<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ChatbotAuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1/chatbot')->group(function () {
    Route::post('/auth/login', [ChatbotAuthController::class, 'login'])->middleware('throttle:chatbot-auth');
    Route::post('/auth/register', [\App\Http\Controllers\Api\RegistrationController::class, 'register'])->middleware('throttle:chatbot-auth');


    Route::middleware(['auth:api'])->group(function () {
        Route::get('/user', function (Request $request) {
            $user = $request->user();
            return [
                'id' => $user?->id,
                'name' => $user?->name,
                'email' => $user?->email,
                'role' => $user?->role,
                'locale' => $user?->preferred_locale,
            ];
        });

        // Endpoints específicos para n8n definidos en el Master Prompt
        Route::post('/auth/logout', [ChatbotAuthController::class, 'logout']);
        Route::get('/auth/verify', [ChatbotAuthController::class, 'verify']);
    });
});
