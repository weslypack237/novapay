<?php

use App\Services\Ledger\LedgerService;
use Illuminate\Support\Facades\Artisan;

Artisan::command('ledger:check', function (LedgerService $ledger) {
    $failed = false;
    foreach ($ledger->trialBalance() as $currency => $row) {
        $this->line(sprintf('%s  debits=%d  credits=%d  %s', $currency, $row['debits'], $row['credits'], $row['balanced'] ? 'OK' : 'UNBALANCED'));
        $failed = $failed || ! $row['balanced'];
    }

    return $failed ? 1 : 0;
})->purpose('Verify the ledger trial balance is zero in every currency');
