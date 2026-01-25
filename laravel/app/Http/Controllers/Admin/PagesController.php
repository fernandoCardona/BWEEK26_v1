<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PagesController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Pages/Index');
    }

    public function edit(string $page)
    {
        return Inertia::render('Admin/Pages/Edit', ['page' => $page]);
    }

    public function update(string $page, Request $request)
    {
        return redirect()->route('admin.pages.edit', ['page' => $page]);
    }
}
