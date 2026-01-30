<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Ticket;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;

class TicketingService
{
    /**
     * Issue a ticket for a user and an event.
     */
    public function issueTicket(User $user, Event $event, string $type, float $price, ?string $eventTicketTypeId = null): Ticket
    {
        $qrCode = $this->generateUniqueCode();
        $validationHash = hash('sha256', Str::uuid() . '|' . Str::random(32));

        return Ticket::create([
            'event_id' => $event->id,
            'event_ticket_type_id' => $eventTicketTypeId,
            'user_id' => $user->id,
            'qr_code' => $qrCode,
            'validation_hash' => $validationHash,
            'ticket_type' => $type,
            'price' => $price,
            'status' => 'available',
            'purchased_at' => now(),
        ]);
    }

    /**
     * Validate a ticket by its QR code.
     */
    public function validateTicket(string $code): array
    {
        $normalized = $this->extractTicketCode($code);
        $ticket = Ticket::where('qr_code', $normalized)->first();

        if (!$ticket) {
            return ['valid' => false, 'message' => 'Ticket not found'];
        }

        if (!in_array($ticket->status, ['active', 'available'], true)) {
            return ['valid' => false, 'message' => "Ticket is {$ticket->status}"];
        }

        if ($ticket->validated_at) {
            return ['valid' => false, 'message' => 'Ticket already validated at ' . $ticket->validated_at];
        }

        $ticket->update([
            'validated_at' => now(),
            'scanned_at' => now(),
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

    public function buildTicketQrPayload(Ticket $ticket, ?Transaction $tx = null): string
    {
        return $this->buildTicketScanUrl($ticket);
    }

    public function buildTicketScanUrl(Ticket $ticket): string
    {
        if (!$ticket->validation_hash) {
            $ticket->validation_hash = hash('sha256', Str::uuid() . '|' . Str::random(32));
            $ticket->save();
        }

        $minutes = (int) env('BSW_TICKET_QR_EXPIRES_MINUTES', 60 * 24 * 365);
        return URL::temporarySignedRoute('tickets.scan', now()->addMinutes($minutes), [
            'ticket' => $ticket->id,
            'hash' => $ticket->validation_hash,
        ]);
    }

    public function validateTicketModel(Ticket $ticket): array
    {
        if (!in_array($ticket->status, ['active', 'available'], true)) {
            return ['valid' => false, 'message' => "Ticket is {$ticket->status}"];
        }

        if ($ticket->validated_at) {
            return ['valid' => false, 'message' => 'Ticket already validated at ' . $ticket->validated_at];
        }

        $ticket->update([
            'validated_at' => now(),
            'scanned_at' => now(),
            'status' => 'used',
        ]);

        return ['valid' => true, 'ticket' => $ticket];
    }

    private function generateUniqueCode(): string
    {
        do {
            $code = 'BW26-' . strtoupper(Str::random(10));
        } while (Ticket::where('qr_code', $code)->exists());

        return $code;
    }

    private function extractTicketCode(string $raw): string
    {
        $trimmed = trim($raw);
        if ($trimmed === '') return $trimmed;

        if ($trimmed[0] === '{' || $trimmed[0] === '[') {
            $decoded = json_decode($trimmed, true);
            if (is_array($decoded)) {
                $candidate = $decoded['qr_code'] ?? $decoded['code'] ?? null;
                if (is_string($candidate) && $candidate !== '') {
                    return $candidate;
                }
            }
        }

        return $trimmed;
    }
}
