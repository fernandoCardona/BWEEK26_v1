<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $fixedPassword = (string) env('BSW_FIXED_USERS_PASSWORD', 'changeme_fixed_users_password');

        // Required Users
        $fixedUsers = [
            [
                'email' => (string) env('BSW_FIXED_SUPERADMIN_EMAIL_1', 'superadmin@example.com'),
                'name' => 'Super Admin',
                'role' => 'super_admin',
            ],
            [
                'email' => (string) env('BSW_FIXED_ADMIN_EMAIL', 'admin@example.com'),
                'name' => 'Admin',
                'role' => 'admin',
            ],
            [
                'email' => (string) env('BSW_FIXED_USER_EMAIL', 'user@example.com'),
                'name' => 'User',
                'role' => 'user',
            ],
        ];

        foreach ($fixedUsers as $u) {
            $email = strtolower(trim((string) ($u['email'] ?? '')));
            if ($email === '') {
                continue;
            }

            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => (string) ($u['name'] ?? 'User'),
                    'password' => Hash::make($fixedPassword),
                    'legacy_role' => User::normalizeRoleName((string) ($u['role'] ?? 'user')),
                    'preferred_locale' => 'es',
                ]
            );

            $user->syncAppRole((string) ($u['role'] ?? 'user'));
        }

        // Demo Events
        Event::create([
            'name' => ['es' => 'Playa Bear Opening', 'en' => 'Playa Bear Opening'],
            'description' => ['es' => 'Inauguración oficial en la playa de Sitges.', 'en' => 'Official inauguration at Sitges beach.'],
            'event_date' => now()->addMonths(8),
            'location' => ['es' => 'Playa de la Bassa Rodona'],
            'capacity' => 1000,
        ]);

        Event::create([
            'name' => ['es' => 'Pool Party Legendaria', 'en' => 'Legendary Pool Party'],
            'description' => ['es' => 'La fiesta en la piscina más grande del festival.', 'en' => 'The biggest pool party of the festival.'],
            'event_date' => now()->addMonths(8)->addDays(2),
            'location' => ['es' => 'Hotel Terraza'],
            'capacity' => 500,
        ]);

        // Demo Products
        Product::create([
            'name' => ['es' => 'Camiseta Oficial 2026', 'en' => 'Official T-Shirt 2026'],
            'description' => ['es' => 'Edición limitada Bears Week 2026.', 'en' => 'Limited edition Bears Week 2026.'],
            'price' => 25.00,
            'category' => 'Merchandising',
        ]);

        $this->call([
            LegalPagesSeeder::class,
        ]);
    }
}
