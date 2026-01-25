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
    Route::post('/auth/login', [ChatbotAuthController::class, 'login']);
    Route::post('/auth/register', [\App\Http\Controllers\Api\RegistrationController::class, 'register']);


    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/user', function (Request $request) {
            return $request->user();
        });

        // Endpoints específicos para n8n definidos en el Master Prompt
        Route::post('/auth/logout', [ChatbotAuthController::class, 'logout']);
        Route::get('/auth/verify', [ChatbotAuthController::class, 'verify']);
    });
});
