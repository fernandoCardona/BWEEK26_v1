<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Services\TicketingService;
use Illuminate\Http\Request;

class TicketScanController extends Controller
{
    public function show(Request $request, Ticket $ticket)
    {
        $hash = (string) $request->query('hash', '');
        if ($hash === '' || !$ticket->validation_hash || !hash_equals($ticket->validation_hash, $hash)) {
            abort(403);
        }

        $ticket->loadMissing(['event.parent', 'user']);
        $result = app(TicketingService::class)->validateTicketModel($ticket);

        return view('tickets.scan', [
            'ok' => (bool) ($result['valid'] ?? false),
            'message' => (string) ($result['message'] ?? ''),
            'ticket' => $ticket,
        ]);
    }
}

