<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $locale = app()->getLocale();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'ziggy' => fn() => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'locale' => $locale,
            'available_locales' => [
                'es' => 'Español',
                'ca' => 'Català',
                'en' => 'English',
                'fr' => 'Français',
                'it' => 'Italiano',
                'de' => 'Deutsch',
            ],
            'translations' => $this->loadJsonTranslations($locale),
        ];
    }

    private function loadJsonTranslations(string $locale): array
    {
        $namespaces = ['web', 'home', 'page', 'cms', 'admin', 'backend'];

        $out = [];
        foreach ($namespaces as $ns) {
            $out[$ns] = $this->readJsonTranslationFile($locale, $ns);
        }
        return $out;
    }

    private function readJsonTranslationFile(string $locale, string $namespace): array
    {
        $base = resource_path('i18n');
        $path = $base . DIRECTORY_SEPARATOR . $locale . DIRECTORY_SEPARATOR . $namespace . '.json';
        $fallback = $base . DIRECTORY_SEPARATOR . 'es' . DIRECTORY_SEPARATOR . $namespace . '.json';

        $raw = null;
        if (File::exists($path)) {
            $raw = File::get($path);
        } elseif (File::exists($fallback)) {
            $raw = File::get($fallback);
        }

        if ($raw === null) {
            return [];
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
