<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductsController extends Controller
{
    public function index(Request $request)
    {
        $locale = app()->getLocale();

        $products = Product::query()
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Product $p) use ($locale) {
                return [
                    'id' => $p->id,
                    'name' => $p->name[$locale] ?? ($p->name['es'] ?? ''),
                    'category' => $p->category,
                    'price' => (string) $p->price,
                    'stock' => (int) $p->stock,
                    'is_active' => (bool) $p->is_active,
                    'image_url' => $p->image_path ? Storage::disk('public')->url($p->image_path) : null,
                ];
            });

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'can' => [
                'create' => $request->user()?->role === 'super_admin',
            ],
        ]);
    }

    public function create(Request $request)
    {
        return Inertia::render('Admin/Products/Edit', [
            'product' => null,
            'can' => [
                'delete' => false,
                'manage_stock' => true,
                'toggle_active' => true,
            ],
        ]);
    }

    public function edit(Request $request, Product $product)
    {
        $locale = app()->getLocale();
        $role = $request->user()?->role;

        return Inertia::render('Admin/Products/Edit', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name[$locale] ?? ($product->name['es'] ?? ''),
                'description' => $product->description[$locale] ?? ($product->description['es'] ?? ''),
                'category' => $product->category,
                'price' => (string) $product->price,
                'stock' => (int) $product->stock,
                'is_active' => (bool) $product->is_active,
                'image_url' => $product->image_path ? Storage::disk('public')->url($product->image_path) : null,
            ],
            'can' => [
                'delete' => $role === 'super_admin',
                'manage_stock' => $role === 'super_admin',
                'toggle_active' => $role === 'super_admin',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateProduct($request);

        $product = new Product();
        $product->fill($data);
        $product->save();

        $this->handleImage($request, $product);

        return redirect()->route('admin.products.edit', $product->id);
    }

    public function update(Request $request, Product $product)
    {
        $role = $request->user()?->role;
        $data = $this->validateProduct($request, $role !== 'super_admin');

        $product->fill($data);
        $product->save();

        if ($role === 'super_admin') {
            $this->handleImage($request, $product);
        }

        return back();
    }

    public function destroy(Request $request, Product $product)
    {
        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }
        $product->delete();
        return redirect()->route('admin.products.index');
    }

    private function validateProduct(Request $request, bool $limited = false): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'file', 'max:4096'],
        ]);

        $locale = app()->getLocale();

        $payload = [
            'name' => [$locale => $data['name']],
            'description' => [$locale => $data['description']],
            'category' => $data['category'] ?? null,
            'price' => $data['price'],
        ];

        if (!$limited) {
            $payload['stock'] = (int) ($data['stock'] ?? 0);
            $payload['is_active'] = (bool) ($data['is_active'] ?? true);
        }

        return $payload;
    }

    private function handleImage(Request $request, Product $product): void
    {
        if (!$request->hasFile('image')) {
            return;
        }

        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }

        $product->image_path = $request->file('image')->store('products', 'public');
        $product->save();
    }
}

