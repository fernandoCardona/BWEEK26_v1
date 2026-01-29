<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductCategory;
use Inertia\Inertia;

class EcommerceController extends Controller
{
    public function index()
    {
        $tickets = \App\Models\EventTicketType::query()
            ->with([
                'event' => function ($q) {
                    $q->select(['id', 'parent_event_id', 'name', 'is_active']);
                },
                'event.parent' => function ($q) {
                    $q->select(['id', 'name']);
                },
            ])
            ->orderBy('price')
            ->get();

        $products = \App\Models\Product::query()
            ->where('is_active', true)
            ->withCount('variants')
            ->get();

        return Inertia::render('Admin/Ecommerce/Index', [
            'tickets' => $tickets,
            'products' => $products,
            'categories' => ProductCategory::query()->orderBy('name')->get(['id', 'name', 'slug', 'is_active']),
        ]);
    }

    public function warehouse()
    {
        $products = \App\Models\Product::query()
            ->with(['variants'])
            ->orderBy('name->es')
            ->get();
        return Inertia::render('Admin/Ecommerce/Warehouse', [
            'products' => $products,
        ]);
    }

    public function updateTicketType(\Illuminate\Http\Request $request, \App\Models\EventTicketType $ticketType)
    {
        $data = $request->validate([
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);

        $ticketType->update([
            'price' => $data['price'],
            'stock' => (int) $data['stock'],
            'is_active' => (bool) $data['is_active'],
        ]);

        return response()->json(['status' => 'ok']);
    }
}
