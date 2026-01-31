<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AgendaLocation;
use App\Models\Page;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PagesController extends Controller
{
    private function supportedLocales(): array
    {
        return ['es', 'ca', 'en', 'fr', 'it', 'de'];
    }

    public function index()
    {
        $pages = Page::query()
            ->orderBy('slug')
            ->get()
            ->map(function (Page $p) {
                return [
                    'id' => $p->id,
                    'slug' => $p->slug,
                    'title' => $p->getTranslations('title'),
                    'meta_description' => $p->getTranslations('meta_description'),
                    'is_published' => (bool) $p->is_published,
                    'updated_at' => $p->updated_at?->toISOString(),
                ];
            })
            ->values();

        return Inertia::render('Admin/Pages/Index', ['pages' => $pages]);
    }

    public function edit(string $page)
    {
        $pageModel = Page::query()->where('slug', $page)->firstOrFail();

        if (!$pageModel->sections()->exists()) {
            $defs = $this->templateDefsForSlug($pageModel->slug);
            $this->ensureSectionsForPage($pageModel, $defs);

            if ($pageModel->slug === 'home') {
                $this->prefillHomeTemplate($pageModel);
            } else {
                $this->prefillGenericTemplate($pageModel);
                $text = $this->readLegacyTextForSlug($pageModel->slug);
                if ($text !== '') {
                    $content = $this->findSectionByKey($pageModel, 'content');
                    if ($content) {
                        $this->setSectionFieldsIfEmpty($content, 'es', ['body' => $text]);
                    }
                    $this->prefillLegacyDerivedFields($pageModel, $text);
                }
            }

            $this->tryImportHeroImage($pageModel, $this->legacyImagesDir($pageModel->slug));
        }

        $sections = $pageModel->sections()
            ->get()
            ->map(function (Section $s) {
                return [
                    'id' => $s->id,
                    'page_id' => $s->page_id,
                    'type' => $s->type,
                    'order' => (int) $s->order,
                    'config' => $s->config ?? [],
                    'updated_at' => $s->updated_at?->toISOString(),
                ];
            })
            ->values();

        $agendaLocations = AgendaLocation::query()
            ->where('is_active', true)
            ->orderBy('created_at')
            ->get()
            ->map(fn (AgendaLocation $l) => [
                'id' => $l->id,
                'name_i18n' => $l->name,
                'address' => $l->address,
                'google_maps_url' => $l->google_maps_url,
                'lat' => $l->lat,
                'lng' => $l->lng,
            ])
            ->values();

        return Inertia::render('Admin/Pages/Edit', [
            'page' => [
                'id' => $pageModel->id,
                'slug' => $pageModel->slug,
                'title' => $pageModel->getTranslations('title'),
                'meta_description' => $pageModel->getTranslations('meta_description'),
                'is_published' => (bool) $pageModel->is_published,
            ],
            'sections' => $sections,
            'agenda_locations' => $agendaLocations,
        ]);
    }

    public function update(string $page, Request $request)
    {
        $pageModel = Page::query()->where('slug', $page)->firstOrFail();

        $data = $request->validate([
            'locale' => ['required', 'string', 'in:es,ca,en,fr,it,de'],
            'title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $locale = $data['locale'];
        if (array_key_exists('title', $data)) {
            $pageModel->setTranslation('title', $locale, (string) ($data['title'] ?? ''));
        }
        if (array_key_exists('meta_description', $data)) {
            $pageModel->setTranslation('meta_description', $locale, (string) ($data['meta_description'] ?? ''));
        }
        if (array_key_exists('is_published', $data)) {
            $pageModel->is_published = (bool) $data['is_published'];
        }
        $pageModel->save();

        return redirect()->route('admin.pages.edit', ['page' => $pageModel->slug]);
    }

    public function bulkUpdate(string $page, Request $request)
    {
        $pageModel = Page::query()->where('slug', $page)->firstOrFail();

        $data = $request->validate([
            'locale' => ['required', 'string', 'in:es,ca,en,fr,it,de'],
            'title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'is_published' => ['nullable', 'boolean'],
            'sections' => ['required', 'array'],
            'sections.*.id' => ['required', 'uuid'],
            'sections.*.type' => ['nullable', 'string', 'max:80'],
            'sections.*.order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'sections.*.enabled' => ['nullable', 'boolean'],
            'sections.*.key' => ['nullable', 'string', 'max:80'],
            'sections.*.fields' => ['nullable', 'array'],
            'sections.*.poi' => ['nullable', 'array'],
            'sections.*.poi.include_agenda_locations' => ['nullable', 'boolean'],
            'sections.*.poi.agenda_location_ids' => ['nullable', 'array'],
            'sections.*.poi.agenda_location_ids.*' => ['uuid'],
            'sections.*.poi.custom' => ['nullable', 'array'],
            'sections.*.poi.custom.*.id' => ['required', 'string', 'max:80'],
            'sections.*.poi.custom.*.name_i18n' => ['nullable', 'array'],
            'sections.*.poi.custom.*.address' => ['nullable', 'string', 'max:255'],
            'sections.*.poi.custom.*.google_maps_url' => ['nullable', 'string', 'max:2048'],
            'sections.*.poi.custom.*.lat' => ['nullable', 'numeric', 'between:-90,90'],
            'sections.*.poi.custom.*.lng' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $locale = $data['locale'];
        if (array_key_exists('title', $data)) {
            $pageModel->setTranslation('title', $locale, (string) ($data['title'] ?? ''));
        }
        if (array_key_exists('meta_description', $data)) {
            $pageModel->setTranslation('meta_description', $locale, (string) ($data['meta_description'] ?? ''));
        }
        if (array_key_exists('is_published', $data)) {
            $pageModel->is_published = (bool) $data['is_published'];
        }
        $pageModel->save();

        foreach ($data['sections'] as $sData) {
            $section = Section::query()
                ->where('id', $sData['id'])
                ->where('page_id', $pageModel->id)
                ->first();
            if (!$section) {
                continue;
            }

            $config = $section->config ?? [];
            if (array_key_exists('enabled', $sData)) {
                $config['enabled'] = (bool) $sData['enabled'];
            }
            if (array_key_exists('key', $sData)) {
                $config['key'] = trim((string) ($sData['key'] ?? '')) ?: null;
            }
            if (is_array($sData['fields'] ?? null)) {
                $content = is_array($config['content'] ?? null) ? $config['content'] : [];
                $current = is_array($content[$locale] ?? null) ? $content[$locale] : [];
                foreach ($sData['fields'] as $k => $v) {
                    $current[$k] = $v;
                }
                $content[$locale] = $current;
                $config['content'] = $content;
            }

            if (is_array($sData['poi'] ?? null)) {
                $poi = $sData['poi'];
                $custom = [];
                foreach (($poi['custom'] ?? []) as $p) {
                    $custom[] = [
                        'id' => (string) ($p['id'] ?? ''),
                        'name_i18n' => is_array($p['name_i18n'] ?? null) ? $p['name_i18n'] : [],
                        'address' => $p['address'] ?? null,
                        'google_maps_url' => $this->cleanLooseText($p['google_maps_url'] ?? null),
                        'lat' => isset($p['lat']) ? (float) $p['lat'] : null,
                        'lng' => isset($p['lng']) ? (float) $p['lng'] : null,
                    ];
                }
                $config['poi'] = [
                    'include_agenda_locations' => (bool) ($poi['include_agenda_locations'] ?? true),
                    'agenda_location_ids' => array_values(array_filter((array) ($poi['agenda_location_ids'] ?? []))),
                    'custom' => $custom,
                ];
            }

            $section->config = $config;
            if (array_key_exists('order', $sData)) {
                $section->order = (int) ($sData['order'] ?? 0);
            }
            if (!empty($sData['type'])) {
                $section->type = (string) $sData['type'];
            }
            $section->save();
        }

        return redirect()->route('admin.pages.edit', ['page' => $pageModel->slug]);
    }

    public function initHome(string $page)
    {
        if ($page !== 'home') {
            return redirect()->route('admin.pages.edit', ['page' => $page]);
        }

        $pageModel = Page::query()->firstOrCreate(
            ['slug' => 'home'],
            [
                'title' => array_fill_keys($this->supportedLocales(), 'Home'),
                'meta_description' => array_fill_keys($this->supportedLocales(), ''),
                'is_published' => false,
            ]
        );

        $this->ensureSectionsForPage($pageModel, [
            ['key' => 'hero', 'type' => 'hero', 'order' => 10],
            ['key' => 'program', 'type' => 'next_event', 'order' => 20],
            ['key' => 'shop', 'type' => 'shop_carousel', 'order' => 30],
            ['key' => 'magazine', 'type' => 'magazine', 'order' => 40],
            ['key' => 'testimonial', 'type' => 'testimonial', 'order' => 50],
            ['key' => 'map', 'type' => 'map', 'order' => 60],
        ]);

        $this->prefillHomeTemplate($pageModel);

        return redirect()->route('admin.pages.edit', ['page' => 'home']);
    }

    public function initTemplate(string $page)
    {
        $pageModel = Page::query()->where('slug', $page)->firstOrFail();

        if ($page === 'home') {
            return $this->initHome('home');
        }

        $defs = $this->templateDefsForSlug($pageModel->slug);

        $this->ensureSectionsForPage($pageModel, $defs);
        $this->prefillGenericTemplate($pageModel);

        return redirect()->route('admin.pages.edit', ['page' => $pageModel->slug]);
    }

    public function importLegacy(string $page)
    {
        $pageModel = Page::query()->where('slug', $page)->firstOrFail();

        if ($pageModel->slug === 'home') {
            $this->prefillHomeTemplate($pageModel);
            $this->tryImportHeroImage($pageModel, $this->legacyImagesDir('home'));
            return redirect()->route('admin.pages.edit', ['page' => 'home']);
        }

        $this->initTemplate($pageModel->slug);

        $text = $this->readLegacyTextForSlug($pageModel->slug);
        if ($text !== '') {
            $content = $this->findSectionByKey($pageModel, 'content');
            if ($content) {
                $this->setSectionFieldsIfEmpty($content, 'es', ['body' => $text]);
            }
            $this->prefillLegacyDerivedFields($pageModel, $text);
        }

        $this->tryImportHeroImage($pageModel, $this->legacyImagesDir($pageModel->slug));

        return redirect()->route('admin.pages.edit', ['page' => $pageModel->slug]);
    }

    private function ensureSectionsForPage(Page $pageModel, array $defs): void
    {
        foreach ($defs as $d) {
            $exists = Section::query()
                ->where('page_id', $pageModel->id)
                ->where('config->key', $d['key'])
                ->exists();
            if ($exists) continue;

            Section::query()->create([
                'page_id' => $pageModel->id,
                'type' => $d['type'],
                'order' => (int) $d['order'],
                'config' => [
                    'key' => $d['key'],
                    'enabled' => true,
                    'content' => [],
                    'images' => [],
                ],
            ]);
        }
    }

    private function templateDefsForSlug(string $slug): array
    {
        $templates = [
            'home' => [
                ['key' => 'hero', 'type' => 'hero', 'order' => 10],
                ['key' => 'program', 'type' => 'next_event', 'order' => 20],
                ['key' => 'shop', 'type' => 'shop_carousel', 'order' => 30],
                ['key' => 'magazine', 'type' => 'magazine', 'order' => 40],
                ['key' => 'testimonial', 'type' => 'testimonial', 'order' => 50],
                ['key' => 'map', 'type' => 'map', 'order' => 60],
            ],
            'about' => [
                ['key' => 'hero', 'type' => 'hero', 'order' => 10],
                ['key' => 'content', 'type' => 'generic', 'order' => 20],
            ],
            'events' => [
                ['key' => 'hero', 'type' => 'hero', 'order' => 10],
                ['key' => 'program', 'type' => 'next_event', 'order' => 20],
            ],
            'magazine' => [
                ['key' => 'hero', 'type' => 'hero', 'order' => 10],
                ['key' => 'magazine', 'type' => 'magazine', 'order' => 20],
            ],
            'store' => [
                ['key' => 'hero', 'type' => 'hero', 'order' => 10],
                ['key' => 'shop', 'type' => 'shop_carousel', 'order' => 20],
                ['key' => 'content', 'type' => 'generic', 'order' => 30],
            ],
            'recommendations' => [
                ['key' => 'hero', 'type' => 'hero', 'order' => 10],
                ['key' => 'map', 'type' => 'map', 'order' => 20],
                ['key' => 'content', 'type' => 'generic', 'order' => 30],
            ],
            'legal' => [
                ['key' => 'hero', 'type' => 'hero', 'order' => 10],
                ['key' => 'content', 'type' => 'generic', 'order' => 20],
            ],
        ];

        return $templates[$slug] ?? [
            ['key' => 'hero', 'type' => 'hero', 'order' => 10],
            ['key' => 'content', 'type' => 'generic', 'order' => 20],
        ];
    }

    private function prefillLegacyDerivedFields(Page $pageModel, string $text): void
    {
        if ($pageModel->slug === 'events') {
            $program = $this->findSectionByKey($pageModel, 'program');
            if ($program) {
                $this->setSectionFieldsIfEmpty($program, 'es', [
                    'kicker' => 'Eventos Destacados',
                    'heading' => 'EL PROGRAMA',
                    'cta_label' => 'Ver calendario completo →',
                    'cta_url' => route('program.index', [], false),
                    'big_label' => 'PROGRAMA OFICIAL',
                    'big_title' => 'BEARS SITGES WEEK 2026',
                    'big_body' => Str::limit($text, 420, '…'),
                ]);
            }
        }

        if ($pageModel->slug === 'magazine') {
            $mag = $this->findSectionByKey($pageModel, 'magazine');
            if ($mag) {
                $this->setSectionFieldsIfEmpty($mag, 'es', [
                    'kicker' => 'Magazine',
                    'title' => 'BEARS SITGES MAGAZINE',
                    'subtitle' => Str::limit($text, 420, '…'),
                    'cta_label' => 'Ver magazine →',
                    'cta_url' => route('magazine.index', [], false),
                ]);
            }
        }

        if ($pageModel->slug === 'store') {
            $shop = $this->findSectionByKey($pageModel, 'shop');
            if ($shop) {
                $this->setSectionFieldsIfEmpty($shop, 'es', [
                    'kicker' => 'Shop',
                    'title' => 'LA STORE',
                    'cta_label' => 'Ver tienda →',
                    'cta_url' => route('products.index', [], false),
                ]);
            }
        }

        if ($pageModel->slug === 'recommendations') {
            $map = $this->findSectionByKey($pageModel, 'map');
            if ($map) {
                $this->setSectionFieldsIfEmpty($map, 'es', [
                    'kicker' => 'Mapa',
                    'title' => 'PUNTOS DE INTERÉS',
                    'subtitle' => Str::limit($text, 420, '…'),
                    'cta_label' => 'Ver recomendaciones →',
                    'cta_url' => route('recomendations.index', [], false),
                ]);
            }
        }
    }

    private function findSectionByKey(Page $pageModel, string $key): ?Section
    {
        return Section::query()
            ->where('page_id', $pageModel->id)
            ->where('config->key', $key)
            ->first();
    }

    private function setSectionFieldsIfEmptyAllLocales(Section $section, array $fields): void
    {
        $config = $section->config ?? [];
        $content = is_array($config['content'] ?? null) ? $config['content'] : [];

        foreach ($this->supportedLocales() as $locale) {
            $current = is_array($content[$locale] ?? null) ? $content[$locale] : [];
            foreach ($fields as $k => $v) {
                $existing = trim((string) ($current[$k] ?? ''));
                if ($existing === '') {
                    $current[$k] = $v;
                }
            }
            $content[$locale] = $current;
        }

        $config['content'] = $content;
        $section->config = $config;
        $section->save();
    }

    private function setSectionFieldsIfEmpty(Section $section, string $locale, array $fields): void
    {
        $config = $section->config ?? [];
        $content = is_array($config['content'] ?? null) ? $config['content'] : [];

        $current = is_array($content[$locale] ?? null) ? $content[$locale] : [];
        foreach ($fields as $k => $v) {
            $existing = trim((string) ($current[$k] ?? ''));
            if ($existing === '') {
                $current[$k] = $v;
            }
        }
        $content[$locale] = $current;

        $config['content'] = $content;
        $section->config = $config;
        $section->save();
    }

    private function prefillHomeTemplate(Page $pageModel): void
    {
        $hero = $this->findSectionByKey($pageModel, 'hero');
        if ($hero) {
            $heroByLocale = [
                'es' => [
                    'badge' => 'Sitges • 5-14 Septiembre 2026',
                    'title' => "WE ARE\nBEARS WEEK",
                    'subtitle' => "El epicentro mundial de la cultura bear.\nUn viaje de libertad, música y comunidad frente al mar.",
                    'cta_primary_label' => 'Conseguir Tickets',
                    'cta_primary_url' => route('products.index', [], false),
                    'cta_secondary_label' => 'Explorar Galería',
                    'cta_secondary_url' => route('magazine.index', [], false),
                ],
                'ca' => [
                    'badge' => 'Sitges • 5-14 Setembre 2026',
                    'title' => "WE ARE\nBEARS WEEK",
                    'subtitle' => "L’epicentre mundial de la cultura bear.\nUn viatge de llibertat, música i comunitat davant del mar.",
                    'cta_primary_label' => 'Aconseguir Tickets',
                    'cta_primary_url' => route('products.index', [], false),
                    'cta_secondary_label' => 'Explorar Galeria',
                    'cta_secondary_url' => route('magazine.index', [], false),
                ],
                'en' => [
                    'badge' => 'Sitges • 5-14 September 2026',
                    'title' => "WE ARE\nBEARS WEEK",
                    'subtitle' => "The global epicenter of bear culture.\nA journey of freedom, music and community by the sea.",
                    'cta_primary_label' => 'Get Tickets',
                    'cta_primary_url' => route('products.index', [], false),
                    'cta_secondary_label' => 'Explore Gallery',
                    'cta_secondary_url' => route('magazine.index', [], false),
                ],
                'fr' => [
                    'badge' => 'Sitges • 5-14 Septembre 2026',
                    'title' => "WE ARE\nBEARS WEEK",
                    'subtitle' => "L’épicentre mondial de la culture bear.\nUn voyage de liberté, de musique et de communauté face à la mer.",
                    'cta_primary_label' => 'Billets',
                    'cta_primary_url' => route('products.index', [], false),
                    'cta_secondary_label' => 'Explorer la galerie',
                    'cta_secondary_url' => route('magazine.index', [], false),
                ],
                'it' => [
                    'badge' => 'Sitges • 5-14 Settembre 2026',
                    'title' => "WE ARE\nBEARS WEEK",
                    'subtitle' => "L’epicentro mondiale della cultura bear.\nUn viaggio di libertà, musica e comunità sul mare.",
                    'cta_primary_label' => 'Biglietti',
                    'cta_primary_url' => route('products.index', [], false),
                    'cta_secondary_label' => 'Esplora la gallery',
                    'cta_secondary_url' => route('magazine.index', [], false),
                ],
                'de' => [
                    'badge' => 'Sitges • 5-14 September 2026',
                    'title' => "WE ARE\nBEARS WEEK",
                    'subtitle' => "Das weltweite Epizentrum der Bear-Community.\nFreiheit, Musik und Gemeinschaft am Meer.",
                    'cta_primary_label' => 'Tickets sichern',
                    'cta_primary_url' => route('products.index', [], false),
                    'cta_secondary_label' => 'Galerie ansehen',
                    'cta_secondary_url' => route('magazine.index', [], false),
                ],
            ];
            foreach ($heroByLocale as $loc => $fields) {
                $this->setSectionFieldsIfEmpty($hero, $loc, $fields);
            }
        }

        $program = $this->findSectionByKey($pageModel, 'program');
        if ($program) {
            $programByLocale = [
                'es' => [
                    'kicker' => 'Eventos Destacados',
                    'heading' => 'EL PROGRAMA',
                    'cta_label' => 'Ver calendario completo →',
                    'cta_url' => route('program.index', [], false),
                    'big_label' => 'MAIN EVENT',
                    'big_title' => 'Playa Bear Opening',
                    'big_body' => 'La inauguración oficial en el chiringuito de la costa. Música, sol y miles de osos.',
                    'card1_title' => 'Pool Party',
                    'card1_subtitle' => 'Hotel Terraza',
                    'card2_title' => 'VIP Gala',
                    'card2_subtitle' => 'Casino Prado',
                    'wide_title' => 'Pop-up Shop',
                    'wide_subtitle' => 'Exclusive Merchandising',
                ],
                'ca' => [
                    'kicker' => 'Esdeveniments destacats',
                    'heading' => 'EL PROGRAMA',
                    'cta_label' => 'Veure calendari complet →',
                    'cta_url' => route('program.index', [], false),
                    'big_label' => 'MAIN EVENT',
                    'big_title' => 'Playa Bear Opening',
                    'big_body' => 'La inauguració oficial al xiringuito de la costa. Música, sol i milers d’ossos.',
                ],
                'en' => [
                    'kicker' => 'Featured Events',
                    'heading' => 'THE PROGRAM',
                    'cta_label' => 'View full calendar →',
                    'cta_url' => route('program.index', [], false),
                    'big_label' => 'MAIN EVENT',
                    'big_title' => 'Playa Bear Opening',
                    'big_body' => 'The official opening on the beachfront. Music, sun and thousands of bears.',
                ],
                'fr' => [
                    'kicker' => 'Événements à la une',
                    'heading' => 'LE PROGRAMME',
                    'cta_label' => 'Voir le calendrier →',
                    'cta_url' => route('program.index', [], false),
                    'big_label' => 'MAIN EVENT',
                    'big_title' => 'Playa Bear Opening',
                    'big_body' => 'L’ouverture officielle au bord de la mer. Musique, soleil et des milliers de bears.',
                ],
                'it' => [
                    'kicker' => 'Eventi in evidenza',
                    'heading' => 'IL PROGRAMMA',
                    'cta_label' => 'Vedi calendario →',
                    'cta_url' => route('program.index', [], false),
                    'big_label' => 'MAIN EVENT',
                    'big_title' => 'Playa Bear Opening',
                    'big_body' => 'L’inaugurazione ufficiale in riva al mare. Musica, sole e migliaia di bears.',
                ],
                'de' => [
                    'kicker' => 'Highlights',
                    'heading' => 'DAS PROGRAMM',
                    'cta_label' => 'Kalender ansehen →',
                    'cta_url' => route('program.index', [], false),
                    'big_label' => 'MAIN EVENT',
                    'big_title' => 'Playa Bear Opening',
                    'big_body' => 'Die offizielle Eröffnung am Strand. Musik, Sonne und tausende Bears.',
                ],
            ];
            foreach ($programByLocale as $loc => $fields) {
                $this->setSectionFieldsIfEmpty($program, $loc, $fields);
            }
        }

        $shop = $this->findSectionByKey($pageModel, 'shop');
        if ($shop) {
            $shopByLocale = [
                'es' => ['kicker' => 'Shop', 'title' => 'LA STORE', 'cta_label' => 'Ver tienda →', 'cta_url' => route('products.index', [], false)],
                'ca' => ['kicker' => 'Shop', 'title' => 'LA STORE', 'cta_label' => 'Veure botiga →', 'cta_url' => route('products.index', [], false)],
                'en' => ['kicker' => 'Shop', 'title' => 'THE STORE', 'cta_label' => 'View store →', 'cta_url' => route('products.index', [], false)],
                'fr' => ['kicker' => 'Shop', 'title' => 'BOUTIQUE', 'cta_label' => 'Voir la boutique →', 'cta_url' => route('products.index', [], false)],
                'it' => ['kicker' => 'Shop', 'title' => 'STORE', 'cta_label' => 'Vedi store →', 'cta_url' => route('products.index', [], false)],
                'de' => ['kicker' => 'Shop', 'title' => 'SHOP', 'cta_label' => 'Zum Shop →', 'cta_url' => route('products.index', [], false)],
            ];
            foreach ($shopByLocale as $loc => $fields) {
                $this->setSectionFieldsIfEmpty($shop, $loc, $fields);
            }
        }

        $magazine = $this->findSectionByKey($pageModel, 'magazine');
        if ($magazine) {
            $magByLocale = [
                'es' => ['kicker' => 'Magazine', 'title' => 'BEARS SITGES MAGAZINE', 'subtitle' => 'Historias, comunidad y contenido de alta calidad.', 'cta_label' => 'Ver magazine →', 'cta_url' => route('magazine.index', [], false)],
                'ca' => ['kicker' => 'Magazine', 'title' => 'BEARS SITGES MAGAZINE', 'subtitle' => 'Històries, comunitat i contingut d’alta qualitat.', 'cta_label' => 'Veure magazine →', 'cta_url' => route('magazine.index', [], false)],
                'en' => ['kicker' => 'Magazine', 'title' => 'BEARS SITGES MAGAZINE', 'subtitle' => 'Stories, community and high-quality content.', 'cta_label' => 'View magazine →', 'cta_url' => route('magazine.index', [], false)],
                'fr' => ['kicker' => 'Magazine', 'title' => 'BEARS SITGES MAGAZINE', 'subtitle' => 'Histoires, communauté et contenu de qualité.', 'cta_label' => 'Voir le magazine →', 'cta_url' => route('magazine.index', [], false)],
                'it' => ['kicker' => 'Magazine', 'title' => 'BEARS SITGES MAGAZINE', 'subtitle' => 'Storie, community e contenuti di alta qualità.', 'cta_label' => 'Vedi magazine →', 'cta_url' => route('magazine.index', [], false)],
                'de' => ['kicker' => 'Magazine', 'title' => 'BEARS SITGES MAGAZINE', 'subtitle' => 'Stories, Community und hochwertige Inhalte.', 'cta_label' => 'Zum Magazin →', 'cta_url' => route('magazine.index', [], false)],
            ];
            foreach ($magByLocale as $loc => $fields) {
                $this->setSectionFieldsIfEmpty($magazine, $loc, $fields);
            }
        }

        $testimonial = $this->findSectionByKey($pageModel, 'testimonial');
        if ($testimonial) {
            $testByLocale = [
                'es' => ['kicker' => 'Testimonial', 'title' => 'LO QUE DICEN', 'quote' => '“Una semana inolvidable. Energía, comunidad y libertad.”', 'author' => 'Bears Community', 'role' => ''],
                'ca' => ['kicker' => 'Testimoni', 'title' => 'EL QUE DIUEN', 'quote' => '“Una setmana inoblidable. Energia, comunitat i llibertat.”', 'author' => 'Bears Community', 'role' => ''],
                'en' => ['kicker' => 'Testimonial', 'title' => 'WHAT THEY SAY', 'quote' => '“An unforgettable week. Energy, community and freedom.”', 'author' => 'Bears Community', 'role' => ''],
                'fr' => ['kicker' => 'Témoignage', 'title' => 'ILS EN PARLENT', 'quote' => '“Une semaine inoubliable. Énergie, communauté et liberté.”', 'author' => 'Bears Community', 'role' => ''],
                'it' => ['kicker' => 'Testimonianza', 'title' => 'COSA DICONO', 'quote' => '“Una settimana indimenticabile. Energia, comunità e libertà.”', 'author' => 'Bears Community', 'role' => ''],
                'de' => ['kicker' => 'Testimonial', 'title' => 'WAS SIE SAGEN', 'quote' => '“Eine unvergessliche Woche. Energie, Community und Freiheit.”', 'author' => 'Bears Community', 'role' => ''],
            ];
            foreach ($testByLocale as $loc => $fields) {
                $this->setSectionFieldsIfEmpty($testimonial, $loc, $fields);
            }
        }

        $map = $this->findSectionByKey($pageModel, 'map');
        if ($map) {
            $mapByLocale = [
                'es' => ['kicker' => 'Mapa', 'title' => 'PUNTOS DE INTERÉS', 'subtitle' => 'Ubicaciones clave, eventos y recomendaciones para vivir Sitges al máximo.', 'cta_label' => 'Ver recomendaciones →', 'cta_url' => route('recomendations.index', [], false)],
                'ca' => ['kicker' => 'Mapa', 'title' => 'PUNTS D’INTERÈS', 'subtitle' => 'Ubicacions clau, esdeveniments i recomanats per viure Sitges al màxim.', 'cta_label' => 'Veure recomanats →', 'cta_url' => route('recomendations.index', [], false)],
                'en' => ['kicker' => 'Map', 'title' => 'POINTS OF INTEREST', 'subtitle' => 'Key locations, events and recommendations to enjoy Sitges at its best.', 'cta_label' => 'View recommendations →', 'cta_url' => route('recomendations.index', [], false)],
                'fr' => ['kicker' => 'Carte', 'title' => 'POINTS D’INTÉRÊT', 'subtitle' => 'Lieux clés, événements et recommandations pour profiter de Sitges.', 'cta_label' => 'Voir les recommandations →', 'cta_url' => route('recomendations.index', [], false)],
                'it' => ['kicker' => 'Mappa', 'title' => 'PUNTI DI INTERESSE', 'subtitle' => 'Luoghi chiave, eventi e consigli per vivere Sitges al meglio.', 'cta_label' => 'Vedi consigliati →', 'cta_url' => route('recomendations.index', [], false)],
                'de' => ['kicker' => 'Karte', 'title' => 'SEHENSWERTES', 'subtitle' => 'Wichtige Orte, Events und Empfehlungen für Sitges.', 'cta_label' => 'Empfehlungen →', 'cta_url' => route('recomendations.index', [], false)],
            ];
            foreach ($mapByLocale as $loc => $fields) {
                $this->setSectionFieldsIfEmpty($map, $loc, $fields);
            }
        }
    }

    private function prefillGenericTemplate(Page $pageModel): void
    {
        $hero = $this->findSectionByKey($pageModel, 'hero');
        if ($hero) {
            $title = strtoupper((string) $pageModel->slug);
            $this->setSectionFieldsIfEmpty($hero, 'es', [
                'badge' => 'Sitges • 2026',
                'title' => $title,
                'subtitle' => '',
                'cta_primary_label' => 'Volver a Home',
                'cta_primary_url' => route('home', [], false),
            ]);
            $this->setSectionFieldsIfEmpty($hero, 'ca', ['badge' => 'Sitges • 2026', 'title' => $title, 'cta_primary_label' => 'Tornar a Home', 'cta_primary_url' => route('home', [], false)]);
            $this->setSectionFieldsIfEmpty($hero, 'en', ['badge' => 'Sitges • 2026', 'title' => $title, 'cta_primary_label' => 'Back to Home', 'cta_primary_url' => route('home', [], false)]);
            $this->setSectionFieldsIfEmpty($hero, 'fr', ['badge' => 'Sitges • 2026', 'title' => $title, 'cta_primary_label' => 'Retour à l’accueil', 'cta_primary_url' => route('home', [], false)]);
            $this->setSectionFieldsIfEmpty($hero, 'it', ['badge' => 'Sitges • 2026', 'title' => $title, 'cta_primary_label' => 'Torna alla Home', 'cta_primary_url' => route('home', [], false)]);
            $this->setSectionFieldsIfEmpty($hero, 'de', ['badge' => 'Sitges • 2026', 'title' => $title, 'cta_primary_label' => 'Zur Startseite', 'cta_primary_url' => route('home', [], false)]);
        }
    }

    private function readLegacyTextForSlug(string $slug): string
    {
        $paths = [];
        $base = $this->legacyBase();
        if ($slug === 'about') {
            $paths[] = $base . DIRECTORY_SEPARATOR . 'WEBSITE-MENU' . DIRECTORY_SEPARATOR . 'ABOUT' . DIRECTORY_SEPARATOR . 'bs-info' . DIRECTORY_SEPARATOR . 'text.txt';
        } elseif ($slug === 'events') {
            $paths[] = $base . DIRECTORY_SEPARATOR . 'WEBSITE-MENU' . DIRECTORY_SEPARATOR . 'EVENTS' . DIRECTORY_SEPARATOR . 'bears-sitges-week' . DIRECTORY_SEPARATOR . 'text.txt';
        } elseif ($slug === 'magazine') {
            $paths[] = $base . DIRECTORY_SEPARATOR . 'WEBSITE-MENU' . DIRECTORY_SEPARATOR . 'MAGAZINE' . DIRECTORY_SEPARATOR . 'bears-sitges-magazine' . DIRECTORY_SEPARATOR . 'text.txt';
        } elseif ($slug === 'store') {
            $paths[] = $base . DIRECTORY_SEPARATOR . 'WEBSITE-MENU' . DIRECTORY_SEPARATOR . 'STORE' . DIRECTORY_SEPARATOR . 'store' . DIRECTORY_SEPARATOR . 'text.txt';
        } elseif ($slug === 'recommendations') {
            $paths[] = $base . DIRECTORY_SEPARATOR . 'WEBSITE-MENU' . DIRECTORY_SEPARATOR . 'RECOMENDATIONS' . DIRECTORY_SEPARATOR . 'recomendados' . DIRECTORY_SEPARATOR . 'text.txt';
        }

        $buf = [];
        foreach ($paths as $p) {
            if (File::exists($p)) {
                $buf[] = File::get($p);
            }
        }
        $raw = implode("\n", $buf);
        return $this->cleanLegacyText($raw);
    }

    private function cleanLegacyText(string $raw): string
    {
        $lines = preg_split("/\r\n|\n|\r/", $raw) ?: [];
        $out = [];
        foreach ($lines as $line) {
            $t = trim((string) $line);
            if ($t === '') continue;
            if (preg_match('/Saltar al contenido|Buscar:|Powered by|Page load link|Configuración de Cookies|Política de Cookies|Política de Privacidad|Aceptar|Rechazar|Ir a Arriba|Copyright/i', $t)) {
                continue;
            }
            if (preg_match('/^(BS Info|Bears Solidarios|Contactar|Bears Sitges Meeting|Bears Sitges Week|BS Store|Bears Sitges Magazine|Recomendados|Dónde Comer|Bares|Compras|Saunas|Transfers|Otros Recomendados|Brothered|comunidad online|ALOJAMIENTO)$/i', $t)) {
                continue;
            }
            if (preg_match('/^×$|^Δ$/', $t)) {
                continue;
            }
            $out[] = $t;
        }
        $text = implode("\n", $out);
        $text = preg_replace("/\n{3,}/", "\n\n", $text) ?? $text;
        return trim($text);
    }

    private function legacyBase(): string
    {
        return (string) config('website_menu.base_path', base_path('WEBSITE GENERAL INFO'));
    }

    private function legacyImagesDir(string $slug): ?string
    {
        $base = $this->legacyBase();
        if ($slug === 'home') {
            return $base . DIRECTORY_SEPARATOR . 'WEBSITE-HOME' . DIRECTORY_SEPARATOR . 'images';
        }
        if ($slug === 'about') {
            return $base . DIRECTORY_SEPARATOR . 'WEBSITE-MENU' . DIRECTORY_SEPARATOR . 'ABOUT' . DIRECTORY_SEPARATOR . 'bs-info' . DIRECTORY_SEPARATOR . 'images';
        }
        if ($slug === 'events') {
            return $base . DIRECTORY_SEPARATOR . 'WEBSITE-MENU' . DIRECTORY_SEPARATOR . 'EVENTS' . DIRECTORY_SEPARATOR . 'bears-sitges-week' . DIRECTORY_SEPARATOR . 'images';
        }
        if ($slug === 'magazine') {
            return $base . DIRECTORY_SEPARATOR . 'WEBSITE-MENU' . DIRECTORY_SEPARATOR . 'MAGAZINE' . DIRECTORY_SEPARATOR . 'bears-sitges-magazine' . DIRECTORY_SEPARATOR . 'images';
        }
        if ($slug === 'store') {
            return $base . DIRECTORY_SEPARATOR . 'WEBSITE-MENU' . DIRECTORY_SEPARATOR . 'STORE' . DIRECTORY_SEPARATOR . 'store' . DIRECTORY_SEPARATOR . 'images';
        }
        if ($slug === 'recommendations') {
            return $base . DIRECTORY_SEPARATOR . 'WEBSITE-MENU' . DIRECTORY_SEPARATOR . 'RECOMENDATIONS' . DIRECTORY_SEPARATOR . 'recomendados' . DIRECTORY_SEPARATOR . 'images';
        }
        return null;
    }

    private function tryImportHeroImage(Page $pageModel, ?string $imagesDir): void
    {
        if (!$imagesDir || !File::isDirectory($imagesDir)) {
            return;
        }

        $hero = $this->findSectionByKey($pageModel, 'hero');
        if (!$hero) return;

        $config = $hero->config ?? [];
        $images = is_array($config['images'] ?? null) ? $config['images'] : [];
        $bg = is_array($images['background'] ?? null) ? $images['background'] : null;
        $hasBg = $bg && !empty($bg['shared_path']);
        if ($hasBg) return;

        $file = $this->pickLegacyImage($imagesDir);
        if (!$file) return;

        $target = $this->importLegacyImageToPublic($file, $pageModel->slug);
        if (!$target) return;

        $images['background'] = [
            'shared' => true,
            'shared_path' => $target,
            'paths' => [],
        ];
        $config['images'] = $images;
        $hero->config = $config;
        $hero->save();
    }

    private function pickLegacyImage(string $dir): ?string
    {
        $files = File::files($dir);
        $candidates = [];
        foreach ($files as $f) {
            $ext = strtolower((string) $f->getExtension());
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'], true)) {
                continue;
            }
            $name = strtolower($f->getFilename());
            if (str_contains($name, '421eef4fc431cfb0ea7f8751995f8a22a8c2c69e')) {
                continue;
            }
            $candidates[] = $f->getPathname();
        }
        sort($candidates);
        $jpg = array_values(array_filter($candidates, fn ($p) => preg_match('/\.(jpe?g)$/i', $p)))[0] ?? null;
        return $jpg ?: ($candidates[0] ?? null);
    }

    private function importLegacyImageToPublic(string $sourcePath, string $slug): ?string
    {
        if (!File::exists($sourcePath)) return null;
        $ext = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));
        $hash = substr(sha1_file($sourcePath) ?: sha1($sourcePath), 0, 20);
        $target = 'cms/legacy/' . $slug . '/' . $hash . '.' . $ext;
        if (!Storage::disk('public')->exists($target)) {
            Storage::disk('public')->put($target, File::get($sourcePath));
        }
        return $target;
    }

    public function seed()
    {
        $base = [
            'home' => 'Home',
            'about' => 'About',
            'events' => 'Events',
            'magazine' => 'Magazine',
            'store' => 'Store',
            'recommendations' => 'Recommendations',
            'legal' => 'Legal',
        ];

        foreach ($base as $slug => $label) {
            Page::query()->firstOrCreate(
                ['slug' => $slug],
                [
                    'title' => [
                        'en' => $label,
                        'es' => $label,
                        'ca' => $label,
                        'fr' => $label,
                        'it' => $label,
                        'de' => $label,
                    ],
                    'meta_description' => [
                        'en' => '',
                        'es' => '',
                        'ca' => '',
                        'fr' => '',
                        'it' => '',
                        'de' => '',
                    ],
                    'is_published' => false,
                ]
            );
        }

        return redirect()->route('admin.pages.index');
    }
}
