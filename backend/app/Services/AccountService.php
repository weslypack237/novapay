<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use Illuminate\Support\Facades\DB;

class AccountService
{
    public function __construct(
        private readonly WalletService $wallets,
        private readonly OtpService $otp,
        private readonly AuditLogger $audit,
    ) {}

    public function registerCustomer(array $data): User
    {
        $user = DB::transaction(function () use ($data) {
            $user = User::create([
                'email' => isset($data['email']) ? strtolower($data['email']) : null,
                'phone' => $data['phone'] ?? null,
                'password' => $data['password'],
                'status' => User::STATUS_PENDING,
            ]);

            $user->profile()->create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'country_code' => $data['country_code'] ?? 'CM',
            ]);

            $user->roles()->attach(Role::where('name', Role::CUSTOMER)->firstOrFail()->id);
            $this->wallets->openForUser($user, config('novapay.default_currency'));
            $this->audit->record('user.registered', $user, 'user', $user->id);

            return $user;
        });

        $this->otp->issue($user, $user->email ? 'verify_email' : 'verify_phone', $user->email ? 'email' : 'sms');

        return $user;
    }
}
