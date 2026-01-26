<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventTicketType;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EventsController extends Controller
{
    public function index(Request $request)
    {
        $events = Event::query()
            ->with(['subevents'])
            ->whereNull('parent_event_id')
            ->orderByDesc('start_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Event $event) {
                return $this->mapEvent($event, true);
            });

        return Inertia::render('Admin/Events/Index', [
            'events' => $events,
            'can' => [
                'create' => $request->user()?->role === 'super_admin',
            ],
        ]);
    }

    public function create(Request $request)
    {
        $parentEventId = $request->string('parent_event_id')->toString() ?: null;

        $parents = Event::query()
            ->whereNull('parent_event_id')
            ->orderByDesc('start_at')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Events/Edit', [
            'event' => null,
            'parents' => $parents,
            'defaults' => [
                'parent_event_id' => $parentEventId,
            ],
            'can' => [
                'delete' => false,
                'toggle_active' => true,
            ],
        ]);
    }

    public function edit(Request $request, Event $event)
    {
        $event->load(['ticketTypes']);
        $parents = Event::query()
            ->whereNull('parent_event_id')
            ->where('id', '!=', $event->id)
            ->orderByDesc('start_at')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Events/Edit', [
            'event' => $this->mapEvent($event, false),
            'parents' => $parents,
            'defaults' => null,
            'can' => [
                'delete' => $request->user()?->role === 'super_admin',
                'toggle_active' => $request->user()?->role === 'super_admin',
                'manage_ticket_types' => $request->user()?->role === 'super_admin',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateEvent($request);

        $event = new Event();
        $event->fill($data);
        $event->is_active = (bool) ($data['is_active'] ?? true);
        $event->save();

        $this->handleFiles($request, $event);

        return redirect()->route('admin.events.edit', $event->id);
    }

    public function update(Request $request, Event $event)
    {
        $data = $this->validateEvent($request, $event);

        $authRole = $request->user()?->role;
        if ($authRole !== 'super_admin') {
            unset($data['is_active'], $data['parent_event_id']);
        }

        $event->fill($data);
        $event->save();

        $this->handleFiles($request, $event);

        return back();
    }

    public function destroy(Request $request, Event $event)
    {
        if ($event->banner_path) {
            Storage::disk('public')->delete($event->banner_path);
        }
        if ($event->logo_path) {
            Storage::disk('public')->delete($event->logo_path);
        }
        if ($event->flyer_path) {
            Storage::disk('public')->delete($event->flyer_path);
        }

        $event->subevents()->delete();
        $event->delete();

        return redirect()->route('admin.events.index');
    }

    public function upsertTicketType(Request $request, Event $event)
    {
        $data = $request->validate([
            'code' => ['required', 'string', Rule::in(['vip', 'standard'])],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        EventTicketType::query()->updateOrCreate(
            [
                'event_id' => $event->id,
                'code' => $data['code'],
            ],
            [
                'price' => $data['price'],
                'stock' => $data['stock'],
                'is_active' => (bool) ($data['is_active'] ?? true),
            ]
        );

        return back();
    }

    public function destroyTicketType(Request $request, Event $event, EventTicketType $ticketType)
    {
        if ($ticketType->event_id !== $event->id) {
            abort(404);
        }
        $ticketType->delete();
        return back();
    }

    private function validateEvent(Request $request, ?Event $event = null): array
    {
        $data = $request->validate([
            'parent_event_id' => ['nullable', 'string', Rule::exists('events', 'id')],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'address' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'string', 'regex:/^\\d{2}-\\d{2}-\\d{4}$/'],
            'end_date' => ['required', 'string', 'regex:/^\\d{2}-\\d{2}-\\d{4}$/'],
            'start_time' => ['required', 'string', 'regex:/^\\d{2}:\\d{2}:\\d{2}$/'],
            'end_time' => ['required', 'string', 'regex:/^\\d{2}:\\d{2}:\\d{2}$/'],
            'is_active' => ['nullable', 'boolean'],
            'banner' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'flyer' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $locale = app()->getLocale();

        $startAt = Carbon::createFromFormat('d-m-Y H:i:s', $data['start_date'] . ' ' . $data['start_time']);
        $endAt = Carbon::createFromFormat('d-m-Y H:i:s', $data['end_date'] . ' ' . $data['end_time']);

        $payload = [
            'parent_event_id' => $data['parent_event_id'] ?? null,
            'name' => [$locale => $data['name']],
            'description' => [$locale => $data['description']],
            'start_at' => $startAt,
            'end_at' => $endAt,
            'event_date' => $startAt,
            'address' => $data['address'],
            'is_active' => (bool) ($data['is_active'] ?? true),
        ];

        return $payload;
    }

    private function handleFiles(Request $request, Event $event): void
    {
        if ($request->hasFile('banner')) {
            if ($event->banner_path) {
                Storage::disk('public')->delete($event->banner_path);
            }
            $event->banner_path = $request->file('banner')->store('events/banners', 'public');
        }

        if ($request->hasFile('logo')) {
            if ($event->logo_path) {
                Storage::disk('public')->delete($event->logo_path);
            }
            $event->logo_path = $request->file('logo')->store('events/logos', 'public');
        }

        if ($request->hasFile('flyer')) {
            if ($event->flyer_path) {
                Storage::disk('public')->delete($event->flyer_path);
            }
            $event->flyer_path = $request->file('flyer')->store('events/flyers', 'public');
        }

        if ($event->isDirty(['banner_path', 'logo_path', 'flyer_path'])) {
            $event->save();
        }
    }

    private function mapEvent(Event $event, bool $includeSubevents): array
    {
        $locale = app()->getLocale();

        return [
            'id' => $event->id,
            'parent_event_id' => $event->parent_event_id,
            'name' => $event->name[$locale] ?? ($event->name['es'] ?? ''),
            'description' => $event->description[$locale] ?? ($event->description['es'] ?? ''),
            'start_at' => optional($event->start_at)->toISOString(),
            'end_at' => optional($event->end_at)->toISOString(),
            'address' => $event->address,
            'is_active' => (bool) $event->is_active,
            'banner_url' => $event->banner_path ? Storage::disk('public')->url($event->banner_path) : null,
            'logo_url' => $event->logo_path ? Storage::disk('public')->url($event->logo_path) : null,
            'flyer_url' => $event->flyer_path ? Storage::disk('public')->url($event->flyer_path) : null,
            'ticket_types' => $event->relationLoaded('ticketTypes')
                ? $event->ticketTypes->sortBy('code')->values()->map(function (EventTicketType $t) {
                    return [
                        'id' => $t->id,
                        'code' => $t->code,
                        'price' => (string) $t->price,
                        'stock' => (int) $t->stock,
                        'is_active' => (bool) $t->is_active,
                    ];
                })
                : [],
            'subevents' => $includeSubevents
                ? $event->subevents->sortBy('start_at')->map(fn (Event $s) => $this->mapEvent($s, false))->values()
                : [],
        ];
    }
}
