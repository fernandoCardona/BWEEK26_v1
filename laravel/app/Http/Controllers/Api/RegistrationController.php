<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class RegistrationController extends Controller
{
    /**
     * Register a new user via the chatbot or web form.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string',
            'registration_source' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'registration_source' => $request->registration_source ?? 'web',
            'role' => 'user',
        ]);

        // If there's a lead with this email, convert it
        $lead = Lead::where('email', $request->email)->first();
        if ($lead) {
            $lead->update([
                'status' => 'converted',
                'converted_to_user_id' => $user->id,
            ]);
        }

        return response()->json([
            'message' => 'User registered successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]
        ], 201);
    }
}
