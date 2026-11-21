<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RbacSeeder extends Seeder
{
    /** permission key => [description, sensitive] */
    public const PERMISSIONS = [
        'admin.overview.view' => ['View admin overview', false],
        'admin.users.view' => ['Search users and businesses', false],
        'admin.users.change_status' => ['Restrict, suspend, reactivate or close accounts', true],
        'admin.audit.view' => ['Read the audit log', false],
        'admin.ledger.view' => ['View ledger and trial balance', false],
        'admin.ledger.reverse' => ['Post reason-coded reversals', true],
        'admin.kyc.review' => ['Review KYC/KYB cases', true],
        'admin.roles.manage' => ['Manage admin roles and permissions', true],
    ];

    /** Least privilege: each staff role gets only what it needs. */
    public const ROLE_PERMISSIONS = [
        Role::CUSTOMER => [],
        Role::BUSINESS_OWNER => [],
        Role::BUSINESS_ADMIN => [],
        Role::BUSINESS_MEMBER => [],
        Role::SUPPORT_AGENT => ['admin.overview.view', 'admin.users.view'],
        Role::OPERATIONS_ADMIN => ['admin.overview.view', 'admin.users.view', 'admin.ledger.view', 'admin.ledger.reverse', 'admin.audit.view'],
        Role::COMPLIANCE_ADMIN => ['admin.overview.view', 'admin.users.view', 'admin.users.change_status', 'admin.kyc.review', 'admin.audit.view'],
        Role::SUPER_ADMIN => ['*'],
    ];

    public function run(): void
    {
        foreach (self::PERMISSIONS as $key => [$description, $sensitive]) {
            Permission::updateOrCreate(['key' => $key], ['description' => $description, 'is_sensitive' => $sensitive]);
        }

        foreach (self::ROLE_PERMISSIONS as $name => $keys) {
            $role = Role::updateOrCreate(['name' => $name], ['description' => ucwords(str_replace('_', ' ', $name))]);
            $ids = $keys === ['*'] ? Permission::pluck('id') : Permission::whereIn('key', $keys)->pluck('id');
            $role->permissions()->sync($ids);
        }
    }
}
