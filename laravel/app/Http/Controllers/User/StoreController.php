<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StoreController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $transactions = Transaction::query()
            ->with([
                'items.product:id,name,price',
                'items.ticket.event:id,name,event_date',
                'billingDocument',
            ])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(function (Transaction $tx) {
                return [
                    'id' => $tx->id,
                    'type' => $tx->type,
                    'status' => $tx->status,
                    'currency' => $tx->currency,
                    'total_amount' => (string) $tx->total_amount,
                    'created_at' => optional($tx->created_at)->toISOString(),
                    'billing_document' => $tx->billingDocument ? [
                        'id' => $tx->billingDocument->id,
                        'kind' => $tx->billingDocument->kind,
                        'series' => $tx->billingDocument->series,
                        'year' => (int) $tx->billingDocument->year,
                        'sequence' => (int) $tx->billingDocument->sequence,
                        'number' => $tx->billingDocument->number,
                        'issued_at' => optional($tx->billingDocument->issued_at)->toISOString(),
                        'currency' => $tx->billingDocument->currency,
                        'vat_rate' => (string) $tx->billingDocument->vat_rate,
                        'subtotal_amount' => (string) $tx->billingDocument->subtotal_amount,
                        'vat_amount' => (string) $tx->billingDocument->vat_amount,
                        'total_amount' => (string) $tx->billingDocument->total_amount,
                        'issuer' => $tx->billingDocument->issuer,
                        'recipient' => $tx->billingDocument->recipient,
                        'lines' => $tx->billingDocument->lines,
                    ] : null,
                    'items' => $tx->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'kind' => $item->kind,
                            'title' => $item->title ?: ($item->product ? ($item->product->getTranslation('name', app()->getLocale()) ?? '') : null),
                            'quantity' => (int) $item->quantity,
                            'unit_price' => (string) $item->unit_price,
                            'total_price' => (string) $item->total_price,
                            'ticket' => $item->ticket ? [
                                'id' => $item->ticket->id,
                                'ticket_type' => $item->ticket->ticket_type,
                                'status' => $item->ticket->status,
                                'event' => $item->ticket->event ? [
                                    'id' => $item->ticket->event->id,
                                    'name' => $item->ticket->event->name,
                                    'event_date' => optional($item->ticket->event->event_date)->toISOString(),
                                ] : null,
                            ] : null,
                            'product' => $item->product ? [
                                'id' => $item->product->id,
                                'name' => $item->product->name,
                                'price' => (string) $item->product->price,
                            ] : null,
                        ];
                    }),
                ];
            });

        $cart = Cart::query()
            ->firstOrCreate(['user_id' => $user->id], ['currency' => 'EUR'])
            ->load(['items.product:id,name,price']);

        $cartPayload = [
            'id' => $cart->id,
            'currency' => $cart->currency,
            'items' => $cart->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'quantity' => (int) $item->quantity,
                    'unit_price' => (string) $item->unit_price,
                    'product' => $item->product ? [
                        'id' => $item->product->id,
                        'name' => $item->product->name,
                        'price' => (string) $item->product->price,
                    ] : null,
                ];
            }),
        ];

        return Inertia::render('User/Store', [
            'transactions' => $transactions,
            'cart' => $cartPayload,
        ]);
    }
}
