<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Ticket;
use App\Models\Transaction;
use App\Models\User;
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

        return Ticket::create([
            'event_id' => $event->id,
            'event_ticket_type_id' => $eventTicketTypeId,
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
        $normalized = $this->extractTicketCode($code);
        $ticket = Ticket::where('qr_code', $normalized)->first();

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

    public function buildTicketQrPayload(Ticket $ticket, ?Transaction $tx = null): string
    {
        $ticket->loadMissing(['event.parent', 'user']);
        $txId = $tx ? (string) $tx->id : (string) ($ticket->transaction_id ?? '');
        $txCreated = $tx ? optional($tx->created_at)->toISOString() : null;
        $eventName = $ticket->event ? ($ticket->event->name['es'] ?? $ticket->event->name['en'] ?? null) : null;
        $parentName = ($ticket->event && $ticket->event->parent) ? ($ticket->event->parent->name['es'] ?? $ticket->event->parent->name['en'] ?? null) : null;

        $payload = [
            'type' => 'bears_ticket',
            'qr_code' => (string) $ticket->qr_code,
            'ticket_uuid' => (string) $ticket->id,
            'transaction_uuid' => $txId,
            'transaction_date' => $txCreated,
            'event' => [
                'event_uuid' => (string) ($ticket->event_id ?? ''),
                'name' => $eventName,
                'parent_name' => $parentName,
            ],
            'user' => [
                'name' => (string) ($ticket->user?->name ?? ''),
                'email' => (string) ($ticket->user?->email ?? ''),
                'phone' => (string) ($ticket->user?->phone ?? ''),
            ],
        ];

        return json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
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
