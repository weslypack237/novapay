<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use App\Services\WalletService;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RbacAndWalletTest extends TestCase
{
    public function test_customers_cannot_reach_admin_endpoints(): void
    {
        Sanctum::actingAs($this->makeUser(Role::CUSTOMER));

        foreach (['/api/v1/admin/overview', '/api/v1/admin/users', '/api/v1/admin/audit-logs', '/api/v1/admin/ledger/trial-balance'] as $url) {
            $this->getJson($url)->assertForbidden()->assertJsonPath('error.code', 'forbidden');
        }
    }

    public function test_support_agent_has_read_access_but_cannot_change_status(): void
    {
        $target = $this->makeUser();
        Sanctum::actingAs($this->makeUser(Role::SUPPORT_AGENT));

        $this->getJson('/api/v1/admin/users')->assertOk();
        $this->getJson('/api/v1/admin/audit-logs')->assertForbidden();
        $this->patchJson("/api/v1/admin/users/{$target->id}/status", ['status' => 'suspended', 'reason' => 'Testing'])
            ->assertForbidden();
    }

    public function test_status_change_requires_reason_and_is_audited(): void
    {
        $target = $this->makeUser();
        $admin = $this->makeUser(Role::COMPLIANCE_ADMIN);
        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/users/{$target->id}/status", ['status' => 'suspended'])
            ->assertUnprocessable()->assertJsonValidationErrors('reason');

        $this->patchJson("/api/v1/admin/users/{$target->id}/status", ['status' => 'suspended', 'reason' => 'Sanctions screening hit'])
            ->assertOk()->assertJsonPath('data.status', 'suspended');

        $log = AuditLog::where('action', 'admin.user.status_changed')->firstOrFail();
        $this->assertSame($admin->id, $log->actor_user_id);
        $this->assertSame('Sanctions screening hit', $log->reason);
        $this->assertSame(['from' => 'active', 'to' => 'suspended'], $log->metadata);
    }

    public function test_there_is_no_route_that_edits_a_balance(): void
    {
        $routes = collect(app('router')->getRoutes()->getRoutes())->map->uri();
        $this->assertFalse($routes->contains(fn ($uri) => str_contains($uri, 'balance') && ! str_contains($uri, 'trial-balance')));
    }

    public function test_wallet_balances_and_history_are_derived_from_the_ledger(): void
    {
        $user = $this->makeUser();
        $account = app(WalletService::class)->openForUser($user);
        app(WalletService::class)->demoCredit($account, 42_000, 'demo:1');
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/wallets')->assertOk()
            ->assertJsonPath('data.0.accounts.0.available_minor', 42_000)
            ->assertJsonPath('data.0.accounts.0.currency', 'XAF')
            ->assertJsonPath('demo_mode', true);

        $this->getJson("/api/v1/wallets/{$account->wallet_id}/transactions")->assertOk()
            ->assertJsonPath('data.0.amount_minor', 42_000)
            ->assertJsonPath('data.0.direction', 'in')
            ->assertJsonPath('data.0.is_simulated', true);
    }

    public function test_users_cannot_read_another_users_wallet(): void
    {
        $owner = $this->makeUser();
        $account = app(WalletService::class)->openForUser($owner);
        Sanctum::actingAs($this->makeUser());

        $this->getJson("/api/v1/wallets/{$account->wallet_id}/transactions")->assertNotFound();
    }

    public function test_admin_reversal_needs_idempotency_key_and_is_audited(): void
    {
        $user = $this->makeUser();
        $account = app(WalletService::class)->openForUser($user);
        app(WalletService::class)->demoCredit($account, 10_000, 'demo:rev');
        $txId = \App\Models\LedgerTransaction::firstOrFail()->id;
        Sanctum::actingAs($this->makeUser(Role::OPERATIONS_ADMIN));

        $payload = ['reason_code' => 'duplicate_credit', 'reason' => 'Provider confirmed duplicate callback'];
        $this->postJson("/api/v1/admin/ledger/transactions/{$txId}/reverse", $payload)->assertStatus(400);

        $this->withHeader('Idempotency-Key', 'abc-123')
            ->postJson("/api/v1/admin/ledger/transactions/{$txId}/reverse", $payload)->assertCreated();
        $this->withHeader('Idempotency-Key', 'abc-123')
            ->postJson("/api/v1/admin/ledger/transactions/{$txId}/reverse", $payload)->assertOk()->assertJsonPath('data.replayed', true);

        $this->assertSame(1, AuditLog::where('action', 'admin.ledger.reversal')->count());
        $this->assertSame(0, app(\App\Services\Ledger\LedgerService::class)->balance($account->available_ledger_account_id));
    }
}
