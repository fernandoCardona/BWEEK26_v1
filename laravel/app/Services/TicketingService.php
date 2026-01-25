<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;

class TicketingService
{
    /**
     * Issue a ticket for a user and an event.
     */
    public function issueTicket(User $user, Event $event, string $type, float $price): Ticket
    {
        $qrCode = $this->generateUniqueCode();

        return Ticket::create([
            'event_id' => $event->id,
            'user_id' => $user->id,
            'qr_code' => $qrCode,
            'ticket_type' => $type,
            'price' => $price,
            'status' => 'active',
            'purchased_at' => now(),
        ]);
    }

    /**
     * Validate a ticket by its QR code.
     */
    public function validateTicket(string $code): array
    {
        $ticket = Ticket::where('qr_code', $code)->first();

        if (!$ticket) {
            return ['valid' => false, 'message' => 'Ticket not found'];
        }

        if ($ticket->status !== 'active') {
            return ['valid' => false, 'message' => "Ticket is {$ticket->status}"];
        }

        if ($ticket->validated_at) {
            return ['valid' => false, 'message' => 'Ticket already validated at ' . $ticket->validated_at];
        }

        $ticket->update([
            'validated_at' => now(),
            'status' => 'used'
        ]);

        return ['valid' => true, 'ticket' => $ticket];
    }

    /**
     * Generate a base64 encoded QR image for the ticket.
     */
    public function generateQrImage(string $code): string
    {
        return base64_encode(QrCode::format('png')->size(300)->generate($code));
    }

    private function generateUniqueCode(): string
    {
        do {
            $code = 'BW26-' . strtoupper(Str::random(10));
        } while (Ticket::where('qr_code', $code)->exists());

        return $code;
    }
}
