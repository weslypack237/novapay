<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['action' => ['nullable', 'string', 'max:96'], 'actor' => ['nullable', 'uuid']]);

        $page = AuditLog::with('actor:id,email')
            ->when($request->filled('action'), fn ($q) => $q->where('action', 'like', $request->action.'%'))
            ->when($request->filled('actor'), fn ($q) => $q->where('actor_user_id', $request->actor))
            ->latest('created_at')
            ->paginate(50);

        return response()->json([
            'data' => collect($page->items())->map(fn (AuditLog $l) => [
                'id' => $l->id,
                'action' => $l->action,
                'actor' => $l->actor?->email ?? 'system',
                'resource' => $l->resource_type ? "{$l->resource_type}:{$l->resource_id}" : null,
                'reason' => $l->reason,
                'ip_address' => $l->ip_address,
                'request_id' => $l->request_id,
                'metadata' => $l->metadata,
                'created_at' => $l->created_at?->toIso8601String(),
            ]),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }
}
