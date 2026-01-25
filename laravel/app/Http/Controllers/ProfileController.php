<?php

namespace App\Http\Controllers;

class ProfileController extends Controller
{
    public function edit()
    {
        return \Inertia\Inertia::render('Profile/Edit');
    }
}
