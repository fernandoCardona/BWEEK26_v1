<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Event;
use App\Models\Product;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $fixedPassword = (string) env('BSW_FIXED_USERS_PASSWORD', 'c4c4v4c4');

        // Required Users
        User::updateOrCreate(
            ['email' => 'fernandocardonatoro@gmail.com'],
            [
                'name' => 'Fernando Cardona',
                'password' => Hash::make($fixedPassword),
                'role' => 'super_admin',
                'preferred_locale' => 'es',
            ]
        );
        User::updateOrCreate(
            ['email' => 'fernandocardonatoro2@gmail.com'],
            [
                'name' => 'Fernando Cardona (Admin)',
                'password' => Hash::make($fixedPassword),
                'role' => 'admin',
                'preferred_locale' => 'es',
            ]
        );
        User::updateOrCreate(
            ['email' => 'fct.registro@gmail.com'],
            [
                'name' => 'FCT Registro',
                'password' => Hash::make($fixedPassword),
                'role' => 'user',
                'preferred_locale' => 'es',
            ]
        );

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
