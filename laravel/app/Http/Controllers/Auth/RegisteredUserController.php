<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\EmailVerificationCode;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class RegisteredUserController extends Controller
{
    private function supportedLocales(): array
    {
        return ['es', 'ca', 'en', 'fr', 'it', 'de'];
    }

    public function create()
    {
        return Inertia::render('Auth/Register');
    }

    public function requestCode(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'preferred_locale' => ['nullable', 'string', 'in:es,ca,en,fr,it,de'],
        ]);

        if (User::query()->where('email', $data['email'])->exists()) {
            return back()->withErrors([
                'email' => 'Este email ya está registrado.',
            ]);
        }

        $code = (string) random_int(100000, 999999);

        EmailVerificationCode::query()->updateOrCreate(
            ['email' => $data['email']],
            [
                'code_hash' => Hash::make($code),
                'payload' => [
                    'name' => $data['name'],
                    'password_hash' => Hash::make($data['password']),
                    'preferred_locale' => $data['preferred_locale'] ?? app()->getLocale(),
                ],
                'expires_at' => now()->addMinutes(10),
            ]
        );

        Mail::raw("Tu código de verificación es: {$code}\n\nEste código caduca en 10 minutos.", function ($message) use ($data) {
            $message->to($data['email'])->subject('Código de verificación • Bears Sitges Week');
        });

        return back();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'verification_code' => ['required', 'string', 'min:6', 'max:6'],
        ]);

        if (User::query()->where('email', $data['email'])->exists()) {
            return back()->withErrors([
                'email' => 'Este email ya está registrado.',
            ]);
        }

        $record = EmailVerificationCode::query()
            ->where('email', $data['email'])
            ->where('expires_at', '>', now())
            ->first();

        if (!$record || !Hash::check($data['verification_code'], $record->code_hash)) {
            return back()->withErrors([
                'verification_code' => 'Código inválido o caducado.',
            ]);
        }

        $payload = $record->payload ?? [];
        $name = (string) ($payload['name'] ?? '');
        $passwordHash = (string) ($payload['password_hash'] ?? '');
        $preferredLocale = strtolower((string) ($payload['preferred_locale'] ?? ''));
        if (!in_array($preferredLocale, $this->supportedLocales(), true)) {
            $preferredLocale = app()->getLocale();
        }
        if (!in_array($preferredLocale, $this->supportedLocales(), true)) {
            $preferredLocale = 'en';
        }

        if ($name === '' || $passwordHash === '') {
            return back()->withErrors([
                'verification_code' => 'No se pudo completar el registro. Solicita un nuevo código.',
            ]);
        }

        $user = new User();
        $user->fill([
            'name' => $name,
            'email' => $data['email'],
            'password' => $passwordHash,
            'email_verified_at' => now(),
            'preferred_locale' => $preferredLocale,
        ]);
        $user->role = 'user';
        $user->is_active = true;
        $user->save();

        $record->delete();

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard');
    }
}
