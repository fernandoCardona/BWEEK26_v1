<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SectionsController extends Controller
{
    public function store(string $page, Request $request)
    {
        $pageModel = Page::query()->where('slug', $page)->firstOrFail();

        $data = $request->validate([
            'type' => ['required', 'string', 'max:80'],
            'order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'key' => ['nullable', 'string', 'max:80'],
        ]);

        $config = [
            'key' => trim((string) ($data['key'] ?? '')) ?: null,
            'enabled' => true,
            'content' => [],
            'images' => [],
        ];

        $section = new Section();
        $section->page_id = $pageModel->id;
        $section->type = $data['type'];
        $section->order = (int) ($data['order'] ?? 0);
        $section->config = $config;
        $section->save();

        return redirect()->route('admin.pages.edit', ['page' => $pageModel->slug]);
    }

    public function update(Section $section, Request $request)
    {
        $data = $request->validate([
            'locale' => ['nullable', 'string', 'in:es,ca,en,fr,it,de'],
            'order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'enabled' => ['nullable', 'boolean'],
            'key' => ['nullable', 'string', 'max:80'],
            'type' => ['nullable', 'string', 'max:80'],
            'fields' => ['nullable', 'array'],
            'image_modes' => ['nullable', 'array'],
        ]);

        $config = $section->config ?? [];
        if (array_key_exists('enabled', $data)) {
            $config['enabled'] = (bool) $data['enabled'];
        }
        if (array_key_exists('key', $data)) {
            $config['key'] = trim((string) ($data['key'] ?? '')) ?: null;
        }
        if (!empty($data['locale']) && is_array($data['fields'] ?? null)) {
            $locale = $data['locale'];
            $content = is_array($config['content'] ?? null) ? $config['content'] : [];
            $current = is_array($content[$locale] ?? null) ? $content[$locale] : [];
            foreach ($data['fields'] as $k => $v) {
                $current[$k] = $v;
            }
            $content[$locale] = $current;
            $config['content'] = $content;
        }

        if (is_array($data['image_modes'] ?? null)) {
            $images = is_array($config['images'] ?? null) ? $config['images'] : [];
            foreach ($data['image_modes'] as $k => $v) {
                $entry = is_array($images[$k] ?? null) ? $images[$k] : ['shared' => true, 'shared_path' => null, 'paths' => []];
                $entry['shared'] = (bool) $v;
                $images[$k] = $entry;
            }
            $config['images'] = $images;
        }

        $section->config = $config;
        if (array_key_exists('order', $data)) {
            $section->order = (int) $data['order'];
        }
        if (array_key_exists('type', $data)) {
            $section->type = $data['type'];
        }
        $section->save();

        return redirect()->route('admin.pages.edit', ['page' => $section->page->slug]);
    }

    public function destroy(Section $section)
    {
        $config = $section->config ?? [];
        $images = is_array($config['images'] ?? null) ? $config['images'] : [];
        foreach ($images as $img) {
            if (is_array($img)) {
                $shared = (string) ($img['shared_path'] ?? '');
                if ($shared) Storage::disk('public')->delete($shared);
                $paths = is_array($img['paths'] ?? null) ? $img['paths'] : [];
                foreach ($paths as $p) {
                    if ($p) Storage::disk('public')->delete((string) $p);
                }
            }
        }

        $slug = $section->page->slug;
        $section->delete();

        return redirect()->route('admin.pages.edit', ['page' => $slug]);
    }

    public function storeImage(Section $section, string $key, Request $request)
    {
        $data = $request->validate([
            'image' => ['required', 'image', 'max:4096'],
            'locale' => ['nullable', 'string', 'in:es,ca,en,fr,it,de'],
            'shared' => ['nullable', 'boolean'],
        ]);

        $config = $section->config ?? [];
        $images = is_array($config['images'] ?? null) ? $config['images'] : [];
        $entry = is_array($images[$key] ?? null) ? $images[$key] : ['shared' => true, 'shared_path' => null, 'paths' => []];

        $shared = (bool) ($data['shared'] ?? ($entry['shared'] ?? true));
        $path = $request->file('image')->store('cms/sections', 'public');

        if ($shared) {
            $old = (string) ($entry['shared_path'] ?? '');
            if ($old) Storage::disk('public')->delete($old);
            $entry['shared'] = true;
            $entry['shared_path'] = $path;
            $entry['paths'] = [];
        } else {
            $locale = (string) ($data['locale'] ?? '');
            if ($locale === '') {
                return response()->json(['error' => 'missing_locale'], 422);
            }
            $paths = is_array($entry['paths'] ?? null) ? $entry['paths'] : [];
            $old = (string) ($paths[$locale] ?? '');
            if ($old) Storage::disk('public')->delete($old);
            $paths[$locale] = $path;
            $entry['shared'] = false;
            $entry['paths'] = $paths;
        }

        $images[$key] = $entry;
        $config['images'] = $images;
        $section->config = $config;
        $section->save();

        return redirect()->route('admin.pages.edit', ['page' => $section->page->slug]);
    }

    public function destroyImage(Section $section, string $key, Request $request)
    {
        $data = $request->validate([
            'locale' => ['nullable', 'string', 'in:es,ca,en,fr,it,de'],
            'shared' => ['nullable', 'boolean'],
        ]);

        $config = $section->config ?? [];
        $images = is_array($config['images'] ?? null) ? $config['images'] : [];
        $entry = is_array($images[$key] ?? null) ? $images[$key] : null;
        if (!$entry) {
            return redirect()->route('admin.pages.edit', ['page' => $section->page->slug]);
        }

        $shared = (bool) ($data['shared'] ?? ($entry['shared'] ?? true));
        if ($shared) {
            $old = (string) ($entry['shared_path'] ?? '');
            if ($old) Storage::disk('public')->delete($old);
            $entry['shared_path'] = null;
        } else {
            $locale = (string) ($data['locale'] ?? '');
            $paths = is_array($entry['paths'] ?? null) ? $entry['paths'] : [];
            $old = (string) ($paths[$locale] ?? '');
            if ($old) Storage::disk('public')->delete($old);
            unset($paths[$locale]);
            $entry['paths'] = $paths;
        }

        $images[$key] = $entry;
        $config['images'] = $images;
        $section->config = $config;
        $section->save();

        return redirect()->route('admin.pages.edit', ['page' => $section->page->slug]);
    }
}
