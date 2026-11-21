<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\LedgerTransaction;
use App\Models\User;
use App\Services\Ledger\LedgerService;
use Illuminate\Http\JsonResponse;

class OverviewController extends Controller
{
    public function __invoke(LedgerService $ledger): JsonResponse
    {
        return response()->json(['data' => [
            'users' => [
                'total' => User::count(),
                'by_status' => User::selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status'),
            ],
            'ledger' => [
                'transactions_24h' => LedgerTransaction::where('posted_at', '>=', now()->subDay())->count(),
                'trial_balance' => $ledger->trialBalance(),
            ],
            'audit_events_24h' => AuditLog::where('created_at', '>=', now()->subDay())->count(),
            'providers' => [], // populated by the provider health monitor in Phase 5
        ]]);
    }
}
