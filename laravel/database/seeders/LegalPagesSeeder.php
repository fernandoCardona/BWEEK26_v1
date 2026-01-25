<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Page;
use App\Models\Section;

class LegalPagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Privacy Policy Page
        $privacy = Page::updateOrCreate(
            ['slug' => 'privacy-policy'],
            [
                'title' => [
                    'es' => 'Política de Privacidad',
                    'en' => 'Privacy Policy',
                    'ca' => 'Política de Privadesa',
                    'fr' => 'Politique de Confidentialité',
                    'de' => 'Datenschutzerklärung'
                ],
                'is_published' => true
            ]
        );

        Section::updateOrCreate(
            ['page_id' => $privacy->id, 'type' => 'content', 'order' => 1],
            [
                'config' => [
                    'text' => [
                        'es' => 'En Bears Week Sitges, nos tomamos muy en serio tu privacidad. Recopilamos tus datos únicamente para procesar tus entradas y enviarte información relevante sobre el festival.',
                        'en' => 'At Bears Week Sitges, we take your privacy very seriously. We only collect your data to process your tickets and send you relevant information about the festival.',
                        'ca' => 'A Bears Week Sitges, ens prenem molt seriosament la teva privadesa. Recopilem les teves dades únicament per processar les teves entrades.',
                        'fr' => 'Chez Bears Week Sitges, nous prenons votre vie privée très au sérieux. Nous ne collectons vos données que pour traiter vos billets.',
                        'de' => 'Bei der Bears Week Sitges nehmen wir Ihre Privatsphäre sehr ernst. Wir erheben Ihre Daten nur zur Bearbeitung Ihrer Tickets.'
                    ]
                ]
            ]
        );

        // 2. Cookies Policy Page
        $cookies = Page::updateOrCreate(
            ['slug' => 'cookies-policy'],
            [
                'title' => [
                    'es' => 'Política de Cookies',
                    'en' => 'Cookies Policy',
                    'ca' => 'Política de Cookies',
                    'fr' => 'Politique de Cookies',
                    'de' => 'Cookie-Richtlinie'
                ],
                'is_published' => true
            ]
        );

        Section::updateOrCreate(
            ['page_id' => $cookies->id, 'type' => 'content', 'order' => 1],
            [
                'config' => [
                    'text' => [
                        'es' => 'Utilizamos cookies técnicas y analíticas para mejorar tu experiencia en nuestra web. Al navegar, aceptas el uso de las mismas.',
                        'en' => 'We use technical and analytical cookies to improve your experience on our website. By browsing, you accept their use.',
                        'ca' => 'Utilitzem cookies tècniques i analítiques per millorar la teva experiència a la nostra web.',
                        'fr' => 'Nous utilisons des cookies techniques et analytiques pour améliorer votre expérience sur notre site web.',
                        'de' => 'Wir verwenden technische und analytische Cookies, um Ihr Erlebnis auf unserer Website zu verbessern.'
                    ]
                ]
            ]
        );
    }
}
