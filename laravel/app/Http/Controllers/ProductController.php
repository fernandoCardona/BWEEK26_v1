<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display the product catalog.
     */
    public function index()
    {
        return Inertia::render('Products/Index', [
            'products' => Product::where('is_active', true)->get(),
        ]);
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product)
    {
        return Inertia::render('Products/Show', [
            'product' => $product->load(['variants', 'images']),
        ]);
    }
}
