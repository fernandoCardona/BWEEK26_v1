<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Vite;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Gate::before(function (?User $user, string $ability) {
            if ($user && $user->isSuperAdmin()) {
                return true;
            }

            return null;
        });

        // Register AI Sync Observers
        \App\Models\Page::observe(\App\Observers\PageObserver::class);
        \App\Models\Product::observe(\App\Observers\ProductObserver::class);

        RateLimiter::for('chatbot-auth', function (Request $request) {
            $email = strtolower((string) $request->input('email', ''));
            $key = $request->ip() . '|' . $email;

            return Limit::perMinute(10)->by($key);
        });
    }
}
