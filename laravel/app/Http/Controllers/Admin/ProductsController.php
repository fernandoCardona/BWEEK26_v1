<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductCategory;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
                'create' => in_array($request->user()?->role, ['super_admin', 'admin'], true),
            ],
        ]);
    }

    public function create(Request $request)
    {
        $categories = ProductCategory::query()->where('is_active', true)->orderBy('name')->get();
        return Inertia::render('Admin/Products/Edit', [
            'product' => null,
            'categories' => $categories,
            'can' => [
                'delete' => false,
                'manage_stock' => in_array($request->user()?->role, ['super_admin', 'admin'], true),
                'toggle_active' => in_array($request->user()?->role, ['super_admin', 'admin'], true),
            ],
        ]);
    }

    public function edit(Request $request, Product $product)
    {
        $locale = app()->getLocale();
        $role = $request->user()?->role;
        $categories = ProductCategory::query()->where('is_active', true)->orderBy('name')->get();

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
                'images' => $product->images()->get()->map(fn (ProductImage $img) => [
                    'id' => $img->id,
                    'url' => Storage::disk('public')->url($img->path),
                    'sort_order' => $img->sort_order,
                ]),
                'variants' => $product->variants()->orderBy('size')->orderBy('color')->get()->map(function ($v) {
                    return [
                        'id' => $v->id,
                        'size' => $v->size,
                        'color' => $v->color,
                        'price' => (string) $v->price,
                        'stock' => (int) $v->stock,
                        'is_active' => (bool) $v->is_active,
                    ];
                }),
            ],
            'categories' => $categories,
            'can' => [
                'delete' => $role === 'super_admin',
                'manage_stock' => in_array($role, ['super_admin', 'admin'], true),
                'toggle_active' => in_array($role, ['super_admin', 'admin'], true),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateProduct($request);
        $variants = $request->validate([
            'variants' => ['nullable', 'array', 'max:200'],
            'variants.*.size' => ['nullable', 'string', 'max:20'],
            'variants.*.color' => ['nullable', 'string', 'max:30'],
            'variants.*.price' => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.stock' => ['required_with:variants', 'integer', 'min:0'],
            'variants.*.is_active' => ['nullable', 'boolean'],
        ])['variants'] ?? [];

        $product = DB::transaction(function () use ($request, $data, $variants) {
            $product = new Product();
            $product->fill($data);
            $product->save();

            if (!empty($variants)) {
                $rows = [];
                $seen = [];
                foreach ($variants as $v) {
                    $size = $v['size'] ?? null;
                    $color = $v['color'] ?? null;
                    $key = strtolower(trim((string) $size)) . '|' . strtolower(trim((string) $color));
                    if (isset($seen[$key])) {
                        continue;
                    }
                    $seen[$key] = true;
                    $rows[] = [
                        'product_id' => $product->id,
                        'size' => $size,
                        'color' => $color,
                        'price' => $v['price'],
                        'stock' => (int) ($v['stock'] ?? 0),
                        'is_active' => (bool) ($v['is_active'] ?? true),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                if (!empty($rows)) {
                    ProductVariant::query()->insert($rows);
                    $product->stock = array_sum(array_map(fn ($r) => (int) ($r['stock'] ?? 0), $rows));
                    $product->save();
                }
            }

            $this->handleImage($request, $product);

            return $product;
        });

        return redirect()->route('admin.products.edit', $product->id);
    }

    public function update(Request $request, Product $product)
    {
        $role = $request->user()?->role;
        $data = $this->validateProduct($request, !in_array($role, ['super_admin', 'admin'], true));

        $product->fill($data);
        $product->save();

        if (in_array($role, ['super_admin', 'admin'], true)) {
            $this->handleImage($request, $product);
        }

        return back();
    }

    public function storeVariant(Request $request, Product $product)
    {
        $data = $request->validate([
            'size' => ['required', 'string', 'max:20'],
            'color' => ['nullable', 'string', 'max:30'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);
        $variant = \App\Models\ProductVariant::create([
            'product_id' => $product->id,
            'size' => $data['size'],
            'color' => $data['color'] ?? null,
            'price' => $data['price'],
            'stock' => (int) $data['stock'],
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);
        return response()->json($variant, 201);
    }

    public function updateVariant(Request $request, Product $product, \App\Models\ProductVariant $variant)
    {
        if ($variant->product_id !== $product->id) {
            abort(404);
        }
        $data = $request->validate([
            'size' => ['required', 'string', 'max:20'],
            'color' => ['nullable', 'string', 'max:30'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);
        $variant->update([
            'size' => $data['size'],
            'color' => $data['color'] ?? null,
            'price' => $data['price'],
            'stock' => (int) $data['stock'],
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);
        return response()->json(['status' => 'ok']);
    }

    public function destroyVariant(Request $request, Product $product, \App\Models\ProductVariant $variant)
    {
        if ($variant->product_id !== $product->id) {
            abort(404);
        }
        $variant->delete();
        return response()->json(['status' => 'ok']);
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
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
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

    public function destroyMainImage(Request $request, Product $product)
    {
        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
            $product->image_path = null;
            $product->save();
        }
        return response()->json(['status' => 'ok']);
    }

    public function storeImage(Request $request, Product $product)
    {
        $data = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);
        $path = $request->file('image')->store('products', 'public');
        $order = (int) ($product->images()->max('sort_order') ?? 0) + 1;
        $image = ProductImage::create([
            'product_id' => $product->id,
            'path' => $path,
            'sort_order' => $order,
        ]);
        return response()->json([
            'id' => $image->id,
            'url' => Storage::disk('public')->url($image->path),
            'sort_order' => $image->sort_order,
        ], 201);
    }

    public function destroyImage(Request $request, Product $product, ProductImage $image)
    {
        if ($image->product_id !== $product->id) {
            abort(404);
        }
        Storage::disk('public')->delete($image->path);
        $image->delete();
        return response()->json(['status' => 'ok']);
    }

    public function storeCategory(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);
        $cat = ProductCategory::create(['name' => $data['name'], 'is_active' => true]);
        return response()->json(['id' => $cat->id, 'name' => $cat->name, 'slug' => $cat->slug], 201);
    }
}
