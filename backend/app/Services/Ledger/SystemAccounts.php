<?php

namespace App\Services\Ledger;

use App\Models\LedgerAccount;

/**
 * Platform-side ledger accounts, kept distinct from customer liabilities.
 * Codes are stable: "{type}.{currency}" or "{type}.{provider}.{currency}".
 */
class SystemAccounts
{
    public const DEFINITIONS = [
        // type => [normal_balance, allow_negative]
        'provider_settlement' => ['debit', true],  // asset: funds held at a provider
        'fee_revenue' => ['credit', false],          // revenue
        'fx_clearing' => ['debit', true],            // clearing, nets to zero over time
        'operational' => ['debit', true],
        'demo_funding' => ['debit', true],           // local/demo only — never real money
    ];

    public function get(string $type, string $currency, ?string $provider = null): LedgerAccount
    {
        [$normal, $allowNegative] = self::DEFINITIONS[$type]
            ?? throw new \InvalidArgumentException("Unknown system account type {$type}");

        $code = implode('.', array_filter([$type, $provider, $currency]));

        return LedgerAccount::firstOrCreate(['code' => $code], [
            'owner_type' => 'system',
            'owner_id' => null,
            'account_type' => $type,
            'normal_balance' => $normal,
            'currency_code' => $currency,
            'allow_negative' => $allowNegative,
            'status' => 'active',
        ]);
    }
}
