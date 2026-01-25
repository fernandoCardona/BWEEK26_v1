<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PasswordResetLinkController extends Controller
{
    public function create()
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    public function store(Request $request)
    {
        return redirect()->route('password.request');
    }
}
