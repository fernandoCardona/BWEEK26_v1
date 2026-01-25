<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\PagesController as AdminPagesController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\ChatbotWebController;
use App\Http\Controllers\TicketController;
use App\Http\Middleware\EnsureSuperAdmin;
use Illuminate\Support\Facades\Route;

Route::get('/', [PageController::class, 'home'])->name('home');

Route::get('/cart', function () {
    return response()->json(['status' => 'ok']);
})->name('cart.index');

Route::get('/get_token', function () {
    return response()->json(['token' => csrf_token()]);
})->name('get_token');

Route::get('/shop', [\App\Http\Controllers\ProductController::class, 'index'])->name('products.index');
Route::get('/shop/{product}', [\App\Http\Controllers\ProductController::class, 'show'])->name('products.show');

Route::get('/events', [\App\Http\Controllers\EventController::class, 'index'])->name('events.index');
Route::get('/events/{event}', [\App\Http\Controllers\EventController::class, 'show'])->name('events.show');

Route::post('/chatbot/message', [ChatbotWebController::class, 'message'])->name('chatbot.message');

Route::middleware('auth')->group(function () {
    Route::get('/me/tickets', [TicketController::class, 'myTickets'])->name('tickets.my');
    Route::post('/events/{event}/purchase', [TicketController::class, 'purchase'])->name('tickets.purchase');
});


Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::get('/dashboard', function () {
        $user = request()->user();
        if ($user && $user->role === 'super_admin') {
            return redirect()->route('admin.dashboard');
        }
        return redirect()->route('profile.edit');
    })->name('dashboard');
});

Route::middleware(['auth', EnsureSuperAdmin::class])->prefix('admin')->group(function () {
    Route::get('/dashboard', AdminDashboardController::class)->name('admin.dashboard');
    Route::get('/ecommerce', function () {
        return redirect()->route('admin.dashboard');
    })->name('admin.ecommerce.index');
    Route::get('/events', function () {
        return redirect()->route('admin.dashboard');
    })->name('admin.events.index');
    Route::get('/marketing', function () {
        return redirect()->route('admin.dashboard');
    })->name('admin.marketing.index');
    Route::get('/users', function () {
        return redirect()->route('admin.dashboard');
    })->name('admin.users.index');
    Route::get('/pages', [AdminPagesController::class, 'index'])->name('admin.pages.index');
    Route::get('/pages/{page}', [AdminPagesController::class, 'edit'])->name('admin.pages.edit');
    Route::patch('/pages/{page}', [AdminPagesController::class, 'update'])->name('admin.pages.update');

    Route::get('/settings', AdminSettingsController::class)->name('admin.settings');
    Route::get('/settings/profile', [AdminSettingsController::class, 'profile'])->name('admin.settings.profile');
    Route::post('/settings/profile', [AdminSettingsController::class, 'handleProfile'])->name('admin.settings.profile.store');
    Route::get('/settings/general', [AdminSettingsController::class, 'general'])->name('admin.settings.general');
    Route::post('/settings/general', [AdminSettingsController::class, 'handleGeneral'])->name('admin.settings.general.store');
});

Route::get('/{slug}', [PageController::class, 'show'])
    ->where('slug', '^(?!api|admin|dashboard|events|shop|login|register|logout|profile).+')
    ->name('pages.show');

require __DIR__ . '/auth.php';
