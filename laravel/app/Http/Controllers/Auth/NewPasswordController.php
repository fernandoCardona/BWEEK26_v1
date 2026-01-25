<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NewPasswordController extends Controller
{
    public function create(string $token)
    {
        return Inertia::render('Auth/ResetPassword', ['token' => $token]);
    }

    public function store(Request $request)
    {
        return redirect()->route('login');
    }
}
