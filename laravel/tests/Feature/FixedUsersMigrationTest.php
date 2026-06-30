<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class FixedUsersMigrationTest extends TestCase
{
    use DatabaseMigrations;

    protected function setUp(): void
    {
        putenv('BSW_FIXED_USERS_PASSWORD=test-password-1234');
        putenv('BSW_FIXED_USER_EMAIL=fixed.user@example.com');
        putenv('BSW_FIXED_SUPERADMIN_EMAIL_1=fixed.admin1@example.com');
        putenv('BSW_FIXED_SUPERADMIN_EMAIL_2=fixed.admin2@example.com');

        $_ENV['BSW_FIXED_USERS_PASSWORD'] = 'test-password-1234';
        $_ENV['BSW_FIXED_USER_EMAIL'] = 'fixed.user@example.com';
        $_ENV['BSW_FIXED_SUPERADMIN_EMAIL_1'] = 'fixed.admin1@example.com';
        $_ENV['BSW_FIXED_SUPERADMIN_EMAIL_2'] = 'fixed.admin2@example.com';

        $_SERVER['BSW_FIXED_USERS_PASSWORD'] = 'test-password-1234';
        $_SERVER['BSW_FIXED_USER_EMAIL'] = 'fixed.user@example.com';
        $_SERVER['BSW_FIXED_SUPERADMIN_EMAIL_1'] = 'fixed.admin1@example.com';
        $_SERVER['BSW_FIXED_SUPERADMIN_EMAIL_2'] = 'fixed.admin2@example.com';

        parent::setUp();
    }

    public function test_fixed_users_exist_after_migrations(): void
    {
        $migration = require base_path('database/migrations/2026_01_26_000019_seed_fixed_users.php');
        $migration->up();

        $emails = collect(config('core_users.fixed_users', []))
            ->map(fn ($u) => strtolower(trim((string) ($u['email'] ?? ''))))
            ->filter()
            ->values();

        $this->assertGreaterThanOrEqual(3, $emails->count());

        foreach ($emails as $email) {
            $this->assertTrue(
                User::query()->whereRaw('lower(email) = ?', [$email])->exists(),
                "No existe el usuario fijo: {$email}"
            );
        }
    }
}
