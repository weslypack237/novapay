<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    public const CUSTOMER = 'customer';
    public const BUSINESS_OWNER = 'business_owner';
    public const BUSINESS_ADMIN = 'business_admin';
    public const BUSINESS_MEMBER = 'business_member';
    public const SUPPORT_AGENT = 'support_agent';
    public const OPERATIONS_ADMIN = 'operations_admin';
    public const COMPLIANCE_ADMIN = 'compliance_admin';
    public const SUPER_ADMIN = 'super_admin';

    public const STAFF_ROLES = [self::SUPPORT_AGENT, self::OPERATIONS_ADMIN, self::COMPLIANCE_ADMIN, self::SUPER_ADMIN];

    protected $fillable = ['name', 'description'];

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions');
    }
}
