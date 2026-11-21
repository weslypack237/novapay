<?php

namespace Tests\Feature;

use App\Services\Ledger\LedgerService;
use App\Services\Ledger\PostingLine;
use App\Services\Ledger\PostingRequest;
use App\Services\Ledger\SystemAccounts;
use App\Services\WalletService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Proves the database itself refuses bad ledger writes, even if application
 * code is bypassed. Runs only against Postgres (CI matrix: pgsql).
 */
class PostgresGuardsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Postgres-only guards.');
        }
        DB::statement('SET CONSTRAINTS ALL IMMEDIATE'); // fire deferred balance check inside the test transaction
    }

    private function posted(): array
    {
        $customer = app(WalletService::class)->openForUser($this->makeUser())->available_ledger_account_id;
        $funding = app(SystemAccounts::class)->get('provider_settlement', 'XAF', 'mtn')->id;
        $tx = app(LedgerService::class)->post(new PostingRequest('deposit', 'pg-'.Str::random(6), [
            PostingLine::debit($funding, 1000, 'XAF'),
            PostingLine::credit($customer, 1000, 'XAF'),
        ]))->transaction;

        return [$tx, $customer, $funding];
    }

    public function test_raw_update_of_a_ledger_entry_is_rejected(): void
    {
        [$tx] = $this->posted();
        $this->expectException(QueryException::class);
        $this->expectExceptionMessage('NOVAPAY_IMMUTABLE');
        DB::table('ledger_entries')->where('ledger_transaction_id', $tx->id)->update(['amount_minor' => 1]);
    }

    public function test_raw_delete_of_an_audit_log_is_rejected(): void
    {
        app(\App\Services\Audit\AuditLogger::class)->record('test.event');
        $this->expectException(QueryException::class);
        DB::table('audit_logs')->delete();
    }

    public function test_raw_unbalanced_insert_is_rejected_by_the_constraint_trigger(): void
    {
        [$tx, $customer] = $this->posted();
        $this->expectException(QueryException::class);
        $this->expectExceptionMessage('NOVAPAY_UNBALANCED');
        DB::table('ledger_entries')->insert([
            'id' => (string) Str::uuid(), 'ledger_transaction_id' => $tx->id, 'ledger_account_id' => $customer,
            'direction' => 'credit', 'amount_minor' => 500, 'currency_code' => 'XAF', 'created_at' => now(),
        ]);
    }
}
