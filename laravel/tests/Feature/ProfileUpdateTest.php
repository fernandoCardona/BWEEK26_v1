<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_own_profile(): void
    {
        $user = new User();
        $user->fill([
            'name' => 'Test',
            'email' => 'test@example.com',
            'password' => 'password1234',
        ]);
        $user->forceFill(['role' => 'user', 'is_active' => true])->save();

        $response = $this->withSession(['_token' => 'test-token'])->actingAs($user)->patch('/profile', [
            '_token' => 'test-token',
            'name' => 'Nuevo Nombre',
            'email' => 'test@example.com',
            'birth_date' => '',
            'country' => 'es',
            'city' => 'Sitges',
            'no_newsletter' => true,
        ]);

        $response->assertStatus(302);

        $user->refresh();
        $this->assertSame('Nuevo Nombre', $user->name);
        $this->assertSame('SITGES', strtoupper((string) $user->city));
        $this->assertSame('ES', $user->country);
        $this->assertNull($user->birth_date);
        $this->assertFalse((bool) $user->newsletter_subscribed);
    }

    public function test_admin_can_update_user_profile(): void
    {
        $admin = new User();
        $admin->fill([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => 'password1234',
        ]);
        $admin->forceFill(['role' => 'admin', 'is_active' => true])->save();

        $user = new User();
        $user->fill([
            'name' => 'User',
            'email' => 'user@example.com',
            'password' => 'password1234',
        ]);
        $user->forceFill(['role' => 'user', 'is_active' => true])->save();

        $response = $this->withSession(['_token' => 'test-token'])->actingAs($admin)->patch(route('admin.users.update', $user->id), [
            '_token' => 'test-token',
            'name' => 'User Updated',
            'email' => 'user@example.com',
            'country' => 'FR',
        ]);

        $response->assertStatus(302);
        $user->refresh();
        $this->assertSame('User Updated', $user->name);
        $this->assertSame('FR', $user->country);
    }
}
