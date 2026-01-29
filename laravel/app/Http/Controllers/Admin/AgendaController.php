<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AgendaLocation;
use App\Models\AgendaSubeventTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AgendaController extends Controller
{
    public function index(Request $request)
    {
        $locale = app()->getLocale();
        $orderLocale = in_array($locale, ['es', 'en'], true) ? $locale : 'es';

        $locations = AgendaLocation::query()
            ->orderByRaw("lower(coalesce(name->>'{$orderLocale}', name->>'es', name->>'en', '')) asc")
            ->get()
            ->map(fn ($l) => [
                'id' => $l->id,
                'name' => $l->name[$locale] ?? ($l->name['es'] ?? ''),
                'name_i18n' => $l->name,
                'location' => $l->location[$locale] ?? ($l->location['es'] ?? ''),
                'location_i18n' => $l->location,
                'address' => $l->address,
                'google_maps_url' => $l->google_maps_url,
                'notes' => $l->notes,
                'is_active' => (bool) $l->is_active,
            ])
            ->values();

        $templates = AgendaSubeventTemplate::query()
            ->orderByRaw("lower(coalesce(name->>'{$orderLocale}', name->>'es', name->>'en', '')) asc")
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name[$locale] ?? ($t->name['es'] ?? ''),
                'name_i18n' => $t->name,
                'description' => $t->description[$locale] ?? ($t->description['es'] ?? ''),
                'description_i18n' => $t->description,
                'agenda_location_id' => $t->agenda_location_id,
                'is_active' => (bool) $t->is_active,
            ])
            ->values();

        $canManage = in_array((string) ($request->user()?->role ?? ''), ['admin', 'super_admin'], true);
        $canDelete = (string) ($request->user()?->role ?? '') === 'super_admin';

        return Inertia::render('Admin/Agenda/Index', [
            'locations' => $locations,
            'templates' => $templates,
            'can' => [
                'manage' => $canManage,
                'delete' => $canDelete,
            ],
        ]);
    }

    public function storeLocation(Request $request)
    {
        $this->authorizeManage($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'google_maps_url' => ['nullable', 'string', 'max:2048'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $locale = app()->getLocale();
        $loc = new AgendaLocation();
        $loc->fill([
            'name' => [$locale => $data['name']],
            'location' => [$locale => (string) ($data['location'] ?? '')],
            'address' => $data['address'] ?? null,
            'google_maps_url' => $this->cleanLooseText($data['google_maps_url'] ?? null),
            'notes' => $data['notes'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);
        $loc->save();

        return back();
    }

    public function updateLocation(Request $request, AgendaLocation $location)
    {
        $this->authorizeManage($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'google_maps_url' => ['nullable', 'string', 'max:2048'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $locale = app()->getLocale();
        $name = (array) ($location->name ?? []);
        $name[$locale] = $data['name'];
        $locI18n = (array) ($location->location ?? []);
        $locI18n[$locale] = (string) ($data['location'] ?? '');

        $location->fill([
            'name' => $name,
            'location' => $locI18n,
            'address' => $data['address'] ?? null,
            'google_maps_url' => $this->cleanLooseText($data['google_maps_url'] ?? null),
            'notes' => $data['notes'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ])->save();

        return back();
    }

    public function destroyLocation(Request $request, AgendaLocation $location)
    {
        $this->authorizeDelete($request);
        $location->delete();
        return back();
    }

    public function storeTemplate(Request $request)
    {
        $this->authorizeManage($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'agenda_location_id' => ['nullable', 'string', 'exists:agenda_locations,id'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $locale = app()->getLocale();
        $tpl = new AgendaSubeventTemplate();
        $tpl->fill([
            'name' => [$locale => $data['name']],
            'description' => [$locale => (string) ($data['description'] ?? '')],
            'agenda_location_id' => $data['agenda_location_id'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);
        $tpl->save();

        return back();
    }

    public function updateTemplate(Request $request, AgendaSubeventTemplate $template)
    {
        $this->authorizeManage($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'agenda_location_id' => ['nullable', 'string', 'exists:agenda_locations,id'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $locale = app()->getLocale();
        $name = (array) ($template->name ?? []);
        $name[$locale] = $data['name'];
        $desc = (array) ($template->description ?? []);
        $desc[$locale] = (string) ($data['description'] ?? '');

        $template->fill([
            'name' => $name,
            'description' => $desc,
            'agenda_location_id' => $data['agenda_location_id'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ])->save();

        return back();
    }

    public function destroyTemplate(Request $request, AgendaSubeventTemplate $template)
    {
        $this->authorizeDelete($request);
        $template->delete();
        return back();
    }

    private function cleanLooseText(?string $value): ?string
    {
        $v = trim((string) $value);
        if ($v === '') return null;
        $v = trim($v, " \t\n\r\0\x0B`'\"");
        $v = rtrim($v, " \t\n\r\0\x0B,");
        $v = trim($v, " \t\n\r\0\x0B`'\"");
        return $v === '' ? null : $v;
    }

    private function authorizeManage(Request $request): void
    {
        $role = (string) ($request->user()?->role ?? '');
        if (!in_array($role, ['admin', 'super_admin'], true)) {
            abort(403);
        }
    }

    private function authorizeDelete(Request $request): void
    {
        $role = (string) ($request->user()?->role ?? '');
        if ($role !== 'super_admin') {
            abort(403);
        }
    }
}
