<?php

namespace App\Services\Ledger;

use App\Exceptions\LedgerException;
use App\Models\LedgerAccount;
use App\Models\LedgerEntry;
use App\Models\LedgerTransaction;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * The single entry point for moving value. Nothing else writes ledger rows.
 *
 * Guarantees (enforced here, and again by Postgres constraints/triggers):
 *  - every transaction balances per currency (sum debits == sum credits)
 *  - amounts are positive integers in minor units
 *  - postings are idempotent per key; reuse with a different payload is rejected
 *  - non-negative accounts can never go below zero, even under concurrency
 *  - posted rows are never updated or deleted; corrections are reversals
 */
class LedgerService
{
    public function post(PostingRequest $request): PostingResult
    {
        $this->validate($request);
        $hash = $request->hash();

        if ($existing = $this->findByIdempotencyKey($request->idempotencyKey, $hash)) {
            return new PostingResult($existing, true);
        }

        try {
            $transaction = DB::transaction(fn () => $this->write($request, $hash), attempts: 3);
        } catch (QueryException $e) {
            // A concurrent request with the same key won the unique-index race.
            if ($existing = $this->findByIdempotencyKey($request->idempotencyKey, $hash)) {
                return new PostingResult($existing, true);
            }
            throw $e;
        }

        return new PostingResult($transaction, false);
    }

    /**
     * Compensating transaction: mirrors every entry of the original with the
     * opposite direction. The original is left untouched.
     */
    public function reverse(string $transactionId, string $reasonCode, ?string $actorId, string $idempotencyKey): PostingResult
    {
        $original = LedgerTransaction::with('entries')->findOrFail($transactionId);

        if ($original->transaction_type === 'reversal') {
            throw LedgerException::invalid('A reversal cannot itself be reversed; post a new correcting transaction.');
        }

        $existingReversal = LedgerTransaction::where('reverses_transaction_id', $original->id)->first();
        if ($existingReversal && $existingReversal->idempotency_key !== $idempotencyKey) {
            throw LedgerException::alreadyReversed();
        }

        $lines = $original->entries->map(fn (LedgerEntry $e) => new PostingLine(
            $e->ledger_account_id,
            $e->direction === 'debit' ? 'credit' : 'debit',
            $e->amount_minor,
            $e->currency_code,
        ))->all();

        return $this->post(new PostingRequest(
            type: 'reversal',
            idempotencyKey: $idempotencyKey,
            lines: $lines,
            description: "Reversal of {$original->reference}",
            sourceType: 'ledger_transaction',
            sourceId: $original->id,
            createdBy: $actorId,
            reasonCode: $reasonCode,
            isSimulated: $original->is_simulated,
            reversesTransactionId: $original->id,
        ));
    }

    /** Balance in the account's normal direction, in minor units. */
    public function balance(string $accountId): int
    {
        $account = LedgerAccount::findOrFail($accountId);

        return $this->computeBalance($account);
    }

    /** Sum of every posted transaction's net per currency. Must be zero. */
    public function trialBalance(): array
    {
        return LedgerEntry::query()
            ->selectRaw("currency_code, SUM(CASE WHEN direction = 'debit' THEN amount_minor ELSE 0 END) AS debits")
            ->selectRaw("SUM(CASE WHEN direction = 'credit' THEN amount_minor ELSE 0 END) AS credits")
            ->groupBy('currency_code')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->currency_code => [
                'debits' => (int) $row->debits,
                'credits' => (int) $row->credits,
                'balanced' => (int) $row->debits === (int) $row->credits,
            ]])
            ->all();
    }

    private function write(PostingRequest $request, string $hash): LedgerTransaction
    {
        $accountIds = collect($request->lines)->pluck('accountId')->unique()->sort()->values();

        // Lock in a deterministic order to avoid deadlocks between concurrent postings.
        $accounts = LedgerAccount::whereIn('id', $accountIds)->orderBy('id')->lockForUpdate()->get()->keyBy('id');

        foreach ($request->lines as $line) {
            $account = $accounts->get($line->accountId);
            if (! $account || $account->status !== 'active' || $account->currency_code !== $line->currency) {
                throw LedgerException::accountUnavailable();
            }
        }

        if ($request->reversesTransactionId
            && LedgerTransaction::where('reverses_transaction_id', $request->reversesTransactionId)->exists()) {
            throw LedgerException::alreadyReversed();
        }

        $now = now();
        $transaction = LedgerTransaction::create([
            'reference' => $this->newReference(),
            'transaction_type' => $request->type,
            'status' => 'posted',
            'description' => $request->description,
            'source_type' => $request->sourceType,
            'source_id' => $request->sourceId,
            'idempotency_key' => $request->idempotencyKey,
            'request_hash' => $hash,
            'reverses_transaction_id' => $request->reversesTransactionId,
            'created_by' => $request->createdBy,
            'reason_code' => $request->reasonCode,
            'is_simulated' => $request->isSimulated,
            'posted_at' => $now,
        ]);

        foreach ($request->lines as $line) {
            LedgerEntry::create([
                'ledger_transaction_id' => $transaction->id,
                'ledger_account_id' => $line->accountId,
                'direction' => $line->direction,
                'amount_minor' => $line->amountMinor,
                'currency_code' => $line->currency,
            ]);
        }

        foreach ($accounts as $account) {
            if (! $account->allow_negative && $this->computeBalance($account) < 0) {
                throw LedgerException::insufficientFunds(); // rolls back the whole posting
            }
        }

        return $transaction->load('entries');
    }

    private function validate(PostingRequest $request): void
    {
        if (count($request->lines) < 2) {
            throw LedgerException::invalid('A posting needs at least two entries.');
        }
        if (trim($request->idempotencyKey) === '' || strlen($request->idempotencyKey) > 128) {
            throw LedgerException::invalid('A valid idempotency key is required.');
        }

        $net = [];
        foreach ($request->lines as $line) {
            if (! in_array($line->direction, ['debit', 'credit'], true)) {
                throw LedgerException::invalid('Entry direction must be debit or credit.');
            }
            if ($line->amountMinor <= 0) {
                throw LedgerException::invalid('Entry amounts must be positive integers in minor units.');
            }
            $net[$line->currency] = ($net[$line->currency] ?? 0)
                + ($line->direction === 'debit' ? $line->amountMinor : -$line->amountMinor);
        }

        foreach ($net as $currency => $sum) {
            if ($sum !== 0) {
                throw LedgerException::unbalanced($currency);
            }
        }
    }

    private function findByIdempotencyKey(string $key, string $hash): ?LedgerTransaction
    {
        $existing = LedgerTransaction::with('entries')->where('idempotency_key', $key)->first();
        if (! $existing) {
            return null;
        }
        if (! hash_equals($existing->request_hash, $hash)) {
            throw LedgerException::idempotencyConflict();
        }

        return $existing;
    }

    private function computeBalance(LedgerAccount $account): int
    {
        $row = LedgerEntry::where('ledger_account_id', $account->id)
            ->selectRaw("COALESCE(SUM(CASE WHEN direction = 'debit' THEN amount_minor ELSE 0 END), 0) AS debits")
            ->selectRaw("COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount_minor ELSE 0 END), 0) AS credits")
            ->first();

        $debits = (int) $row->debits;
        $credits = (int) $row->credits;

        return $account->normal_balance === LedgerAccount::DEBIT ? $debits - $credits : $credits - $debits;
    }

    private function newReference(): string
    {
        return 'NP'.now()->format('ymd').'-'.Str::upper(Str::random(10));
    }
}
