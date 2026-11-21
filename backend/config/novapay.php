<?php

/*
|--------------------------------------------------------------------------
| NovaPay domain configuration
|--------------------------------------------------------------------------
| Nothing here is a commercial commitment. Currencies, providers, fees and
| limits are placeholders until confirmed by issuer/provider agreements.
| Fees and limits will move to the database (fee_rules) in Phase 4.
*/

return [

    // Only currencies the selected providers/issuer support should be enabled.
    // exponent = number of minor-unit digits. XAF has no minor unit in practice.
    'currencies' => [
        'XAF' => ['exponent' => 0, 'enabled' => true],
        'USD' => ['exponent' => 2, 'enabled' => (bool) env('NOVAPAY_USD_ENABLED', false)],
    ],

    'default_currency' => 'XAF',

    // Local/demo mode: every simulated outcome must be labelled as such.
    'demo_mode' => (bool) env('NOVAPAY_DEMO_MODE', false),

    // Crypto funding/withdrawal is disabled until legal & regulatory approval.
    'crypto_enabled' => false,

    'otp' => [
        'length' => 6,
        'ttl_minutes' => 10,
        'max_attempts' => 5,
    ],

    'auth' => [
        'token_ttl_minutes' => (int) env('NOVAPAY_TOKEN_TTL', 60 * 12),
        'login_rate_per_minute' => 5,
    ],
];
