<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class WebLoginTest extends TestCase
{
    use DatabaseMigrations;

    public function test_user_can_login_with_correct_credentials(): void
    {
        $user = new User();
        $user->fill([
            'name' => 'Login Test',
            'email' => 'login@example.com',
            'password' => 'password1234',
        ]);
        $user->forceFill([
            'legacy_role' => 'user',
            'is_active' => true,
        ])->save();
        $user->syncAppRole('user');

        $response = $this->withSession(['_token' => 'test-token'])->post('/login', [
            '_token' => 'test-token',
            'email' => 'login@example.com',
            'password' => 'password1234',
        ]);

        $response->assertStatus(302);
        $this->assertAuthenticatedAs($user);
    }
}
