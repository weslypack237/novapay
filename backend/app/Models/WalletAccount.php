<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletAccount extends Model
{
    use HasUuids;

    protected $fillable = ['wallet_id', 'currency_code', 'available_ledger_account_id', 'held_ledger_account_id', 'status'];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    public function availableAccount(): BelongsTo
    {
        return $this->belongsTo(LedgerAccount::class, 'available_ledger_account_id');
    }

    public function heldAccount(): BelongsTo
    {
        return $this->belongsTo(LedgerAccount::class, 'held_ledger_account_id');
    }
}
