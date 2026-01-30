<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class StockReservationService
{
    private function recalculateProductFromVariants(\App\Models\Product $product): void
    {
        $variants = \App\Models\ProductVariant::query()
            ->where('product_id', $product->id)
            ->where('is_active', true)
            ->get(['stock']);

        $product->stock = (int) $variants->sum('stock');
        $product->save();
    }

    public function reserveStock(Transaction $tx, iterable $cartItems): void
    {
        DB::transaction(function () use ($tx, $cartItems) {
            $tx = Transaction::query()->where('id', $tx->id)->lockForUpdate()->first();
            if (!$tx) return;

            $reservedTickets = is_array($tx->meta['reserved_tickets'] ?? null) ? $tx->meta['reserved_tickets'] : null;
            $reservedVariants = is_array($tx->meta['reserved_variants'] ?? null) ? $tx->meta['reserved_variants'] : null;
            $reservedProducts = is_array($tx->meta['reserved_products'] ?? null) ? $tx->meta['reserved_products'] : null;

            $ticketsReservations = $reservedTickets ?? [];
            $variantsReservations = $reservedVariants ?? [];
            $productsReservations = $reservedProducts ?? [];

            foreach ($cartItems as $item) {
                $kind = (string) ($item->kind ?? '');
                $qty = (int) ($item->quantity ?? 0);
                if ($qty <= 0) continue;

                if ($kind === 'ticket' && $reservedTickets === null) {
                    if (!$item->event_ticket_type_id) continue;
                    $type = \App\Models\EventTicketType::query()->where('id', $item->event_ticket_type_id)->lockForUpdate()->first();
                    if (!$type || !$type->is_active) {
                        abort(422, 'Ticket no disponible');
                    }
                    if ((int) $type->stock < $qty) {
                        abort(422, 'No hay stock suficiente de tickets');
                    }

                    $type->decrement('stock', $qty);
                    $type->refresh();
                    if ((int) $type->stock <= 0 && $type->is_active) {
                        $type->is_active = false;
                        $type->save();
                    }

                    $ticketsReservations[] = [
                        'event_ticket_type_id' => $type->id,
                        'quantity' => $qty,
                    ];
                }

                if ($kind === 'product' && $reservedVariants === null && $item->product_variant_id) {
                    $variant = \App\Models\ProductVariant::query()->where('id', $item->product_variant_id)->lockForUpdate()->first();
                    $product = $variant ? \App\Models\Product::query()->where('id', $variant->product_id)->lockForUpdate()->first() : null;
                    if (!$variant || !$product || !$variant->is_active || !$product->is_active) {
                        abort(422, 'Variante no disponible');
                    }
                    if ((int) $variant->stock < $qty) {
                        abort(422, 'No hay stock suficiente para la talla seleccionada');
                    }

                    $variant->decrement('stock', $qty);
                    $variant->refresh();
                    $autoDeactivated = false;
                    if ((int) $variant->stock <= 0 && $variant->is_active) {
                        $variant->is_active = false;
                        $variant->save();
                        $autoDeactivated = true;
                    }

                    $this->recalculateProductFromVariants($product);

                    $variantsReservations[] = [
                        'product_variant_id' => $variant->id,
                        'quantity' => $qty,
                        'auto_deactivated' => $autoDeactivated,
                    ];
                }

                if ($kind === 'product' && $reservedProducts === null && !$item->product_variant_id) {
                    if (!$item->product_id) continue;
                    $product = \App\Models\Product::query()->where('id', $item->product_id)->lockForUpdate()->first();
                    if (!$product || !$product->is_active) {
                        abort(422, 'Producto no disponible');
                    }
                    if ((int) $product->stock < $qty) {
                        abort(422, 'No hay stock suficiente');
                    }

                    $product->decrement('stock', $qty);

                    $productsReservations[] = [
                        'product_id' => $product->id,
                        'quantity' => $qty,
                    ];
                }
            }

            $meta = $tx->meta ?? [];
            if ($reservedTickets === null) {
                $meta['reserved_tickets'] = $ticketsReservations;
            }
            if ($reservedVariants === null) {
                $meta['reserved_variants'] = $variantsReservations;
            }
            if ($reservedProducts === null) {
                $meta['reserved_products'] = $productsReservations;
            }
            if (!isset($meta['reserved_at'])) {
                $meta['reserved_at'] = now()->toISOString();
            }

            $tx->update(['meta' => $meta]);
        });
    }

    public function releaseStock(Transaction $tx): void
    {
        DB::transaction(function () use ($tx) {
            $tx = Transaction::query()->where('id', $tx->id)->lockForUpdate()->first();
            if (!$tx) return;

            $reserved = $tx->meta['reserved_tickets'] ?? null;
            if (!is_array($reserved) || ($tx->meta['reserved_tickets_released'] ?? false)) {
                $reserved = [];
            }

            if (!empty($reserved) && !($tx->meta['reserved_tickets_released'] ?? false)) {
                foreach ($reserved as $r) {
                    $typeId = (string) ($r['event_ticket_type_id'] ?? '');
                    $qty = (int) ($r['quantity'] ?? 0);
                    if ($typeId === '' || $qty <= 0) continue;

                    $type = \App\Models\EventTicketType::query()->where('id', $typeId)->lockForUpdate()->first();
                    if (!$type) continue;

                    $type->increment('stock', $qty);
                    if (!$type->is_active) {
                        $type->is_active = true;
                        $type->save();
                    }
                }
            }

            $reservedVariants = $tx->meta['reserved_variants'] ?? null;
            if (is_array($reservedVariants) && !($tx->meta['reserved_variants_released'] ?? false)) {
                foreach ($reservedVariants as $r) {
                    $variantId = (string) ($r['product_variant_id'] ?? '');
                    $qty = (int) ($r['quantity'] ?? 0);
                    $autoDeactivated = (bool) ($r['auto_deactivated'] ?? false);
                    if ($variantId === '' || $qty <= 0) continue;

                    $variant = \App\Models\ProductVariant::query()->where('id', $variantId)->lockForUpdate()->first();
                    if (!$variant) continue;

                    $variant->increment('stock', $qty);
                    if ($autoDeactivated && !$variant->is_active) {
                        $variant->is_active = true;
                        $variant->save();
                    }

                    $product = \App\Models\Product::query()->where('id', $variant->product_id)->lockForUpdate()->first();
                    if ($product) {
                        $this->recalculateProductFromVariants($product);
                    }
                }
            }

            $reservedProducts = $tx->meta['reserved_products'] ?? null;
            if (is_array($reservedProducts) && !($tx->meta['reserved_products_released'] ?? false)) {
                foreach ($reservedProducts as $r) {
                    $productId = (string) ($r['product_id'] ?? '');
                    $qty = (int) ($r['quantity'] ?? 0);
                    if ($productId === '' || $qty <= 0) continue;

                    $product = \App\Models\Product::query()->where('id', $productId)->lockForUpdate()->first();
                    if (!$product) continue;

                    $product->increment('stock', $qty);
                }
            }

            $tx->update([
                'meta' => array_merge($tx->meta ?? [], [
                    'reserved_tickets_released' => true,
                    'reserved_variants_released' => true,
                    'reserved_products_released' => true,
                    'reserved_released_at' => now()->toISOString(),
                ]),
            ]);
        });
    }

    public function reserveTickets(Transaction $tx, iterable $cartItems): void
    {
        $this->reserveStock($tx, $cartItems);
    }

    public function releaseTickets(Transaction $tx): void
    {
        $this->releaseStock($tx);
    }
}
