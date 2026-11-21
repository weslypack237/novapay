<?php

namespace App\Services;

use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * One-time codes are stored hashed, expire, and lock after max attempts.
 * Delivery goes through the mailer (log driver locally). SMS arrives with
 * the notification provider adapter.
 */
class OtpService
{
    public function issue(User $user, string $purpose, string $channel = 'email'): void
    {
        VerificationCode::where('user_id', $user->id)->where('purpose', $purpose)
            ->whereNull('consumed_at')->update(['consumed_at' => now()]);

        $length = (int) config('novapay.otp.length');
        $code = str_pad((string) random_int(0, 10 ** $length - 1), $length, '0', STR_PAD_LEFT);

        VerificationCode::create([
            'user_id' => $user->id,
            'channel' => $channel,
            'purpose' => $purpose,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes((int) config('novapay.otp.ttl_minutes')),
        ]);

        if ($channel === 'email' && $user->email) {
            Mail::raw(
                "Your NovaPay verification code is {$code}. It expires in ".config('novapay.otp.ttl_minutes')." minutes. NovaPay will never ask you for this code.",
                fn ($m) => $m->to($user->email)->subject('Your NovaPay verification code'),
            );
        } else {
            // Never log the code itself.
            Log::info('OTP issued for non-email channel; SMS adapter not configured.', ['user_id' => $user->id]);
        }
    }

    public function verify(User $user, string $purpose, string $code): bool
    {
        $record = VerificationCode::where('user_id', $user->id)->where('purpose', $purpose)
            ->whereNull('consumed_at')->latest()->first();

        if (! $record || $record->expires_at->isPast() || $record->attempts >= (int) config('novapay.otp.max_attempts')) {
            return false;
        }

        if (! Hash::check($code, $record->code_hash)) {
            $record->increment('attempts');

            return false;
        }

        $record->update(['consumed_at' => now()]);

        return true;
    }
}
