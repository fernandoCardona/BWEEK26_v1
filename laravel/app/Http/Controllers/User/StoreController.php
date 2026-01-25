<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StoreController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $tickets = Ticket::query()
            ->with(['event:id,name,event_date'])
            ->where('user_id', $user->id)
            ->orderByDesc('purchased_at')
            ->limit(50)
            ->get()
            ->map(function (Ticket $ticket) {
                return [
                    'id' => $ticket->id,
                    'ticket_type' => $ticket->ticket_type,
                    'price' => (string) $ticket->price,
                    'status' => $ticket->status,
                    'purchased_at' => optional($ticket->purchased_at)->toISOString(),
                    'validated_at' => optional($ticket->validated_at)->toISOString(),
                    'event' => $ticket->event ? [
                        'id' => $ticket->event->id,
                        'name' => $ticket->event->name,
                        'event_date' => optional($ticket->event->event_date)->toISOString(),
                    ] : null,
                ];
            });

        return Inertia::render('User/Store', [
            'tickets' => $tickets,
        ]);
    }
}

