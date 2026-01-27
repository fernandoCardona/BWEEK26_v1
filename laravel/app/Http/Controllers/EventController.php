<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EventController extends Controller
{
    /**
     * Display the event listing.
     */
    public function index()
    {
        $locale = app()->getLocale();

        return Inertia::render('Tickets/Index', [
            'events' => Event::where('is_active', true)
                ->whereNull('parent_event_id')
                ->orderBy('event_date')
                ->get()
                ->map(function (Event $event) use ($locale) {
                    return [
                        'id' => $event->id,
                        'name' => $event->name[$locale] ?? ($event->name['es'] ?? ''),
                        'description' => $event->description[$locale] ?? ($event->description['es'] ?? ''),
                        'start_at' => optional($event->start_at)->toISOString(),
                        'end_at' => optional($event->end_at)->toISOString(),
                        'address' => $event->address,
                        'banner_url' => $event->banner_path ? Storage::disk('public')->url($event->banner_path) : null,
                        'logo_url' => $event->logo_path ? Storage::disk('public')->url($event->logo_path) : null,
                        'flyer_url' => $event->flyer_path ? Storage::disk('public')->url($event->flyer_path) : null,
                    ];
                })
        ]);
    }

    /**
     * Display the specified event.
     */
    public function show(Event $event)
    {
        $event->load(['subevents.ticketTypes', 'sponsors', 'programItems']);

        $locale = app()->getLocale();

        return Inertia::render('Tickets/Show', [
            'event' => [
                'id' => $event->id,
                'name' => $event->name[$locale] ?? ($event->name['es'] ?? ''),
                'description' => $event->description[$locale] ?? ($event->description['es'] ?? ''),
                'start_at' => optional($event->start_at)->toISOString(),
                'end_at' => optional($event->end_at)->toISOString(),
                'address' => $event->address,
                'banner_url' => $event->banner_path ? Storage::disk('public')->url($event->banner_path) : null,
                'logo_url' => $event->logo_path ? Storage::disk('public')->url($event->logo_path) : null,
                'flyer_url' => $event->flyer_path ? Storage::disk('public')->url($event->flyer_path) : null,
                'sponsors' => $event->sponsors->sortBy('sort_order')->values()->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'logo_url' => $s->logo_path ? Storage::disk('public')->url($s->logo_path) : null,
                    ];
                }),
                'program_items' => $event->programItems
                    ->sortBy(fn ($p) => sprintf('%s-%010d-%s', (string) $p->day_date?->format('Y-m-d'), (int) $p->sort_order, (string) $p->start_time))
                    ->values()
                    ->map(function ($p) {
                        return [
                            'id' => $p->id,
                            'day_date' => $p->day_date?->format('Y-m-d'),
                            'start_time' => $p->start_time ? substr((string) $p->start_time, 0, 5) : null,
                            'end_time' => $p->end_time ? substr((string) $p->end_time, 0, 5) : null,
                            'title' => $p->title,
                            'description' => $p->description,
                        ];
                    }),
                'subevents' => $event->subevents->sortBy('start_at')->values()->map(function (Event $s) use ($locale) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name[$locale] ?? ($s->name['es'] ?? ''),
                        'description' => $s->description[$locale] ?? ($s->description['es'] ?? ''),
                        'start_at' => optional($s->start_at)->toISOString(),
                        'end_at' => optional($s->end_at)->toISOString(),
                        'ticket_types' => $s->relationLoaded('ticketTypes')
                            ? $s->ticketTypes->sortBy('code')->values()->map(function ($t) {
                                return [
                                    'id' => $t->id,
                                    'code' => $t->code,
                                    'price' => (string) $t->price,
                                    'stock' => (int) $t->stock,
                                    'is_active' => (bool) $t->is_active,
                                ];
                            })
                            : [],
                    ];
                }),
            ],
        ]);
    }
}
