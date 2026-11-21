<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignUuid('business_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('status', 32)->default('active');
            $table->timestamps();
        });

        Schema::create('ledger_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // owner_type: user | business | system
            $table->string('owner_type', 16);
            $table->uuid('owner_id')->nullable();
            // Distinct buckets: customer_available, customer_held, provider_settlement,
            // fee_revenue, fx_clearing, operational, demo_funding.
            $table->string('account_type', 32);
            // asset accounts are debit-normal; liability/revenue accounts are credit-normal.
            $table->string('normal_balance', 6); // debit | credit
            $table->char('currency_code', 3);
            $table->boolean('allow_negative')->default(false);
            $table->string('code', 64)->nullable()->unique(); // stable code for system accounts
            $table->string('status', 16)->default('active');
            $table->timestamps();
            $table->index(['owner_type', 'owner_id']);
        });

        Schema::create('wallet_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('wallet_id')->constrained()->restrictOnDelete();
            $table->char('currency_code', 3);
            $table->foreignUuid('available_ledger_account_id')->constrained('ledger_accounts')->restrictOnDelete();
            $table->foreignUuid('held_ledger_account_id')->constrained('ledger_accounts')->restrictOnDelete();
            $table->string('status', 16)->default('active');
            $table->timestamps();
            $table->unique(['wallet_id', 'currency_code']);
        });

        Schema::create('ledger_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference', 40)->unique();
            $table->string('transaction_type', 32); // deposit | withdrawal | fee | adjustment | reversal | demo_credit ...
            $table->string('status', 16)->default('posted');
            $table->string('description')->nullable();
            $table->string('source_type', 64)->nullable();
            $table->uuid('source_id')->nullable();
            $table->string('idempotency_key', 128);
            $table->char('request_hash', 64); // detects key reuse with a different payload
            $table->foreignUuid('reverses_transaction_id')->nullable()->unique()->constrained('ledger_transactions');
            $table->foreignUuid('created_by')->nullable()->constrained('users');
            $table->string('reason_code', 64)->nullable();
            $table->boolean('is_simulated')->default(false);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('posted_at')->nullable();
            $table->unique('idempotency_key');
            $table->index(['source_type', 'source_id']);
        });

        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('ledger_transaction_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('ledger_account_id')->constrained()->restrictOnDelete();
            $table->string('direction', 6); // debit | credit
            $table->bigInteger('amount_minor');
            $table->char('currency_code', 3);
            $table->timestamp('created_at')->useCurrent();
            $table->index(['ledger_account_id', 'created_at']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('actor_user_id')->nullable()->constrained('users');
            $table->string('action', 96)->index();
            $table->string('resource_type', 64)->nullable();
            $table->string('resource_id', 64)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('reason')->nullable();
            $table->string('request_id', 64)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
            $table->index(['resource_type', 'resource_id']);
        });

        if (DB::getDriverName() === 'pgsql') {
            $this->installPostgresGuards();
        }
    }

    /**
     * Database-level guarantees that hold even if application code is wrong:
     *  - positive amounts and valid directions
     *  - ledger entries and audit logs are append-only
     *  - every ledger transaction balances per currency at COMMIT time
     */
    private function installPostgresGuards(): void
    {
        DB::statement("ALTER TABLE ledger_entries ADD CONSTRAINT ledger_entries_amount_positive CHECK (amount_minor > 0)");
        DB::statement("ALTER TABLE ledger_entries ADD CONSTRAINT ledger_entries_direction_valid CHECK (direction IN ('debit','credit'))");
        DB::statement("ALTER TABLE ledger_accounts ADD CONSTRAINT ledger_accounts_normal_valid CHECK (normal_balance IN ('debit','credit'))");
        DB::statement("ALTER TABLE wallets ADD CONSTRAINT wallets_single_owner CHECK ((user_id IS NULL) <> (business_id IS NULL))");

        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION novapay_forbid_mutation() RETURNS trigger AS $$
            BEGIN
                RAISE EXCEPTION 'NOVAPAY_IMMUTABLE: % is append-only', TG_TABLE_NAME;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER ledger_entries_immutable
                BEFORE UPDATE OR DELETE ON ledger_entries
                FOR EACH ROW EXECUTE FUNCTION novapay_forbid_mutation();

            CREATE TRIGGER audit_logs_immutable
                BEFORE UPDATE OR DELETE ON audit_logs
                FOR EACH ROW EXECUTE FUNCTION novapay_forbid_mutation();

            CREATE OR REPLACE FUNCTION novapay_check_transaction_balanced() RETURNS trigger AS $$
            DECLARE
                unbalanced RECORD;
            BEGIN
                SELECT currency_code,
                       SUM(CASE WHEN direction = 'debit' THEN amount_minor ELSE -amount_minor END) AS net
                  INTO unbalanced
                  FROM ledger_entries
                 WHERE ledger_transaction_id = NEW.ledger_transaction_id
                 GROUP BY currency_code
                HAVING SUM(CASE WHEN direction = 'debit' THEN amount_minor ELSE -amount_minor END) <> 0
                 LIMIT 1;
                IF FOUND THEN
                    RAISE EXCEPTION 'NOVAPAY_UNBALANCED: transaction % does not balance in %',
                        NEW.ledger_transaction_id, unbalanced.currency_code;
                END IF;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;

            CREATE CONSTRAINT TRIGGER ledger_entries_balanced
                AFTER INSERT ON ledger_entries
                DEFERRABLE INITIALLY DEFERRED
                FOR EACH ROW EXECUTE FUNCTION novapay_check_transaction_balanced();
        SQL);
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared('DROP TRIGGER IF EXISTS ledger_entries_balanced ON ledger_entries');
            DB::unprepared('DROP TRIGGER IF EXISTS ledger_entries_immutable ON ledger_entries');
            DB::unprepared('DROP TRIGGER IF EXISTS audit_logs_immutable ON audit_logs');
            DB::unprepared('DROP FUNCTION IF EXISTS novapay_check_transaction_balanced()');
            DB::unprepared('DROP FUNCTION IF EXISTS novapay_forbid_mutation()');
        }
        foreach (['audit_logs', 'ledger_entries', 'ledger_transactions', 'wallet_accounts', 'ledger_accounts', 'wallets'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
