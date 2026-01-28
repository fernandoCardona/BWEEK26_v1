<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class EcommerceController extends Controller
{
    public function index()
    {
        $tickets = \App\Models\EventTicketType::query()
            ->with(['event:id,name,is_active'])
            ->orderBy('price')
            ->get();

        $products = \App\Models\Product::query()
            ->where('is_active', true)
            ->withCount('variants')
            ->get();

        return Inertia::render('Admin/Ecommerce/Index', [
            'tickets' => $tickets,
            'products' => $products,
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
}
