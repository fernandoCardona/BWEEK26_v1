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
        $supported = ['es', 'ca', 'en', 'fr', 'it', 'de'];
        $fallback = 'en';

        // 1. URL parameter
        if ($request->has('lang')) {
            $lang = strtolower((string) $request->get('lang'));
            if (in_array($lang, $supported, true)) {
                return $lang;
            }
        }

        // 2. Session
        if (session()->has('app_locale')) {
            $lang = strtolower((string) session('app_locale'));
            if (in_array($lang, $supported, true)) {
                return $lang;
            }
        }

        // 3. User preference
        if ($request->user() && $request->user()->preferred_locale) {
            $lang = strtolower((string) $request->user()->preferred_locale);
            if (in_array($lang, $supported, true)) {
                return $lang;
            }
        }

        // 4. Cookie
        if ($request->hasCookie('app_locale')) {
            $lang = strtolower((string) $request->cookie('app_locale'));
            if (in_array($lang, $supported, true)) {
                return $lang;
            }
        }

        // 5. Browser header
        $browser = $request->getPreferredLanguage($supported);
        if ($browser && in_array($browser, $supported, true)) {
            return $browser;
        }

        // 6. Default
        $default = strtolower((string) config('app.locale', $fallback));
        return in_array($default, $supported, true) ? $default : $fallback;
    }
}
