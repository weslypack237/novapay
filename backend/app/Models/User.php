<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasUuids, Notifiable;

    public const STATUS_PENDING = 'pending_verification';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_RESTRICTED = 'restricted';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_CLOSED = 'closed';

    protected $fillable = ['email', 'phone', 'password', 'status', 'preferred_theme'];

    protected $hidden = ['password'];

    /** @var array<string, bool>|null */
    private ?array $permissionCache = null;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles')->withPivot('business_id')->withTimestamps();
    }

    public function wallets(): HasMany
    {
        return $this->hasMany(Wallet::class);
    }

    public function hasRole(string $name): bool
    {
        return $this->loadMissing('roles')->roles->contains('name', $name);
    }

    /** Global (non business-scoped) permission check. */
    public function hasPermission(string $key): bool
    {
        if ($this->permissionCache === null) {
            $this->permissionCache = Permission::query()
                ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
                ->join('user_roles', 'role_permissions.role_id', '=', 'user_roles.role_id')
                ->where('user_roles.user_id', $this->id)
                ->whereNull('user_roles.business_id')
                ->pluck('permissions.key')
                ->flip()
                ->map(fn () => true)
                ->all();
        }

        return isset($this->permissionCache[$key]);
    }

    public function isStaff(): bool
    {
        return $this->loadMissing('roles')->roles->pluck('name')->intersect(Role::STAFF_ROLES)->isNotEmpty();
    }

    public function canTransact(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }
}
