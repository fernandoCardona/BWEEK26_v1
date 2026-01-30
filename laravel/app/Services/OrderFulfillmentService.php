<?php

namespace App\Services;

use App\Mail\InvoiceMail;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Support\Facades\DB;

class OrderFulfillmentService
{
    private function recalculateProductFromVariants(\App\Models\Product $product): void
    {
        $variants = \App\Models\ProductVariant::query()
            ->where('product_id', $product->id)
            ->where('is_active', true)
            ->get(['price', 'stock']);

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

    public function fulfill(string $transactionId): void
    {
        DB::transaction(function () use ($transactionId) {
            $tx = Transaction::query()->where('id', $transactionId)->lockForUpdate()->first();
            if (!$tx || strtolower((string) $tx->status) === 'completed') {
                return;
            }

            $reservedTickets = is_array($tx->meta['reserved_tickets'] ?? null) ? $tx->meta['reserved_tickets'] : [];

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
                    $isReserved = $this->isTicketTypeReserved($reservedTickets, $type->id, $qty);
                    if (!$isReserved) {
                        if ($type->stock < $qty) {
                            continue;
                        }
                        $type->decrement('stock', $qty);
                        if ((int) $type->stock <= 0) {
                            $type->is_active = false;
                            $type->save();
                        }
                    }
                    for ($i = 0; $i < $qty; $i++) {
                        $ticket = app(TicketingService::class)->issueTicket($tx->user, $ev, $type->code, (float) $type->price, $type->id);
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

    private function isTicketTypeReserved(array $reservedTickets, string $ticketTypeId, int $qty): bool
    {
        foreach ($reservedTickets as $r) {
            if ((string) ($r['event_ticket_type_id'] ?? '') !== $ticketTypeId) continue;
            return (int) ($r['quantity'] ?? 0) >= $qty;
        }
        return false;
    }
}
