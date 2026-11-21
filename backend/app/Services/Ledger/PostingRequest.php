<?php

namespace App\Services\Ledger;

final class PostingRequest
{
    /** @param PostingLine[] $lines */
    public function __construct(
        public readonly string $type,
        public readonly string $idempotencyKey,
        public readonly array $lines,
        public readonly ?string $description = null,
        public readonly ?string $sourceType = null,
        public readonly ?string $sourceId = null,
        public readonly ?string $createdBy = null,
        public readonly ?string $reasonCode = null,
        public readonly bool $isSimulated = false,
        public readonly ?string $reversesTransactionId = null,
    ) {}

    /** Hash of the economically meaningful content, used to detect idempotency-key reuse. */
    public function hash(): string
    {
        $lines = array_map(fn (PostingLine $l) => $l->toArray(), $this->lines);
        sort($lines);

        return hash('sha256', json_encode([$this->type, $lines, $this->reversesTransactionId]));
    }
}
