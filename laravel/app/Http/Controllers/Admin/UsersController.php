<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UsersController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Users/Index');
    }

    public function updateRole(Request $request, User $user)
    {
        $request->validate([
            'role' => ['required', 'string', 'in:user,admin,super_admin'],
        ]);

        $authUser = $request->user();
        if ($authUser && $authUser->id === $user->id) {
            return back()->withErrors([
                'role' => 'No puedes cambiar tu propio rol.',
            ]);
        }

        $user->update([
            'role' => $request->string('role')->toString(),
        ]);

        return back();
    }
}
