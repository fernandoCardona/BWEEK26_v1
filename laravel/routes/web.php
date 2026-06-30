<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\PagesController as AdminPagesController;
use App\Http\Controllers\Admin\SectionsController as AdminSectionsController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Admin\EventsController as AdminEventsController;
use App\Http\Controllers\Admin\ProductsController as AdminProductsController;
use App\Http\Controllers\ChatbotWebController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Admin\EcommerceController as AdminEcommerceController;
use App\Http\Controllers\Admin\UsersController as AdminUsersController;
use App\Http\Controllers\Admin\ProductCategoriesController as AdminProductCategoriesController;
use App\Http\Controllers\User\DashboardController as UserDashboardController;
use App\Http\Controllers\User\StoreController as UserStoreController;
use App\Http\Controllers\WebsiteMenuController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PageController::class, 'home'])->name('home');

Route::get('/get_token', function () {
    return response()->json(['token' => csrf_token()]);
})->name('get_token');

Route::get('/shop', [\App\Http\Controllers\ProductController::class, 'index'])->name('products.index');
Route::get('/shop/{product}', [\App\Http\Controllers\ProductController::class, 'show'])->name('products.show');

Route::get('/events', [\App\Http\Controllers\EventController::class, 'index'])->name('events.index');
Route::get('/events/{event}', [\App\Http\Controllers\EventController::class, 'show'])->name('events.show');

Route::post('/chatbot/message', [ChatbotWebController::class, 'message'])->middleware('throttle:30,1')->name('chatbot.message');

Route::get('/menu/{category}/items', [WebsiteMenuController::class, 'categoryJson'])->name('menu.items');

Route::get('/about', [PageController::class, 'show'])->defaults('slug', 'about')->name('about.index');
Route::get('/about/{page}', function ($page) {
    return app(WebsiteMenuController::class)->page('about', $page);
})->name('about.page');

Route::get('/program', [WebsiteMenuController::class, 'category'])->defaults('category', 'events')->name('program.index');
Route::get('/program/{page}', function ($page) {
    return app(WebsiteMenuController::class)->page('events', $page);
})->name('program.page');

Route::get('/magazine', [PageController::class, 'show'])->defaults('slug', 'magazine')->name('magazine.index');
Route::get('/magazine/{page}', function ($page) {
    return app(WebsiteMenuController::class)->page('magazine', $page);
})->name('magazine.page');

Route::get('/recomendations', [PageController::class, 'show'])->defaults('slug', 'recommendations')->name('recomendations.index');
Route::get('/recomendations/{page}', function ($page) {
    return app(WebsiteMenuController::class)->page('recomendations', $page);
})->name('recomendations.page');

Route::get('/store', [PageController::class, 'show'])->defaults('slug', 'store')->name('store.index');
Route::get('/legal', [PageController::class, 'show'])->defaults('slug', 'legal')->name('legal.index');
Route::get('/store/{page}', function ($page) {
    return app(WebsiteMenuController::class)->page('store', $page);
})->name('store.page');

Route::middleware('auth')->group(function () {
    Route::get('/me/tickets', [TicketController::class, 'myTickets'])->name('tickets.my');
    Route::post('/events/{event}/purchase', [TicketController::class, 'purchase'])->name('tickets.purchase');
});

Route::get('/tickets', [TicketController::class, 'catalog'])->name('tickets.index');
Route::middleware('signed')->get('/tickets/scan/{ticket}', [\App\Http\Controllers\TicketScanController::class, 'show'])->name('tickets.scan');

