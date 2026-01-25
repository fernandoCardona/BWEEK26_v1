<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Vite;

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

        // Register AI Sync Observers
        \App\Models\Page::observe(\App\Observers\PageObserver::class);
        \App\Models\Product::observe(\App\Observers\ProductObserver::class);
    }
}
