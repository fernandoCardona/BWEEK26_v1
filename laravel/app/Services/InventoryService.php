<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryService
{
    /**
     * Check if a product variant has enough stock.
     */
    public function checkStock(string $sku, int $quantity = 1): bool
    {
        $variant = ProductVariant::where('sku', $sku)->first();

        if (!$variant) {
            return false;
        }

        return $variant->stock >= $quantity;
    }

    /**
     * Reserve stock for a checkout process.
     */
    public function reserveStock(string $sku, int $quantity): bool
    {
        return DB::transaction(function () use ($sku, $quantity) {
            $variant = ProductVariant::where('sku', $sku)->lockForUpdate()->first();

            if (!$variant || $variant->stock < $quantity) {
                return false;
            }

            $variant->decrement('stock', $quantity);

            // Log transaction logic here

            return true;
        });
    }

    /**
     * Release previously reserved stock.
     */
    public function releaseStock(string $sku, int $quantity): void
    {
        $variant = ProductVariant::where('sku', $sku)->first();

        if ($variant) {
            $variant->increment('stock', $quantity);
        }
    }
}