Route::middleware('auth')->group(function () {
    Route::get('/cart', [CartController::class, 'page'])->name('cart.index');
    Route::get('/cart/data', [CartController::class, 'show'])->name('cart.data');
    Route::post('/cart/items', [CartController::class, 'addItem'])->name('cart.items.add');
    Route::patch('/cart/items/{item}', [CartController::class, 'updateItem'])->name('cart.items.update');
    Route::delete('/cart/items/{item}', [CartController::class, 'removeItem'])->name('cart.items.remove');
    Route::post('/cart/checkout', [CartController::class, 'checkout'])->name('cart.checkout');
    Route::post('/checkout/stripe', [CheckoutController::class, 'createStripeCheckout'])->name('checkout.stripe');
    Route::post('/checkout/paypal', [CheckoutController::class, 'createPaypalCheckout'])->name('checkout.paypal');
    Route::get('/checkout/paypal/return', [CheckoutController::class, 'paypalReturn'])->name('checkout.paypal.return');
    Route::get('/checkout/return', [\App\Http\Controllers\CheckoutReturnController::class, 'index'])->name('checkout.return');
    Route::get('/api/order/{transaction}/status', [\App\Http\Controllers\OrderStatusController::class, 'show'])->name('order.status');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/send-password-reset', [ProfileController::class, 'sendPasswordReset'])->name('profile.password.reset');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/dashboard', function () {
        $user = request()->user();
        if ($user && $user->isAdminLike()) {
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

Route::middleware(['auth', 'permission:admin.access'])->prefix('admin')->group(function () {
    Route::get('/dashboard', AdminDashboardController::class)->name('admin.dashboard');
    Route::get('/ecommerce', [AdminEcommerceController::class, 'index'])->name('admin.ecommerce.index');
    Route::get('/ecommerce/warehouse', [AdminEcommerceController::class, 'warehouse'])->name('admin.ecommerce.warehouse');
    Route::patch('/ecommerce/tickets/{ticketType}', [AdminEcommerceController::class, 'updateTicketType'])->name('admin.ecommerce.tickets.update');
    Route::post('/ecommerce/tickets', [AdminEcommerceController::class, 'storeTicket'])->name('admin.ecommerce.tickets.store');
    Route::post('/ecommerce/ticket-templates', [AdminEcommerceController::class, 'storeTicketTemplate'])->name('admin.ecommerce.ticket-templates.store');
    Route::patch('/ecommerce/ticket-templates/{ticketTemplate}', [AdminEcommerceController::class, 'updateTicketTemplate'])->name('admin.ecommerce.ticket-templates.update');
    Route::delete('/transactions/{transaction}', [\App\Http\Controllers\Admin\TransactionsController::class, 'destroy'])->name('admin.transactions.destroy');
    Route::get('/agenda', [\App\Http\Controllers\Admin\AgendaController::class, 'index'])->name('admin.agenda.index');
    Route::post('/agenda/locations', [\App\Http\Controllers\Admin\AgendaController::class, 'storeLocation'])->name('admin.agenda.locations.store');
    Route::patch('/agenda/locations/{location}', [\App\Http\Controllers\Admin\AgendaController::class, 'updateLocation'])->name('admin.agenda.locations.update');
    Route::post('/agenda/templates', [\App\Http\Controllers\Admin\AgendaController::class, 'storeTemplate'])->name('admin.agenda.templates.store');
    Route::patch('/agenda/templates/{template}', [\App\Http\Controllers\Admin\AgendaController::class, 'updateTemplate'])->name('admin.agenda.templates.update');
    Route::get('/products', [AdminProductsController::class, 'index'])->name('admin.products.index');
    Route::get('/products/create', [AdminProductsController::class, 'create'])->name('admin.products.create');
    Route::post('/products', [AdminProductsController::class, 'store'])->name('admin.products.store');
    Route::post('/products/categories', [AdminProductsController::class, 'storeCategory'])->name('admin.products.categories.store');
    Route::get('/product-categories', [AdminProductCategoriesController::class, 'index'])->name('admin.product-categories.index');
    Route::post('/product-categories', [AdminProductCategoriesController::class, 'store'])->name('admin.product-categories.store');
    Route::patch('/product-categories/{category}', [AdminProductCategoriesController::class, 'update'])->name('admin.product-categories.update');
    Route::delete('/product-categories/{category}', [AdminProductCategoriesController::class, 'destroy'])->name('admin.product-categories.destroy');
    Route::post('/products/{product}/variants', [AdminProductsController::class, 'storeVariant'])->name('admin.products.variants.store');
    Route::patch('/products/{product}/variants/{variant}', [AdminProductsController::class, 'updateVariant'])->name('admin.products.variants.update');
    Route::delete('/products/{product}/variants/{variant}', [AdminProductsController::class, 'destroyVariant'])->name('admin.products.variants.destroy');
    Route::get('/events', [AdminEventsController::class, 'index'])->name('admin.events.index');
    Route::post('/events/{event}/subevents', [AdminEventsController::class, 'storeSubevent'])->name('admin.events.subevents.store');
    Route::post('/events/{event}/ticket-types/attach-template', [AdminEventsController::class, 'attachTicketTemplate'])->name('admin.events.ticket-types.attach-template');
    Route::delete('/events/{event}/days/{day}', [AdminEventsController::class, 'destroyDay'])->name('admin.events.days.destroy');
    Route::patch('/events/{event}/days/{day}', [AdminEventsController::class, 'updateDay'])->name('admin.events.days.update');
    Route::patch('/events/{event}/days/{day}/move', [AdminEventsController::class, 'moveDay'])->name('admin.events.days.move');
    Route::delete('/events/{event}/subevents/{subevent}', [AdminEventsController::class, 'destroySubevent'])->name('admin.events.subevents.destroy');
    Route::middleware(['role:super_admin'])->group(function () {
        Route::get('/events/create', [AdminEventsController::class, 'create'])->name('admin.events.create');
        Route::post('/events', [AdminEventsController::class, 'store'])->name('admin.events.store');
        Route::delete('/events/{event}', [AdminEventsController::class, 'destroy'])->name('admin.events.destroy');
        Route::delete('/ecommerce/ticket-templates/{ticketTemplate}', [AdminEcommerceController::class, 'destroyTicketTemplate'])->name('admin.ecommerce.ticket-templates.destroy');
        Route::delete('/agenda/locations/{location}', [\App\Http\Controllers\Admin\AgendaController::class, 'destroyLocation'])->name('admin.agenda.locations.destroy');
        Route::delete('/agenda/templates/{template}', [\App\Http\Controllers\Admin\AgendaController::class, 'destroyTemplate'])->name('admin.agenda.templates.destroy');
        Route::post('/events/{event}/ticket-types', [AdminEventsController::class, 'upsertTicketType'])->name('admin.events.ticket-types.upsert');
        Route::delete('/events/{event}/ticket-types/{ticketType}', [AdminEventsController::class, 'destroyTicketType'])->name('admin.events.ticket-types.destroy');
        Route::delete('/events/{event}/ticket-types/{ticketType}/image', [AdminEventsController::class, 'destroyTicketTypeImage'])->name('admin.events.ticket-types.image.destroy');
        Route::post('/events/{event}/sponsors', [AdminEventsController::class, 'storeSponsor'])->name('admin.events.sponsors.store');
        Route::patch('/events/{event}/sponsors/{sponsor}', [AdminEventsController::class, 'updateSponsor'])->name('admin.events.sponsors.update');
        Route::delete('/events/{event}/sponsors/{sponsor}', [AdminEventsController::class, 'destroySponsor'])->name('admin.events.sponsors.destroy');
        Route::post('/events/{event}/program-items/{programItem}/flyer', [AdminEventsController::class, 'storeProgramItemFlyer'])->name('admin.events.program-items.flyer.store');
        Route::delete('/events/{event}/program-items/{programItem}/flyer', [AdminEventsController::class, 'destroyProgramItemFlyer'])->name('admin.events.program-items.flyer.destroy');
        Route::post('/events/{event}/banner', [AdminEventsController::class, 'storeEventBanner'])->name('admin.events.banner.store');
        Route::delete('/events/{event}/banner', [AdminEventsController::class, 'destroyEventBanner'])->name('admin.events.banner.destroy');
        Route::post('/events/{event}/logo', [AdminEventsController::class, 'storeEventLogo'])->name('admin.events.logo.store');
        Route::delete('/events/{event}/logo', [AdminEventsController::class, 'destroyEventLogo'])->name('admin.events.logo.destroy');
        Route::post('/events/{event}/flyer', [AdminEventsController::class, 'storeEventFlyer'])->name('admin.events.flyer.store');
        Route::delete('/events/{event}/flyer', [AdminEventsController::class, 'destroyEventFlyer'])->name('admin.events.flyer.destroy');
        Route::delete('/products/{product}', [AdminProductsController::class, 'destroy'])->name('admin.products.destroy');
    });
    Route::get('/products/{product}', [AdminProductsController::class, 'edit'])->name('admin.products.edit');
    Route::patch('/products/{product}', [AdminProductsController::class, 'update'])->name('admin.products.update');
    Route::post('/products/{product}/images', [AdminProductsController::class, 'storeImage'])->name('admin.products.images.store');
    Route::delete('/products/{product}/images/{image}', [AdminProductsController::class, 'destroyImage'])->name('admin.products.images.destroy');
    Route::delete('/products/{product}/image', [AdminProductsController::class, 'destroyMainImage'])->name('admin.products.image.destroy');
    Route::get('/events/{event}', [AdminEventsController::class, 'edit'])->name('admin.events.edit');
    Route::patch('/events/{event}', [AdminEventsController::class, 'update'])->name('admin.events.update');
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
    Route::middleware(['permission:users.role.manage'])->group(function () {
        Route::patch('/users/{user}/role', [AdminUsersController::class, 'updateRole'])->name('admin.users.role.update');
    });
    Route::get('/pages', [AdminPagesController::class, 'index'])->name('admin.pages.index');
    Route::get('/pages/{page}', [AdminPagesController::class, 'edit'])->name('admin.pages.edit');
    Route::patch('/pages/{page}', [AdminPagesController::class, 'update'])->name('admin.pages.update');
    Route::patch('/pages/{page}/bulk', [AdminPagesController::class, 'bulkUpdate'])->name('admin.pages.bulk');
    Route::middleware(['role:super_admin'])->group(function () {
        Route::post('/pages/seed', [AdminPagesController::class, 'seed'])->name('admin.pages.seed');
        Route::post('/pages/{page}/init-home', [AdminPagesController::class, 'initHome'])->name('admin.pages.init_home');
        Route::post('/pages/{page}/init-template', [AdminPagesController::class, 'initTemplate'])->name('admin.pages.init_template');
        Route::post('/pages/{page}/import-legacy', [AdminPagesController::class, 'importLegacy'])->name('admin.pages.import_legacy');
    });

    Route::post('/pages/{page}/sections', [AdminSectionsController::class, 'store'])->name('admin.pages.sections.store');
    Route::patch('/sections/{section}', [AdminSectionsController::class, 'update'])->name('admin.sections.update');
    Route::delete('/sections/{section}', [AdminSectionsController::class, 'destroy'])->name('admin.sections.destroy');
    Route::post('/sections/{section}/images/{key}', [AdminSectionsController::class, 'storeImage'])->name('admin.sections.images.store');
    Route::delete('/sections/{section}/images/{key}', [AdminSectionsController::class, 'destroyImage'])->name('admin.sections.images.destroy');

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

Route::post('/webhooks/stripe', [\App\Http\Controllers\PaymentWebhookController::class, 'stripe'])->middleware('throttle:60,1')->name('webhooks.stripe');
Route::post('/webhooks/paypal', [\App\Http\Controllers\PaymentWebhookController::class, 'paypal'])->middleware('throttle:60,1')->name('webhooks.paypal');
