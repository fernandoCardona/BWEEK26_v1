<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class CheckoutController extends Controller
{
    public function createStripeCheckout(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $cart = Cart::query()
            ->firstOrCreate(['user_id' => $user->id], ['currency' => 'EUR']);
        $items = CartItem::query()->where('cart_id', $cart->id)->get();
        if ($items->isEmpty()) {
            abort(422, 'El carrito está vacío');
        }

        $productIds = $items->where('kind', 'product')->pluck('product_id')->unique()->values();
        $ticketTypeIds = $items->where('kind', 'ticket')->pluck('event_ticket_type_id')->unique()->values();
        $products = Product::query()->whereIn('id', $productIds)->get()->keyBy('id');
        $ticketTypes = \App\Models\EventTicketType::query()->whereIn('id', $ticketTypeIds)->get()->keyBy('id');
        $events = \App\Models\Event::query()->whereIn('id', $ticketTypes->pluck('event_id')->unique())->get()->keyBy('id');

        $lineItems = [];
        $total = 0.0;
        foreach ($items as $item) {
            if ($item->kind === 'product') {
                $p = $products->get($item->product_id);
                if (!$p || !$p->is_active) {
                    abort(422, 'Producto no disponible');
                }
                if ($p->stock < $item->quantity) {
                    abort(422, 'No hay stock suficiente');
                }
                $unit = (float) ($p->price);
                $qty = (int) ($item->quantity);
                $total += $unit * $qty;
                $name = $p->getTranslation('name', app()->getLocale()) ?? 'Producto';
                $lineItems[] = [
                    'price_data' => [
                        'currency' => strtolower($cart->currency ?? 'EUR'),
                        'product_data' => [
                            'name' => $name,
                        ],
                        'unit_amount' => (int) round($unit * 100),
                    ],
                    'quantity' => $qty,
                ];
            } else {
                $type = $ticketTypes->get($item->event_ticket_type_id);
                if (!$type || !$type->is_active) {
                    abort(422, 'Ticket no disponible');
                }
                $ev = $events->get($type->event_id);
                if (!$ev || !$ev->is_active) {
                    abort(422, 'Evento no disponible');
                }
                if ($type->stock < $item->quantity) {
                    abort(422, 'No hay stock suficiente de tickets');
                }
                $unit = (float) ($type->price);
                $qty = (int) ($item->quantity);
                $total += $unit * $qty;
                $name = strtoupper($type->code) . ' • ' . ($ev->name['es'] ?? $ev->name['en'] ?? 'Evento');
                $lineItems[] = [
                    'price_data' => [
                        'currency' => strtolower($cart->currency ?? 'EUR'),
                        'product_data' => [
                            'name' => $name,
                        ],
                        'unit_amount' => (int) round($unit * 100),
                    ],
                    'quantity' => $qty,
                ];
            }
        }

        $tx = Transaction::create([
            'user_id' => $user->id,
            'type' => 'merch',
            'status' => 'pending',
            'currency' => $cart->currency ?? 'EUR',
            'total_amount' => round($total, 2),
            'meta' => ['source' => 'stripe_checkout', 'cart_id' => $cart->id],
        ]);

        $secret = Config::get('services.stripe.secret') ?? env('STRIPE_SECRET');
        $publicKey = Config::get('services.stripe.key') ?? env('STRIPE_KEY');
        if (!$secret || !$publicKey) {
            abort(500, 'Stripe no configurado');
        }

        $successUrl = url('/checkout/success') . '?session_id={CHECKOUT_SESSION_ID}';
        $cancelUrl = url('/cart');

        $payload = [
            'mode' => 'payment',
            'payment_method_types' => ['card'],
            'line_items' => $lineItems,
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'metadata' => [
                'order_id' => $tx->id,
                'user_id' => $user->id,
            ],
        ];

        $resp = Http::withToken($secret)
            ->asForm()
            ->post('https://api.stripe.com/v1/checkout/sessions', $this->flattenPayload($payload));

        if (!$resp->successful()) {
            $tx->update(['status' => 'failed', 'meta' => array_merge($tx->meta ?? [], ['error' => $resp->json()])]);
            abort(502, 'Error creando sesión de pago');
        }

        $session = $resp->json();
        return response()->json([
            'session_id' => $session['id'] ?? null,
            'url' => $session['url'] ?? null,
            'public_key' => $publicKey,
            'order_id' => $tx->id,
        ]);
    }

    public function stripeWebhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $secret = env('STRIPE_WEBHOOK_SECRET');
        if ($secret) {
            if (!$this->verifyStripeSignature($payload, $sigHeader, $secret)) {
                return response()->json(['error' => 'invalid_signature'], 400);
            }
        }

        $event = json_decode($payload, true);
        $type = $event['type'] ?? '';

        if ($type === 'checkout.session.completed') {
            $session = $event['data']['object'] ?? [];
            $orderId = $session['metadata']['order_id'] ?? null;
            if ($orderId) {
                $this->fulfillOrder($orderId);
            }
        }

        return response()->json(['received' => true]);
    }

    private function fulfillOrder(string $orderId): void
    {
        DB::transaction(function () use ($orderId) {
            $tx = Transaction::query()->where('id', $orderId)->lockForUpdate()->first();
            if (!$tx || $tx->status === 'completed') {
                return;
            }
            $userId = $tx->user_id;
            $cartId = $tx->meta['cart_id'] ?? null;
            if (!$cartId) {
                $tx->update(['status' => 'failed', 'meta' => array_merge($tx->meta ?? [], ['error' => 'missing_cart'])]);
                return;
            }
            $items = CartItem::query()->where('cart_id', $cartId)->get();
            $productIds = $items->where('kind', 'product')->pluck('product_id')->unique()->values();
            $ticketTypeIds = $items->where('kind', 'ticket')->pluck('event_ticket_type_id')->unique()->values();
            $products = Product::query()->whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');
            $ticketTypes = \App\Models\EventTicketType::query()->whereIn('id', $ticketTypeIds)->lockForUpdate()->get()->keyBy('id');
            $events = \App\Models\Event::query()->whereIn('id', $ticketTypes->pluck('event_id')->unique())->get()->keyBy('id');
            foreach ($items as $item) {
                if ($item->kind === 'product') {
                    $p = $products->get($item->product_id);
                    if (!$p || !$p->is_active) {
                        continue;
                    }
                    $qty = (int) $item->quantity;
                    if ($p->stock < $qty) {
                        continue;
                    }
                    $p->decrement('stock', $qty);
                    TransactionItem::create([
                        'transaction_id' => $tx->id,
                        'kind' => 'product',
                        'product_id' => $p->id,
                        'title' => $p->getTranslation('name', app()->getLocale()) ?? null,
                        'quantity' => $qty,
                        'unit_price' => (float) $p->price,
                        'total_price' => round(((float) $p->price) * $qty, 2),
                    ]);
                } else {
                    $type = $ticketTypes->get($item->event_ticket_type_id);
                    $ev = $type ? $events->get($type->event_id) : null;
                    if (!$type || !$ev) {
                        continue;
                    }
                    $qty = (int) $item->quantity;
                    if ($type->stock < $qty) {
                        continue;
                    }
                    $type->decrement('stock', $qty);
                    for ($i = 0; $i < $qty; $i++) {
                        $ticket = app(\App\Services\TicketingService::class)->issueTicket($tx->user, $ev, $type->code, (float) $type->price, $type->id);
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
                                'event_id' => $ev->id,
                                'ticket_type_id' => $type->id,
                            ],
                        ]);
                    }
                }
            }
            CartItem::query()->where('cart_id', $cartId)->delete();
            $tx->update(['status' => 'completed']);
            // Send tickets email if any ticket in order
            if ($items->where('kind', 'ticket')->count() > 0) {
                try {
                    \Illuminate\Support\Facades\Mail::to($tx->user)->send(new \App\Mail\TicketOrderMail($tx));
                } catch (\Throwable $e) {
                    // swallow mail errors to not break webhook processing
                }
            }
        });
    }

    private function flattenPayload(array $payload): array
    {
        $result = [];
        $this->flatten('', $payload, $result);
        return $result;
    }

    private function flatten(string $prefix, $value, array &$result): void
    {
        if (is_array($value)) {
            foreach ($value as $k => $v) {
                $key = $prefix === '' ? $k : "{$prefix}[{$k}]";
                $this->flatten($key, $v, $result);
            }
        } else {
            $result[$prefix] = $value;
        }
    }

    private function verifyStripeSignature(string $payload, ?string $sigHeader, string $secret): bool
    {
        if (!$sigHeader) return false;
        $parts = [];
        foreach (explode(',', $sigHeader) as $piece) {
            [$k, $v] = array_pad(explode('=', trim($piece), 2), 2, null);
            if ($k && $v) $parts[$k] = $v;
        }
        $t = $parts['t'] ?? null;
        $v1 = $parts['v1'] ?? null;
        if (!$t || !$v1) return false;
        $signedPayload = "{$t}.{$payload}";
        $expected = hash_hmac('sha256', $signedPayload, $secret);
        return hash_equals($expected, $v1);
    }
}
