<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Blocks suspended/closed accounts everywhere; restricted/pending can still read. */
class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $status = $request->user()?->status;

        if (in_array($status, [User::STATUS_SUSPENDED, User::STATUS_CLOSED], true)) {
            $token = $request->user()->currentAccessToken();
            if ($token instanceof \Laravel\Sanctum\PersonalAccessToken) {
                $token->delete();
            }

            return response()->json([
                'error' => ['code' => 'account_'.$status, 'message' => 'This account is not available. Please contact support.'],
            ], 403);
        }

        return $next($request);
    }
}
