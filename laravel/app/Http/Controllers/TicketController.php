<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Event;

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
        $request->validate([
            'quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        return response()->json([
            'status' => 'ok',
            'event_id' => $event->id,
        ], 201);
    }
}
