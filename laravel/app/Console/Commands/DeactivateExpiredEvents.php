<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\EventTicketType;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeactivateExpiredEvents extends Command
{
    protected $signature = 'events:deactivate-expired {--dry-run : No escribe en BD}';

    protected $description = 'Desactiva eventos expirados (end_at < now) y sus tickets';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $expiredAnyEventIds = Event::query()
            ->whereNotNull('end_at')
            ->where('end_at', '<', now())
            ->where('is_active', true)
            ->pluck('id')
            ->values()
            ->all();

        $expiredMainIds = Event::query()
            ->whereNull('parent_event_id')
            ->whereNotNull('end_at')
            ->where('end_at', '<', now())
            ->where('is_active', true)
            ->pluck('id')
            ->values()
            ->all();

        $subIdsFromExpiredMain = [];
        if (!empty($expiredMainIds)) {
            $subIdsFromExpiredMain = Event::query()
                ->whereIn('parent_event_id', $expiredMainIds)
                ->pluck('id')
                ->values()
                ->all();
        }

        $eventIdsToDisable = array_values(array_unique(array_merge($expiredAnyEventIds, $subIdsFromExpiredMain)));

        if (empty($eventIdsToDisable)) {
            $this->info('No hay eventos expirados activos.');
            return 0;
        }

        $this->line('Eventos a desactivar: ' . count($eventIdsToDisable) . ' (incluye subeventos expirados).');

        if ($dryRun) {
            return 0;
        }

        DB::transaction(function () use ($eventIdsToDisable, $expiredMainIds) {
            Event::query()
                ->whereIn('id', $eventIdsToDisable)
                ->update(['is_active' => false]);

            EventTicketType::query()
                ->whereIn('event_id', $eventIdsToDisable)
                ->update(['is_active' => false]);

            Event::query()
                ->whereIn('id', $expiredMainIds)
                ->update(['external_ticket_url' => null]);
        });

        $this->info('Eventos expirados desactivados OK.');
        return 0;
    }
}
