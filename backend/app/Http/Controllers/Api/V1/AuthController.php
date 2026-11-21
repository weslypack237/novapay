<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Services\AccountService;
use App\Services\Audit\AuditLogger;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    public function __construct(
        private readonly AccountService $accounts,
        private readonly OtpService $otp,
        private readonly AuditLogger $audit,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->accounts->registerCustomer($request->validated());

        return response()->json([
            'data' => $this->issueToken($user, $request),
            'next_step' => 'verify_otp',
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $identifier = strtolower(trim((string) $request->input('identifier')));
        $key = 'login:'.sha1($identifier.'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($key, (int) config('novapay.auth.login_rate_per_minute'))) {
            return $this->error('too_many_attempts', 'Too many sign-in attempts. Try again in '.RateLimiter::availableIn($key).' seconds.', 429);
        }

        $user = User::where('email', $identifier)->orWhere('phone', $identifier)->first();

        // Same response and similar timing whether or not the account exists.
        if (! $user || ! Hash::check((string) $request->input('password'), $user->password)) {
            RateLimiter::hit($key, 60);
            $this->audit->record('auth.login_failed', $user, 'user', $user?->id);

            return $this->error('invalid_credentials', 'The email/phone or password is incorrect.', 422);
        }

        if (in_array($user->status, [User::STATUS_SUSPENDED, User::STATUS_CLOSED], true)) {
            return $this->error('account_'.$user->status, 'This account is not available. Please contact support.', 403);
        }

        RateLimiter::clear($key);
        $user->forceFill(['last_login_at' => now()])->save();
        $this->audit->record('auth.login', $user, 'user', $user->id);

        return response()->json(['data' => $this->issueToken($user, $request)]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'digits:'.config('novapay.otp.length')],
            'purpose' => ['required', 'in:verify_email,verify_phone'],
        ]);
        $user = $request->user();

        if (! $this->otp->verify($user, $data['purpose'], $data['code'])) {
            return $this->error('invalid_code', 'That code is incorrect or has expired.', 422);
        }

        $user->forceFill([
            $data['purpose'] === 'verify_email' ? 'email_verified_at' : 'phone_verified_at' => now(),
            'status' => $user->status === User::STATUS_PENDING ? User::STATUS_ACTIVE : $user->status,
        ])->save();

        $this->audit->record('auth.'.$data['purpose'], $user, 'user', $user->id);

        return response()->json(['data' => $this->presentUser($user->fresh())]);
    }

    public function resendOtp(Request $request): JsonResponse
    {
        $user = $request->user();
        $key = 'otp-resend:'.$user->id;

        if (RateLimiter::tooManyAttempts($key, 3)) {
            return $this->error('too_many_attempts', 'Please wait before requesting another code.', 429);
        }
        RateLimiter::hit($key, 300);

        $this->otp->issue($user, $user->email ? 'verify_email' : 'verify_phone', $user->email ? 'email' : 'sms');

        return response()->json(['data' => ['sent' => true]]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->presentUser($request->user())]);
    }

    public function updateTheme(Request $request): JsonResponse
    {
        $data = $request->validate(['theme' => ['required', 'in:system,light,dark']]);
        $request->user()->forceFill(['preferred_theme' => $data['theme']])->save();

        return response()->json(['data' => ['theme' => $data['theme']]]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        $this->audit->record('auth.logout', $request->user(), 'user', $request->user()->id);

        return response()->json(['data' => ['logged_out' => true]]);
    }

    public function logoutOtherSessions(Request $request): JsonResponse
    {
        $current = $request->user()->currentAccessToken()->id;
        $count = $request->user()->tokens()->where('id', '!=', $current)->delete();
        $this->audit->record('auth.logout_other_sessions', $request->user(), 'user', $request->user()->id, metadata: ['revoked' => $count]);

        return response()->json(['data' => ['revoked' => $count]]);
    }

    private function issueToken(User $user, Request $request): array
    {
        $token = $user->createToken(
            name: substr($request->input('device_name', 'web'), 0, 100),
            expiresAt: now()->addMinutes((int) config('novapay.auth.token_ttl_minutes')),
        );
        $token->accessToken->forceFill([
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
        ])->save();

        return ['token' => $token->plainTextToken, 'user' => $this->presentUser($user)];
    }

    private function presentUser(User $user): array
    {
        $user->loadMissing('profile', 'roles');

        return [
            'id' => $user->id,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'first_name' => $user->profile?->first_name,
            'last_name' => $user->profile?->last_name,
            'email_verified' => $user->email_verified_at !== null,
            'phone_verified' => $user->phone_verified_at !== null,
            'roles' => $user->roles->pluck('name')->values(),
            'is_staff' => $user->isStaff(),
            'theme' => $user->preferred_theme,
        ];
    }
}
