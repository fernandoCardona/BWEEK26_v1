<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\PagesController as AdminPagesController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Admin\EventsController as AdminEventsController;
use App\Http\Controllers\ChatbotWebController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\Admin\UsersController as AdminUsersController;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Controllers\User\DashboardController as UserDashboardController;
use App\Http\Controllers\User\StoreController as UserStoreController;
use App\Http\Controllers\WebsiteMenuController;
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

Route::get('/menu/{category}/items', [WebsiteMenuController::class, 'categoryJson'])->name('menu.items');

Route::get('/about', [WebsiteMenuController::class, 'category'])->defaults('category', 'about')->name('about.index');
Route::get('/about/{page}', function ($page) {
    return app(WebsiteMenuController::class)->page('about', $page);
})->name('about.page');

Route::get('/events', [WebsiteMenuController::class, 'category'])->defaults('category', 'events')->name('events.menu');
Route::get('/events/{page}', function ($page) {
    return app(WebsiteMenuController::class)->page('events', $page);
})->name('events.page');

Route::get('/magazine', [WebsiteMenuController::class, 'category'])->defaults('category', 'magazine')->name('magazine.index');
Route::get('/magazine/{page}', function ($page) {
    return app(WebsiteMenuController::class)->page('magazine', $page);
})->name('magazine.page');

Route::get('/recomendations', [WebsiteMenuController::class, 'category'])->defaults('category', 'recomendations')->name('recomendations.index');
Route::get('/recomendations/{page}', function ($page) {
    return app(WebsiteMenuController::class)->page('recomendations', $page);
})->name('recomendations.page');

Route::get('/store', [WebsiteMenuController::class, 'category'])->defaults('category', 'store')->name('store.index');
Route::get('/store/{page}', function ($page) {
    return app(WebsiteMenuController::class)->page('store', $page);
})->name('store.page');

Route::middleware('auth')->group(function () {
    Route::get('/me/tickets', [TicketController::class, 'myTickets'])->name('tickets.my');
    Route::post('/events/{event}/purchase', [TicketController::class, 'purchase'])->name('tickets.purchase');
});


Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/send-password-reset', [ProfileController::class, 'sendPasswordReset'])->name('profile.password.reset');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/dashboard', function () {
        $user = request()->user();
        if ($user && in_array($user->role, ['super_admin', 'admin'], true)) {
            return redirect()->route('admin.dashboard');
        }
        return redirect()->route('user.dashboard');
    })->name('dashboard');

    Route::get('/me', function () {
        return redirect()->route('user.dashboard');
    })->name('user.home');
    Route::get('/me/dashboard', [UserDashboardController::class, 'overview'])->name('user.dashboard');
    Route::get('/me/store', [UserStoreController::class, 'index'])->name('user.store');
});

Route::middleware(['auth', EnsureAdmin::class])->prefix('admin')->group(function () {
    Route::get('/dashboard', AdminDashboardController::class)->name('admin.dashboard');
    Route::get('/ecommerce', function () {
        return redirect()->route('admin.dashboard');
    })->name('admin.ecommerce.index');
    Route::get('/events', [AdminEventsController::class, 'index'])->name('admin.events.index');
    Route::get('/events/{event}', [AdminEventsController::class, 'edit'])->name('admin.events.edit');
    Route::patch('/events/{event}', [AdminEventsController::class, 'update'])->name('admin.events.update');
    Route::middleware([EnsureSuperAdmin::class])->group(function () {
        Route::get('/events/create', [AdminEventsController::class, 'create'])->name('admin.events.create');
        Route::post('/events', [AdminEventsController::class, 'store'])->name('admin.events.store');
        Route::delete('/events/{event}', [AdminEventsController::class, 'destroy'])->name('admin.events.destroy');
    });
    Route::get('/marketing', function () {
        return redirect()->route('admin.dashboard');
    })->name('admin.marketing.index');
    Route::get('/users', [AdminUsersController::class, 'index'])->name('admin.users.index');
    Route::post('/users', [AdminUsersController::class, 'store'])->name('admin.users.store');
    Route::get('/users/{user}', [AdminUsersController::class, 'show'])->name('admin.users.show');
    Route::patch('/users/{user}', [AdminUsersController::class, 'update'])->name('admin.users.update');
    Route::patch('/users/{user}/active', [AdminUsersController::class, 'toggleActive'])->name('admin.users.active');
    Route::post('/users/{user}/send-password-reset', [AdminUsersController::class, 'sendPasswordReset'])->name('admin.users.password.reset');
    Route::delete('/users/{user}', [AdminUsersController::class, 'destroy'])->name('admin.users.destroy');
    Route::patch('/users/{user}/tickets/{ticket}', [AdminUsersController::class, 'updateTicket'])->name('admin.users.tickets.update');
    Route::delete('/users/{user}/tickets/{ticket}', [AdminUsersController::class, 'destroyTicket'])->name('admin.users.tickets.destroy');
    Route::middleware([EnsureSuperAdmin::class])->group(function () {
        Route::patch('/users/{user}/role', [AdminUsersController::class, 'updateRole'])->name('admin.users.role.update');
    });
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
    ->where('slug', '^(?!api|admin|dashboard|events|about|magazine|recomendations|store|shop|login|register|logout|profile).+')
    ->name('pages.show');

require __DIR__ . '/auth.php';
