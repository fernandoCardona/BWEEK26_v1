<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductCategoriesController extends Controller
{
    public function index()
    {
        return response()->json(
            ProductCategory::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'is_active'])
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $slugBase = Str::slug($data['name']);
        $slug = $slugBase;
        $i = 2;
        while (ProductCategory::query()->where('slug', $slug)->exists()) {
            $slug = "{$slugBase}-{$i}";
            $i++;
        }

        $cat = ProductCategory::create([
            'name' => $data['name'],
            'slug' => $slug,
            'is_active' => true,
        ]);

        return response()->json($cat->only(['id', 'name', 'slug', 'is_active']), 201);
    }

    public function update(Request $request, ProductCategory $category)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'is_active' => ['required', 'boolean'],
        ]);

        $category->update([
            'name' => $data['name'],
            'is_active' => (bool) $data['is_active'],
        ]);

        return response()->json(['status' => 'ok']);
    }

    public function destroy(Request $request, ProductCategory $category)
    {
        $category->delete();

        return response()->json(['status' => 'ok']);
    }
}

