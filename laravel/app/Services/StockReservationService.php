<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class StockReservationService
{
    public function reserveTickets(Transaction $tx, iterable $cartItems): void
    {
        DB::transaction(function () use ($tx, $cartItems) {
            $tx = Transaction::query()->where('id', $tx->id)->lockForUpdate()->first();
            if (!$tx) return;

            if (($tx->meta['reserved_tickets'] ?? null) !== null) {
                return;
            }

            $reservations = [];
            foreach ($cartItems as $item) {
                if (($item->kind ?? null) !== 'ticket') continue;
                if (!$item->event_ticket_type_id) continue;
                $qty = (int) ($item->quantity ?? 0);
                if ($qty <= 0) continue;

                $type = \App\Models\EventTicketType::query()->where('id', $item->event_ticket_type_id)->lockForUpdate()->first();
                if (!$type || !$type->is_active) {
                    abort(422, 'Ticket no disponible');
                }
                if ((int) $type->stock < $qty) {
                    abort(422, 'No hay stock suficiente de tickets');
                }

                $type->decrement('stock', $qty);
                $type->refresh();
                if ((int) $type->stock <= 0 && $type->is_active) {
                    $type->is_active = false;
                    $type->save();
                }

                $reservations[] = [
                    'event_ticket_type_id' => $type->id,
                    'quantity' => $qty,
                ];
            }

            $tx->update([
                'meta' => array_merge($tx->meta ?? [], [
                    'reserved_tickets' => $reservations,
                    'reserved_at' => now()->toISOString(),
                ]),
            ]);
        });
    }

    public function releaseTickets(Transaction $tx): void
    {
        DB::transaction(function () use ($tx) {
            $tx = Transaction::query()->where('id', $tx->id)->lockForUpdate()->first();
            if (!$tx) return;

            $reserved = $tx->meta['reserved_tickets'] ?? null;
            if (!is_array($reserved) || ($tx->meta['reserved_tickets_released'] ?? false)) {
                return;
            }

            foreach ($reserved as $r) {
                $typeId = (string) ($r['event_ticket_type_id'] ?? '');
                $qty = (int) ($r['quantity'] ?? 0);
                if ($typeId === '' || $qty <= 0) continue;

                $type = \App\Models\EventTicketType::query()->where('id', $typeId)->lockForUpdate()->first();
                if (!$type) continue;

                $type->increment('stock', $qty);
                if (!$type->is_active) {
                    $type->is_active = true;
                    $type->save();
                }
            }

            $tx->update([
                'meta' => array_merge($tx->meta ?? [], [
                    'reserved_tickets_released' => true,
                    'reserved_released_at' => now()->toISOString(),
                ]),
            ]);
        });
    }
}

