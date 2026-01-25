<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function __invoke()
    {
        return Inertia::render('Admin/Settings/Profile');
    }

    public function profile()
    {
        return Inertia::render('Admin/Settings/Profile');
    }

    public function general()
    {
        return Inertia::render('Admin/Settings/General');
    }

    public function handleProfile(Request $request)
    {
        return redirect()->route('admin.settings.profile');
    }

    public function handleGeneral(Request $request)
    {
        return redirect()->route('admin.settings.general');
    }
}
