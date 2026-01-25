<?php

namespace App\Observers;

use App\Models\Product;
use App\Services\AISyncService;

class ProductObserver
{
    public function __construct(protected AISyncService $aiSyncService)
    {
    }

    public function saved(Product $product)
    {
        foreach (['es', 'ca', 'en', 'fr', 'de'] as $locale) {
            $name = $product->getTranslation('name', $locale, false);
            $desc = $product->getTranslation('description', $locale, false);

            if ($name || $desc) {
                $content = "Producto: {$name}\nDescripción: {$desc}\nPrecio: {$product->price}€\nCategoría: {$product->category}";

                $this->aiSyncService->syncContent(
                    'Product',
                    $product->id,
                    $name ?: "Producto {$product->id}",
                    $content,
                    $locale
                );
            }
        }
    }
}
