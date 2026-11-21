<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LedgerAccount extends Model
{
    use HasUuids;

    public const DEBIT = 'debit';
    public const CREDIT = 'credit';

    protected $fillable = ['owner_type', 'owner_id', 'account_type', 'normal_balance', 'currency_code', 'allow_negative', 'code', 'status'];

    protected function casts(): array
    {
        return ['allow_negative' => 'boolean'];
    }

    public function entries(): HasMany
    {
        return $this->hasMany(LedgerEntry::class);
    }
}
