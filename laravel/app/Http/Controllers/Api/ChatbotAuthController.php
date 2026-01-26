<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Models\AuthLog;

class ChatbotAuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required_without:phone',
            'phone' => 'required_without:email',
            'password' => 'required',
            'channel' => 'required|in:web,whatsapp,telegram'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $credentials = $request->only('password', 'channel');
        $user = null;

        if ($request->has('email')) {
            $user = User::where('email', $request->email)->first();
        } elseif ($request->has('phone')) {
            $user = User::where('phone', $request->phone)->first();
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            $this->logAuth($request, null, 'failed_login');
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        if ($user->is_active === false) {
            $this->logAuth($request, $user->id, 'disabled_user_login');
            return response()->json(['error' => 'User disabled'], 403);
        }

        if (!$user->email_verified_at && $request->channel === 'web') {
            return response()->json(['error' => 'Email not verified', 'action' => 'verify_email'], 403);
        }

        // Generar JWT con claims personalizados
        $token = JWTAuth::fromUser($user, [
            'channel' => $request->channel,
            'ip' => $request->ip(),
        ]);

        $user->update(['last_login_at' => now()]);
        $this->logAuth($request, $user->id, 'chatbot_login', true);

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'locale' => $user->preferred_locale,
            ]
        ]);
    }

    public function verify(Request $request)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            return response()->json([
                'valid' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'locale' => $user->preferred_locale,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['valid' => false, 'error' => 'Invalid or expired token'], 401);
        }
    }

    public function logout(Request $request)
    {
        JWTAuth::invalidate(JWTAuth::getToken());
        return response()->json(['message' => 'Logged out successfully']);
    }

    private function logAuth(Request $request, $userId, $action, $success = false)
    {
        // En un entorno real, esto guardaría en la tabla auth_logs
        // Implementación básica aquí
    }
}
