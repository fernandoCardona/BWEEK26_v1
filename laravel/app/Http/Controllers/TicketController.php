<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Event;
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
            'ticket_type' => ['nullable', 'string', 'max:50'],
            'price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $quantity = (int) ($data['quantity'] ?? 1);
        $ticketType = (string) ($data['ticket_type'] ?? 'general');
        $price = (float) ($data['price'] ?? 0);

        $service = app(TicketingService::class);

        $transaction = DB::transaction(function () use ($user, $event, $service, $quantity, $ticketType, $price) {
            $tx = Transaction::create([
                'user_id' => $user->id,
                'type' => 'ticket',
                'status' => 'completed',
                'currency' => 'EUR',
                'total_amount' => round($price * $quantity, 2),
                'meta' => [
                    'event_id' => $event->id,
                ],
            ]);

            for ($i = 0; $i < $quantity; $i++) {
                $ticket = $service->issueTicket($user, $event, $ticketType, $price);
                $ticket->update(['transaction_id' => $tx->id]);

                TransactionItem::create([
                    'transaction_id' => $tx->id,
                    'kind' => 'ticket',
                    'ticket_id' => $ticket->id,
                    'title' => $ticketType,
                    'quantity' => 1,
                    'unit_price' => $price,
                    'total_price' => $price,
                    'meta' => [
                        'event_id' => $event->id,
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
