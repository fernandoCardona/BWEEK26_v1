<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuthenticatedSessionController extends Controller
{
    public function create()
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request)
    {
        return redirect()->intended(route('home'));
    }

    public function destroy(Request $request)
    {
        return redirect()->route('home');
    }
}
