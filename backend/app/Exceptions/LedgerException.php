<?php

namespace App\Exceptions;

use RuntimeException;

/** Domain error with a stable machine-readable code and a safe message. */
class LedgerException extends RuntimeException
{
    public function __construct(string $message, public readonly string $errorCode, public readonly int $status = 422)
    {
        parent::__construct($message);
    }

    public static function unbalanced(string $currency): self
    {
        return new self("Debits and credits do not balance for {$currency}.", 'ledger_unbalanced');
    }

    public static function invalid(string $message): self
    {
        return new self($message, 'ledger_invalid_posting');
    }

    public static function insufficientFunds(): self
    {
        return new self('Insufficient available balance.', 'insufficient_funds');
    }

    public static function idempotencyConflict(): self
    {
        return new self('This idempotency key was already used for a different request.', 'idempotency_conflict', 409);
    }

    public static function alreadyReversed(): self
    {
        return new self('This transaction has already been reversed.', 'already_reversed', 409);
    }

    public static function immutable(string $table): self
    {
        return new self("Records in {$table} are append-only.", 'immutable_record', 409);
    }

    public static function accountUnavailable(): self
    {
        return new self('A ledger account in this posting is missing, inactive or in the wrong currency.', 'account_unavailable');
    }
}
