<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\Audit\AuditLogger;
use App\Services\Ledger\LedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * No endpoint here edits a balance. The only correction path is a
 * reason-coded reversal, which is itself a balanced ledger posting.
 */
class LedgerController extends Controller
{
    public function trialBalance(LedgerService $ledger): JsonResponse
    {
        return response()->json(['data' => $ledger->trialBalance()]);
    }

    public function reverse(Request $request, string $transactionId, LedgerService $ledger, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate([
            'reason_code' => ['required', 'string', 'max:64'],
            'reason' => ['required', 'string', 'min:10', 'max:500'],
        ]);
        $key = $request->header('Idempotency-Key');
        if (! $key) {
            return $this->error('idempotency_key_required', 'An Idempotency-Key header is required.', 400);
        }

        $result = $ledger->reverse($transactionId, $data['reason_code'], $request->user()->id, 'admin-reversal:'.$key);

        if (! $result->replayed) {
            $audit->record('admin.ledger.reversal', $request->user(), 'ledger_transaction', $transactionId, $data['reason'], [
                'reversal_transaction_id' => $result->transaction->id,
                'reason_code' => $data['reason_code'],
            ]);
        }

        return response()->json(['data' => [
            'reversal_id' => $result->transaction->id,
            'reference' => $result->transaction->reference,
            'replayed' => $result->replayed,
        ]], $result->replayed ? 200 : 201);
    }
}
