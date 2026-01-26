<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Event;
use App\Models\EventTicketType;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Services\TicketingService;
use Illuminate\Support\Facades\DB;

class TicketController extends Controller
{
    public function myTickets(Request $request): JsonResponse
    {
        return response()->json([
            'tickets' => [],
        ]);
    }

    public function purchase(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $data = $request->validate([
            'quantity' => ['nullable', 'integer', 'min:1', 'max:20'],
            'ticket_type_id' => ['nullable', 'string', 'exists:event_ticket_types,id'],
        ]);

        $quantity = (int) ($data['quantity'] ?? 1);
        $ticketTypeId = $data['ticket_type_id'] ?? null;

        $service = app(TicketingService::class);

        $transaction = DB::transaction(function () use ($user, $event, $service, $quantity, $ticketTypeId) {
            $type = null;
            if ($ticketTypeId) {
                $type = EventTicketType::query()
                    ->where('id', $ticketTypeId)
                    ->where('event_id', $event->id)
                    ->lockForUpdate()
                    ->first();
            } else {
                abort(422, 'ticket_type_id requerido');
            }

            if (!$type || !$type->is_active) {
                abort(422, 'Tipo de ticket no disponible');
            }

            if ($type->stock < $quantity) {
                abort(422, 'No hay stock suficiente');
            }

            $type->decrement('stock', $quantity);

            $tx = Transaction::create([
                'user_id' => $user->id,
                'type' => 'ticket',
                'status' => 'completed',
                'currency' => 'EUR',
                'total_amount' => round(((float) $type->price) * $quantity, 2),
                'meta' => [
                    'event_id' => $event->id,
                ],
            ]);

            for ($i = 0; $i < $quantity; $i++) {
                $ticket = $service->issueTicket($user, $event, $type->code, (float) $type->price, $type->id);
                $ticket->update(['transaction_id' => $tx->id]);

                TransactionItem::create([
                    'transaction_id' => $tx->id,
                    'kind' => 'ticket',
                    'ticket_id' => $ticket->id,
                    'title' => strtoupper($type->code),
                    'quantity' => 1,
                    'unit_price' => (float) $type->price,
                    'total_price' => (float) $type->price,
                    'meta' => [
                        'event_id' => $event->id,
                        'ticket_type_id' => $type->id,
                    ],
                ]);
            }

            return $tx;
        });

        return response()->json([
            'status' => 'ok',
            'transaction_id' => $transaction->id,
            'event_id' => $event->id,
        ], 201);
    }
}
