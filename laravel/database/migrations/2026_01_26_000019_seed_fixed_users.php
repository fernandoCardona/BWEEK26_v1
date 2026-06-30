<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        $password = (string) env('BSW_FIXED_USERS_PASSWORD', 'changeme_fixed_users_password');

        $fixedUsers = [
            [
                'id' => 'e0e8e9a2-3c9d-4f42-b6ee-0e9d4e8d7a11',
                'email' => (string) env('BSW_FIXED_USER_EMAIL', ''),
                'role' => 'user',
            ],
            [
                'id' => '7c5b0e9c-9d15-4fb0-ae3e-6e7c2d0a6b35',
                'email' => (string) env('BSW_FIXED_ADMIN_EMAIL', ''),
                'role' => 'admin',
            ],
            [
                'id' => '5c3b17f2-5d5a-4c74-9e4c-6e4c0a0a7e21',
                'email' => (string) env('BSW_FIXED_SUPERADMIN_EMAIL_1', ''),
                'role' => 'super_admin',
            ],
            [
                'id' => 'b1f23b61-74e9-4db0-8f2c-3a2d3fb0b4c9',
                'email' => (string) env('BSW_FIXED_SUPERADMIN_EMAIL_2', ''),
                'role' => 'super_admin',
            ],
        ];

        foreach ($fixedUsers as $u) {
            $email = strtolower(trim((string) $u['email']));
            if ($email === '') {
                continue;
            }

            $exists = DB::table('users')->whereRaw('lower(email) = ?', [$email])->exists();
            if ($exists) {
                continue;
            }

            $name = explode('@', $email)[0] ?? 'User';

            DB::table('users')->insert([
                'id' => (string) ($u['id'] ?? Str::uuid()),
                'name' => $name,
                'email' => $email,
                'phone' => null,
                'telegram_id' => null,
                'telegram_username' => null,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
                'legacy_role' => \App\Models\User::normalizeRoleName((string) $u['role']),
                'preferred_locale' => 'es',
                'registration_source' => 'seed_fixed_users',
                'interests' => null,
                'newsletter_subscribed' => false,
                'terms_accepted_at' => null,
                'last_login_at' => null,
                'remember_token' => null,
                'created_at' => now(),
                'updated_at' => now(),
                'is_active' => true,
            ]);
        }
    }

    public function down(): void {}
};
