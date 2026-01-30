<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Services\BillingService;
use App\Mail\InvoiceMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class CheckoutController extends Controller
{
    private function recalculateProductFromVariants(\App\Models\Product $product): void
    {
        $variants = \App\Models\ProductVariant::query()->where('product_id', $product->id)->where('is_active', true)->get(['price', 'stock']);
        if ($variants->isEmpty()) {
            $product->stock = 0;
            $product->save();
            return;
        }
        $product->stock = (int) $variants->sum('stock');
        $minPrice = $variants->min(fn ($v) => (float) $v->price);
        if ($minPrice !== null) {
            $product->price = $minPrice;
        }
        $product->save();
    }
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
        $variantIds = $items->where('kind', 'product')->pluck('product_variant_id')->filter()->unique()->values();
        $variants = \App\Models\ProductVariant::query()->whereIn('id', $variantIds)->get()->keyBy('id');
        $ticketTypes = \App\Models\EventTicketType::query()->whereIn('id', $ticketTypeIds)->get()->keyBy('id');
        $events = \App\Models\Event::query()->whereIn('id', $ticketTypes->pluck('event_id')->unique())->get()->keyBy('id');

        $lineItems = [];
        $snapshotLines = [];
        $snapshotLines = [];
        $total = 0.0;
        foreach ($items as $item) {
            if ($item->kind === 'product') {
                if ($item->product_variant_id) {
                    $v = $variants->get($item->product_variant_id);
                    $p = $v ? $products->get($v->product_id) : null;
                    if (!$v || !$p || !$v->is_active || !$p->is_active) {
                        abort(422, 'Variante no disponible');
                    }
                    if ($v->stock < $item->quantity) {
                        abort(422, 'No hay stock suficiente para la talla/color seleccionados');
                    }
                    $unit = (float) ($v->price);
                    $qty = (int) ($item->quantity);
                    $total += $unit * $qty;
                    $nameBase = $p->getTranslation('name', app()->getLocale()) ?? 'Producto';
                    $name = "{$nameBase} • {$v->size}" . ($v->color ? " • {$v->color}" : '');
                    $snapshotLines[] = [
                        'kind' => 'product',
                        'description' => $name,
                        'quantity' => $qty,
                        'unit_price' => $unit,
                        'total' => round($unit * $qty, 2),
                        'meta' => [
                            'product_id' => $p->id,
                            'product_variant_id' => $v->id,
                        ],
                    ];
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
                    $snapshotLines[] = [
                        'kind' => 'product',
                        'description' => $name,
                        'quantity' => $qty,
                        'unit_price' => $unit,
                        'total' => round($unit * $qty, 2),
                        'meta' => [
                            'product_id' => $p->id,
                        ],
                    ];
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
                $snapshotLines[] = [
                    'kind' => 'ticket',
                    'description' => $name,
                    'quantity' => $qty,
                    'unit_price' => $unit,
                    'total' => round($unit * $qty, 2),
                    'meta' => [
                        'event_id' => $ev->id,
                        'ticket_type_id' => $type->id,
                        'ticket_type_code' => $type->code,
                    ],
                ];
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
            'meta' => [
                'source' => 'stripe_checkout',
                'cart_id' => $cart->id,
                'lines_snapshot' => $snapshotLines,
                'vat_rate' => (float) config('billing.vat_rate', 21.0),
            ],
        ]);

        try {
            app(BillingService::class)->ensureProformaForTransaction($tx, $snapshotLines);
        } catch (\Throwable $e) {
        }

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

    public function createPaypalCheckout(Request $request)
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
        $variantIds = $items->where('kind', 'product')->pluck('product_variant_id')->filter()->unique()->values();
        $variants = \App\Models\ProductVariant::query()->whereIn('id', $variantIds)->get()->keyBy('id');
        $ticketTypes = \App\Models\EventTicketType::query()->whereIn('id', $ticketTypeIds)->get()->keyBy('id');
        $events = \App\Models\Event::query()->whereIn('id', $ticketTypes->pluck('event_id')->unique())->get()->keyBy('id');

        $total = 0.0;
        foreach ($items as $item) {
            if ($item->kind === 'product') {
                if ($item->product_variant_id) {
                    $v = $variants->get($item->product_variant_id);
                    $p = $v ? $products->get($v->product_id) : null;
                    if (!$v || !$p || !$v->is_active || !$p->is_active) {
                        abort(422, 'Variante no disponible');
                    }
                    if ($v->stock < $item->quantity) {
                        abort(422, 'No hay stock suficiente para la talla/color seleccionados');
                    }
                    $unit = (float) $v->price;
                    $qty = (int) $item->quantity;
                    $total += $unit * $qty;
                    $nameBase = $p->getTranslation('name', app()->getLocale()) ?? 'Producto';
                    $name = "{$nameBase} • {$v->size}" . ($v->color ? " • {$v->color}" : '');
                    $snapshotLines[] = [
                        'kind' => 'product',
                        'description' => $name,
                        'quantity' => $qty,
                        'unit_price' => $unit,
                        'total' => round($unit * $qty, 2),
                        'meta' => [
                            'product_id' => $p->id,
                            'product_variant_id' => $v->id,
                        ],
                    ];
                } else {
                    $p = $products->get($item->product_id);
                    if (!$p || !$p->is_active) {
                        abort(422, 'Producto no disponible');
                    }
                    if ($p->stock < $item->quantity) {
                        abort(422, 'No hay stock suficiente');
                    }
                    $unit = (float) $p->price;
                    $qty = (int) $item->quantity;
                    $total += $unit * $qty;
                    $name = $p->getTranslation('name', app()->getLocale()) ?? 'Producto';
                    $snapshotLines[] = [
                        'kind' => 'product',
                        'description' => $name,
                        'quantity' => $qty,
                        'unit_price' => $unit,
                        'total' => round($unit * $qty, 2),
                        'meta' => [
                            'product_id' => $p->id,
                        ],
                    ];
                }
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
                $unit = (float) $type->price;
                $qty = (int) $item->quantity;
                $total += $unit * $qty;
                $name = strtoupper($type->code) . ' • ' . ($ev->name['es'] ?? $ev->name['en'] ?? 'Evento');
                $snapshotLines[] = [
                    'kind' => 'ticket',
                    'description' => $name,
                    'quantity' => $qty,
                    'unit_price' => $unit,
                    'total' => round($unit * $qty, 2),
                    'meta' => [
                        'event_id' => $ev->id,
                        'ticket_type_id' => $type->id,
                        'ticket_type_code' => $type->code,
                    ],
                ];
            }
        }

        $tx = Transaction::create([
            'user_id' => $user->id,
            'type' => 'merch',
            'status' => 'pending',
            'currency' => $cart->currency ?? 'EUR',
            'total_amount' => round($total, 2),
            'meta' => [
                'source' => 'paypal_checkout',
                'cart_id' => $cart->id,
                'lines_snapshot' => $snapshotLines,
                'vat_rate' => (float) config('billing.vat_rate', 21.0),
            ],
        ]);

        try {
            app(BillingService::class)->ensureProformaForTransaction($tx, (array) ($tx->meta['lines_snapshot'] ?? []));
        } catch (\Throwable $e) {
        }

        $accessToken = $this->paypalAccessToken();
        $baseUrl = $this->paypalBaseUrl();

        $orderResp = Http::withToken($accessToken)
            ->post("{$baseUrl}/v2/checkout/orders", [
                'intent' => 'CAPTURE',
                'purchase_units' => [
                    [
                        'custom_id' => $tx->id,
                        'amount' => [
                            'currency_code' => strtoupper($cart->currency ?? 'EUR'),
                            'value' => number_format((float) $tx->total_amount, 2, '.', ''),
                        ],
                    ],
                ],
                'application_context' => [
                    'brand_name' => config('app.name'),
                    'landing_page' => 'LOGIN',
                    'shipping_preference' => 'NO_SHIPPING',
                    'user_action' => 'PAY_NOW',
                    'return_url' => url('/checkout/paypal/return'),
                    'cancel_url' => url('/cart'),
                ],
            ]);

        if (!$orderResp->successful()) {
            $tx->update(['status' => 'failed', 'meta' => array_merge($tx->meta ?? [], ['error' => $orderResp->json()])]);
            abort(502, 'Error creando orden PayPal');
        }

        $order = $orderResp->json();
        $tx->update(['meta' => array_merge($tx->meta ?? [], ['paypal_order_id' => $order['id'] ?? null])]);

        $approveUrl = null;
        foreach (($order['links'] ?? []) as $link) {
            if (($link['rel'] ?? '') === 'approve') {
                $approveUrl = $link['href'] ?? null;
                break;
            }
        }

        return response()->json([
            'order_id' => $order['id'] ?? null,
            'url' => $approveUrl,
            'tx_id' => $tx->id,
        ]);
    }

    public function paypalReturn(Request $request)
    {
        $token = (string) $request->query('token', '');
        if ($token === '') {
            return redirect('/cart');
        }

        $tx = Transaction::query()->whereRaw("(meta->>'paypal_order_id') = ?", [$token])->first();
        if (!$tx) {
            return redirect('/cart');
        }

        $accessToken = $this->paypalAccessToken();
        $baseUrl = $this->paypalBaseUrl();

        $captureResp = Http::withToken($accessToken)
            ->post("{$baseUrl}/v2/checkout/orders/{$token}/capture", []);

        if (!$captureResp->successful()) {
            $tx->update(['status' => 'failed', 'meta' => array_merge($tx->meta ?? [], ['paypal_capture_error' => $captureResp->json()])]);
            return redirect('/cart');
        }

        $capture = $captureResp->json();
        $status = (string) ($capture['status'] ?? '');
        $tx->update(['meta' => array_merge($tx->meta ?? [], ['paypal_capture' => $capture, 'paypal_status' => $status])]);

        if ($status === 'COMPLETED') {
            $this->fulfillOrder($tx->id);
        }

        return redirect('/cart');
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
            $variantIds = $items->where('kind', 'product')->pluck('product_variant_id')->filter()->unique()->values();
            $variants = \App\Models\ProductVariant::query()->whereIn('id', $variantIds)->lockForUpdate()->get()->keyBy('id');
            $ticketTypes = \App\Models\EventTicketType::query()->whereIn('id', $ticketTypeIds)->lockForUpdate()->get()->keyBy('id');
            $events = \App\Models\Event::query()->whereIn('id', $ticketTypes->pluck('event_id')->unique())->get()->keyBy('id');
            foreach ($items as $item) {
                if ($item->kind === 'product') {
                    if ($item->product_variant_id) {
                        $v = $variants->get($item->product_variant_id);
                        $p = $v ? $products->get($v->product_id) : null;
                        if (!$v || !$p || !$v->is_active || !$p->is_active) {
                            continue;
                        }
                        $qty = (int) $item->quantity;
                        if ($v->stock < $qty) {
                            continue;
                        }
                        $v->decrement('stock', $qty);
                        $v->refresh();
                        if ((int) $v->stock <= 0) {
                            $v->is_active = false;
                            $v->save();
                        }
                        $this->recalculateProductFromVariants($p);
                        TransactionItem::create([
                            'transaction_id' => $tx->id,
                            'kind' => 'product',
                            'product_id' => $p->id,
                            'title' => ($p->getTranslation('name', app()->getLocale()) ?? null) . ' • ' . ($v->size ?? '') . ($v->color ? " • {$v->color}" : ''),
                            'quantity' => $qty,
                            'unit_price' => (float) $v->price,
                            'total_price' => round(((float) $v->price) * $qty, 2),
                            'meta' => [
                                'product_variant_id' => $v->id,
                            ],
                        ]);
                    } else {
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
                    }
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
                    if ((int) $type->stock <= 0) {
                        $type->is_active = false;
                        $type->save();
                    }
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
            try {
                app(BillingService::class)->issueInvoiceForTransaction($tx);
            } catch (\Throwable $e) {
            }

            try {
                \Illuminate\Support\Facades\Mail::to($tx->user)->send(new InvoiceMail($tx->id));
            } catch (\Throwable $e) {
            }
        });
    }

    private function paypalBaseUrl(): string
    {
        $mode = (string) (Config::get('services.paypal.mode') ?? env('PAYPAL_MODE', 'sandbox'));
        return $mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    }

    private function paypalAccessToken(): string
    {
        $clientId = Config::get('services.paypal.client_id') ?? env('PAYPAL_CLIENT_ID');
        $secret = Config::get('services.paypal.secret') ?? env('PAYPAL_SECRET');
        if (!$clientId || !$secret) {
            abort(500, 'PayPal no configurado');
        }

        $baseUrl = $this->paypalBaseUrl();
        $resp = Http::withBasicAuth($clientId, $secret)
            ->asForm()
            ->post("{$baseUrl}/v1/oauth2/token", [
                'grant_type' => 'client_credentials',
            ]);

        if (!$resp->successful()) {
            abort(502, 'Error autenticando con PayPal');
        }

        $json = $resp->json();
        $token = $json['access_token'] ?? null;
        if (!$token) {
            abort(502, 'Token PayPal inválido');
        }
        return (string) $token;
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
