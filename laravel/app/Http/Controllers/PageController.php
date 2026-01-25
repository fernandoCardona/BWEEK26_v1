<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class PageController extends Controller
{
    public function home()
    {
        return Inertia::render('Home');
    }

    public function show(string $slug)
    {
        return Inertia::render('Page', ['slug' => $slug]);
    }
}
