<?php

namespace App\Services\Ledger;

final class PostingLine
{
    public function __construct(
        public readonly string $accountId,
        public readonly string $direction,
        public readonly int $amountMinor,
        public readonly string $currency,
    ) {}

    public static function debit(string $accountId, int $amountMinor, string $currency): self
    {
        return new self($accountId, 'debit', $amountMinor, $currency);
    }

    public static function credit(string $accountId, int $amountMinor, string $currency): self
    {
        return new self($accountId, 'credit', $amountMinor, $currency);
    }

    public function toArray(): array
    {
        return [$this->accountId, $this->direction, $this->amountMinor, $this->currency];
    }
}
