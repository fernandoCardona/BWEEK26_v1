<?php

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

Artisan::command('users:reset-password {email} {password}', function (string $email, string $password) {
    $normalizedEmail = strtolower(trim($email));
    $user = User::query()
        ->whereRaw('lower(email) = ?', [$normalizedEmail])
        ->first();
    if (!$user) {
        $this->error("No existe el usuario: {$normalizedEmail}");
        return 1;
    }

    $user->forceFill([
        'password' => $password,
        'is_active' => true,
    ])->save();

    $ok = Hash::check($password, (string) $user->password);
    if (!$ok) {
        $this->error("No se pudo verificar la contraseña para: {$email}");
        return 1;
    }

    $this->info("Password reseteado OK: {$normalizedEmail}");
    return 0;
})->purpose('Resetear contraseña (sin imprimirla) y reactivar usuario');

Artisan::command('users:list {--limit=20}', function () {
    $limit = (int) $this->option('limit');
    $users = User::query()->orderBy('created_at', 'desc')->limit($limit)->get(['id', 'email', 'legacy_role', 'is_active', 'created_at']);
    foreach ($users as $u) {
        $this->line("{$u->email} | {$u->roleName()} | active=" . (($u->is_active ?? true) ? '1' : '0'));
    }
    $this->info('Total: ' . User::query()->count());
})->purpose('Listar usuarios (debug)');

Artisan::command('users:ensure {email} {password} {--role=user}', function (string $email, string $password) {
    $normalizedEmail = strtolower(trim($email));
    $role = (string) $this->option('role');
    if (!in_array($role, ['user', 'admin', 'super_admin'], true)) {
        $this->error("Rol inválido: {$role}");
        return 1;
    }

    $user = User::query()
        ->whereRaw('lower(email) = ?', [$normalizedEmail])
        ->first();

    if (!$user) {
        $name = explode('@', $normalizedEmail)[0] ?? 'User';
        $user = new User();
        $user->fill([
            'name' => $name,
            'email' => $normalizedEmail,
            'password' => $password,
            'email_verified_at' => now(),
        ]);
        $user->forceFill([
            'legacy_role' => User::normalizeRoleName($role),
            'is_active' => true,
        ])->save();
        $user->syncAppRole($role);

        $this->info("Usuario creado OK: {$normalizedEmail} ({$role})");
        return 0;
    }

    $user->forceFill([
        'password' => $password,
        'legacy_role' => User::normalizeRoleName($role),
        'is_active' => true,
    ])->save();
    $user->syncAppRole($role);

    $ok = Hash::check($password, (string) $user->password);
    if (!$ok) {
        $this->error("No se pudo verificar la contraseña para: {$normalizedEmail}");
        return 1;
    }

    $this->info("Usuario actualizado OK: {$normalizedEmail} ({$role})");
    return 0;
})->purpose('Crear/actualizar un usuario y fijar password+rol');

Artisan::command('core-users:ensure', function () {
    $fixedUsers = (array) config('core_users.fixed_users', []);
    $password = (string) config('core_users.fixed_password', 'c4c4v4c4');

    foreach ($fixedUsers as $u) {
        $email = strtolower(trim((string) ($u['email'] ?? '')));
        $role = (string) ($u['role'] ?? 'user');
        if ($email === '') {
            continue;
        }

        $this->call('users:ensure', [
            'email' => $email,
            'password' => $password,
            '--role' => $role,
        ]);
    }
})->purpose('Asegurar usuarios fijos definidos en config/core_users.php');

