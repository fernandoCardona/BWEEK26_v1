<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Inertia\Inertia;
use Illuminate\Http\Request;

class EventController extends Controller
{
    /**
     * Display the event listing.
     */
    public function index()
    {
        return Inertia::render('Tickets/Index', [
            'events' => Event::where('is_active', true)->orderBy('event_date')->get(),
        ]);
    }

    /**
     * Display the specified event.
     */
    public function show(Event $event)
    {
        return Inertia::render('Tickets/Show', [
            'event' => $event,
        ]);
    }
}
