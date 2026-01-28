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
            'events' => Event::query()
                ->whereNull('parent_event_id')
                ->active()
                ->notExpired()
                ->orderBy('event_date')
                ->get()
                ->map(function (Event $event) use ($locale) {
                    return [
                        'id' => $event->id,
                        'name' => $event->name[$locale] ?? ($event->name['es'] ?? ''),
                        'description' => $event->description[$locale] ?? ($event->description['es'] ?? ''),
                        'start_at' => $event->start_at?->format('Y-m-d\\TH:i:s'),
                        'end_at' => $event->end_at?->format('Y-m-d\\TH:i:s'),
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

        if (!$event->is_active || ($event->end_at && $event->end_at->lt(now()))) {
            abort(404);
        }

        $locale = app()->getLocale();

        return Inertia::render('Tickets/Show', [
            'event' => [
                'id' => $event->id,
                'name' => $event->name[$locale] ?? ($event->name['es'] ?? ''),
                'description' => $event->description[$locale] ?? ($event->description['es'] ?? ''),
                'start_at' => $event->start_at?->format('Y-m-d\\TH:i:s'),
                'end_at' => $event->end_at?->format('Y-m-d\\TH:i:s'),
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
                'subevents' => $event->subevents
                    ->filter(fn (Event $s) => $s->is_active && (!$s->end_at || $s->end_at->gte(now())))
                    ->sortBy('start_at')
                    ->values()
                    ->map(function (Event $s) use ($locale) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name[$locale] ?? ($s->name['es'] ?? ''),
                        'description' => $s->description[$locale] ?? ($s->description['es'] ?? ''),
                        'start_at' => $s->start_at?->format('Y-m-d\\TH:i:s'),
                        'end_at' => $s->end_at?->format('Y-m-d\\TH:i:s'),
                        'ticket_types' => $s->relationLoaded('ticketTypes')
                            ? $s->ticketTypes->sortBy('code')->values()->map(function ($t) {
                                if (!$t->is_active) {
                                    return null;
                                }
                                return [
                                    'id' => $t->id,
                                    'code' => $t->code,
                                    'price' => (string) $t->price,
                                    'stock' => (int) $t->stock,
                                    'is_active' => (bool) $t->is_active,
                                    'description' => $t->description,
                                    'legal_terms' => $t->legal_terms,
                                ];
                            })->filter()->values()
                            : [],
                    ];
                }),
            ],
        ]);
    }
}