Artisan::command('bweek:snapshot', function () {
    $ts = now()->format('Ymd_His');
    $path = "backups/snapshot_{$ts}.json";

    $data = [
        'created_at' => now()->toIso8601String(),
        'tables' => [
            'events' => DB::table('events')->get(),
            'event_program_items' => DB::table('event_program_items')->get(),
            'event_ticket_types' => DB::table('event_ticket_types')->get(),
            'product_categories' => DB::table('product_categories')->get(),
            'products' => DB::table('products')->get(),
            'product_variants' => DB::table('product_variants')->get(),
        ],
    ];

    Storage::disk('local')->put($path, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    $this->info("Snapshot guardado: storage/app/{$path}");
})->purpose('Guardar snapshot JSON de tablas clave para backup manual');

Artisan::command('bweek:restore-event-ticket-folders', function () {
    $disk = Storage::disk('public');
    $base = 'images/events';

    $parents = DB::table('events')
        ->whereNull('parent_event_id')
        ->get(['id', 'name', 'start_at', 'address', 'location', 'google_maps_url', 'external_ticket_url'])
        ->map(function ($e) {
            $name = is_array($e->name) ? ($e->name['es'] ?? $e->name['en'] ?? '') : (string) $e->name;
            return [
                'id' => (string) $e->id,
                'id_prefix' => substr((string) $e->id, 0, 8),
                'name' => (string) $name,
                'start_at' => $e->start_at ? Carbon::parse($e->start_at) : null,
                'address' => (string) ($e->address ?? ''),
                'location' => $e->location,
                'google_maps_url' => $e->google_maps_url ? (string) $e->google_maps_url : null,
                'external_ticket_url' => $e->external_ticket_url ? (string) $e->external_ticket_url : null,
            ];
        })
        ->values();

    $programByParent = [];
    $programRows = DB::table('event_program_items')->get(['event_id', 'day_date', 'start_time', 'end_time', 'title', 'description']);
    foreach ($programRows as $row) {
        $key = Str::slug((string) $row->title);
        if (!isset($programByParent[(string) $row->event_id])) {
            $programByParent[(string) $row->event_id] = [];
        }
        if (!isset($programByParent[(string) $row->event_id][$key])) {
            $programByParent[(string) $row->event_id][$key] = [
                'day_date' => (string) $row->day_date,
                'start_time' => $row->start_time ? substr((string) $row->start_time, 0, 5) : null,
                'end_time' => $row->end_time ? substr((string) $row->end_time, 0, 5) : null,
                'title' => (string) ($row->title ?? ''),
                'description' => $row->description ? (string) $row->description : null,
            ];
        }
    }

    $eventDirs = $disk->directories($base);
    $createdSubevents = 0;
    $createdTicketTypes = 0;

    DB::transaction(function () use ($disk, $base, $parents, $programByParent, $eventDirs, &$createdSubevents, &$createdTicketTypes) {
        foreach ($eventDirs as $eventDir) {
            $eventFolder = basename((string) $eventDir);
            $parts = explode('-', $eventFolder);
            $eventIdPrefix = (string) end($parts);
            if (strlen($eventIdPrefix) !== 8) {
                continue;
            }

            $parent = $parents->firstWhere('id_prefix', $eventIdPrefix);
            if (!$parent) {
                continue;
            }

            $existingSubs = DB::table('events')
                ->where('parent_event_id', $parent['id'])
                ->get(['id', 'name', 'description', 'start_at', 'end_at', 'event_date', 'address', 'location', 'google_maps_url', 'external_ticket_url', 'media_folder', 'is_active'])
                ->map(function ($e) {
                    $nameEs = '';
                    if (is_string($e->name ?? null)) {
                        $decoded = json_decode((string) $e->name, true);
                        $nameEs = is_array($decoded) ? (string) ($decoded['es'] ?? ($decoded['en'] ?? '')) : '';
                    }
                    return [
                        'id' => (string) $e->id,
                        'name_es' => $nameEs,
                        'slug' => Str::slug($nameEs),
                        'media_folder' => (string) ($e->media_folder ?? ''),
                    ];
                })
                ->values();

            $subeventsBase = "{$eventDir}/subevents";
            $subeventDirs = $disk->directories($subeventsBase);
            foreach ($subeventDirs as $subDir) {
                $ticketsDir = "{$subDir}/tickets";
                if (!$disk->exists($ticketsDir)) {
                    continue;
                }

                $files = collect($disk->files($ticketsDir))
                    ->filter(fn ($f) => preg_match('/\\.(png|jpe?g|webp)$/i', (string) $f))
                    ->values();
                if ($files->isEmpty()) {
                    continue;
                }

                $subFolder = basename((string) $subDir);
                $subFolderParts = explode('-', $subFolder);
                $subIdPrefix = (string) end($subFolderParts);
                $slug = strlen($subIdPrefix) === 8 ? implode('-', array_slice($subFolderParts, 0, -1)) : $subFolder;
                $slug = trim((string) $slug);
                if ($slug === '') {
                    continue;
                }

                $nameEs = Str::of($slug)->replace('-', ' ')->title()->toString();
                $programKey = Str::slug($slug);
                $program = $programByParent[$parent['id']][$programKey] ?? null;
                $eventDate = $program
                    ? Carbon::createFromFormat('Y-m-d', $program['day_date'])->setTime(12, 0, 0)
                    : (($parent['start_at'] instanceof Carbon) ? $parent['start_at']->copy()->setTime(12, 0, 0) : now()->copy()->setTime(12, 0, 0));
                $startAt = null;
                $endAt = null;
                if ($program && $program['start_time']) {
                    $startAt = Carbon::createFromFormat('Y-m-d H:i', $program['day_date'] . ' ' . $program['start_time']);
                }
                if ($program && $program['end_time']) {
                    $endAt = Carbon::createFromFormat('Y-m-d H:i', $program['day_date'] . ' ' . $program['end_time']);
                    if ($startAt && $endAt->lessThan($startAt)) {
                        $endAt = $endAt->copy()->addDay();
                    }
                }

                $expectedMediaFolder = "{$base}/{$eventFolder}/subevents/{$subFolder}";
                $folderEvent = $existingSubs->firstWhere('media_folder', $expectedMediaFolder);

                $slugFolder = Str::slug($slug);
                $slugFolderCore = preg_replace('/^(noche-especial-|special-night-)/', '', $slugFolder);
                $slugFolderCore = (string) ($slugFolderCore ?? $slugFolder);
                $best = null;
                $bestScore = 0.0;
                foreach ($existingSubs as $cand) {
                    $candSlug = (string) ($cand['slug'] ?? '');
                    if ($candSlug === '' || $slugFolder === '') {
                        continue;
                    }
                    if (
                        str_contains($candSlug, $slugFolder) ||
                        str_contains($slugFolder, $candSlug) ||
                        ($slugFolderCore !== '' && (str_contains($candSlug, $slugFolderCore) || str_contains($slugFolderCore, $candSlug)))
                    ) {
                        $score = 100.0;
                    } else {
                        $pct = 0.0;
                        $pct1 = 0.0;
                        $pct2 = 0.0;
                        similar_text($candSlug, $slugFolder, $pct1);
                        if ($slugFolderCore !== '') {
                            similar_text($candSlug, $slugFolderCore, $pct2);
                        }
                        $score = max((float) $pct1, (float) $pct2);
                    }
                    if ($score > $bestScore) {
                        $bestScore = $score;
                        $best = $cand;
                    }
                }

                $target = null;
                if ($best && $bestScore >= 65.0) {
                    $target = $best;
                } elseif ($folderEvent) {
                    $target = $folderEvent;
                }

                if (!$target) {
                    $target = [
                        'id' => (string) Str::uuid(),
                        'name_es' => '',
                        'slug' => '',
                        'media_folder' => '',
                    ];
                }

                $subeventId = (string) $target['id'];
                $programTitle = $program ? trim((string) ($program['title'] ?? '')) : '';
                $programDesc = $program ? ($program['description'] ?? null) : null;

                $targetExists = DB::table('events')->where('id', $subeventId)->exists();

                if (!$targetExists) {
                    DB::table('events')->insert([
                        'id' => $subeventId,
                        'parent_event_id' => $parent['id'],
                        'name' => json_encode(['es' => ($programTitle !== '' ? $programTitle : $nameEs)], JSON_UNESCAPED_UNICODE),
                        'description' => json_encode(['es' => $programDesc], JSON_UNESCAPED_UNICODE),
                        'event_date' => $eventDate,
                        'start_at' => $startAt,
                        'end_at' => $endAt,
                        'location' => $parent['location'] ?? json_encode(['es' => ''], JSON_UNESCAPED_UNICODE),
                        'address' => $parent['address'] ?? '',
                        'google_maps_url' => $parent['google_maps_url'],
                        'external_ticket_url' => $parent['external_ticket_url'],
                        'sort_order' => 0,
                        'media_folder' => $expectedMediaFolder,
                        'disabled_days' => json_encode([], JSON_UNESCAPED_UNICODE),
                        'capacity' => null,
                        'is_active' => true,
                        'banner_path' => null,
                        'logo_path' => null,
                        'flyer_path' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $createdSubevents++;
                } else {
                    $existing = DB::table('events')->where('id', $subeventId)->first();
                    $existingNameEs = '';
                    if ($existing && is_string($existing->name ?? null)) {
                        $decoded = json_decode((string) $existing->name, true);
                        $existingNameEs = is_array($decoded) ? (string) ($decoded['es'] ?? '') : '';
                    }

                    $updates = [];
                    if ((string) ($existing->media_folder ?? '') === '') {
                        $updates['media_folder'] = $expectedMediaFolder;
                    }
                    if ($existing->event_date === null) {
                        $updates['event_date'] = $eventDate;
                    }
                    if ($existing->start_at === null && $startAt) {
                        $updates['start_at'] = $startAt;
                    }
                    if ($existing->end_at === null && $endAt) {
                        $updates['end_at'] = $endAt;
                    }
                    if ((string) ($existing->address ?? '') === '' && (string) ($parent['address'] ?? '') !== '') {
                        $updates['address'] = $parent['address'];
                    }
                    if ($existing->location === null && $parent['location'] !== null) {
                        $updates['location'] = $parent['location'];
                    }
                    if ($existing->google_maps_url === null && $parent['google_maps_url']) {
                        $updates['google_maps_url'] = $parent['google_maps_url'];
                    }
                    if ($existing->external_ticket_url === null && $parent['external_ticket_url']) {
                        $updates['external_ticket_url'] = $parent['external_ticket_url'];
                    }
                    if ($programTitle !== '' && mb_strtolower(trim((string) $existingNameEs)) === mb_strtolower(trim((string) $nameEs))) {
                        $updates['name'] = json_encode(['es' => $programTitle], JSON_UNESCAPED_UNICODE);
                    }
                    if ($programDesc !== null) {
                        $existingDescEs = '';
                        if (is_string($existing->description ?? null)) {
                            $decoded = json_decode((string) $existing->description, true);
                            $existingDescEs = is_array($decoded) ? (string) ($decoded['es'] ?? '') : '';
                        }
                        if (trim((string) $existingDescEs) === '') {
                            $updates['description'] = json_encode(['es' => $programDesc], JSON_UNESCAPED_UNICODE);
                        }
                    }
                    if (!empty($updates)) {
                        $updates['updated_at'] = now();
                        DB::table('events')->where('id', $subeventId)->update($updates);
                    }
                }

                if ($folderEvent && (string) $folderEvent['id'] !== $subeventId) {
                    $folderEventId = (string) $folderEvent['id'];
                    $folderTicketCount = (int) DB::table('event_ticket_types')->where('event_id', $folderEventId)->count();
                    $targetTicketCount = (int) DB::table('event_ticket_types')->where('event_id', $subeventId)->count();
                    if ($folderTicketCount > 0 && $targetTicketCount === 0) {
                        DB::table('event_ticket_types')->where('event_id', $folderEventId)->update(['event_id' => $subeventId, 'updated_at' => now()]);
                        DB::table('events')->where('id', $folderEventId)->update(['is_active' => false, 'updated_at' => now()]);
                    }
                }

                $existingTicketCount = (int) DB::table('event_ticket_types')->where('event_id', $subeventId)->count();
                if ($existingTicketCount > 0) {
                    continue;
                }

                foreach ($files as $idx => $filePath) {
                    $code = 'ticket' . ($idx + 1);
                    DB::table('event_ticket_types')->insert([
                        'id' => (string) Str::uuid(),
                        'event_id' => $subeventId,
                        'code' => $code,
                        'price' => 0,
                        'stock' => 0,
                        'is_active' => true,
                        'image_path' => $filePath,
                        'description' => null,
                        'legal_terms' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $createdTicketTypes++;
                }
            }
        }
    });

    $this->info("Subeventos creados: {$createdSubevents}");
    $this->info("Tipos de ticket creados: {$createdTicketTypes}");
})->purpose('Restaurar subeventos y ticket types desde carpetas de imágenes en Storage (solo inserta, no borra).');

Artisan::command('bweek:export-events-csv-template {--path=imports/bweek_events_template.csv}', function () {
    $path = (string) $this->option('path');
    $path = ltrim($path, '/\\');
    $dir = trim(str_replace('\\', '/', dirname($path)));
    if ($dir !== '' && $dir !== '.') {
        Storage::disk('local')->makeDirectory($dir);
    }

    $exportRow = function (array $row) {
        $fp = fopen('php://temp', 'w+');
        fputcsv($fp, $row);
        rewind($fp);
        $csv = stream_get_contents($fp);
        fclose($fp);
        return $csv;
    };

    $header = [
        'record_type',
        'id',
        'parent_event_id',
        'event_id',
        'day_date',
        'start_time',
        'end_time',
        'sort_order',
        'is_active',
        'capacity',
        'name_es',
        'description_es',
        'location_es',
        'address',
        'google_maps_url',
        'external_ticket_url',
        'media_folder',
        'disabled_days_json',
        'ticket_code',
        'ticket_price',
        'ticket_stock',
        'ticket_external_purchase_url',
        'ticket_image_path',
        'ticket_description',
        'ticket_legal_terms',
        'program_title',
        'program_description',
        'program_flyer_path',
    ];

    $out = '';
    $out .= $exportRow($header);

    $toEs = function ($json) {
        if (is_array($json)) {
            return (string) ($json['es'] ?? ($json['en'] ?? ''));
        }
        if (is_string($json)) {
            $decoded = json_decode($json, true);
            if (is_array($decoded)) {
                return (string) ($decoded['es'] ?? ($decoded['en'] ?? ''));
            }
        }
        return '';
    };

    $parents = \App\Models\Event::query()
        ->whereNull('parent_event_id')
        ->with([
            'programItems' => fn ($q) => $q->orderBy('day_date')->orderBy('sort_order'),
            'subevents' => fn ($q) => $q->orderBy('event_date')->orderBy('sort_order'),
            'ticketTypes' => fn ($q) => $q->orderBy('code'),
            'subevents.ticketTypes' => fn ($q) => $q->orderBy('code'),
        ])
        ->orderBy('start_at')
        ->get();

    foreach ($parents as $event) {
        $out .= $exportRow([
            'EVENT',
            $event->id,
            '',
            '',
            optional($event->event_date)->format('Y-m-d'),
            optional($event->start_at)->format('H:i'),
            optional($event->end_at)->format('H:i'),
            $event->sort_order ?? 0,
            $event->is_active ? 1 : 0,
            $event->capacity ?? '',
            $toEs($event->name),
            $toEs($event->description),
            $toEs($event->location),
            $event->address ?? '',
            $event->google_maps_url ?? '',
            $event->external_ticket_url ?? '',
            $event->media_folder ?? '',
            $event->disabled_days ? json_encode($event->disabled_days, JSON_UNESCAPED_UNICODE) : '[]',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
        ]);

        foreach ($event->programItems as $pi) {
            $out .= $exportRow([
                'PROGRAM_ITEM',
                $pi->id,
                '',
                $event->id,
                $pi->day_date?->format('Y-m-d'),
                $pi->start_time ? substr((string) $pi->start_time, 0, 5) : '',
                $pi->end_time ? substr((string) $pi->end_time, 0, 5) : '',
                $pi->sort_order ?? 0,
                1,
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                $pi->title ?? '',
                $pi->description ?? '',
                $pi->flyer_path ?? '',
            ]);
        }

        foreach ($event->subevents as $sub) {
            $day = $sub->event_date ? $sub->event_date->format('Y-m-d') : optional($sub->start_at)->format('Y-m-d');
            $out .= $exportRow([
                'SUBEVENT',
                $sub->id,
                $event->id,
                '',
                $day ?? '',
                optional($sub->start_at)->format('H:i'),
                optional($sub->end_at)->format('H:i'),
                $sub->sort_order ?? 0,
                $sub->is_active ? 1 : 0,
                $sub->capacity ?? '',
                $toEs($sub->name),
                $toEs($sub->description),
                $toEs($sub->location),
                $sub->address ?? '',
                $sub->google_maps_url ?? '',
                $sub->external_ticket_url ?? '',
                $sub->media_folder ?? '',
                $sub->disabled_days ? json_encode($sub->disabled_days, JSON_UNESCAPED_UNICODE) : '[]',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
            ]);

            foreach ($sub->ticketTypes as $tt) {
                $out .= $exportRow([
                    'TICKET_TYPE',
                    $tt->id,
                    '',
                    $sub->id,
                    '',
                    '',
                    '',
                    0,
                    $tt->is_active ? 1 : 0,
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    $tt->code ?? '',
                    (string) ($tt->price ?? 0),
                    (string) ($tt->stock ?? 0),
                    $tt->external_purchase_url ?? '',
                    $tt->image_path ?? '',
                    $tt->description ?? '',
                    $tt->legal_terms ?? '',
                    '',
                    '',
                    '',
                ]);
            }
        }

        foreach ($event->ticketTypes as $tt) {
            $out .= $exportRow([
                'TICKET_TYPE',
                $tt->id,
                '',
                $event->id,
                '',
                '',
                '',
                0,
                $tt->is_active ? 1 : 0,
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                $tt->code ?? '',
                (string) ($tt->price ?? 0),
                (string) ($tt->stock ?? 0),
                $tt->external_purchase_url ?? '',
                $tt->image_path ?? '',
                $tt->description ?? '',
                $tt->legal_terms ?? '',
                '',
                '',
                '',
            ]);
        }
    }

    $ok = Storage::disk('local')->put($path, $out);
    if (!$ok) {
        $this->error("No se pudo escribir: storage/app/{$path}");
        return 1;
    }
    $this->info('CSV generado: ' . Storage::disk('local')->path($path));
    return 0;
})->purpose('Exportar plantilla CSV (eventos/días/subeventos/tickets) para rellenar y reimportar');

Artisan::command('bweek:import-events-csv {path}', function (string $path) {
    $fullPath = $path;
    if (!str_contains($fullPath, ':\\') && !str_starts_with($fullPath, '/') && !str_starts_with($fullPath, '\\')) {
        $fullPath = storage_path('app/' . ltrim($fullPath, '/\\'));
    }

    if (!is_file($fullPath)) {
        $this->error("No existe el archivo: {$fullPath}");
        return 1;
    }

    $fp = fopen($fullPath, 'r');
    if (!$fp) {
        $this->error("No se pudo abrir: {$fullPath}");
        return 1;
    }

    $header = fgetcsv($fp);
    if (!$header || !is_array($header)) {
        fclose($fp);
        $this->error('CSV inválido (sin header)');
        return 1;
    }

    $idx = array_flip($header);
    $get = function (array $row, string $col) use ($idx) {
        $i = $idx[$col] ?? null;
        if ($i === null) return null;
        return array_key_exists($i, $row) ? $row[$i] : null;
    };

    $toBool = fn ($v) => in_array((string) $v, ['1', 'true', 'TRUE', 'yes', 'YES', 'si', 'SI'], true);
    $toInt = fn ($v, $def = 0) => is_numeric($v) ? (int) $v : $def;
    $toDec = fn ($v, $def = '0.00') => is_numeric($v) ? (string) $v : (string) $def;
    $toJsonEs = fn ($v) => json_encode(['es' => (string) $v], JSON_UNESCAPED_UNICODE);

    $count = ['EVENT' => 0, 'SUBEVENT' => 0, 'PROGRAM_ITEM' => 0, 'TICKET_TYPE' => 0];

    DB::transaction(function () use ($fp, $get, $toBool, $toInt, $toDec, $toJsonEs, &$count) {
        while (($row = fgetcsv($fp)) !== false) {
            $type = strtoupper(trim((string) ($get($row, 'record_type') ?? '')));
            if (!in_array($type, ['EVENT', 'SUBEVENT', 'PROGRAM_ITEM', 'TICKET_TYPE'], true)) {
                continue;
            }

            if ($type === 'EVENT' || $type === 'SUBEVENT') {
                $id = trim((string) ($get($row, 'id') ?? ''));
                if ($id === '') {
                    continue;
                }

                $parentEventId = trim((string) ($get($row, 'parent_event_id') ?? '')) ?: null;
                $dayDate = trim((string) ($get($row, 'day_date') ?? ''));
                $startHm = trim((string) ($get($row, 'start_time') ?? ''));
                $endHm = trim((string) ($get($row, 'end_time') ?? ''));

                $eventDate = $dayDate !== '' ? Carbon::createFromFormat('Y-m-d', $dayDate)->setTime(12, 0, 0) : now()->copy()->setTime(12, 0, 0);
                $startAt = ($dayDate !== '' && $startHm !== '') ? Carbon::createFromFormat('Y-m-d H:i', "{$dayDate} {$startHm}") : null;
                $endAt = ($dayDate !== '' && $endHm !== '') ? Carbon::createFromFormat('Y-m-d H:i', "{$dayDate} {$endHm}") : null;
                if ($startAt && $endAt && $endAt->lessThan($startAt)) {
                    $endAt = $endAt->copy()->addDay();
                }

                $disabledJson = trim((string) ($get($row, 'disabled_days_json') ?? ''));
                $disabled = [];
                if ($disabledJson !== '') {
                    $decoded = json_decode($disabledJson, true);
                    if (is_array($decoded)) {
                        $disabled = $decoded;
                    }
                }

                DB::table('events')->updateOrInsert(
                    ['id' => $id],
                    [
                        'parent_event_id' => $parentEventId,
                        'name' => $toJsonEs((string) ($get($row, 'name_es') ?? '')),
                        'description' => $toJsonEs((string) ($get($row, 'description_es') ?? '')),
                        'event_date' => $eventDate,
                        'start_at' => $startAt,
                        'end_at' => $endAt,
                        'location' => $toJsonEs((string) ($get($row, 'location_es') ?? '')),
                        'address' => (string) ($get($row, 'address') ?? ''),
                        'google_maps_url' => (string) ($get($row, 'google_maps_url') ?? '') ?: null,
                        'external_ticket_url' => (string) ($get($row, 'external_ticket_url') ?? '') ?: null,
                        'sort_order' => $toInt($get($row, 'sort_order'), 0),
                        'media_folder' => (string) ($get($row, 'media_folder') ?? '') ?: null,
                        'disabled_days' => json_encode($disabled, JSON_UNESCAPED_UNICODE),
                        'capacity' => ($get($row, 'capacity') ?? '') !== '' ? $toInt($get($row, 'capacity'), 0) : null,
                        'is_active' => $toBool($get($row, 'is_active')) ? 1 : 0,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );

                $count[$type]++;
                continue;
            }

            if ($type === 'PROGRAM_ITEM') {
                $id = trim((string) ($get($row, 'id') ?? ''));
                $eventId = trim((string) ($get($row, 'event_id') ?? ''));
                $dayDate = trim((string) ($get($row, 'day_date') ?? ''));
                $title = (string) ($get($row, 'program_title') ?? '');
                if ($id === '' || $eventId === '' || $dayDate === '' || trim($title) === '') {
                    continue;
                }

                $startHm = trim((string) ($get($row, 'start_time') ?? ''));
                $endHm = trim((string) ($get($row, 'end_time') ?? ''));

                DB::table('event_program_items')->updateOrInsert(
                    ['id' => $id],
                    [
                        'event_id' => $eventId,
                        'day_date' => $dayDate,
                        'start_time' => $startHm !== '' ? "{$startHm}:00" : null,
                        'end_time' => $endHm !== '' ? "{$endHm}:00" : null,
                        'title' => $title,
                        'description' => (string) ($get($row, 'program_description') ?? '') ?: null,
                        'flyer_path' => (string) ($get($row, 'program_flyer_path') ?? '') ?: null,
                        'sort_order' => $toInt($get($row, 'sort_order'), 0),
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );

                $count[$type]++;
                continue;
            }

            if ($type === 'TICKET_TYPE') {
                $id = trim((string) ($get($row, 'id') ?? ''));
                $eventId = trim((string) ($get($row, 'event_id') ?? ''));
                $code = trim((string) ($get($row, 'ticket_code') ?? ''));
                if ($id === '' || $eventId === '' || $code === '') {
                    continue;
                }

                DB::table('event_ticket_types')->updateOrInsert(
                    ['id' => $id],
                    [
                        'event_id' => $eventId,
                        'code' => $code,
                        'price' => $toDec($get($row, 'ticket_price'), '0.00'),
                        'stock' => $toInt($get($row, 'ticket_stock'), 0),
                        'is_active' => $toBool($get($row, 'is_active')) ? 1 : 0,
                        'external_purchase_url' => (string) ($get($row, 'ticket_external_purchase_url') ?? '') ?: null,
                        'image_path' => (string) ($get($row, 'ticket_image_path') ?? '') ?: null,
                        'description' => (string) ($get($row, 'ticket_description') ?? '') ?: null,
                        'legal_terms' => (string) ($get($row, 'ticket_legal_terms') ?? '') ?: null,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );

                $count[$type]++;
                continue;
            }
        }
    });

    fclose($fp);

    foreach ($count as $k => $v) {
        $this->info("Importados {$k}: {$v}");
    }
    return 0;
})->purpose('Importar CSV de eventos/días/subeventos/tickets (solo upsert, nunca borra)');

Schedule::command('payments:expire-pending')->everyMinute()->withoutOverlapping();
