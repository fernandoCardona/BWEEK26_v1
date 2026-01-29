<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventProgramItem;
use App\Models\EventSponsor;
use App\Models\EventTicketType;
use App\Models\AgendaLocation;
use App\Models\AgendaSubeventTemplate;
use App\Models\TicketTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EventsController extends Controller
{
    private function programDayStartHour(): int
    {
        return (int) config('events.program_day_start_hour', 7);
    }

    private function toProgramDateTime(string $programDayYmd, string $timeHm): Carbon
    {
        $cutoff = $this->programDayStartHour();
        $dt = Carbon::createFromFormat('Y-m-d H:i', $programDayYmd . ' ' . $timeHm);
        $hour = (int) substr($timeHm, 0, 2);
        if ($hour < $cutoff) {
            $dt = $dt->copy()->addDay();
        }
        return $dt;
    }

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

        $role = $request->user()?->role;

        return Inertia::render('Admin/Events/Index', [
            'events' => $events,
            'can' => [
                'create_event' => $role === 'super_admin',
                'manage_program' => in_array($role, ['super_admin', 'admin'], true),
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

        $agenda = $this->agendaProps();
        $ticketTemplates = $this->ticketTemplatesProps();

        return Inertia::render('Admin/Events/Edit', [
            'event' => null,
            'parents' => $parents,
            'agenda' => $agenda,
            'ticketTemplates' => $ticketTemplates,
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
        $event->load(['ticketTypes.ticketTemplate', 'sponsors', 'programItems', 'subevents.ticketTypes.ticketTemplate']);
        $parents = Event::query()
            ->whereNull('parent_event_id')
            ->where('id', '!=', $event->id)
            ->orderByDesc('start_at')
            ->get(['id', 'name']);

        $role = $request->user()?->role;
        $agenda = $this->agendaProps();
        $ticketTemplates = $this->ticketTemplatesProps();

        return Inertia::render('Admin/Events/Edit', [
            'event' => $this->mapEvent($event, true),
            'parents' => $parents,
            'agenda' => $agenda,
            'ticketTemplates' => $ticketTemplates,
            'defaults' => null,
            'can' => [
                'delete' => $role === 'super_admin',
                'toggle_active' => $role === 'super_admin',
                'manage_ticket_types' => in_array($role, ['super_admin', 'admin'], true),
                'manage_program' => in_array($role, ['super_admin', 'admin'], true),
            ],
        ]);
    }

    private function ticketTemplatesProps(): array
    {
        if (!Schema::hasTable('ticket_templates')) {
            return [];
        }

        return TicketTemplate::query()
            ->orderByRaw('lower(name) asc')
            ->orderBy('code')
            ->get(['id', 'name', 'code', 'is_active'])
            ->map(fn (TicketTemplate $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'code' => $t->code,
                'is_active' => (bool) $t->is_active,
            ])
            ->values()
            ->all();
    }

    private function agendaProps(): array
    {
        $locale = app()->getLocale();
        $orderLocale = in_array($locale, ['es', 'en'], true) ? $locale : 'es';

        $locations = AgendaLocation::query()
            ->where('is_active', true)
            ->orderByRaw("lower(coalesce(name->>'{$orderLocale}', name->>'es', name->>'en', '')) asc")
            ->get()
            ->map(fn ($l) => [
                'id' => $l->id,
                'name' => $l->name[$locale] ?? ($l->name['es'] ?? ''),
                'location' => $l->location[$locale] ?? ($l->location['es'] ?? ''),
                'address' => $l->address,
                'google_maps_url' => $l->google_maps_url,
            ])
            ->values();

        $templates = AgendaSubeventTemplate::query()
            ->where('is_active', true)
            ->orderByRaw("lower(coalesce(name->>'{$orderLocale}', name->>'es', name->>'en', '')) asc")
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name[$locale] ?? ($t->name['es'] ?? ''),
                'description' => $t->description[$locale] ?? ($t->description['es'] ?? ''),
                'agenda_location_id' => $t->agenda_location_id,
            ])
            ->values();

        return [
            'locations' => $locations,
            'templates' => $templates,
        ];
    }

    public function store(Request $request)
    {
        $data = $this->validateEvent($request);

        $event = new Event();
        $event->fill($data);
        $event->is_active = (bool) ($data['is_active'] ?? true);
        $event->save();

        $this->ensureMediaFolder($event);
        $this->handleFiles($request, $event);
        $this->syncProgramItems($request, $event);

        return back();
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

        $this->ensureMediaFolder($event);
        $this->handleFiles($request, $event);
        $this->syncProgramItems($request, $event);

        return back();
    }

    public function storeSponsor(Request $request, Event $event)
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:120'],
            'website_url' => ['nullable', 'string', 'max:2048'],
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $this->ensureMediaFolder($event);
        $path = $request->file('logo')->store($event->media_folder . '/sponsors', 'public');

        $maxSort = (int) EventSponsor::query()
            ->where('event_id', $event->id)
            ->max('sort_order');

        $sponsor = new EventSponsor();
        $sponsor->fill([
            'event_id' => $event->id,
            'name' => $data['name'] ?? null,
            'logo_path' => $path,
            'website_url' => $data['website_url'] ?? null,
            'sort_order' => $maxSort + 1,
        ]);
        $sponsor->save();

        return back();
    }

    public function updateSponsor(Request $request, Event $event, EventSponsor $sponsor)
    {
        if ($sponsor->event_id !== $event->id) {
            abort(404);
        }

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:120'],
            'website_url' => ['nullable', 'string', 'max:2048'],
        ]);

        $sponsor->fill([
            'name' => $data['name'] ?? null,
            'website_url' => $data['website_url'] ?? null,
        ])->save();

        return back();
    }

    public function destroySponsor(Request $request, Event $event, EventSponsor $sponsor)
    {
        if ($sponsor->event_id !== $event->id) {
            abort(404);
        }

        Storage::disk('public')->delete($sponsor->logo_path);
        $sponsor->delete();

        return back();
    }

    public function storeProgramItemFlyer(Request $request, Event $event, EventProgramItem $programItem)
    {
        if ($programItem->event_id !== $event->id) {
            abort(404);
        }

        $data = $request->validate([
            'flyer' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        if ($programItem->flyer_path) {
            Storage::disk('public')->delete($programItem->flyer_path);
        }

        $this->ensureMediaFolder($event);
        $programItem->flyer_path = $request->file('flyer')->store($event->media_folder . '/program-items/' . $programItem->id, 'public');
        $programItem->save();

        return back();
    }

    public function destroyProgramItemFlyer(Request $request, Event $event, EventProgramItem $programItem)
    {
        if ($programItem->event_id !== $event->id) {
            abort(404);
        }

        if ($programItem->flyer_path) {
            Storage::disk('public')->delete($programItem->flyer_path);
        }
        $programItem->flyer_path = null;
        $programItem->save();

        return back();
    }

    public function storeEventFlyer(Request $request, Event $event)
    {
        $data = $request->validate([
            'flyer' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        if ($event->flyer_path) {
            Storage::disk('public')->delete($event->flyer_path);
        }
        $this->ensureMediaFolder($event);
        $event->flyer_path = $request->file('flyer')->store($event->media_folder, 'public');
        $event->save();

        return back();
    }

    public function storeEventBanner(Request $request, Event $event)
    {
        $data = $request->validate([
            'banner' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        if ($event->banner_path) {
            Storage::disk('public')->delete($event->banner_path);
        }
        $this->ensureMediaFolder($event);
        $event->banner_path = $request->file('banner')->store($event->media_folder, 'public');
        $event->save();

        return back();
    }

    public function destroyEventBanner(Request $request, Event $event)
    {
        if ($event->banner_path) {
            Storage::disk('public')->delete($event->banner_path);
        }
        $event->banner_path = null;
        $event->save();

        return back();
    }

    public function storeEventLogo(Request $request, Event $event)
    {
        $data = $request->validate([
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        if ($event->logo_path) {
            Storage::disk('public')->delete($event->logo_path);
        }
        $this->ensureMediaFolder($event);
        $event->logo_path = $request->file('logo')->store($event->media_folder, 'public');
        $event->save();

        return back();
    }

    public function destroyEventLogo(Request $request, Event $event)
    {
        if ($event->logo_path) {
            Storage::disk('public')->delete($event->logo_path);
        }
        $event->logo_path = null;
        $event->save();

        return back();
    }

    public function destroyEventFlyer(Request $request, Event $event)
    {
        if ($event->flyer_path) {
            Storage::disk('public')->delete($event->flyer_path);
        }
        $event->flyer_path = null;
        $event->save();

        return back();
    }

    public function storeSubevent(Request $request, Event $event)
    {
        $data = $request->validate([
            'day_date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['nullable', 'regex:/^\\d{2}:\\d{2}$/'],
            'end_time' => ['nullable', 'regex:/^\\d{2}:\\d{2}$/'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'google_maps_url' => ['nullable', 'string', 'max:2048'],
            'external_ticket_url' => ['nullable', 'string', 'max:2048'],
            'flyer' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'is_active' => ['nullable', 'boolean'],
            'tickets_enabled' => ['nullable', 'boolean'],
            'ticket_template_id' => [Rule::requiredIf(fn () => (bool) $request->boolean('tickets_enabled')), 'string', Rule::exists('ticket_templates', 'id')],
        ]);

        $locale = app()->getLocale();
        $eventDate = Carbon::createFromFormat('Y-m-d', $data['day_date'])->setTime(12, 0, 0);

        $disabled = (array) ($event->disabled_days ?? []);
        if (in_array($data['day_date'], $disabled, true)) {
            $event->disabled_days = array_values(array_diff($disabled, [$data['day_date']]));
            $event->save();
        }

        $startAt = null;
        $endAt = null;
        if (!empty($data['start_time'])) {
            $startAt = $this->toProgramDateTime($data['day_date'], $data['start_time']);
        }
        if (!empty($data['end_time'])) {
            $endAt = $this->toProgramDateTime($data['day_date'], $data['end_time']);
        }
        if ($startAt && $endAt) {
            if ($endAt->lessThan($startAt)) {
                $endAt = $endAt->copy()->addDay();
            }
        }

        $sub = new Event();
        $sub->fill([
            'parent_event_id' => $event->id,
            'name' => [$locale => $data['name']],
            'description' => [$locale => ($data['description'] ?? '')],
            'location' => [$locale => ($data['location'] ?? ($event->location[$locale] ?? ($event->location['es'] ?? '')))],
            'address' => $data['address'] ?? $event->address,
            'google_maps_url' => $data['google_maps_url'] ?? null,
            'external_ticket_url' => $data['external_ticket_url'] ?? null,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'event_date' => $eventDate,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);
        $sub->save();

        $this->ensureMediaFolder($sub);
        if ($request->hasFile('flyer')) {
            $sub->flyer_path = $request->file('flyer')->store($sub->media_folder, 'public');
            $sub->save();
        }

        if ((bool) ($data['tickets_enabled'] ?? false)) {
            $tpl = TicketTemplate::query()->findOrFail($data['ticket_template_id']);
            $stock = (int) $tpl->stock;
            $isExpired = $sub->end_at && $sub->end_at->lt(now());
            $isActive = !$isExpired && $stock > 0 && (bool) $tpl->is_active;

            $ticketType = EventTicketType::query()->updateOrCreate(
                [
                    'event_id' => $sub->id,
                    'code' => $tpl->code,
                ],
                [
                    'ticket_template_id' => $tpl->id,
                    'price' => $tpl->price,
                    'stock' => $stock,
                    'external_purchase_url' => $tpl->external_purchase_url,
                    'description' => $tpl->description,
                    'legal_terms' => $tpl->legal_terms,
                    'is_active' => $isActive,
                ]
            );

            if ($tpl->image_path) {
                $this->copyTicketTemplateImageToEvent($tpl, $sub, $ticketType);
            }
        }

        return back();
    }

    public function attachTicketTemplate(Request $request, Event $event)
    {
        $role = (string) ($request->user()?->role ?? '');
        if (!in_array($role, ['admin', 'super_admin'], true)) {
            abort(403);
        }

        $data = $request->validate([
            'ticket_template_id' => ['required', 'string', Rule::exists('ticket_templates', 'id')],
        ]);

        $tpl = TicketTemplate::query()->findOrFail($data['ticket_template_id']);
        $stock = (int) $tpl->stock;
        $isExpired = $event->end_at && $event->end_at->lt(now());
        $isActive = !$isExpired && $stock > 0 && (bool) $tpl->is_active;

        $ticketType = EventTicketType::query()->updateOrCreate(
            [
                'event_id' => $event->id,
                'code' => $tpl->code,
            ],
            [
                'ticket_template_id' => $tpl->id,
                'price' => $tpl->price,
                'stock' => $stock,
                'external_purchase_url' => $tpl->external_purchase_url,
                'description' => $tpl->description,
                'legal_terms' => $tpl->legal_terms,
                'is_active' => $isActive,
            ]
        );

        if ($tpl->image_path) {
            $this->copyTicketTemplateImageToEvent($tpl, $event, $ticketType);
        }

        return back();
    }

    private function copyTicketTemplateImageToEvent(TicketTemplate $tpl, Event $event, EventTicketType $ticketType): void
    {
        $this->ensureMediaFolder($event);

        $ext = pathinfo((string) $tpl->image_path, PATHINFO_EXTENSION);
        $ext = $ext ? '.' . $ext : '';
        $dest = $event->media_folder . '/tickets/' . Str::uuid() . $ext;

        if ($ticketType->image_path) {
            Storage::disk('public')->delete($ticketType->image_path);
        }

        try {
            Storage::disk('public')->makeDirectory($event->media_folder . '/tickets');
            Storage::disk('public')->copy($tpl->image_path, $dest);
            $ticketType->image_path = $dest;
            $ticketType->save();
        } catch (\Throwable $e) {
        }
    }

    public function destroy(Request $request, Event $event)
    {
        $this->deleteEventTree($event);

        return redirect()->route('admin.events.index');
    }

    public function destroySubevent(Request $request, Event $event, Event $subevent)
    {
        if ($subevent->parent_event_id !== $event->id) {
            abort(404);
        }

        $this->deleteEventTree($subevent);

        return back();
    }

    public function destroyDay(Request $request, Event $event, string $day)
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day)) {
            abort(422);
        }

        $start = Carbon::createFromFormat('Y-m-d', $day)->startOfDay();
        $end = Carbon::createFromFormat('Y-m-d', $day)->endOfDay();
        $subs = Event::query()
            ->where('parent_event_id', $event->id)
            ->whereBetween('event_date', [$start, $end])
            ->get();

        foreach ($subs as $s) {
            $this->deleteEventTree($s);
        }

        $disabled = (array) ($event->disabled_days ?? []);
        if (!in_array($day, $disabled, true)) {
            $disabled[] = $day;
            $event->disabled_days = array_values($disabled);
            $event->save();
        }

        return back();
    }

    public function updateDay(Request $request, Event $event, string $day)
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day)) {
            abort(422);
        }

        $rawSubevents = $request->input('subevents');
        if (empty($rawSubevents)) {
            $disabled = (array) ($event->disabled_days ?? []);
            if (in_array($day, $disabled, true)) {
                $event->disabled_days = array_values(array_diff($disabled, [$day]));
                $event->save();
            }
            return back();
        }

        $data = $request->validate([
            'subevents' => ['required', 'array'],
            'subevents.*.id' => ['required', 'string', Rule::exists('events', 'id')],
            'subevents.*.day_date' => ['required', 'date_format:Y-m-d'],
            'subevents.*.start_time' => ['nullable', 'regex:/^\\d{2}:\\d{2}$/'],
            'subevents.*.end_time' => ['nullable', 'regex:/^\\d{2}:\\d{2}$/'],
            'subevents.*.name' => ['required', 'string', 'max:255'],
            'subevents.*.description' => ['nullable', 'string'],
            'subevents.*.location' => ['nullable', 'string', 'max:255'],
            'subevents.*.address' => ['nullable', 'string', 'max:255'],
            'subevents.*.google_maps_url' => ['nullable', 'string', 'max:2048'],
            'subevents.*.external_ticket_url' => ['nullable', 'string', 'max:2048'],
            'subevents.*.is_active' => ['nullable'],
            'subevents.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $locale = app()->getLocale();

        $ids = array_values(array_unique(array_map(fn ($x) => (string) $x['id'], (array) $data['subevents'])));
        $subs = Event::query()
            ->where('parent_event_id', $event->id)
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        $disabled = (array) ($event->disabled_days ?? []);
        if (in_array($day, $disabled, true)) {
            $event->disabled_days = array_values(array_diff($disabled, [$day]));
            $event->save();
        }

        foreach ((array) $data['subevents'] as $i => $row) {
            $sid = (string) ($row['id'] ?? '');
            $sub = $subs->get($sid);
            if (!$sub) {
                continue;
            }

            $dayDate = (string) ($row['day_date'] ?? $day);
            $eventDate = Carbon::createFromFormat('Y-m-d', $dayDate)->setTime(12, 0, 0);

            $startAt = null;
            $endAt = null;
            $start = (string) ($row['start_time'] ?? '');
            $end = (string) ($row['end_time'] ?? '');
            if ($start !== '') {
                $startAt = $this->toProgramDateTime($dayDate, $start);
            }
            if ($end !== '') {
                $endAt = $this->toProgramDateTime($dayDate, $end);
            }
            if ($startAt && $endAt && $endAt->lessThan($startAt)) {
                $endAt = $endAt->copy()->addDay();
            }

            $sub->fill([
                'parent_event_id' => $event->id,
                'name' => [$locale => (string) ($row['name'] ?? '')],
                'description' => [$locale => (string) ($row['description'] ?? '')],
                'location' => [$locale => ((string) ($row['location'] ?? '') !== '' ? (string) $row['location'] : ($event->location[$locale] ?? ($event->location['es'] ?? '')))],
                'address' => (string) ($row['address'] ?? $event->address),
                'google_maps_url' => (string) ($row['google_maps_url'] ?? '') !== '' ? (string) $row['google_maps_url'] : null,
                'external_ticket_url' => (string) ($row['external_ticket_url'] ?? '') !== '' ? (string) $row['external_ticket_url'] : null,
                'start_at' => $startAt,
                'end_at' => $endAt,
                'event_date' => $eventDate,
                'is_active' => (bool) ($row['is_active'] ?? true),
                'sort_order' => (int) ($row['sort_order'] ?? $i),
            ]);
            $sub->save();
        }

        return back();
    }

    public function moveDay(Request $request, Event $event, string $day)
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day)) {
            abort(422);
        }

        $data = $request->validate([
            'new_day_date' => ['required', 'date_format:Y-m-d'],
        ]);

        $newDay = (string) $data['new_day_date'];
        if ($newDay === $day) {
            return back();
        }

        $start = Carbon::createFromFormat('Y-m-d', $day)->startOfDay();
        $end = Carbon::createFromFormat('Y-m-d', $day)->endOfDay();
        $subs = Event::query()
            ->where('parent_event_id', $event->id)
            ->whereBetween('event_date', [$start, $end])
            ->get();

        if ($subs->isEmpty()) {
            $disabled = (array) ($event->disabled_days ?? []);
            $disabled = array_values(array_unique(array_merge($disabled, [$day])));
            $disabled = array_values(array_diff($disabled, [$newDay]));
            $event->disabled_days = $disabled;
            $event->save();
            return back();
        }

        $newEventDate = Carbon::createFromFormat('Y-m-d', $newDay)->setTime(12, 0, 0);

        foreach ($subs as $sub) {
            $startHm = $sub->start_at ? $sub->start_at->format('H:i') : '';
            $endHm = $sub->end_at ? $sub->end_at->format('H:i') : '';

            $startAt = null;
            $endAt = null;
            if ($startHm !== '') {
                $startAt = $this->toProgramDateTime($newDay, $startHm);
            }
            if ($endHm !== '') {
                $endAt = $this->toProgramDateTime($newDay, $endHm);
            }
            if ($startAt && $endAt && $endAt->lessThan($startAt)) {
                $endAt = $endAt->copy()->addDay();
            }

            $sub->event_date = $newEventDate;
            $sub->start_at = $startAt;
            $sub->end_at = $endAt;
            $sub->save();
        }

        $disabled = (array) ($event->disabled_days ?? []);
        if (!in_array($day, $disabled, true)) {
            $disabled[] = $day;
        }
        $disabled = array_values(array_diff($disabled, [$newDay]));
        $event->disabled_days = array_values(array_unique($disabled));
        $event->save();

        return back();
    }

    private function deleteEventTree(Event $event): void
    {
        $subeventIds = $event->subevents()->pluck('id')->all();
        $allEventIds = array_values(array_unique(array_merge([$event->id], $subeventIds)));

        $ticketImages = EventTicketType::query()
            ->whereIn('event_id', $allEventIds)
            ->whereNotNull('image_path')
            ->get(['image_path']);
        foreach ($ticketImages as $t) {
            Storage::disk('public')->delete($t->image_path);
        }

        $sponsors = EventSponsor::query()->whereIn('event_id', $allEventIds)->get(['logo_path']);
        foreach ($sponsors as $s) {
            Storage::disk('public')->delete($s->logo_path);
        }

        $programFlyers = EventProgramItem::query()->whereIn('event_id', $allEventIds)->whereNotNull('flyer_path')->get(['flyer_path']);
        foreach ($programFlyers as $p) {
            Storage::disk('public')->delete($p->flyer_path);
        }

        $events = Event::query()->whereIn('id', $allEventIds)->get(['id', 'banner_path', 'logo_path', 'flyer_path', 'media_folder']);
        foreach ($events as $e) {
            if ($e->banner_path) {
                Storage::disk('public')->delete($e->banner_path);
            }
            if ($e->logo_path) {
                Storage::disk('public')->delete($e->logo_path);
            }
            if ($e->flyer_path) {
                Storage::disk('public')->delete($e->flyer_path);
            }
        }

        $folders = $events
            ->pluck('media_folder')
            ->filter(fn ($x) => is_string($x) && $x !== '')
            ->unique()
            ->sortByDesc(fn ($x) => strlen((string) $x))
            ->values();
        foreach ($folders as $folder) {
            Storage::disk('public')->deleteDirectory($folder);
        }

        EventTicketType::query()->whereIn('event_id', $allEventIds)->delete();
        EventSponsor::query()->whereIn('event_id', $allEventIds)->delete();
        EventProgramItem::query()->whereIn('event_id', $allEventIds)->delete();

        Event::query()->whereIn('id', $subeventIds)->delete();
        $event->delete();
    }

    public function upsertTicketType(Request $request, Event $event)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:40', 'regex:/^[A-Za-z0-9][A-Za-z0-9 _-]*$/'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'external_purchase_url' => ['nullable', 'string', 'max:2048'],
            'description' => ['nullable', 'string', 'max:8000'],
            'legal_terms' => ['nullable', 'string', 'max:8000'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $code = strtoupper(str_replace(' ', '_', trim((string) $data['code'])));
        $stock = (int) $data['stock'];
        $isActive = $stock > 0 ? (bool) ($data['is_active'] ?? true) : false;
        $ticketType = EventTicketType::query()->updateOrCreate(
            [
                'event_id' => $event->id,
                'code' => $code,
            ],
            [
                'price' => $data['price'],
                'stock' => $stock,
                'external_purchase_url' => $data['external_purchase_url'] ?? null,
                'description' => $data['description'] ?? null,
                'legal_terms' => $data['legal_terms'] ?? null,
                'is_active' => $isActive,
            ]
        );

        if ($request->hasFile('image')) {
            if ($ticketType->image_path) {
                Storage::disk('public')->delete($ticketType->image_path);
            }
            $this->ensureMediaFolder($event);
            $ticketType->image_path = $request->file('image')->store($event->media_folder . '/tickets', 'public');
            $ticketType->save();
        }

        return back();
    }

    public function destroyTicketTypeImage(Request $request, Event $event, EventTicketType $ticketType)
    {
        if ($ticketType->event_id !== $event->id) {
            abort(404);
        }
        if ($ticketType->image_path) {
            Storage::disk('public')->delete($ticketType->image_path);
        }
        $ticketType->image_path = null;
        $ticketType->save();
        return back();
    }

    public function destroyTicketType(Request $request, Event $event, EventTicketType $ticketType)
    {
        if ($ticketType->event_id !== $event->id) {
            abort(404);
        }
        if ($ticketType->image_path) {
            Storage::disk('public')->delete($ticketType->image_path);
        }
        $ticketType->delete();
        return back();
    }

    private function validateEvent(Request $request, ?Event $event = null): array
    {
        $messages = [
            'name.required' => 'El nombre es obligatorio.',
            'description.required' => 'La descripción es obligatoria.',
            'address.required' => 'La dirección es obligatoria.',
            'location.required' => 'La localización es obligatoria.',
            'start_date.required' => 'La fecha de inicio es obligatoria.',
            'end_date.required' => 'La fecha de fin es obligatoria.',
            'start_time.required' => 'La hora de inicio es obligatoria.',
            'end_time.required' => 'La hora de fin es obligatoria.',
            'start_date.regex' => 'Formato de fecha inválido.',
            'end_date.regex' => 'Formato de fecha inválido.',
            'start_time.regex' => 'Formato de hora inválido.',
            'end_time.regex' => 'Formato de hora inválido.',
        ];

        $data = $request->validate([
            'parent_event_id' => ['nullable', 'string', Rule::exists('events', 'id')],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'address' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'google_maps_url' => ['nullable', 'string', 'max:2048'],
            'external_ticket_url' => ['nullable', 'string', 'max:2048'],
            'start_date' => ['required', 'string', 'regex:/^(\\d{2}-\\d{2}-\\d{4}|\\d{4}-\\d{2}-\\d{2})$/'],
            'end_date' => ['required', 'string', 'regex:/^(\\d{2}-\\d{2}-\\d{4}|\\d{4}-\\d{2}-\\d{2})$/'],
            'start_time' => [Rule::requiredIf(fn () => !$request->filled('parent_event_id')), 'nullable', 'string', 'regex:/^\\d{2}:\\d{2}(:\\d{2})?$/'],
            'end_time' => [Rule::requiredIf(fn () => !$request->filled('parent_event_id')), 'nullable', 'string', 'regex:/^\\d{2}:\\d{2}(:\\d{2})?$/'],
            'is_active' => ['nullable', 'boolean'],
            'banner' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'flyer' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'program_items' => ['nullable', 'array'],
            'program_items.*.id' => ['nullable', 'string', 'max:36'],
            'program_items.*.client_id' => ['nullable', 'string', 'max:64'],
            'program_items.*.day_date' => ['nullable', 'date_format:Y-m-d'],
            'program_items.*.start_time' => ['nullable', 'regex:/^\\d{2}:\\d{2}$/'],
            'program_items.*.end_time' => ['nullable', 'regex:/^\\d{2}:\\d{2}$/'],
            'program_items.*.title' => ['nullable', 'string', 'max:255'],
            'program_items.*.description' => ['nullable', 'string'],
            'program_items.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ], $messages);

        $locale = app()->getLocale();

        $startAt = null;
        $endAt = null;
        $startDate = str_contains($data['start_date'], '-') && strlen($data['start_date']) === 10 && $data['start_date'][4] === '-'
            ? Carbon::createFromFormat('Y-m-d', $data['start_date'])
            : Carbon::createFromFormat('d-m-Y', $data['start_date']);
        $endDate = str_contains($data['end_date'], '-') && strlen($data['end_date']) === 10 && $data['end_date'][4] === '-'
            ? Carbon::createFromFormat('Y-m-d', $data['end_date'])
            : Carbon::createFromFormat('d-m-Y', $data['end_date']);

        $isSubevent = !empty($data['parent_event_id']) || (bool) ($event?->parent_event_id);
        $cutoff = $this->programDayStartHour();

        if (!empty($data['start_time'])) {
            $startAt = $startDate->copy()->setTimeFromTimeString($data['start_time']);
            if ($isSubevent) {
                $startHour = (int) substr((string) $data['start_time'], 0, 2);
                if ($startHour < $cutoff) {
                    $startAt = $startAt->copy()->addDay();
                }
            }
        }
        if (!empty($data['end_time'])) {
            $endAt = ($isSubevent ? $startDate : $endDate)->copy()->setTimeFromTimeString($data['end_time']);
            if ($isSubevent) {
                $endHour = (int) substr((string) $data['end_time'], 0, 2);
                if ($endHour < $cutoff) {
                    $endAt = $endAt->copy()->addDay();
                }
            }
        }
        if ($startAt && $endAt && $endAt->lessThan($startAt)) {
            $endAt = $endAt->copy()->addDay();
        }
        $eventDate = $startDate->copy()->setTime(12, 0, 0);

        $payload = [
            'parent_event_id' => $data['parent_event_id'] ?? null,
            'name' => [$locale => $data['name']],
            'description' => [$locale => $data['description']],
            'start_at' => $startAt,
            'end_at' => $endAt,
            'event_date' => $eventDate,
            'address' => $data['address'],
            'location' => [$locale => $data['location']],
            'google_maps_url' => $data['google_maps_url'] ?? null,
            'external_ticket_url' => $data['external_ticket_url'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ];

        return $payload;
    }

    private function syncProgramItems(Request $request, Event $event): void
    {
        if (!$request->has('program_items')) {
            return;
        }

        $items = (array) $request->input('program_items', []);

        $normalized = [];
        foreach ($items as $i => $item) {
            if (!is_array($item)) {
                continue;
            }
            $day = (string) ($item['day_date'] ?? '');
            $title = trim((string) ($item['title'] ?? ''));
            $description = trim((string) ($item['description'] ?? ''));
            $start = (string) ($item['start_time'] ?? '');
            $end = (string) ($item['end_time'] ?? '');

            $hasAny = ($day !== '') || ($title !== '') || ($description !== '') || ($start !== '') || ($end !== '');
            if (!$hasAny) {
                continue;
            }

            if ($day === '' || $title === '') {
                continue;
            }

            $id = (string) ($item['id'] ?? '');
            if ($id === '') {
                $id = (string) Str::uuid();
            }

            $normalized[] = [
                'id' => $id,
                'event_id' => $event->id,
                'day_date' => $day,
                'start_time' => $start !== '' ? $start . ':00' : null,
                'end_time' => $end !== '' ? $end . ':00' : null,
                'title' => $title,
                'description' => $description !== '' ? $description : null,
                'sort_order' => (int) ($item['sort_order'] ?? $i),
            ];
        }

        $keepIds = array_map(fn ($x) => $x['id'], $normalized);

        foreach ($normalized as $item) {
            EventProgramItem::query()->updateOrCreate(
                [
                    'id' => $item['id'],
                    'event_id' => $event->id,
                ],
                [
                    'day_date' => $item['day_date'],
                    'start_time' => $item['start_time'],
                    'end_time' => $item['end_time'],
                    'title' => $item['title'],
                    'description' => $item['description'],
                    'sort_order' => $item['sort_order'],
                ]
            );
        }
    }

    private function handleFiles(Request $request, Event $event): void
    {
        $this->ensureMediaFolder($event);
        if ($request->hasFile('banner')) {
            if ($event->banner_path) {
                Storage::disk('public')->delete($event->banner_path);
            }
            $event->banner_path = $request->file('banner')->store($event->media_folder, 'public');
        }

        if ($request->hasFile('logo')) {
            if ($event->logo_path) {
                Storage::disk('public')->delete($event->logo_path);
            }
            $event->logo_path = $request->file('logo')->store($event->media_folder, 'public');
        }

        if ($request->hasFile('flyer')) {
            if ($event->flyer_path) {
                Storage::disk('public')->delete($event->flyer_path);
            }
            $event->flyer_path = $request->file('flyer')->store($event->media_folder, 'public');
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
            'start_ymd' => optional($event->start_at)->format('Y-m-d'),
            'end_ymd' => optional($event->end_at)->format('Y-m-d'),
            'event_date_ymd' => optional($event->event_date)->format('Y-m-d') ?? optional($event->start_at)->format('Y-m-d'),
            'start_at' => $event->start_at?->format('Y-m-d\\TH:i:s'),
            'end_at' => $event->end_at?->format('Y-m-d\\TH:i:s'),
            'location' => $event->location[$locale] ?? ($event->location['es'] ?? ''),
            'address' => $event->address,
            'google_maps_url' => $event->google_maps_url,
            'external_ticket_url' => $event->external_ticket_url,
            'sort_order' => $event->sort_order,
            'disabled_days' => $event->disabled_days ?? [],
            'is_active' => (bool) $event->is_active,
            'banner_url' => $event->banner_path ? Storage::disk('public')->url($event->banner_path) : null,
            'logo_url' => $event->logo_path ? Storage::disk('public')->url($event->logo_path) : null,
            'flyer_url' => $event->flyer_path ? Storage::disk('public')->url($event->flyer_path) : null,
            'ticket_types' => $event->relationLoaded('ticketTypes')
                ? $event->ticketTypes->sortBy('code')->values()->map(function (EventTicketType $t) {
                    return [
                        'id' => $t->id,
                        'name' => $t->ticketTemplate?->name,
                        'code' => $t->code,
                        'price' => (string) $t->price,
                        'stock' => (int) $t->stock,
                        'external_purchase_url' => $t->external_purchase_url,
                        'image_url' => $t->image_path ? Storage::disk('public')->url($t->image_path) : null,
                        'description' => $t->description,
                        'legal_terms' => $t->legal_terms,
                        'is_active' => (bool) $t->is_active,
                    ];
                })
                : [],
            'sponsors' => $event->relationLoaded('sponsors')
                ? $event->sponsors->sortBy('sort_order')->values()->map(function (EventSponsor $s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'logo_url' => $s->logo_path ? Storage::disk('public')->url($s->logo_path) : null,
                        'website_url' => $s->website_url,
                        'sort_order' => (int) $s->sort_order,
                    ];
                })
                : [],
            'program_items' => $event->relationLoaded('programItems')
                ? $event->programItems
                    ->sortBy(fn (EventProgramItem $p) => sprintf('%s-%010d-%s', (string) $p->day_date?->format('Y-m-d'), (int) $p->sort_order, (string) $p->start_time))
                    ->values()
                    ->map(function (EventProgramItem $p) {
                        return [
                            'id' => $p->id,
                            'day_date' => $p->day_date?->format('Y-m-d'),
                            'start_time' => $p->start_time ? substr((string) $p->start_time, 0, 5) : null,
                            'end_time' => $p->end_time ? substr((string) $p->end_time, 0, 5) : null,
                            'title' => $p->title,
                            'description' => $p->description,
                            'flyer_url' => $p->flyer_path ? Storage::disk('public')->url($p->flyer_path) : null,
                            'sort_order' => (int) $p->sort_order,
                        ];
                    })
                : [],
            'subevents' => $includeSubevents
                ? $event->subevents
                    ->sortBy(fn (Event $s) => sprintf('%s-%010d-%s', (string) $s->event_date?->format('Y-m-d'), (int) ($s->sort_order ?? 0), (string) $s->start_at))
                    ->values()
                    ->map(fn (Event $s) => $this->mapEvent($s, false))
                    ->values()
                : [],
        ];
    }

    private function ensureMediaFolder(Event $event): void
    {
        if ($event->media_folder) {
            Storage::disk('public')->makeDirectory($event->media_folder);
            Storage::disk('public')->makeDirectory($event->media_folder . '/subevents');
            return;
        }

        $locale = app()->getLocale();
        $name = (string) ($event->name[$locale] ?? ($event->name['es'] ?? ($event->name['en'] ?? $event->id)));
        $shortId = substr((string) $event->id, 0, 8);
        $folderName = Str::slug($name) . '-' . $shortId;

        if ($event->parent_event_id) {
            $parent = Event::query()->find($event->parent_event_id);
            if ($parent) {
                if (!$parent->media_folder) {
                    $this->ensureMediaFolder($parent);
                }
                $event->media_folder = $parent->media_folder . '/subevents/' . $folderName;
            } else {
                $event->media_folder = 'images/events/' . $folderName;
            }
        } else {
            $event->media_folder = 'images/events/' . $folderName;
        }

        $event->save();

        Storage::disk('public')->makeDirectory($event->media_folder);
        Storage::disk('public')->makeDirectory($event->media_folder . '/subevents');
    }
}
