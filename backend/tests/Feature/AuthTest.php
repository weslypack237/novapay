<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    private function registerPayload(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Ngozi', 'last_name' => 'Example',
            'email' => 'ngozi@example.test',
            'password' => 'Strong-Passw0rd', 'password_confirmation' => 'Strong-Passw0rd',
            'accept_terms' => true,
        ], $overrides);
    }

    public function test_registration_creates_pending_customer_with_wallet_and_audit_record(): void
    {
        $res = $this->postJson('/api/v1/auth/register', $this->registerPayload())->assertCreated();

        $res->assertJsonPath('data.user.status', 'pending_verification')
            ->assertJsonPath('data.user.roles.0', 'customer')
            ->assertJsonPath('next_step', 'verify_otp');

        $user = User::where('email', 'ngozi@example.test')->firstOrFail();
        $this->assertSame(1, $user->wallets()->count());
        $this->assertSame(1, VerificationCode::where('user_id', $user->id)->count());
        $this->assertTrue(AuditLog::where('action', 'user.registered')->where('resource_id', $user->id)->exists());
    }

    public function test_weak_password_is_rejected(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registerPayload(['password' => 'short', 'password_confirmation' => 'short']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_otp_verification_activates_the_account(): void
    {
        $token = $this->postJson('/api/v1/auth/register', $this->registerPayload())->json('data.token');
        $user = User::where('email', 'ngozi@example.test')->first();
        VerificationCode::where('user_id', $user->id)->update(['code_hash' => Hash::make('123456')]);

        $this->withToken($token)->postJson('/api/v1/auth/verify-otp', ['code' => '000000', 'purpose' => 'verify_email'])
            ->assertUnprocessable()->assertJsonPath('error.code', 'invalid_code');

        $this->withToken($token)->postJson('/api/v1/auth/verify-otp', ['code' => '123456', 'purpose' => 'verify_email'])
            ->assertOk()->assertJsonPath('data.status', 'active')->assertJsonPath('data.email_verified', true);
    }

    public function test_login_with_valid_and_invalid_credentials(): void
    {
        $user = $this->makeUser();

        $this->postJson('/api/v1/auth/login', ['identifier' => $user->email, 'password' => 'wrong'])
            ->assertUnprocessable()->assertJsonPath('error.code', 'invalid_credentials');

        $token = $this->postJson('/api/v1/auth/login', ['identifier' => $user->email, 'password' => 'Secret-Passw0rd'])
            ->assertOk()->json('data.token');

        $this->withToken($token)->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.email', $user->email);
    }

    public function test_login_is_rate_limited(): void
    {
        $user = $this->makeUser();
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', ['identifier' => $user->email, 'password' => 'wrong']);
        }

        $this->postJson('/api/v1/auth/login', ['identifier' => $user->email, 'password' => 'Secret-Passw0rd'])
            ->assertStatus(429)->assertJsonPath('error.code', 'too_many_attempts');
    }

    public function test_suspended_accounts_cannot_log_in(): void
    {
        $user = $this->makeUser(status: User::STATUS_SUSPENDED);

        $this->postJson('/api/v1/auth/login', ['identifier' => $user->email, 'password' => 'Secret-Passw0rd'])
            ->assertForbidden()->assertJsonPath('error.code', 'account_suspended');
    }

    public function test_protected_routes_require_authentication(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
        $this->getJson('/api/v1/wallets')->assertUnauthorized();
        $this->getJson('/api/v1/admin/overview')->assertUnauthorized();
    }

    public function test_logout_revokes_the_token(): void
    {
        $user = $this->makeUser();
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_responses_carry_a_request_id(): void
    {
        $this->getJson('/api/v1/health')->assertOk()->assertHeader('X-Request-Id');
    }
}
