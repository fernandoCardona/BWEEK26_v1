<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'super_admin') {
            return redirect()->route('dashboard');
        }
        return $next($request);
    }
}
