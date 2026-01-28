<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Event;
use App\Models\EventTicketType;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CartController extends Controller
{
    public function page(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $cart = Cart::query()->firstOrCreate(['user_id' => $user->id], ['currency' => 'EUR']);

        return Inertia::render('Cart/Index', [
            'cart' => $this->toPayload($cart),
        ]);
    }

    public function show(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $cart = Cart::query()
            ->firstOrCreate(['user_id' => $user->id], ['currency' => 'EUR'])
            ->load(['items.product:id,name,price,stock,is_active']);

        return response()->json($this->toPayload($cart));
    }

    public function addItem(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $data = $request->validate([
            'kind' => ['nullable', 'in:product,ticket'],
            'product_id' => ['nullable', 'string', 'exists:products,id'],
            'event_ticket_type_id' => ['nullable', 'string', 'exists:event_ticket_types,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $cart = Cart::query()->firstOrCreate(['user_id' => $user->id], ['currency' => 'EUR']);

        $kind = $data['kind'] ?? 'product';
        if ($kind === 'product') {
            $product = Product::query()->where('id', $data['product_id'])->firstOrFail();
            if (!$product->is_active) {
                abort(422, 'Producto no disponible');
            }

            $item = CartItem::query()->where('cart_id', $cart->id)->where('product_id', $product->id)->first();
            $newQty = ($item?->quantity ?? 0) + (int) $data['quantity'];

            if ($product->stock < $newQty) {
                abort(422, 'No hay stock suficiente');
            }

            CartItem::query()->updateOrCreate(
                ['cart_id' => $cart->id, 'product_id' => $product->id],
                ['kind' => 'product', 'quantity' => $newQty, 'unit_price' => $product->price]
            );
        } else {
            $type = EventTicketType::query()->where('id', $data['event_ticket_type_id'])->firstOrFail();
            $event = Event::query()->where('id', $type->event_id)->firstOrFail();
            if (!$type->is_active || !$event->is_active) {
                abort(422, 'Ticket no disponible');
            }
            $item = CartItem::query()->where('cart_id', $cart->id)->where('event_ticket_type_id', $type->id)->first();
            $newQty = ($item?->quantity ?? 0) + (int) $data['quantity'];
            if ($type->stock < $newQty) {
                abort(422, 'No hay stock suficiente para el ticket');
            }
            CartItem::query()->updateOrCreate(
                ['cart_id' => $cart->id, 'event_ticket_type_id' => $type->id],
                ['kind' => 'ticket', 'quantity' => $newQty, 'unit_price' => $type->price]
            );
        }

        return $this->show($request);
    }

    public function updateItem(Request $request, CartItem $item)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $cart = Cart::query()->where('user_id', $user->id)->firstOrFail();
        if ($item->cart_id !== $cart->id) {
            abort(404);
        }

        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        $qty = (int) $data['quantity'];
        if ($qty === 0) {
            $item->delete();
            return $this->show($request);
        }

        if ($item->kind === 'product') {
            $product = Product::query()->where('id', $item->product_id)->firstOrFail();
            if (!$product->is_active) {
                abort(422, 'Producto no disponible');
            }
            if ($product->stock < $qty) {
                abort(422, 'No hay stock suficiente');
            }
            $item->update([
                'quantity' => $qty,
                'unit_price' => $product->price,
            ]);
        } else {
            $type = EventTicketType::query()->where('id', $item->event_ticket_type_id)->firstOrFail();
            if (!$type->is_active) {
                abort(422, 'Ticket no disponible');
            }
            if ($type->stock < $qty) {
                abort(422, 'No hay stock suficiente de tickets');
            }
            $item->update([
                'quantity' => $qty,
                'unit_price' => $type->price,
            ]);
        }

        return $this->show($request);
    }

    public function removeItem(Request $request, CartItem $item)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $cart = Cart::query()->where('user_id', $user->id)->firstOrFail();
        if ($item->cart_id !== $cart->id) {
            abort(404);
        }

        $item->delete();
        return $this->show($request);
    }

    public function checkout(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $transaction = DB::transaction(function () use ($user) {
            $cart = Cart::query()->firstOrCreate(['user_id' => $user->id], ['currency' => 'EUR']);
            $items = CartItem::query()->where('cart_id', $cart->id)->get();

            if ($items->isEmpty()) {
                abort(422, 'El carrito está vacío');
            }

            $productIds = $items->pluck('product_id')->unique()->values();
            $products = Product::query()->whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');

            $total = 0.0;
            foreach ($items as $item) {
                $p = $products->get($item->product_id);
                if (!$p || !$p->is_active) {
                    abort(422, 'Producto no disponible');
                }
                if ($p->stock < $item->quantity) {
                    abort(422, 'No hay stock suficiente');
                }
                $total += ((float) $p->price) * (int) $item->quantity;
            }

            $tx = Transaction::create([
                'user_id' => $user->id,
                'type' => 'merch',
                'status' => 'completed',
                'currency' => $cart->currency ?? 'EUR',
                'total_amount' => round($total, 2),
                'meta' => ['source' => 'cart_checkout'],
            ]);

            foreach ($items as $item) {
                $p = $products->get($item->product_id);
                $unit = (float) $p->price;
                $qty = (int) $item->quantity;

                $p->decrement('stock', $qty);

                TransactionItem::create([
                    'transaction_id' => $tx->id,
                    'kind' => 'product',
                    'product_id' => $p->id,
                    'title' => $p->getTranslation('name', app()->getLocale()) ?? null,
                    'quantity' => $qty,
                    'unit_price' => $unit,
                    'total_price' => round($unit * $qty, 2),
                ]);
            }

            CartItem::query()->where('cart_id', $cart->id)->delete();

            return $tx;
        });

        return response()->json([
            'status' => 'ok',
            'transaction_id' => $transaction->id,
        ], 201);
    }

    private function toPayload(Cart $cart): array
    {
        $cart->loadMissing([
            'items.product:id,name,price,stock,is_active',
            'items.ticketType:id,event_id,code,price,stock,is_active',
            'items.ticketType.event:id,name,address,is_active',
        ]);

        return [
            'id' => $cart->id,
            'currency' => $cart->currency,
            'items' => $cart->items->map(function (CartItem $item) {
                return [
                    'id' => $item->id,
                    'kind' => $item->kind ?? 'product',
                    'product_id' => $item->product_id,
                    'event_ticket_type_id' => $item->event_ticket_type_id,
                    'quantity' => (int) $item->quantity,
                    'unit_price' => (string) $item->unit_price,
                    'product' => $item->product ? [
                        'id' => $item->product->id,
                        'name' => $item->product->name,
                        'price' => (string) $item->product->price,
                        'stock' => (int) $item->product->stock,
                        'is_active' => (bool) $item->product->is_active,
                    ] : null,
                    'ticket_type' => $item->ticketType ? [
                        'id' => $item->ticketType->id,
                        'code' => $item->ticketType->code,
                        'price' => (string) $item->ticketType->price,
                        'stock' => (int) $item->ticketType->stock,
                        'is_active' => (bool) $item->ticketType->is_active,
                    ] : null,
                    'event' => $item->ticketType && $item->ticketType->event ? [
                        'id' => $item->ticketType->event->id,
                        'name' => $item->ticketType->event->name,
                        'address' => $item->ticketType->event->address,
                        'is_active' => (bool) $item->ticketType->event->is_active,
                    ] : null,
                ];
            }),
        ];
    }
}
