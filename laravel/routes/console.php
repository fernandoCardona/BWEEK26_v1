<?php

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

Artisan::command('users:reset-password {email} {password}', function (string $email, string $password) {
    $normalizedEmail = strtolower(trim($email));
    $user = User::query()
        ->whereRaw('lower(email) = ?', [$normalizedEmail])
        ->first();
    if (!$user) {
        $this->error("No existe el usuario: {$normalizedEmail}");
        return 1;
    }

    $user->forceFill([
        'password' => $password,
        'is_active' => true,
    ])->save();

    $ok = Hash::check($password, (string) $user->password);
    if (!$ok) {
        $this->error("No se pudo verificar la contraseña para: {$email}");
        return 1;
    }

    $this->info("Password reseteado OK: {$normalizedEmail}");
    return 0;
})->purpose('Resetear contraseña (sin imprimirla) y reactivar usuario');

Artisan::command('users:list {--limit=20}', function () {
    $limit = (int) $this->option('limit');
    $users = User::query()->orderBy('created_at', 'desc')->limit($limit)->get(['id', 'email', 'role', 'is_active', 'created_at']);
    foreach ($users as $u) {
        $this->line("{$u->email} | {$u->role} | active=" . (($u->is_active ?? true) ? '1' : '0'));
    }
    $this->info('Total: ' . User::query()->count());
})->purpose('Listar usuarios (debug)');

Artisan::command('users:ensure {email} {password} {--role=user}', function (string $email, string $password) {
    $normalizedEmail = strtolower(trim($email));
    $role = (string) $this->option('role');
    if (!in_array($role, ['user', 'admin', 'super_admin'], true)) {
        $this->error("Rol inválido: {$role}");
        return 1;
    }

    $user = User::query()
        ->whereRaw('lower(email) = ?', [$normalizedEmail])
        ->first();

    if (!$user) {
        $name = explode('@', $normalizedEmail)[0] ?? 'User';
        $user = new User();
        $user->fill([
            'name' => $name,
            'email' => $normalizedEmail,
            'password' => $password,
            'email_verified_at' => now(),
        ]);
        $user->forceFill([
            'role' => $role,
            'is_active' => true,
        ])->save();

        $this->info("Usuario creado OK: {$normalizedEmail} ({$role})");
        return 0;
    }

    $user->forceFill([
        'password' => $password,
        'role' => $role,
        'is_active' => true,
    ])->save();

    $ok = Hash::check($password, (string) $user->password);
    if (!$ok) {
        $this->error("No se pudo verificar la contraseña para: {$normalizedEmail}");
        return 1;
    }

    $this->info("Usuario actualizado OK: {$normalizedEmail} ({$role})");
    return 0;
})->purpose('Crear/actualizar un usuario y fijar password+rol');

Artisan::command('core-users:ensure', function () {
    $fixedUsers = (array) config('core_users.fixed_users', []);
    $password = (string) config('core_users.fixed_password', 'c4c4v4c4');

    foreach ($fixedUsers as $u) {
        $email = strtolower(trim((string) ($u['email'] ?? '')));
        $role = (string) ($u['role'] ?? 'user');
        if ($email === '') {
            continue;
        }

        $this->call('users:ensure', [
            'email' => $email,
            'password' => $password,
            '--role' => $role,
        ]);
    }
})->purpose('Asegurar usuarios fijos definidos en config/core_users.php');
