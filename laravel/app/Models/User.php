<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Traits\HasRoles;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    protected string $guard_name = 'web';

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'name',
        'last_name',
        'nickname',
        'avatar_path',
        'email',
        'phone',
        'telegram_id',
        'telegram_username',
        'password',
        'email_verified_at',
        'birth_date',
        'gender',
        'address_line1',
        'address_line2',
        'city',
        'postal_code',
        'country',
        'preferred_locale',
        'registration_source',
        'interests',
        'newsletter_subscribed',
        'terms_accepted_at',
        'last_login_at',
        'legacy_role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'id' => 'string',
            'email_verified_at' => 'datetime',
            'interests' => 'json',
            'newsletter_subscribed' => 'boolean',
            'terms_accepted_at' => 'datetime',
            'last_login_at' => 'datetime',
            'birth_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function setPasswordAttribute($value): void
    {
        if ($value === null) {
            $this->attributes['password'] = null;
            return;
        }

        $password = (string) $value;

        if (preg_match('/^\\$2[ayb]\\$\\d{2}\\$/', $password) === 1) {
            $this->attributes['password'] = $password;
            return;
        }

        $this->attributes['password'] = Hash::make($password);
    }

    protected $appends = [
        'avatar_url',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });

        static::saved(function (self $user) {
            $user->synchronizeAppRole();
        });
    }

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [
            'role' => $this->roleName(),
            'name' => $this->name,
        ];
    }

    public static function normalizeRoleName(?string $role): string
    {
        $normalized = strtolower(trim((string) $role));

        return match ($normalized) {
            'super_admin' => 'super_admin',
            'admin', 'super_user' => 'admin',
            default => 'user',
        };
    }

    public function roleName(): string
    {
        if (self::permissionTablesAvailable()) {
            $loadedRoles = $this->relationLoaded('roles')
                ? $this->roles->pluck('name')->filter()
                : collect();

            if ($loadedRoles->isEmpty() && $this->exists) {
                $loadedRoles = $this->roles()->pluck('name');
            }

            $role = $loadedRoles
                ->map(fn ($name) => self::normalizeRoleName((string) $name))
                ->sortByDesc(fn (string $name) => match ($name) {
                    'super_admin' => 3,
                    'admin' => 2,
                    default => 1,
                })
                ->first();

            if (is_string($role) && $role !== '') {
                return $role;
            }
        }

        return self::normalizeRoleName($this->legacy_role ?? 'user');
    }

    public function hasAppRole(string $role): bool
    {
        return $this->roleName() === self::normalizeRoleName($role);
    }

    public function hasAnyAppRole(array $roles): bool
    {
        $normalizedRoles = array_values(array_unique(array_map(
            fn ($role) => self::normalizeRoleName((string) $role),
            $roles
        )));

        return in_array($this->roleName(), $normalizedRoles, true);
    }

    public function isAdminLike(): bool
    {
        return $this->canAccessAdmin();
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasAppRole('super_admin');
    }

    public function canAccessAdmin(): bool
    {
        return $this->canUsePermission('admin.access', fn () => $this->hasAnyAppRole(['admin', 'super_admin']));
    }

    public function canManageUsers(): bool
    {
        return $this->canUsePermission('users.manage', fn () => $this->hasAnyAppRole(['admin', 'super_admin']));
    }

    public function canManageUserRoles(): bool
    {
        return $this->canUsePermission('users.role.manage', fn () => $this->isSuperAdmin());
    }

    public function canViewUsers(): bool
    {
        return $this->canUsePermission('users.view', fn () => $this->hasAnyAppRole(['admin', 'super_admin']));
    }

    public function canManageProducts(): bool
    {
        return $this->canUsePermission('products.manage', fn () => $this->hasAnyAppRole(['admin', 'super_admin']));
    }

    public function canManageEvents(): bool
    {
        return $this->canUsePermission('events.manage', fn () => $this->hasAnyAppRole(['admin', 'super_admin']));
    }

    public function canManageAgenda(): bool
    {
        return $this->canUsePermission('agenda.manage', fn () => $this->hasAnyAppRole(['admin', 'super_admin']));
    }

    public function canManageEcommerce(): bool
    {
        return $this->canUsePermission('ecommerce.manage', fn () => $this->hasAnyAppRole(['admin', 'super_admin']));
    }

    public function canManageTransactions(): bool
    {
        return $this->canUsePermission('transactions.manage', fn () => $this->hasAnyAppRole(['admin', 'super_admin']));
    }

    public function canManagePages(): bool
    {
        return $this->canUsePermission('pages.manage', fn () => $this->hasAnyAppRole(['admin', 'super_admin']));
    }

    public function canManageSettings(): bool
    {
        return $this->canUsePermission('settings.manage', fn () => $this->hasAnyAppRole(['admin', 'super_admin']));
    }

    public function syncAppRole(?string $role = null): void
    {
        $normalizedRole = self::normalizeRoleName($role ?? $this->legacy_role ?? 'user');

        if (($this->legacy_role ?? null) !== $normalizedRole) {
            $this->forceFill(['legacy_role' => $normalizedRole])->saveQuietly();
        }

        $this->synchronizeAppRole();
    }

    private function synchronizeAppRole(): void
    {
        $normalizedRole = self::normalizeRoleName($this->legacy_role ?? 'user');

        if (($this->legacy_role ?? null) !== $normalizedRole) {
            $this->forceFill(['legacy_role' => $normalizedRole])->saveQuietly();
        }

        if (!self::permissionTablesAvailable() || !$this->exists) {
            return;
        }

        $guardName = method_exists($this, 'getDefaultGuardName')
            ? $this->getDefaultGuardName()
            : $this->guard_name;

        $roleExists = Role::query()
            ->where('name', $normalizedRole)
            ->where('guard_name', $guardName)
            ->exists();

        if (!$roleExists) {
            return;
        }

        $currentRoles = $this->roles()
            ->pluck('name')
            ->map(fn ($name) => self::normalizeRoleName((string) $name))
            ->unique()
            ->values();

        if ($currentRoles->count() === 1 && $currentRoles->first() === $normalizedRole) {
            return;
        }

        $this->syncRoles([$normalizedRole]);
        $this->unsetRelation('roles');
    }

    private static function permissionTablesAvailable(): bool
    {
        try {
            return Schema::hasTable('roles') && Schema::hasTable('model_has_roles');
        } catch (\Throwable $e) {
            return false;
        }
    }

    private function canUsePermission(string $permission, callable $fallback): bool
    {
        if (!self::permissionTablesAvailable()) {
            return (bool) $fallback();
        }

        try {
            return $this->can($permission);
        } catch (\Throwable $e) {
            return (bool) $fallback();
        }
    }

    public function getAvatarUrlAttribute()
    {
        if (!$this->avatar_path) {
            return null;
        }

        return Storage::disk('public')->url($this->avatar_path);
    }

    public function sendPasswordResetNotification($token)
    {
        $this->notify(new \App\Notifications\ResetPasswordNotification($token));
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function cart()
    {
        return $this->hasOne(Cart::class);
    }
}
