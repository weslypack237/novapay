<?php

namespace App\Services\Ledger;

use App\Models\LedgerTransaction;

final class PostingResult
{
    public function __construct(
        public readonly LedgerTransaction $transaction,
        /** True when the idempotency key matched an earlier identical posting. */
        public readonly bool $replayed,
    ) {}
}
