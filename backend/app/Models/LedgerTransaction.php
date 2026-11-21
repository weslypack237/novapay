<?php

namespace App\Models;

use App\Exceptions\LedgerException;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Posted ledger transactions are immutable. Corrections are new reversal
 * transactions that reference the original via reverses_transaction_id.
 */
class LedgerTransaction extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

    protected $fillable = [
        'reference', 'transaction_type', 'status', 'description', 'source_type', 'source_id',
        'idempotency_key', 'request_hash', 'reverses_transaction_id', 'created_by', 'reason_code',
        'is_simulated', 'posted_at',
    ];

    protected function casts(): array
    {
        return ['posted_at' => 'datetime', 'is_simulated' => 'boolean'];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw LedgerException::immutable('ledger_transactions'));
        static::deleting(fn () => throw LedgerException::immutable('ledger_transactions'));
    }

    public function entries(): HasMany
    {
        return $this->hasMany(LedgerEntry::class);
    }

    public function reversal(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(self::class, 'reverses_transaction_id');
    }
}
