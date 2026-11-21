<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Server-side RBAC: route->middleware('permission:admin.audit.view') */
class EnsurePermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        foreach ($permissions as $permission) {
            if (! $user || ! $user->hasPermission($permission)) {
                return response()->json([
                    'error' => ['code' => 'forbidden', 'message' => 'You do not have permission to perform this action.'],
                    'request_id' => $request->attributes->get('request_id'),
                ], 403);
            }
        }

        return $next($request);
    }
}
