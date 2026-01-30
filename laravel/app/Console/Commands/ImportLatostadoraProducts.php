<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportLatostadoraProducts extends Command
{
    protected $signature = 'products:import-latostadora {--shop=https://www.latostadora.com/shop/bearssitges/#shop} {--limit=48} {--dry-run} {--reset}';

    protected $description = 'Importa productos desde LaTostadora (bearssitges) a products/product_images/product_variants';

    public function handle(): int
    {
        $shopUrl = (string) $this->option('shop');
        $limit = max(1, (int) $this->option('limit'));
        $dryRun = (bool) $this->option('dry-run');
        $reset = (bool) $this->option('reset');

        $this->info("Shop: {$shopUrl}");

        $html = $this->fetchHtml($shopUrl);
        if ($html === null) {
            $this->error('No se pudo descargar la tienda.');
            return 1;
        }

        $productUrls = $this->extractProductUrls($html);
        $productUrls = array_values(array_unique($productUrls));
        $productUrls = array_slice($productUrls, 0, $limit);

        $this->info('Productos detectados: ' . count($productUrls));
        if (empty($productUrls)) {
            return 0;
        }

        if ($reset && !$dryRun) {
            DB::transaction(function () {
                $ids = Product::query()->where('source', 'latostadora')->pluck('id')->values()->all();
                if (!empty($ids)) {
                    Product::query()->whereIn('id', $ids)->delete();
                }
            });
            $this->warn('Reset aplicado: borrados productos source=latostadora');
        }

        $created = 0;
        $updated = 0;

        foreach ($productUrls as $i => $url) {
            $this->line('[' . ($i + 1) . '/' . count($productUrls) . '] ' . $url);
            $pageHtml = $this->fetchHtml($url);
            if ($pageHtml === null) {
                $this->warn('  - no se pudo descargar la página');
                continue;
            }

            $data = $this->parseProductPage($pageHtml, $url);
            if (!$data['title'] || !$data['price']) {
                $this->warn('  - faltan datos (title/price), se omite');
                continue;
            }

            if ($dryRun) {
                $this->info('  - ' . $data['title'] . ' | ' . $data['price'] . '€ | ' . ($data['category'] ?? '—'));
                continue;
            }

            DB::transaction(function () use ($data, &$created, &$updated) {
                $p = Product::query()
                    ->where('source', 'latostadora')
                    ->where('external_url', $data['url'])
                    ->first();

                $payload = [
                    'name' => ['es' => $data['title']],
                    'description' => $data['description'] ? ['es' => $data['description']] : null,
                    'price' => $data['price'],
                    'stock' => 9999,
                    'category' => $data['category'],
                    'source' => 'latostadora',
                    'external_url' => $data['url'],
                    'is_active' => true,
                ];

                if (!$p) {
                    $p = Product::create($payload);
                    $created++;
                } else {
                    $p->update($payload);
                    $updated++;
                }

                if (!empty($data['images'])) {
                    $this->syncImages($p, $data['images']);
                }

                $this->ensureVariants($p, $data['category'], $data['price']);
            });
        }

        $this->info("Import finalizado. Creados={$created}, Actualizados={$updated}");
        return 0;
    }

    private function fetchHtml(string $url): ?string
    {
        try {
            $resp = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (compatible; BSW Bot)',
                'Accept-Language' => 'es-ES,es;q=0.9,en;q=0.8',
            ])->timeout(25)->get($url);
            if (!$resp->successful()) return null;
            return (string) $resp->body();
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function extractProductUrls(string $html): array
    {
        $urls = [];
        if (preg_match_all('~https?://www\\.latostadora\\.com/web/[^"\\s<>]+~i', $html, $m)) {
            foreach ($m[0] as $u) $urls[] = $this->normalizeUrl($u);
        }
        if (preg_match_all('~href="(/web/[^"]+)"~i', $html, $m2)) {
            foreach ($m2[1] as $path) {
                $urls[] = $this->normalizeUrl('https://www.latostadora.com' . $path);
            }
        }
        return $urls;
    }

    private function parseProductPage(string $html, string $url): array
    {
        $decoded = html_entity_decode($html, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        $title = $this->extractMeta($html, 'og:title') ?? $this->extractH1($html) ?? $this->extractTitleTag($decoded);
        $title = $title ? trim(html_entity_decode($title, ENT_QUOTES | ENT_HTML5, 'UTF-8')) : null;
        if ($title && str_contains($title, '|')) {
            $title = trim(explode('|', $title)[0]);
        }

        $price = null;
        $priceMeta = $this->extractMeta($html, 'product:price:amount') ?? $this->extractMeta($html, 'og:price:amount');
        if ($priceMeta && is_numeric(str_replace(',', '.', $priceMeta))) {
            $price = (float) str_replace(',', '.', $priceMeta);
        }
        if ($price === null && preg_match('~(\\d{1,3}(?:[\\.,]\\d{2})?)\\s*(?:€|EUR)~u', $decoded, $pm)) {
            $price = (float) str_replace(',', '.', $pm[1]);
        }

        $category = null;
        if (preg_match('~href="/shop/[^"]+"[^>]*>\\s*([^<]{2,80})\\s*<~u', $decoded, $cm)) {
            $category = trim($cm[1]);
        }
        if (!$category && $title) {
            $lc = mb_strtolower($title);
            if (str_contains($lc, 'delantal') || str_contains($lc, 'apron')) $category = 'Delantales';
            elseif (str_contains($lc, 'sudadera') || str_contains($lc, 'hoodie')) $category = 'Sudaderas';
            elseif (str_contains($lc, 'pijama') || str_contains($lc, 'pyjama')) $category = 'Pijamas';
            elseif (str_contains($lc, 'bolsa') || str_contains($lc, 'bag')) $category = 'Bolsas';
            elseif (str_contains($lc, 'tank top')) $category = 'Camisetas hombre';
            elseif (str_contains($lc, 'camiseta') || str_contains($lc, 't-shirt')) $category = 'Camisetas hombre';
            else $category = 'Merch';
        }

        $description = null;
        if (preg_match('~<h3[^>]*>\\s*Descripción\\s*</h3>.*?<div[^>]*>\\s*(.*?)\\s*</div>~isu', $decoded, $dm)) {
            $text = strip_tags($dm[1]);
            $text = trim(preg_replace('~\\s+~u', ' ', $text));
            $description = $text !== '' ? $text : null;
        }

        $images = [];
        $main = $this->extractMeta($html, 'og:image') ?? $this->extractMeta($html, 'twitter:image');
        if ($main) $images[] = $main;

        if (preg_match_all('~https?://[^"\\s<>]+\\.(?:png|jpe?g|webp)(?:\\?[^"\\s<>]+)?~i', $html, $im)) {
            foreach ($im[0] as $img) {
                if (stripos($img, 'latostadora') === false && stripos($img, 'tostadora') === false) continue;
                $images[] = $img;
            }
        }

        $images = array_values(array_unique(array_map([$this, 'normalizeUrl'], $images)));
        $images = array_slice($images, 0, 8);

        return [
            'url' => $this->normalizeUrl($url),
            'title' => $title,
            'price' => $price ? round($price, 2) : null,
            'category' => $category,
            'description' => $description,
            'images' => $images,
        ];
    }

    private function extractMeta(string $html, string $property): ?string
    {
        $re = '~<meta[^>]+property=["\\\']' . preg_quote($property, '~') . '["\\\'][^>]+content=["\\\']([^"\\\']+)["\\\']~i';
        if (preg_match($re, $html, $m)) return $m[1] ?? null;
        $re2 = '~<meta[^>]+name=["\\\']' . preg_quote($property, '~') . '["\\\'][^>]+content=["\\\']([^"\\\']+)["\\\']~i';
        if (preg_match($re2, $html, $m2)) return $m2[1] ?? null;
        return null;
    }

    private function extractH1(string $html): ?string
    {
        if (preg_match('~<h1[^>]*>(.*?)</h1>~isu', $html, $m)) {
            return trim(strip_tags($m[1]));
        }
        return null;
    }

    private function extractTitleTag(string $decodedHtml): ?string
    {
        if (preg_match('~<title[^>]*>(.*?)</title>~isu', $decodedHtml, $m)) {
            return trim(strip_tags($m[1]));
        }
        return null;
    }

    private function normalizeUrl(string $url): string
    {
        $url = trim($url);
        $url = preg_replace('~#.*$~', '', $url);
        return $url;
    }

    private function downloadImage(string $remoteUrl): ?string
    {
        try {
            $resp = Http::timeout(25)->get($remoteUrl);
            if (!$resp->successful()) return null;

            $ctype = (string) ($resp->header('content-type') ?? '');
            $ext = 'jpg';
            if (stripos($ctype, 'png') !== false) $ext = 'png';
            if (stripos($ctype, 'webp') !== false) $ext = 'webp';
            if (stripos($ctype, 'jpeg') !== false) $ext = 'jpg';

            $path = 'products/latostadora/' . Str::uuid() . '.' . $ext;
            Storage::disk('public')->put($path, $resp->body());
            return $path;
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function syncImages(Product $product, array $remoteUrls): void
    {
        $current = ProductImage::query()->where('product_id', $product->id)->orderBy('sort_order')->get();
        if ($current->isNotEmpty()) {
            foreach ($current as $img) {
                if ($img->path) {
                    Storage::disk('public')->delete($img->path);
                }
            }
            ProductImage::query()->where('product_id', $product->id)->delete();
        }

        $stored = [];
        foreach ($remoteUrls as $idx => $remote) {
            $path = $this->downloadImage($remote);
            if (!$path) continue;
            $stored[] = $path;
            ProductImage::create([
                'product_id' => $product->id,
                'path' => $path,
                'sort_order' => $idx,
            ]);
        }

        if (!empty($stored)) {
            $product->update(['image_path' => $stored[0]]);
        }
    }

    private function ensureVariants(Product $product, ?string $category, float $price): void
    {
        $cat = strtolower((string) $category);
        $isApparel = str_contains($cat, 'camis') || str_contains($cat, 't-shirt') || str_contains($cat, 'tank') || str_contains($cat, 'sudader') || str_contains($cat, 'pijama');
        $colors = ['Negro', 'Blanco', 'Beige', 'Gris', 'Azul royal', 'Azul marino', 'Verde', 'Rojo', 'Rosa'];

        if ($isApparel) {
            $sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
            foreach ($colors as $c) {
                foreach ($sizes as $s) {
                    ProductVariant::query()->updateOrCreate(
                        ['product_id' => $product->id, 'size' => $s, 'color' => $c],
                        ['price' => $price, 'stock' => 9999, 'is_active' => true]
                    );
                }
            }
            return;
        }

        if (str_contains($cat, 'delantal') || str_contains($cat, 'apron')) {
            foreach ($colors as $c) {
                ProductVariant::query()->updateOrCreate(
                    ['product_id' => $product->id, 'size' => null, 'color' => $c],
                    ['price' => $price, 'stock' => 9999, 'is_active' => true]
                );
            }
            return;
        }
    }
}
