<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use App\Models\Page;
use App\Models\Section;
use Illuminate\Support\Str;

class ImportScrapedContent extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scraping:import {--source= : Document path or directory} {--url= : URL to fetch and import} {--max-pages=1 : Max pages to crawl when using --url}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import scraped content from JSON/Markdown files into Laravel database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $source = $this->option('source');
        $url = $this->option('url');

        if ($url) {
            $this->processUrlCrawl((string) $url, (int) $this->option('max-pages'));
            $this->info('Import completed successfully.');
            return 0;
        }

        if (!$source) {
            $this->error('Please provide a source path using --source or --url');
            return 1;
        }

        $path = base_path('../' . $source);

        if (!File::exists($path)) {
            $this->error("Path not found: {$path}");
            return 1;
        }

        if (File::isDirectory($path)) {
            $this->processDirectory($path);
        } else {
            $this->processFile($path);
        }

        $this->info('Import completed successfully.');
        return 0;
    }

    private function processUrlCrawl(string $startUrl, int $maxPages): void
    {
        $maxPages = max(1, $maxPages);
        $queue = [$startUrl];
        $visited = [];

        while ($queue && count($visited) < $maxPages) {
            $url = array_shift($queue);
            if (!$url || isset($visited[$url])) {
                continue;
            }

            $visited[$url] = true;
            $this->info("Fetching: {$url}");

            $data = $this->fetchAndExtract($url);
            if ($data) {
                $this->createOrUpdatePageFromUrl($url, $data);
            }

            foreach (($data['links'] ?? []) as $link) {
                if (!isset($visited[$link])) {
                    $queue[] = $link;
                }
            }
        }
    }

    private function fetchAndExtract(string $url): ?array
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (compatible; BearsSitgesMigration/1.0)',
                'Accept' => 'text/html,application/xhtml+xml',
            ])->get($url);

            if (!$response->successful()) {
                $this->error("Failed to fetch ({$response->status()}): {$url}");
                return null;
            }

            $html = (string) $response->body();

            libxml_use_internal_errors(true);
            $dom = new \DOMDocument();
            $dom->loadHTML($html);
            libxml_clear_errors();

            $xpath = new \DOMXPath($dom);

            $title = trim((string) ($xpath->evaluate('string(//h1[1])') ?: $xpath->evaluate('string(//title)')));
            $metaDescription = trim((string) $xpath->evaluate('string(//meta[@name="description"]/@content)'));

            $sectionNodes = $xpath->query('//main//*[self::section or self::div[contains(@class,"elementor-section")] or self::div[contains(@class,"wp-block-group")]]');
            if (!$sectionNodes || $sectionNodes->length === 0) {
                $sectionNodes = $xpath->query('//body//*[self::section or self::div[contains(@class,"elementor-section")] or self::div[contains(@class,"wp-block-group")]]');
            }

            $sections = [];
            if ($sectionNodes) {
                foreach ($sectionNodes as $node) {
                    $textParts = [];
                    foreach ($xpath->query('.//p|.//li|.//h2|.//h3', $node) as $textNode) {
                        $t = trim(preg_replace('/\s+/', ' ', $textNode->textContent));
                        if ($t !== '') {
                            $textParts[] = $t;
                        }
                    }

                    $images = [];
                    foreach ($xpath->query('.//img/@src', $node) as $imgAttr) {
                        $src = trim((string) $imgAttr->nodeValue);
                        if ($src !== '') {
                            $images[] = $this->absolutizeUrl($url, $src);
                        }
                    }

                    $text = trim(implode("\n", array_values(array_unique($textParts))));
                    $images = array_values(array_unique(array_filter($images)));

                    if ($text !== '' || $images) {
                        $sections[] = [
                            'text' => $text,
                            'images' => $images,
                        ];
                    }
                }
            }

            if (count($sections) <= 1) {
                $mainTexts = [];
                foreach ($xpath->query('//main//p|//main//li|//main//h2|//main//h3') as $textNode) {
                    $t = trim(preg_replace('/\s+/', ' ', $textNode->textContent));
                    if ($t !== '') {
                        $mainTexts[] = $t;
                    }
                }
                $mainTexts = array_values(array_unique($mainTexts));

                $mainImages = [];
                foreach ($xpath->query('//main//img/@src') as $imgAttr) {
                    $src = trim((string) $imgAttr->nodeValue);
                    if ($src !== '') {
                        $mainImages[] = $this->absolutizeUrl($url, $src);
                    }
                }
                $mainImages = array_values(array_unique(array_filter($mainImages)));

                if ($mainTexts) {
                    $chunkSize = 6;
                    $chunks = array_chunk($mainTexts, $chunkSize);
                    $sections = array_map(function (array $chunk, int $index) use ($mainImages) {
                        $images = $index === 0 ? array_slice($mainImages, 0, 12) : [];
                        return [
                            'text' => implode("\n", $chunk),
                            'images' => $images,
                        ];
                    }, $chunks, array_keys($chunks));
                }
            }

            $links = [];
            foreach ($xpath->query('//a/@href') as $hrefAttr) {
                $href = trim((string) $hrefAttr->nodeValue);
                if ($href === '' || str_starts_with($href, '#')) {
                    continue;
                }

                $abs = $this->absolutizeUrl($url, $href);
                if ($this->isSameSiteAndPathPrefix($url, $abs)) {
                    $links[] = $abs;
                }
            }

            return [
                'title' => $title !== '' ? $title : $url,
                'meta_description' => $metaDescription !== '' ? $metaDescription : null,
                'sections' => $sections,
                'links' => array_values(array_unique($links)),
            ];
        } catch (\Throwable $e) {
            $this->error("Exception fetching {$url}: {$e->getMessage()}");
            return null;
        }
    }

    private function processDirectory($dir)
    {
        $files = array_values(array_unique(array_merge(
            File::glob($dir . '/content.json') ?: [],
            File::glob($dir . '/*/content.json') ?: []
        )));

        foreach ($files as $file) {
            $this->processFile($file);
        }
    }

    private function processFile($file)
    {
        $this->info("Processing: {$file}");
        $data = json_decode(File::get($file), true);

        if (!$data) {
            $this->error("Invalid JSON in: {$file}");
            return;
        }

        $this->createOrUpdatePage($file, $data);
    }

    private function createOrUpdatePage(string $source, array $data, ?string $forcedSlug = null): void
    {
        $slug = $forcedSlug ?: $this->inferSlugFromPath($source);
        $title = (string) ($data['title'] ?? $slug);
        $metaDescription = $data['meta_description'] ?? null;

        $page = Page::updateOrCreate(
            ['slug' => $slug],
            [
                'title' => ['es' => $title],
                'meta_description' => $metaDescription ? ['es' => (string) $metaDescription] : null,
                'is_published' => true,
            ]
        );

        $sections = is_array($data['sections'] ?? null) ? $data['sections'] : [];

        $page->sections()->delete();
        foreach ($sections as $index => $section) {
            $text = isset($section['text']) ? (string) $section['text'] : '';
            $images = isset($section['images']) && is_array($section['images']) ? $section['images'] : [];

            Section::create([
                'page_id' => $page->id,
                'type' => 'rich_text',
                'order' => $index,
                'config' => [
                    'text' => ['es' => trim($text)],
                    'images' => array_values(array_filter($images)),
                ],
            ]);
        }

        $this->comment("Page '{$slug}' created/updated with " . count($sections) . " sections.");
    }

    private function createOrUpdatePageFromUrl(string $url, array $data): void
    {
        $slug = $this->inferSlugFromUrl($url);
        $this->createOrUpdatePage($url, $data, $slug);
    }

    private function inferSlugFromUrl(string $url): string
    {
        $path = parse_url($url, PHP_URL_PATH) ?: '';
        $path = trim($path, '/');

        if ($path === '') {
            return 'home';
        }

        $segments = array_values(array_filter(explode('/', $path)));
        return Str::slug(end($segments));
    }

    private function absolutizeUrl(string $baseUrl, string $maybeRelative): string
    {
        if (preg_match('/^https?:\/\//i', $maybeRelative)) {
            return $maybeRelative;
        }

        $baseParts = parse_url($baseUrl);
        $scheme = $baseParts['scheme'] ?? 'https';
        $host = $baseParts['host'] ?? '';
        $port = isset($baseParts['port']) ? ':' . $baseParts['port'] : '';

        if (str_starts_with($maybeRelative, '//')) {
            return $scheme . ':' . $maybeRelative;
        }

        if (str_starts_with($maybeRelative, '/')) {
            return "{$scheme}://{$host}{$port}{$maybeRelative}";
        }

        $basePath = $baseParts['path'] ?? '/';
        $dir = rtrim(substr($basePath, 0, strrpos($basePath, '/') ?: 0), '/');
        $dir = $dir === '' ? '' : $dir;

        return "{$scheme}://{$host}{$port}{$dir}/{$maybeRelative}";
    }

    private function isSameSiteAndPathPrefix(string $startUrl, string $candidateUrl): bool
    {
        $startHost = parse_url($startUrl, PHP_URL_HOST);
        $candidateHost = parse_url($candidateUrl, PHP_URL_HOST);
        if (!$startHost || !$candidateHost || strtolower($startHost) !== strtolower($candidateHost)) {
            return false;
        }

        $startPath = (string) (parse_url($startUrl, PHP_URL_PATH) ?: '/');
        $candidatePath = (string) (parse_url($candidateUrl, PHP_URL_PATH) ?: '/');

        $startDir = rtrim($startPath, '/');
        return $startDir !== '' && str_starts_with(rtrim($candidatePath, '/'), $startDir);
    }

    private function inferSlugFromPath(string $file): string
    {
        $normalized = str_replace('\\', '/', $file);
        $parts = explode('/', $normalized);

        $pagesIndex = array_search('pages', $parts, true);
        if ($pagesIndex !== false && isset($parts[$pagesIndex + 1])) {
            return Str::slug($parts[$pagesIndex + 1]);
        }

        return Str::slug(pathinfo($file, PATHINFO_FILENAME));
    }
}
