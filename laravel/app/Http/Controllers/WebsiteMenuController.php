<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;

class WebsiteMenuController extends Controller
{
    private function base(): string
    {
        return (string) config('website_menu.base_path', base_path('WEBSITE GENERAL INFO'));
    }

    private function categoryMap(): array
    {
        return [
            'about' => $this->base() . DIRECTORY_SEPARATOR . 'WEBSITE-MENU' . DIRECTORY_SEPARATOR . 'ABOUT',
            'events' => $this->base() . DIRECTORY_SEPARATOR . 'WEBSITE-MENU' . DIRECTORY_SEPARATOR . 'EVENTS',
            'magazine' => $this->base() . DIRECTORY_SEPARATOR . 'WEBSITE-MENU' . DIRECTORY_SEPARATOR . 'MAGAZINE',
            'recomendations' => $this->base() . DIRECTORY_SEPARATOR . 'WEBSITE-MENU' . DIRECTORY_SEPARATOR . 'RECOMENDATIONS',
            'store' => $this->base() . DIRECTORY_SEPARATOR . 'WEBSITE-MENU' . DIRECTORY_SEPARATOR . 'STORE' . DIRECTORY_SEPARATOR . 'store',
        ];
    }

    public function category(string $category)
    {
        $map = $this->categoryMap();
        if (!isset($map[$category])) {
            abort(404);
        }
        $dir = $map[$category];
        $pages = [];
        foreach (File::directories($dir) as $sub) {
            $slug = basename($sub);
            if ($category === 'store' && $slug === 'images') {
                continue;
            }
            $title = ucwords(str_replace(['-', '_'], ' ', $slug));
            $pages[] = [
                'slug' => $slug,
                'title' => $title,
                'has_images' => File::isDirectory($sub . DIRECTORY_SEPARATOR . 'images'),
                'has_text' => File::exists($sub . DIRECTORY_SEPARATOR . 'text.txt'),
            ];
        }
        if (empty($pages) && File::exists($dir . DIRECTORY_SEPARATOR . 'text.txt')) {
            $pages[] = [
                'slug' => 'index',
                'title' => ucwords($category),
                'has_images' => File::isDirectory($dir . DIRECTORY_SEPARATOR . 'images'),
                'has_text' => true,
            ];
        }
        return Inertia::render('Website/Category', [
            'category' => $category,
            'pages' => $pages,
        ]);
    }

    public function categoryJson(string $category)
    {
        $map = $this->categoryMap();
        if (!isset($map[$category])) {
            return response()->json(['pages' => []], 404);
        }
        $dir = $map[$category];
        $pages = [];
        foreach (File::directories($dir) as $sub) {
            $slug = basename($sub);
            if ($category === 'store' && $slug === 'images') {
                continue;
            }
            $title = ucwords(str_replace(['-', '_'], ' ', $slug));
            if (File::exists($sub . DIRECTORY_SEPARATOR . 'text.txt')) {
                $pages[] = [
                    'slug' => $slug,
                    'title' => $title,
                ];
            }
        }
        if (empty($pages) && File::exists($dir . DIRECTORY_SEPARATOR . 'text.txt')) {
            $pages[] = [
                'slug' => 'index',
                'title' => ucwords($category),
            ];
        }
        return response()->json(['pages' => $pages]);
    }

    private function resolvePageBase(string $category, string $page): string
    {
        $map = $this->categoryMap();
        if (!isset($map[$category])) {
            abort(404);
        }
        $dir = $map[$category];
        if (!File::isDirectory($dir)) {
            abort(404);
        }

        $dirReal = realpath($dir);
        if ($dirReal === false) {
            abort(404);
        }

        if ($category === 'store' || $page === 'index') {
            return $dirReal;
        }

        if (!preg_match('/^[a-z0-9][a-z0-9_-]{0,80}$/i', $page)) {
            abort(404);
        }

        $candidate = $dirReal . DIRECTORY_SEPARATOR . $page;
        $candidateReal = realpath($candidate);
        if ($candidateReal === false) {
            abort(404);
        }

        if (!str_starts_with($candidateReal, $dirReal . DIRECTORY_SEPARATOR)) {
            abort(404);
        }

        return $candidateReal;
    }

    private function pagePath(string $category, string $page): array
    {
        $base = $this->resolvePageBase($category, $page);
        return [
            'text' => $base . DIRECTORY_SEPARATOR . 'text.txt',
            'images' => $base . DIRECTORY_SEPARATOR . 'images',
        ];
    }

    private function readText(string $path): string
    {
        if (File::exists($path)) {
            return File::get($path);
        }
        return '';
    }

    private function readImages(string $dir): array
    {
        $result = [];
        if (File::isDirectory($dir)) {
            foreach (File::files($dir) as $file) {
                $ext = strtolower($file->getExtension());
                if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) {
                    continue;
                }
                if ($file->getSize() > 5 * 1024 * 1024) {
                    continue;
                }
                $mime = File::mimeType($file->getPathname()) ?: 'image/jpeg';
                $data = base64_encode(File::get($file->getPathname()));
                $result[] = 'data:' . $mime . ';base64,' . $data;
            }
        }
        return $result;
    }

    public function page(string $category, string $page)
    {
        $paths = $this->pagePath($category, $page);
        $text = $this->readText($paths['text']);
        $images = $this->readImages($paths['images']);
        return Inertia::render('Website/Page', [
            'category' => $category,
            'slug' => $page,
            'title' => ucwords(str_replace(['-', '_'], ' ', $page)),
            'text' => $text,
            'images' => $images,
        ]);
    }
}
