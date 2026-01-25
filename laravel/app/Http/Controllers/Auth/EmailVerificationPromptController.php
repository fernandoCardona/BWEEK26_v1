<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;

class EmailVerificationPromptController
{
    public function __invoke(Request $request)
    {
        if ($request->user() && $request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard'));
        }

        if (view()->exists('auth.verify-email')) {
            return view('auth.verify-email');
        }

        return redirect()->route('dashboard');
    }
}
