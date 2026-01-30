<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class CheckoutReturnController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $orderId = (string) $request->query('order_id', '');
        return Inertia::render('Checkout/Return', [
            'order_id' => $orderId,
        ]);
    }
}

