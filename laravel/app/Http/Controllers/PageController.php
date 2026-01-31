<?php

namespace App\Http\Controllers;

use App\Models\AgendaLocation;
use App\Models\Event;
use App\Models\Page;
use App\Models\Product;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class PageController extends Controller
{
    public function home()
    {
        return $this->renderCmsPage('home');
    }

    public function show(string $slug)
    {
        return $this->renderCmsPage($slug);
    }

    private function renderCmsPage(string $slug)
    {
        try {
            $q = Page::query()->where('slug', $slug);
            $user = request()->user();
            $isAdmin = $user && in_array((string) $user->role, ['admin', 'super_admin', 'super_user'], true);

            if (!$isAdmin || !request()->boolean('preview')) {
                $q->where('is_published', true);
            }

            $page = $q->with(['sections'])->firstOrFail();

            $sections = $page->sections
                ->sortBy('order')
                ->values()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'type' => $s->type,
                    'order' => (int) $s->order,
                    'config' => $s->config ?? [],
                ]);

            $locale = app()->getLocale();
            $hasMapSection = $sections->contains(fn ($s) => ($s['type'] ?? null) === 'map');
            $agendaLocations = $hasMapSection
                ? AgendaLocation::query()
                    ->where('is_active', true)
                    ->whereNotNull('lat')
                    ->whereNotNull('lng')
                    ->orderBy('created_at')
                    ->get()
                    ->map(fn (AgendaLocation $l) => [
                        'id' => $l->id,
                        'name' => $l->name[$locale] ?? ($l->name['es'] ?? ''),
                        'address' => $l->address,
                        'google_maps_url' => $l->google_maps_url,
                        'lat' => $l->lat,
                        'lng' => $l->lng,
                    ])
                    ->values()
                : collect();

            $pagePayload = [
                'id' => $page->id,
                'slug' => $page->slug,
                'title' => $page->getTranslations('title'),
                'meta_description' => $page->getTranslations('meta_description'),
                'is_published' => (bool) $page->is_published,
            ];

            if ($slug === 'home') {
                $products = Product::query()
                    ->where('is_active', true)
                    ->with(['images' => fn ($q) => $q->orderBy('sort_order')])
                    ->orderByDesc('created_at')
                    ->limit(12)
                    ->get()
                    ->map(fn (Product $p) => [
                        'id' => $p->id,
                        'name' => $p->name,
                        'price' => (string) $p->price,
                        'image_url' => $p->image_path ? Storage::disk('public')->url($p->image_path) : null,
                    ])
                    ->values();

                $events = Event::query()
                    ->whereNull('parent_event_id')
                    ->active()
                    ->notExpired()
                    ->orderBy('event_date')
                    ->limit(8)
                    ->get()
                    ->map(function (Event $event) use ($locale) {
                        return [
                            'id' => $event->id,
                            'name' => $event->name[$locale] ?? ($event->name['es'] ?? ''),
                            'description' => $event->description[$locale] ?? ($event->description['es'] ?? ''),
                            'start_at' => $event->start_at?->format('Y-m-d\\TH:i:s'),
                            'end_at' => $event->end_at?->format('Y-m-d\\TH:i:s'),
                            'address' => $event->address,
                            'image_url' => $event->flyer_path
                                ? Storage::disk('public')->url($event->flyer_path)
                                : ($event->banner_path ? Storage::disk('public')->url($event->banner_path) : ($event->logo_path ? Storage::disk('public')->url($event->logo_path) : null)),
                        ];
                    })
                    ->values();

                return Inertia::render('Home', [
                    'locale' => $locale,
                    'page' => $pagePayload,
                    'sections' => $sections,
                    'products' => $products,
                    'events' => $events,
                    'agenda_locations' => $agendaLocations,
                ]);
            }

            return Inertia::render('Page', [
                'slug' => $slug,
                'locale' => $locale,
                'page' => $pagePayload,
                'sections' => $sections,
                'agenda_locations' => $agendaLocations,
            ]);
        } catch (ModelNotFoundException $e) {
            if ($slug === 'home') {
                return Inertia::render('Home');
            }
            $legacyMap = [
                'about' => 'about',
                'magazine' => 'magazine',
                'store' => 'store',
                'recommendations' => 'recomendations',
            ];
            if (isset($legacyMap[$slug])) {
                return app(WebsiteMenuController::class)->category($legacyMap[$slug]);
            }
            throw $e;
        }
    }
}
