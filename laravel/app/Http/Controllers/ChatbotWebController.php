<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ChatbotWebController extends Controller
{
    public function message(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:10000'],
            'context' => ['nullable', 'array'],
        ]);

        return response()->json([
            'status' => 'ok',
            'echo' => $data['message'],
        ]);
    }
}
