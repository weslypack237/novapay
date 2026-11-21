<?php

namespace Tests\Feature;

use App\Exceptions\LedgerException;
use App\Models\LedgerEntry;
use App\Models\LedgerTransaction;
use App\Services\Ledger\LedgerService;
use App\Services\Ledger\PostingLine;
use App\Services\Ledger\PostingRequest;
use App\Services\Ledger\SystemAccounts;
use App\Services\WalletService;
use Tests\TestCase;

class LedgerServiceTest extends TestCase
{
    private LedgerService $ledger;
    private string $funding;
    private string $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->ledger = app(LedgerService::class);
        $this->funding = app(SystemAccounts::class)->get('provider_settlement', 'XAF', 'mtn')->id;
        $this->customer = app(WalletService::class)->openForUser($this->makeUser(), 'XAF')->available_ledger_account_id;
    }

    private function credit(int $amount, string $key): PostingRequest
    {
        return new PostingRequest('deposit', $key, [
            PostingLine::debit($this->funding, $amount, 'XAF'),
            PostingLine::credit($this->customer, $amount, 'XAF'),
        ]);
    }

    public function test_balanced_posting_updates_derived_balances(): void
    {
        $this->ledger->post($this->credit(10_000, 'k1'));

        $this->assertSame(10_000, $this->ledger->balance($this->customer));
        $this->assertSame(10_000, $this->ledger->balance($this->funding));
        $this->assertTrue($this->ledger->trialBalance()['XAF']['balanced']);
    }

    public function test_unbalanced_posting_is_rejected_and_nothing_is_written(): void
    {
        try {
            $this->ledger->post(new PostingRequest('deposit', 'k-unbalanced', [
                PostingLine::debit($this->funding, 10_000, 'XAF'),
                PostingLine::credit($this->customer, 9_999, 'XAF'),
            ]));
            $this->fail('Expected unbalanced posting to be rejected.');
        } catch (LedgerException $e) {
            $this->assertSame('ledger_unbalanced', $e->errorCode);
        }
        $this->assertSame(0, LedgerTransaction::count());
        $this->assertSame(0, LedgerEntry::count());
    }

    public function test_zero_and_negative_amounts_are_rejected(): void
    {
        foreach ([0, -500] as $amount) {
            try {
                $this->ledger->post($this->credit($amount, 'k-amount-'.$amount));
                $this->fail('Expected invalid amount to be rejected.');
            } catch (LedgerException $e) {
                $this->assertSame('ledger_invalid_posting', $e->errorCode);
            }
        }
    }

    public function test_balancing_is_checked_per_currency(): void
    {
        $this->expectExceptionObject(LedgerException::unbalanced('XAF'));

        $this->ledger->post(new PostingRequest('fx', 'k-fx', [
            PostingLine::debit($this->funding, 1_000, 'XAF'),
            PostingLine::credit($this->customer, 1_000, 'USD'),
        ]));
    }

    public function test_duplicate_request_with_same_key_posts_once(): void
    {
        $first = $this->ledger->post($this->credit(5_000, 'dup'));
        $second = $this->ledger->post($this->credit(5_000, 'dup'));

        $this->assertFalse($first->replayed);
        $this->assertTrue($second->replayed);
        $this->assertSame($first->transaction->id, $second->transaction->id);
        $this->assertSame(5_000, $this->ledger->balance($this->customer));
        $this->assertSame(1, LedgerTransaction::count());
    }

    public function test_reusing_a_key_with_different_payload_is_a_conflict(): void
    {
        $this->ledger->post($this->credit(5_000, 'reuse'));

        $this->expectExceptionObject(LedgerException::idempotencyConflict());
        $this->ledger->post($this->credit(6_000, 'reuse'));
    }

    public function test_customer_account_cannot_go_negative(): void
    {
        $this->ledger->post($this->credit(1_000, 'fund'));

        try {
            $this->ledger->post(new PostingRequest('withdrawal', 'overspend', [
                PostingLine::debit($this->customer, 1_001, 'XAF'),
                PostingLine::credit($this->funding, 1_001, 'XAF'),
            ]));
            $this->fail('Expected overspend to be rejected.');
        } catch (LedgerException $e) {
            $this->assertSame('insufficient_funds', $e->errorCode);
        }

        $this->assertSame(1_000, $this->ledger->balance($this->customer));
        $this->assertSame(1, LedgerTransaction::count());
    }

    public function test_reversal_creates_compensating_entries_and_leaves_original_intact(): void
    {
        $original = $this->ledger->post($this->credit(7_500, 'to-reverse'))->transaction;
        $reversal = $this->ledger->reverse($original->id, 'provider_reversed', null, 'rev-1')->transaction;

        $this->assertSame('reversal', $reversal->transaction_type);
        $this->assertSame($original->id, $reversal->reverses_transaction_id);
        $this->assertSame(0, $this->ledger->balance($this->customer));
        $this->assertSame(2, $original->fresh()->entries()->count());
        $this->assertSame('posted', $original->fresh()->status);
        $this->assertTrue($this->ledger->trialBalance()['XAF']['balanced']);
    }

    public function test_a_transaction_cannot_be_reversed_twice(): void
    {
        $original = $this->ledger->post($this->credit(2_000, 'once'))->transaction;
        $this->ledger->reverse($original->id, 'error', null, 'rev-a');

        $this->expectExceptionObject(LedgerException::alreadyReversed());
        $this->ledger->reverse($original->id, 'error', null, 'rev-b');
    }

    public function test_replaying_the_same_reversal_key_is_idempotent(): void
    {
        $original = $this->ledger->post($this->credit(2_000, 'replay'))->transaction;
        $a = $this->ledger->reverse($original->id, 'error', null, 'rev-same');
        $b = $this->ledger->reverse($original->id, 'error', null, 'rev-same');

        $this->assertTrue($b->replayed);
        $this->assertSame($a->transaction->id, $b->transaction->id);
    }

    public function test_posted_entries_and_transactions_are_immutable(): void
    {
        $tx = $this->ledger->post($this->credit(3_000, 'immutable'))->transaction;
        $entry = $tx->entries->first();

        foreach ([fn () => $entry->update(['amount_minor' => 1]), fn () => $entry->delete(),
            fn () => $tx->update(['status' => 'void']), fn () => $tx->delete()] as $mutation) {
            try {
                $mutation();
                $this->fail('Expected mutation to be rejected.');
            } catch (LedgerException $e) {
                $this->assertSame('immutable_record', $e->errorCode);
            }
        }
        $this->assertSame(3_000, $this->ledger->balance($this->customer));
    }

    public function test_inactive_or_wrong_currency_account_is_rejected(): void
    {
        $this->expectExceptionObject(LedgerException::accountUnavailable());

        $usdFunding = app(SystemAccounts::class)->get('provider_settlement', 'USD', 'bank')->id;
        $this->ledger->post(new PostingRequest('deposit', 'wrong-ccy', [
            PostingLine::debit($usdFunding, 100, 'XAF'),
            PostingLine::credit($this->customer, 100, 'XAF'),
        ]));
    }
}
