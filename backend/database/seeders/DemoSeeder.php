<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Database\Seeder;

/**
 * Fictional people, simulated money. Every demo posting has is_simulated=true
 * and the UI labels it. Never run in production.
 */
class DemoSeeder extends Seeder
{
    public function run(WalletService $wallets): void
    {
        $customer = $this->user('demo.customer@novapay.local', 'Amara', 'Demo', Role::CUSTOMER);
        $account = $wallets->openForUser($customer, 'XAF');
        $wallets->demoCredit($account, 250_000, 'demo-seed:'.$customer->id.':1');
        $wallets->demoCredit($account, 75_500, 'demo-seed:'.$customer->id.':2');

        $this->user('demo.ops@novapay.local', 'Ops', 'Demo', Role::OPERATIONS_ADMIN);
        $this->user('demo.admin@novapay.local', 'Super', 'Demo', Role::SUPER_ADMIN);

        $this->command?->warn('Demo accounts use the password "Demo-Passw0rd!" — local only.');
    }

    private function user(string $email, string $first, string $last, string $role): User
    {
        $user = User::firstOrCreate(['email' => $email], [
            'password' => 'Demo-Passw0rd!',
            'status' => User::STATUS_ACTIVE,
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();
        $user->profile()->firstOrCreate([], ['first_name' => $first, 'last_name' => $last]);
        $user->roles()->syncWithoutDetaching([Role::where('name', $role)->value('id')]);

        return $user;
    }
}
