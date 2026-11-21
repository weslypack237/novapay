<?php

use App\Http\Controllers\Api\V1\Admin\AuditLogController;
use App\Http\Controllers\Api\V1\Admin\LedgerController;
use App\Http\Controllers\Api\V1\Admin\OverviewController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\WalletController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('health', fn () => ['status' => 'ok', 'demo_mode' => (bool) config('novapay.demo_mode')]);

    Route::middleware('throttle:auth')->group(function () {
        Route::post('auth/register', [AuthController::class, 'register']);
        Route::post('auth/login', [AuthController::class, 'login']);
    });

    Route::middleware(['auth:sanctum', 'active'])->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::patch('me/theme', [AuthController::class, 'updateTheme']);
        Route::post('auth/verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:otp');
        Route::post('auth/resend-otp', [AuthController::class, 'resendOtp']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::post('auth/logout-others', [AuthController::class, 'logoutOtherSessions']);

        Route::get('wallets', [WalletController::class, 'index']);
        Route::get('wallets/{walletId}/transactions', [WalletController::class, 'transactions'])->whereUuid('walletId');

        Route::prefix('admin')->group(function () {
            Route::get('overview', OverviewController::class)->middleware('permission:admin.overview.view');
            Route::get('users', [UserController::class, 'index'])->middleware('permission:admin.users.view');
            Route::patch('users/{userId}/status', [UserController::class, 'updateStatus'])
                ->whereUuid('userId')->middleware('permission:admin.users.change_status');
            Route::get('audit-logs', [AuditLogController::class, 'index'])->middleware('permission:admin.audit.view');
            Route::get('ledger/trial-balance', [LedgerController::class, 'trialBalance'])->middleware('permission:admin.ledger.view');
            Route::post('ledger/transactions/{transactionId}/reverse', [LedgerController::class, 'reverse'])
                ->whereUuid('transactionId')->middleware('permission:admin.ledger.reverse');
        });
    });
});
