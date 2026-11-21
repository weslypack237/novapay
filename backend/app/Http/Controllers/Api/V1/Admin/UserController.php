<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['q' => ['nullable', 'string', 'max:100'], 'status' => ['nullable', 'string', 'max:32']]);

        $page = User::with('profile', 'roles')
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.strtolower($request->q).'%';
                $q->where(fn ($w) => $w->whereRaw('LOWER(email) LIKE ?', [$term])->orWhere('phone', 'like', $term));
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(25);

        return response()->json([
            'data' => collect($page->items())->map(fn (User $u) => [
                'id' => $u->id,
                'name' => trim(($u->profile?->first_name ?? '').' '.($u->profile?->last_name ?? '')),
                'email' => $u->email,
                'phone' => $u->phone,
                'status' => $u->status,
                'roles' => $u->roles->pluck('name'),
                'created_at' => $u->created_at?->toIso8601String(),
                'last_login_at' => $u->last_login_at?->toIso8601String(),
            ]),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    /** Sensitive: requires permission, a reason, and leaves an audit record. */
    public function updateStatus(Request $request, string $userId, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:active,restricted,suspended,closed'],
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);
        $target = User::findOrFail($userId);

        if ($target->id === $request->user()->id) {
            return $this->error('self_action_forbidden', 'You cannot change the status of your own account.', 422);
        }

        $previous = $target->status;
        $target->forceFill(['status' => $data['status']])->save();

        if (in_array($data['status'], [User::STATUS_SUSPENDED, User::STATUS_CLOSED], true)) {
            $target->tokens()->delete();
        }

        $audit->record('admin.user.status_changed', $request->user(), 'user', $target->id, $data['reason'], [
            'from' => $previous, 'to' => $data['status'],
        ]);

        return response()->json(['data' => ['id' => $target->id, 'status' => $target->status]]);
    }
}
