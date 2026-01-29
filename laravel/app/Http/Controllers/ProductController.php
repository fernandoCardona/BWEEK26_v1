<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\EventTicketType;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Display the product catalog.
     */
    public function index()
    {
        $products = Product::query()
            ->where('is_active', true)
            ->with(['images' => fn ($q) => $q->orderBy('sort_order')])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Product $p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'description' => $p->description,
                    'price' => (string) $p->price,
                    'stock' => (int) $p->stock,
                    'category' => $p->category,
                    'image_url' => $p->image_path ? Storage::disk('public')->url($p->image_path) : null,
                    'gallery' => $p->images->map(fn ($img) => [
                        'id' => $img->id,
                        'url' => Storage::disk('public')->url($img->path),
                    ]),
                ];
            });

        $tickets = EventTicketType::query()
            ->where('is_active', true)
            ->with([
                'event' => function ($q) {
                    $q->select(['id', 'parent_event_id', 'name', 'is_active']);
                },
                'event.parent' => function ($q) {
                    $q->select(['id', 'name']);
                },
            ])
            ->orderBy('price')
            ->get()
            ->map(function (EventTicketType $t) {
                return [
                    'id' => $t->id,
                    'code' => $t->code,
                    'price' => (string) $t->price,
                    'stock' => (int) $t->stock,
                    'is_active' => (bool) $t->is_active,
                    'event' => $t->event ? [
                        'id' => $t->event->id,
                        'parent_event_id' => $t->event->parent_event_id,
                        'name' => $t->event->name,
                        'is_active' => (bool) $t->event->is_active,
                        'parent' => $t->event->parent ? [
                            'id' => $t->event->parent->id,
                            'name' => $t->event->parent->name,
                        ] : null,
                    ] : null,
                ];
            });

        return Inertia::render('Products/Index', [
            'products' => $products,
            'tickets' => $tickets,
        ]);
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product)
    {
        $locale = app()->getLocale();
        $product->load(['variants', 'images']);

        return Inertia::render('Products/Show', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => (string) $product->price,
                'stock' => (int) $product->stock,
                'category' => $product->category,
                'is_active' => (bool) $product->is_active,
                'image_url' => $product->image_path ? Storage::disk('public')->url($product->image_path) : null,
                'variants' => $product->variants->map(function ($v) {
                    return [
                        'id' => $v->id,
                        'size' => $v->size,
                        'color' => $v->color,
                        'price' => (string) $v->price,
                        'stock' => (int) $v->stock,
                        'is_active' => (bool) $v->is_active,
                    ];
                }),
                'images' => $product->images->map(function ($img) {
                    return [
                        'id' => $img->id,
                        'url' => Storage::disk('public')->url($img->path),
                        'sort_order' => (int) $img->sort_order,
                    ];
                }),
            ],
        ]);
    }
}
