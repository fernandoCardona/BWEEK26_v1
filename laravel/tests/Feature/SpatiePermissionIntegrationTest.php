<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class SpatiePermissionIntegrationTest extends TestCase
{
    use DatabaseMigrations;

    public function test_admin_role_is_synced_with_spatie_permissions(): void
    {
        $user = new User();
        $user->fill([
            'name' => 'Admin Sync',
            'email' => 'admin.sync@example.com',
            'password' => 'password1234',
        ]);
        $user->forceFill([
            'legacy_role' => 'admin',
            'is_active' => true,
        ])->save();

        $user->syncAppRole('admin');
        $user->refresh();

        $this->assertSame('admin', $user->roleName());
        $this->assertTrue($user->hasRole('admin'));
        $this->assertTrue($user->canAccessAdmin());
        $this->assertTrue($user->canManageUsers());
        $this->assertTrue($user->canManageProducts());
        $this->assertFalse($user->canManageUserRoles());
    }

    public function test_super_admin_receives_full_access(): void
    {
        $user = new User();
        $user->fill([
            'name' => 'Super Admin Sync',
            'email' => 'super.sync@example.com',
            'password' => 'password1234',
        ]);
        $user->forceFill([
            'legacy_role' => 'super_admin',
            'is_active' => true,
        ])->save();

        $user->syncAppRole('super_admin');
        $user->refresh();

        $this->assertSame('super_admin', $user->roleName());
        $this->assertTrue($user->hasRole('super_admin'));
        $this->assertTrue($user->canAccessAdmin());
        $this->assertTrue($user->canManageUserRoles());
        $this->assertTrue($user->canManageEvents());
        $this->assertTrue($user->canManageEcommerce());
        $this->assertTrue($user->canManageSettings());
    }
}
