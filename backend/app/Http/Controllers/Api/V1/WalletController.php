<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LedgerEntry;
use App\Models\Wallet;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function __construct(private readonly WalletService $wallets) {}

    public function index(Request $request): JsonResponse
    {
        $wallets = Wallet::with('accounts')->where('user_id', $request->user()->id)->get();

        return response()->json([
            'data' => $wallets->map(fn (Wallet $w) => [
                'id' => $w->id,
                'status' => $w->status,
                'accounts' => $w->accounts->map(fn ($a) => ['id' => $a->id, 'status' => $a->status] + $this->wallets->balances($a)),
            ]),
            'demo_mode' => (bool) config('novapay.demo_mode'),
        ]);
    }

    public function transactions(Request $request, string $walletId): JsonResponse
    {
        // Scoped by owner: another user's wallet ID returns 404, not 403.
        $wallet = Wallet::with('accounts')->where('user_id', $request->user()->id)->findOrFail($walletId);
        $request->validate([
            'currency' => ['nullable', 'size:3'],
            'type' => ['nullable', 'string', 'max:32'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $accountIds = $wallet->accounts
            ->when($request->filled('currency'), fn ($c) => $c->where('currency_code', strtoupper($request->currency)))
            ->flatMap(fn ($a) => [$a->available_ledger_account_id, $a->held_ledger_account_id]);

        $page = LedgerEntry::query()
            ->with('transaction:id,reference,transaction_type,status,description,is_simulated,posted_at,reverses_transaction_id')
            ->whereIn('ledger_account_id', $accountIds)
            ->when($request->filled('type'), fn ($q) => $q->whereHas('transaction', fn ($t) => $t->where('transaction_type', $request->type)))
            ->latest('created_at')
            ->paginate($request->integer('per_page', 25));

        return response()->json([
            'data' => collect($page->items())->map(fn (LedgerEntry $e) => [
                'id' => $e->id,
                'reference' => $e->transaction->reference,
                'type' => $e->transaction->transaction_type,
                'status' => $e->transaction->status,
                'description' => $e->transaction->description,
                // Customer view: credit to a liability account = money in.
                'direction' => $e->direction === 'credit' ? 'in' : 'out',
                'amount_minor' => $e->amount_minor,
                'currency' => $e->currency_code,
                'is_simulated' => $e->transaction->is_simulated,
                'is_reversal' => $e->transaction->reverses_transaction_id !== null,
                'posted_at' => $e->transaction->posted_at?->toIso8601String(),
            ]),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }
}
