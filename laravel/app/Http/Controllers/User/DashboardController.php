<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function overview(Request $request)
    {
        $user = $request->user();

        $ticketsTotal = Ticket::query()->where('user_id', $user->id)->count();
        $ticketsActive = Ticket::query()->where('user_id', $user->id)->where('status', 'active')->count();
        $ticketsValidated = Ticket::query()->where('user_id', $user->id)->whereNotNull('validated_at')->count();

        return Inertia::render('User/Dashboard', [
            'stats' => [
                'tickets_total' => $ticketsTotal,
                'tickets_active' => $ticketsActive,
                'tickets_validated' => $ticketsValidated,
                'merch_purchases_total' => 0,
            ],
        ]);
    }
}

