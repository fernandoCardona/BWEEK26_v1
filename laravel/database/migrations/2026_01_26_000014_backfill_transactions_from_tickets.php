<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        $rows = DB::table('tickets')
            ->select(['user_id', 'purchased_at'])
            ->whereNotNull('user_id')
            ->whereNull('transaction_id')
            ->whereNotNull('purchased_at')
            ->distinct()
            ->orderBy('purchased_at')
            ->get();

        foreach ($rows as $row) {
            $ticketIds = DB::table('tickets')
                ->where('user_id', $row->user_id)
                ->whereNull('transaction_id')
                ->where('purchased_at', $row->purchased_at)
                ->pluck('id');

            if ($ticketIds->isEmpty()) {
                continue;
            }

            $total = DB::table('tickets')
                ->whereIn('id', $ticketIds)
                ->sum('price');

            $transactionId = (string) Str::uuid();
            DB::table('transactions')->insert([
                'id' => $transactionId,
                'user_id' => $row->user_id,
                'type' => 'ticket',
                'status' => 'completed',
                'currency' => 'EUR',
                'total_amount' => $total,
                'meta' => json_encode(['source' => 'backfill:tickets']),
                'created_at' => $row->purchased_at,
                'updated_at' => $row->purchased_at,
            ]);

            DB::table('tickets')->whereIn('id', $ticketIds)->update([
                'transaction_id' => $transactionId,
                'updated_at' => now(),
            ]);

            $tickets = DB::table('tickets')
                ->select(['id', 'event_id', 'ticket_type', 'price', 'purchased_at'])
                ->whereIn('id', $ticketIds)
                ->get();

            $now = now();
            $items = [];
            foreach ($tickets as $t) {
                $items[] = [
                    'id' => (string) Str::uuid(),
                    'transaction_id' => $transactionId,
                    'kind' => 'ticket',
                    'ticket_id' => $t->id,
                    'product_id' => null,
                    'title' => $t->ticket_type,
                    'quantity' => 1,
                    'unit_price' => $t->price,
                    'total_price' => $t->price,
                    'meta' => json_encode(['event_id' => $t->event_id]),
                    'created_at' => $t->purchased_at ?? $now,
                    'updated_at' => $t->purchased_at ?? $now,
                ];
            }

            if (count($items) > 0) {
                DB::table('transaction_items')->insert($items);
            }
        }
    }

    public function down(): void
    {
        $ids = DB::table('transactions')
            ->where('meta', 'like', '%backfill:tickets%')
            ->pluck('id');

        if ($ids->isNotEmpty()) {
            DB::table('transaction_items')->whereIn('transaction_id', $ids)->delete();
            DB::table('transactions')->whereIn('id', $ids)->delete();
        }
    }
};
