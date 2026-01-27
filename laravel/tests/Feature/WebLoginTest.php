<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_correct_credentials(): void
    {
        $user = new User();
        $user->fill([
            'name' => 'Login Test',
            'email' => 'login@example.com',
            'password' => 'password1234',
        ]);
        $user->forceFill([
            'role' => 'user',
            'is_active' => true,
        ])->save();

        $response = $this->withSession(['_token' => 'test-token'])->post('/login', [
            '_token' => 'test-token',
            'email' => 'login@example.com',
            'password' => 'password1234',
        ]);

        $response->assertStatus(302);
        $this->assertAuthenticatedAs($user);
    }
}

