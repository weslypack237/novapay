<?php

namespace App\Services;

use App\Exceptions\LedgerException;
use App\Models\LedgerAccount;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletAccount;
use App\Services\Ledger\LedgerService;
use App\Services\Ledger\PostingLine;
use App\Services\Ledger\PostingRequest;
use App\Services\Ledger\SystemAccounts;
use App\Support\Money;
use Illuminate\Support\Facades\DB;

class WalletService
{
    public function __construct(
        private readonly LedgerService $ledger,
        private readonly SystemAccounts $system,
    ) {}

    public function openForUser(User $user, string $currency = 'XAF'): WalletAccount
    {
        if (! Money::isEnabled($currency)) {
            throw LedgerException::invalid("{$currency} is not enabled for this programme.");
        }

        return DB::transaction(function () use ($user, $currency) {
            $wallet = Wallet::firstOrCreate(['user_id' => $user->id], ['status' => 'active']);

            if ($existing = $wallet->accounts()->where('currency_code', $currency)->first()) {
                return $existing;
            }

            $account = fn (string $type) => LedgerAccount::create([
                'owner_type' => 'user',
                'owner_id' => $user->id,
                'account_type' => $type,
                'normal_balance' => LedgerAccount::CREDIT, // customer funds are a liability to NovaPay
                'currency_code' => $currency,
                'allow_negative' => false,
                'status' => 'active',
            ]);

            return WalletAccount::create([
                'wallet_id' => $wallet->id,
                'currency_code' => $currency,
                'available_ledger_account_id' => $account('customer_available')->id,
                'held_ledger_account_id' => $account('customer_held')->id,
                'status' => 'active',
            ]);
        });
    }

    /** Balances derived from the ledger, never from a stored number. */
    public function balances(WalletAccount $account): array
    {
        $available = $this->ledger->balance($account->available_ledger_account_id);
        $held = $this->ledger->balance($account->held_ledger_account_id);

        return [
            'currency' => $account->currency_code,
            'exponent' => Money::exponent($account->currency_code),
            'available_minor' => $available,
            'held_minor' => $held,
            'pending_minor' => 0, // populated from pending deposits in Phase 5
            'ledger_minor' => $available + $held,
        ];
    }

    /** Local/demo only: credit simulated funds, clearly flagged as simulated. */
    public function demoCredit(WalletAccount $account, int $amountMinor, string $idempotencyKey): void
    {
        if (! config('novapay.demo_mode') || app()->isProduction()) {
            throw LedgerException::invalid('Demo credits are only available in demo mode.');
        }

        $funding = $this->system->get('demo_funding', $account->currency_code);

        $this->ledger->post(new PostingRequest(
            type: 'demo_credit',
            idempotencyKey: $idempotencyKey,
            lines: [
                PostingLine::debit($funding->id, $amountMinor, $account->currency_code),
                PostingLine::credit($account->available_ledger_account_id, $amountMinor, $account->currency_code),
            ],
            description: 'Simulated funds (demo mode)',
            sourceType: 'demo_seed',
            isSimulated: true,
        ));
    }
}
