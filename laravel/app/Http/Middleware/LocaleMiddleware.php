<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class LocaleMiddleware
{
    /**
     * Handle an incoming request.
     * Priority: 
     * 1. URL parameter (?lang=)
     * 2. Session
     * 3. User preference (if logged in)
     * 4. Browser header (Accept-Language)
     * 5. Cookie
     * 6. Default config
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->getPreferredLocale($request);

        App::setLocale($locale);

        // Save to session for subsequent requests
        session(['app_locale' => $locale]);

        return $next($request);
    }

    private function getPreferredLocale(Request $request): string
    {
        // 1. URL parameter
        if ($request->has('lang')) {
            return $request->lang;
        }

        // 2. Session
        if (session()->has('app_locale')) {
            return session('app_locale');
        }

        // 3. User preference
        if ($request->user() && $request->user()->preferred_locale) {
            return $request->user()->preferred_locale;
        }

        // 4. Cookie
        if ($request->hasCookie('app_locale')) {
            return $request->cookie('app_locale');
        }

        // 5. Browser header
        $browserLocale = substr($request->server('HTTP_ACCEPT_LANGUAGE'), 0, 2);
        if (in_array($browserLocale, ['es', 'ca', 'en', 'fr', 'de'])) {
            return $browserLocale;
        }

        // 6. Default
        return config('app.locale');
    }
}
