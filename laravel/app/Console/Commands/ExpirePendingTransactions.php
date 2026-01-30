<?php

namespace App\Console\Commands;

use App\Models\Transaction;
use App\Services\StockReservationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpirePendingTransactions extends Command
{
    protected $signature = 'payments:expire-pending {--minutes= : TTL de pending en minutos} {--limit=200 : Máximo a procesar por ejecución}';

    protected $description = 'Marca pending como failed si expira el TTL y libera reservas de stock';

    public function handle(): int
    {
        $minutes = (int) ($this->option('minutes') ?? 0);
        if ($minutes <= 0) {
            $minutes = (int) env('BSW_PENDING_TTL_MINUTES', 45);
        }

        $limit = (int) ($this->option('limit') ?? 200);
        if ($limit <= 0) {
            $limit = 200;
        }

        $cutoff = now()->subMinutes($minutes);

        $ids = Transaction::query()
            ->where('status', 'pending')
            ->where('created_at', '<', $cutoff)
            ->orderBy('created_at')
            ->limit($limit)
            ->pluck('id')
            ->values()
            ->all();

        if (empty($ids)) {
            return 0;
        }

        $expired = 0;
        foreach ($ids as $id) {
            $didExpire = DB::transaction(function () use ($id, $cutoff) {
                $tx = Transaction::query()->where('id', $id)->lockForUpdate()->first();
                if (!$tx) return false;
                if ((string) $tx->status !== 'pending') return false;
                if ($tx->created_at && $tx->created_at->gte($cutoff)) return false;

                $tx->update([
                    'status' => 'failed',
                    'meta' => array_merge($tx->meta ?? [], [
                        'failed_reason' => 'pending_timeout',
                        'expired_at' => now()->toISOString(),
                    ]),
                ]);

                try {
                    app(StockReservationService::class)->releaseStock($tx);
                } catch (\Throwable $e) {
                }

                return true;
            });

            if ($didExpire) {
                $expired++;
            }
        }

        $this->info("Expired pending: {$expired} (ttl={$minutes}m)");
        return 0;
    }
}

