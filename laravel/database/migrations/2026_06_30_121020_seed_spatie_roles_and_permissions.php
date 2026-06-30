<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        if (
            !Schema::hasTable('users') ||
            !Schema::hasTable('roles') ||
            !Schema::hasTable('permissions') ||
            !Schema::hasTable('model_has_roles') ||
            !Schema::hasColumn('users', 'legacy_role')
        ) {
            return;
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $guardName = 'web';
        $permissions = [
            'admin.access',
            'users.view',
            'users.manage',
            'users.role.manage',
            'products.manage',
            'events.manage',
            'agenda.manage',
            'ecommerce.manage',
            'transactions.manage',
            'pages.manage',
            'settings.manage',
        ];

        foreach ($permissions as $permissionName) {
            Permission::findOrCreate($permissionName, $guardName);
        }

        $userRole = Role::findOrCreate('user', $guardName);
        $adminRole = Role::findOrCreate('admin', $guardName);
        $superAdminRole = Role::findOrCreate('super_admin', $guardName);

        $adminRole->syncPermissions([
            'admin.access',
            'users.view',
            'users.manage',
            'products.manage',
            'events.manage',
            'agenda.manage',
            'ecommerce.manage',
            'transactions.manage',
            'pages.manage',
            'settings.manage',
        ]);

        $superAdminRole->syncPermissions(Permission::query()->where('guard_name', $guardName)->pluck('name')->all());
        $userRole->syncPermissions([]);

        User::query()->select(['id', 'legacy_role'])->chunkById(100, function ($users) {
            foreach ($users as $user) {
                $user->syncAppRole($user->legacy_role ?? 'user');
            }
        }, 'id');

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        if (!Schema::hasTable('permissions') || !Schema::hasTable('roles')) {
            return;
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Permission::query()->whereIn('name', [
            'admin.access',
            'users.view',
            'users.manage',
            'users.role.manage',
            'products.manage',
            'events.manage',
            'agenda.manage',
            'ecommerce.manage',
            'transactions.manage',
            'pages.manage',
            'settings.manage',
        ])->delete();

        Role::query()->whereIn('name', ['user', 'admin', 'super_admin'])->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
