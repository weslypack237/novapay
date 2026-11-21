<?php

namespace Tests;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RbacSeeder::class);
    }

    protected function makeUser(string $role = Role::CUSTOMER, string $status = User::STATUS_ACTIVE): User
    {
        static $n = 0;
        $n++;
        $user = User::create(['email' => "user{$n}@test.local", 'password' => 'Secret-Passw0rd', 'status' => $status]);
        $user->profile()->create(['first_name' => 'Test', 'last_name' => "User{$n}"]);
        $user->roles()->attach(Role::where('name', $role)->value('id'));

        return $user;
    }
}
