<?php

namespace App\Console\Commands;

use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class SyncBearsSitgesWeek2026 extends Command
{
    protected $signature = 'events:sync-bears-sitges-week-2026 {--dry-run : No escribe en BD}';

    protected $description = 'Sincroniza el programa oficial (subeventos) de BEARS SITGES WEEK 2026';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $event = Event::query()
            ->where('parent_event_id', null)
            ->where(function ($q) {
                $q->where('name->es', 'BEARS SITGES WEEK 2026')
                    ->orWhere('name->en', 'BEARS SITGES WEEK 2026');
            })
            ->first();

        if (!$event) {
            $this->error('No se encontró el evento principal: BEARS SITGES WEEK 2026');
            return 1;
        }

        $locale = 'es';

        if (!$event->media_folder) {
            $name = (string) ($event->name[$locale] ?? ($event->name['es'] ?? ($event->name['en'] ?? $event->id)));
            $shortId = substr((string) $event->id, 0, 8);
            $event->media_folder = 'images/events/' . Str::slug($name) . '-' . $shortId;
            if (!$dryRun) {
                $event->save();
            }
        }

        $eventStart = Carbon::createFromFormat('Y-m-d H:i', '2026-09-04 00:00');
        $eventEnd = Carbon::createFromFormat('Y-m-d H:i', '2026-09-14 23:58');
        if ($dryRun) {
            $this->line('UPDATE evento principal: start_at=2026-09-04 00:00, end_at=2026-09-14 23:58');
        } else {
            $event->start_at = $eventStart;
            $event->end_at = $eventEnd;
            $event->event_date = $eventStart->copy()->setTime(12, 0, 0);
            $event->save();
        }

        $itemsByDay = $this->programDefinition();

        $all = Event::query()->where('parent_event_id', $event->id)->get();

        $grouped = $all->groupBy(function (Event $s) use ($locale) {
            $ymd = optional($s->event_date)->format('Y-m-d') ?? '';
            $name = $s->name[$locale] ?? ($s->name['es'] ?? ($s->name['en'] ?? ''));
            return $this->makeKey($ymd, (string) $name);
        });

        $dedupDeleted = 0;
        $kept = collect();
        foreach ($grouped as $key => $group) {
            $candidates = $group->filter(fn (Event $x) => $x->id !== null);
            if ($candidates->count() <= 1) {
                $kept = $kept->merge($candidates);
                continue;
            }
            $sorted = $candidates->sortBy(fn (Event $x) => (string) $x->created_at)->values();
            $keep = $sorted->first();
            $kept = $kept->merge([$keep]);

            $dups = $sorted->slice(1);
            if (!$dryRun) {
                foreach ($dups as $d) {
                    $d->delete();
                    $dedupDeleted++;
                }
            }
        }

        $existing = $kept->mapWithKeys(function (Event $s) use ($locale) {
            $ymd = optional($s->event_date)->format('Y-m-d') ?? '';
            $name = $s->name[$locale] ?? ($s->name['es'] ?? ($s->name['en'] ?? ''));
            $key = $this->makeKey($ymd, (string) $name);
            return [$key => $s];
        });

        $created = 0;
        $updated = 0;
        $deleted = 0;

        foreach ($itemsByDay as $ymd => $items) {
            $order = 0;
            foreach ($items as $item) {
                $order++;
                $name = $this->cleanText((string) ($item['name'] ?? ''));
                if ($name === '') {
                    continue;
                }
                $slug = Str::slug(mb_strtolower($name));

                $description = $this->cleanText((string) ($item['description'] ?? ''));
                $location = $this->cleanText((string) ($item['location'] ?? ''));
                $address = $this->cleanText((string) ($item['address'] ?? ''));
                $googleMaps = $this->cleanText((string) ($item['google_maps_url'] ?? ''));
                $external = $this->cleanText((string) ($item['external_ticket_url'] ?? ''));

                [$startAt, $endAt] = $this->buildDateTimes($ymd, $item['start'] ?? null, $item['end'] ?? null);

                $key = $this->makeKey($ymd, $name);
                $sub = $existing->get($key);
                $isNew = !$sub;
                if (!$sub) {
                    $sub = new Event();
                }

                $sub->fill([
                    'parent_event_id' => $event->id,
                    'name' => [$locale => $name],
                    'description' => [$locale => $description],
                    'event_date' => Carbon::createFromFormat('Y-m-d H:i', "{$ymd} 12:00"),
                    'start_at' => $startAt,
                    'end_at' => $endAt,
                    'location' => [$locale => $location !== '' ? $location : ($event->location[$locale] ?? ($event->location['es'] ?? ''))],
                    'address' => $address !== '' ? $address : $event->address,
                    'google_maps_url' => $googleMaps !== '' ? $googleMaps : null,
                    'external_ticket_url' => $external !== '' ? $external : null,
                    'sort_order' => $order,
                    'is_active' => true,
                ]);

                if ($dryRun) {
                    $this->line((!$isNew ? 'UPDATE ' : 'CREATE ') . "{$ymd} #{$order} {$name}");
                    continue;
                }

                $sub->save();
                if (!$sub->media_folder) {
                    $subShort = substr((string) $sub->id, 0, 8);
                    $subFolderName = $slug . '-' . $subShort;
                    $sub->media_folder = $event->media_folder . '/subevents/' . $subFolderName;
                    $sub->save();
                }
                $existing->put($key, $sub);

                if ($isNew) {
                    $created++;
                } else {
                    $updated++;
                }
            }
        }

        if (!$dryRun) {
            $deleted = $dedupDeleted;
        }

        if (!$dryRun) {
            $this->info("OK. Creados: {$created}. Actualizados: {$updated}. Eliminados duplicados: {$deleted}.");
        }

        return 0;
    }

    private function makeKey(string $ymd, string $name): string
    {
        return "{$ymd}::" . Str::slug(mb_strtolower($name));
    }

    private function cleanText(string $v): string
    {
        $v = trim(preg_replace('/\s+/u', ' ', $v) ?? '');
        $v = str_replace('(Esto es un sub Evento asociado a este evento asi que debemos crearlo tambien como subevento)', '', $v);
        $v = trim(preg_replace('/\s+/u', ' ', $v) ?? '');
        return $v;
    }

    private function buildDateTimes(string $ymd, ?string $start, ?string $end): array
    {
        $startAt = null;
        $endAt = null;

        $start = $start ? trim($start) : '';
        $end = $end ? trim($end) : '';

        if ($start !== '') {
            $startAt = Carbon::createFromFormat('Y-m-d H:i', "{$ymd} {$start}");
        }
        if ($end !== '') {
            $endAt = Carbon::createFromFormat('Y-m-d H:i', "{$ymd} {$end}");
        }
        if ($startAt && $endAt && $endAt->lessThan($startAt)) {
            $endAt = $endAt->copy()->addDay();
        }

        return [$startAt, $endAt];
    }

    private function programDefinition(): array
    {
        return [
            '2026-09-05' => [
                ['start' => '20:00', 'name' => 'INAUGURACIÓN BEARS SITGES WEEK 2026', 'description' => 'Brindaremos con Cava y Aperitivo. Hotel Calipolis. Entrada Libre.'],
                [
                    'start' => '22:00',
                    'name' => 'Ruta del OSO en «Bares Sponsors»',
                    'description' => 'Bears Bar – Bears Dance Bar – Moulin Rose Sitges – Runway Terrace – Industry Sitges – Chiringuito Iguana – Parrots Terrace Pub. Encontrarás tickets con 50% descuento para algunos bares en el «PACK BEARS SITGES».',
                ],
                [
                    'start' => '01:00',
                    'end' => '06:00',
                    'name' => 'WELCOME BEARS en «BEARS DISCO» by Scandal',
                    'external_ticket_url' => 'https://scandalsitges.com',
                ],
                ['name' => 'ATENCIÓN: Rogamos que sea respetado el descanso de los vecinos – GRACIAS'],
            ],
            '2026-09-06' => [
                ['name' => 'Osos en la Playa', 'description' => 'Recomendamos: Playa Gay Bassa Rodona (Pique Nique Chillout) – Playa Balmins (Chiringuito La Caleta) o Playa de la Fragata (Chiringuito Iguana).'],
                ['name' => 'Descubre Sitges', 'description' => 'Visita los diferentes Museos de Sitges y el Patrimonio Cultural y Arquitectónico de la Vila. «Te va a enamorar».'],
                ['start' => '14:00', 'name' => 'BBQ & Music – POP-Air en Restaurant LE PATIO', 'description' => 'Tickets a la venta en el enlace indicado.'],
                [
                    'start' => '19:00',
                    'name' => 'Inauguración + Vernissage Exposición «MALE BEAUTY» por Blanca de Nicolas',
                    'description' => 'Entrada Gratuita, brindis incluido. Galería Bnude Art, c/. Sant Pere, 26 – Sitges.',
                ],
                [
                    'start' => '22:00',
                    'name' => 'Ruta del OSO en «Bares Sponsors»',
                    'description' => 'Bears Bar – Bears Dance Bar – Moulin Rose Sitges – Runway Terrace – Industry Sitges – Chiringuito Iguana. Encontrarás tickets con 50% descuento para algunos bares en el «PACK BEARS SITGES».',
                ],
                ['start' => '23:00', 'name' => 'Fiesta «100% BEARS» en Bears Bar'],
                ['start' => '01:00', 'end' => '06:00', 'name' => 'DISCO POP en «BEARS DISCO» by Scandal', 'external_ticket_url' => 'https://scandalsitges.com'],
                ['name' => 'ATENCIÓN: Rogamos que sea respetado el descanso de los vecinos – GRACIAS'],
            ],
            '2026-09-07' => [
                ['name' => 'Osos en la Playa', 'description' => 'Recomendamos: Playa Gay Bassa Rodona (Pique Nique Chillout) – Playa Balmins (Chiringuito La Caleta) o Playa de la Fragata (Chiringuito Iguana).'],
                ['name' => 'Descubre Sitges', 'description' => 'Visita los diferentes Museos de Sitges y el Patrimonio Cultural y Arquitectónico de la Vila. «Te va a enamorar».'],
                ['start' => '16:00', 'name' => 'Tarde de Osos en Sauna Sitges', 'description' => 'Encontrarás tickets con descuentos diarios en el «PACK BEARS SITGES».'],
                [
                    'start' => '22:00',
                    'name' => 'Ruta del OSO en «Bares Sponsors»',
                    'description' => 'Bears Bar – Bears Dance Bar – Moulin Rose Sitges – Runway Terrace – Industry Sitges – Chiringuito Iguana. Encontrarás tickets con 50% descuento para algunos bares en el «PACK BEARS SITGES».',
                ],
                ['start' => '01:00', 'end' => '06:00', 'name' => 'JUNGLE NIGHT PARTY en «BEARS DISCO» by Scandal', 'external_ticket_url' => 'https://scandalsitges.com'],
                ['name' => 'ATENCIÓN: Rogamos que sea respetado el descanso de los vecinos – GRACIAS'],
            ],
            '2026-09-08' => [
                [
                    'name' => 'NOTA',
                    'description' => 'Las actividades oficiales y recomendadas por «La Organización» son las que aparecen en este «Programa Oficial». Para algunas actividades, tienes que comprar el ticket al sponsor que la organiza.',
                ],
                ['name' => 'Osos en la Playa', 'description' => 'Recomendamos: Playa Gay Bassa Rodona (Pique Nique Chillout) – Playa Balmins (Chiringuito La Caleta) o Playa de la Fragata (Chiringuito Iguana).'],
                ['name' => 'Descubre Sitges', 'description' => 'Recomendamos descubrir el Patrimonio Cultural y Arquitectónico de la Vila. «Te va a enamorar».'],
                ['start' => '16:00', 'name' => 'Tarde de OSOS en Sauna Sitges', 'description' => 'Tickets descuentos incluidos en el PACK BEARS SITGES.'],
                ['start' => '16:30', 'end' => '21:00', 'name' => 'Apertura BEARS SITGES MARKET en Hotel Calipolis'],
                [
                    'start' => '18:00',
                    'end' => '21:00',
                    'name' => 'Entrega de BEARS SITGES PACKS y venta de CAMISETA OFICIAL',
                    'description' => 'En Bears Sitges Market del Hotel Calipolis. Los packs se entregarán exclusivamente en los horarios, días y lugar indicados en este programa.',
                ],
                [
                    'start' => '22:00',
                    'name' => 'Ruta del OSO en «Bares Sponsors»',
                    'description' => 'Bear-Village – Bears Bar – Bears Dance Bar – Moulin Rose Sitges – Runway Terrace – Industry Sitges – Chiringuito Iguana. Encontrarás tickets con 50% descuento para algunos bares en el «PACK BEARS SITGES».',
                ],
                [
                    'start' => '21:00',
                    'end' => '03:00',
                    'name' => 'Noche Especial BIENVENIDA en Bear-Village con DJ BEAROSOL',
                    'description' => 'Entrada Libre. Tickets para la ZONA VIP del Bear-Village en www.bearsevents.com',
                    'external_ticket_url' => 'https://www.bearsevents.com',
                ],
                ['start' => '01:00', 'end' => '06:00', 'name' => '«Opening Night Village» After Party en «BEARS DISCO» by Scandal', 'external_ticket_url' => 'https://scandalsitges.com'],
                ['name' => 'ATENCIÓN: Rogamos que sea respetado el descanso de los vecinos – GRACIAS'],
            ],
            '2026-09-09' => [
                ['start' => '10:00', 'end' => '13:30', 'name' => 'BEARS SITGES MARKET en Hotel Calipolis'],
                [
                    'start' => '11:30',
                    'name' => 'Excursion to PLAYA DEL MUERTO',
                    'description' => 'PRAGUE BEARS organizan la excursión tradicional. Punto de encuentro: 11:30 en la zona BEAR-MARKET del Hotel Calipolis.',
                ],
                ['start' => '16:00', 'name' => 'Tarde de OSOS en Sauna Sitges', 'description' => 'Tickets descuentos incluidos en el PACK BEARS SITGES.'],
                [
                    'start' => '18:00',
                    'end' => '21:00',
                    'name' => 'Entrega de BEARS SITGES PACKS y venta de CAMISETA OFICIAL',
                    'description' => 'En Bears Sitges Market del Hotel Calipolis.',
                ],
                [
                    'start' => '19:00',
                    'name' => 'Meet & Greet: brindis conjunto en Hotel Calipolis',
                    'description' => 'Hotel Calipolis invita a Mr. Bears y Vice Mr. Bears y organizaciones BEARS.',
                ],
                [
                    'start' => '22:00',
                    'name' => 'Ruta del OSO en «Bares Sponsors»',
                    'description' => 'Bear-Village – Bears Bar – Bears Dance Bar – Moulin Rose Sitges – Runway Terrace – Industry Sitges – Chiringuito Iguana. Encontrarás tickets con 50% descuento para algunos bares en el «PACK BEARS SITGES».',
                ],
                [
                    'start' => '21:00',
                    'end' => '03:00',
                    'name' => 'Especial NOCHE BLANCA con PRAGUE BEARS en Bear-Village (DJ PAW.L)',
                    'description' => 'Entrada Libre. Tickets VIP en www.bearsevents.com. Ven vestido de blanco.',
                    'external_ticket_url' => 'https://www.bearsevents.com',
                ],
                ['start' => '01:00', 'end' => '06:00', 'name' => 'FIESTA BLANCA en «BEARS DISCO» by Scandal', 'external_ticket_url' => 'https://scandalsitges.com'],
                ['name' => 'ATENCIÓN: Rogamos que sea respetado el descanso de los vecinos – GRACIAS'],
            ],
            '2026-09-10' => [
                ['start' => '10:00', 'end' => '13:30', 'name' => 'BEARS SITGES MARKET en Hotel Calipolis'],
                ['start' => '16:00', 'name' => 'THE BEAR BOAT', 'description' => 'Click en la imagen para + info y tickets.'],
                ['start' => '16:00', 'name' => 'Tarde de OSOS en Sauna Sitges', 'description' => 'Tickets descuentos incluidos en el PACK BEARS SITGES.'],
                ['start' => '16:30', 'end' => '21:00', 'name' => 'BEARS SITGES MARKET en Hotel Calipolis'],
                [
                    'start' => '18:00',
                    'end' => '21:00',
                    'name' => 'Entrega de BEARS SITGES PACKS y venta de CAMISETA OFICIAL',
                    'description' => 'En Bears Sitges Market del Hotel Calipolis.',
                ],
                [
                    'start' => '22:00',
                    'name' => 'Ruta del OSO en «Bares Sponsors»',
                    'description' => 'Bear-Village – Bears Bar – Bears Dance Bar – Moulin Rose Sitges – Runway Terrace – Industry Sitges – Chiringuito Iguana. Encontrarás tickets con 50% descuento para algunos bares en el «PACK BEARS SITGES».',
                ],
                [
                    'start' => '21:00',
                    'end' => '03:00',
                    'name' => 'NOCHE ESPECIAL «IBC Palm Springs» en Bear-Village (DJ Radio CHÍ)',
                    'description' => 'Entrada Libre. Tickets VIP en www.bearsevents.com.',
                    'external_ticket_url' => 'https://www.bearsevents.com',
                ],
                ['start' => '01:00', 'end' => '06:00', 'name' => '«Beef Mince» Party en «BEARS DISCO» by Scandal', 'external_ticket_url' => 'https://scandalsitges.com'],
                ['name' => 'ATENCIÓN: Rogamos que sea respetado el descanso de los vecinos – GRACIAS'],
            ],
            '2026-09-11' => [
                ['start' => '10:00', 'end' => '13:30', 'name' => 'BEARS SITGES MARKET en Hotel Calipolis'],
                ['name' => 'Osos en la Playa', 'description' => 'Recomendamos: Playa Gay Bassa Rodona (Pique Nique Chillout) – Playa Balmins (Chiringuito La Caleta) o Playa de la Fragata (Chiringuito Iguana).'],
                [
                    'start' => '16:00',
                    'end' => '20:30',
                    'name' => 'BEAR TEA-DANCE en el RoofTop del Hotel MiM',
                    'description' => 'Plazas limitadas. Compra tu ticket en www.bearsevents.com',
                    'external_ticket_url' => 'https://www.bearsevents.com',
                ],
                ['start' => '16:30', 'end' => '21:00', 'name' => 'BEARS SITGES MARKET en Hotel Calipolis'],
                ['start' => '18:00', 'end' => '21:00', 'name' => 'Entrega de BEARS SITGES PACKS y venta de CAMISETA OFICIAL', 'description' => 'En Bears Sitges Market del Hotel Calipolis.'],
                [
                    'start' => '22:00',
                    'name' => 'Ruta del OSO en «Bares Sponsors»',
                    'description' => 'Bear-Village – Bears Bar – Bears Dance Bar – Moulin Rose Sitges – Runway Terrace – Industry Sitges – Chiringuito Iguana. Encontrarás tickets con 50% descuento para algunos bares en el «PACK BEARS SITGES».',
                ],
                [
                    'start' => '21:00',
                    'end' => '03:00',
                    'name' => 'BEARS on CRUISE Special Night at Bear-Village (DJ JAMES MUNICH)',
                    'description' => 'Entrada Libre. Tickets para la ZONA VIP en www.bearsevents.com',
                    'external_ticket_url' => 'https://www.bearsevents.com',
                ],
                ['start' => '01:00', 'end' => '06:00', 'name' => 'SAILOR Party en «BEARS DISCO» by Scandal', 'external_ticket_url' => 'https://scandalsitges.com'],
                ['name' => 'ATENCIÓN: Rogamos que sea respetado el descanso de los vecinos – GRACIAS'],
            ],
            '2026-09-12' => [
                ['start' => '10:00', 'end' => '13:30', 'name' => 'BEARS SITGES MARKET en Hotel Calipolis'],
                ['name' => 'BEAR POOL PARTY', 'description' => 'En una lujosa villa en las colinas de Sitges. Transporte en autobús. Compra tu ticket en el enlace indicado.'],
                ['start' => '16:30', 'end' => '21:00', 'name' => 'BEARS SITGES MARKET en Hotel Calipolis'],
                [
                    'start' => '20:00',
                    'name' => 'CENA OFICIAL 24º ANIVERSARIO BEARS SITGES en Hotel Calipolis',
                    'description' => 'Cóctel – Cena & Performance. Incluida en el PACK BEARS SITGES.',
                ],
                [
                    'start' => '21:30',
                    'end' => '03:30',
                    'name' => 'Noche Especial 24º anniBEARsary Bears Sitges en Bear-Village (DJ PERFECTO)',
                    'description' => 'Entrada Libre. Tickets VIP en www.bearsevents.com',
                    'external_ticket_url' => 'https://www.bearsevents.com',
                ],
                ['start' => '01:00', 'end' => '06:00', 'name' => '«24º anniBEARsary Bears Sitges» Party en «BEARS DISCO» by Scandal', 'external_ticket_url' => 'https://scandalsitges.com'],
                ['name' => 'ATENCIÓN: Rogamos que sea respetado el descanso de los vecinos – GRACIAS'],
            ],
            '2026-09-13' => [
                ['start' => '10:00', 'end' => '13:30', 'name' => 'BEARS SITGES MARKET en Hotel Calipolis'],
                ['start' => '14:00', 'name' => 'BBQ & Music – POP-Air en Restaurant LE PATIO', 'description' => 'Tickets a la venta en el enlace indicado.'],
                ['start' => '16:30', 'end' => '21:00', 'name' => 'BEARS SITGES MARKET en Hotel Calipolis'],
                [
                    'start' => '21:00',
                    'end' => '03:30',
                    'name' => 'Special Night Mr. BEAR SITGES 2026 en Bear-Village (DJ Radio Chi)',
                    'description' => 'Entrada Libre. Tickets VIP en www.bearsevents.com. El concurso empieza a las 23:00.',
                    'external_ticket_url' => 'https://www.bearsevents.com',
                ],
                ['start' => '01:00', 'end' => '06:00', 'name' => 'Mr. Bears Sitges 2026 «THE PARTY» en «BEARS DISCO» by Scandal', 'external_ticket_url' => 'https://scandalsitges.com'],
                ['name' => 'ATENCIÓN: Rogamos que sea respetado el descanso de los vecinos – GRACIAS'],
            ],
            '2026-09-14' => [
                ['start' => '10:00', 'end' => '13:30', 'name' => 'BEARS SITGES MARKET en Hotel Calipolis', 'description' => 'Últimas horas.'],
                ['start' => '13:00', 'name' => 'Sitges Drag Brunch', 'description' => 'Pronto actualización fecha y tickets a la venta en www.bearsevents.com', 'external_ticket_url' => 'https://www.bearsevents.com'],
                ['start' => '16:00', 'name' => 'Tarde de OSOS en Sauna Sitges', 'description' => 'Tickets descuentos incluidos en el PACK BEARS SITGES.'],
                [
                    'start' => '22:00',
                    'name' => 'Ruta del OSO en «Bares Sponsors»',
                    'description' => 'Bear-Village – Bears Bar – Bears Dance Bar – Moulin Rose Sitges – Runway Terrace – Industry Sitges – Chiringuito Iguana. Encontrarás tickets con 50% descuento para algunos bares en el «PACK BEARS SITGES».',
                ],
                [
                    'start' => '21:00',
                    'end' => '03:00',
                    'name' => 'NOCHE ESPECIAL DESPEDIDA en ROSA en Bear-Village (DJ PEASANT)',
                    'description' => 'Entrada Libre. Ven vestido con algo ROSA. Tickets VIP en www.bearsevents.com',
                    'external_ticket_url' => 'https://www.bearsevents.com',
                ],
                ['start' => '01:00', 'end' => '06:00', 'name' => '«FAREWELL PINK PARTY» en «BEARS DISCO» by Scandal', 'external_ticket_url' => 'https://scandalsitges.com'],
                ['name' => 'ATENCIÓN: Rogamos que sea respetado el descanso de los vecinos – GRACIAS'],
            ],
        ];
    }
}
