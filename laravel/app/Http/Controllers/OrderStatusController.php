<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\Transaction;
use App\Services\TicketingService;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class OrderStatusController extends Controller
{
    public function show(Request $request, Transaction $transaction)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $role = (string) ($user->role ?? '');
        $isPrivileged = in_array($role, ['admin', 'super_admin', 'super_user'], true);
        if (!$isPrivileged && $transaction->user_id !== $user->id) {
            abort(403);
        }

        $transaction->loadMissing(['items.ticket.event', 'items.product', 'billingDocument']);
        $status = strtolower((string) $transaction->status);

        $tickets = [];
        if ($status === 'completed') {
            $tickets = Ticket::query()
                ->with(['event.parent', 'user'])
                ->where('transaction_id', $transaction->id)
                ->get()
                ->map(function (Ticket $t) use ($transaction) {
                    $eventName = $t->event ? ($t->event->name['es'] ?? $t->event->name['en'] ?? null) : null;
                    $parentName = ($t->event && $t->event->parent) ? ($t->event->parent->name['es'] ?? $t->event->parent->name['en'] ?? null) : null;
                    $url = app(TicketingService::class)->buildTicketScanUrl($t);
                    $qrSvg = QrCode::format('svg')->size(220)->generate($url);
                    return [
                        'id' => $t->id,
                        'status' => $t->status,
                        'qr_svg' => $qrSvg,
                        'event' => [
                            'id' => $t->event_id,
                            'name' => $eventName,
                            'parent_name' => $parentName,
                            'address' => $t->event?->address,
                            'event_date' => optional($t->event?->event_date)->format('d/m/Y'),
                        ],
                        'user' => [
                            'name' => $t->user?->name,
                            'email' => $t->user?->email,
                            'phone' => $t->user?->phone,
                        ],
                    ];
                })
                ->values()
                ->all();
        }

        return response()->json([
            'id' => $transaction->id,
            'status' => $transaction->status,
            'provider' => $transaction->provider,
            'external_id' => $transaction->external_id,
            'currency' => $transaction->currency,
            'total_amount' => (string) $transaction->total_amount,
            'billing_document' => $transaction->billingDocument ? [
                'kind' => $transaction->billingDocument->kind,
                'number' => $transaction->billingDocument->number,
                'issued_at' => optional($transaction->billingDocument->issued_at)->toISOString(),
            ] : null,
            'tickets' => $tickets,
        ]);
    }
}
