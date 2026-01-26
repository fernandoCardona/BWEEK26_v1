<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\File;

class WebsiteMenuTraversalTest extends TestCase
{
    public function test_allows_safe_page_slug(): void
    {
        $root = storage_path('testing-website-info');
        config(['website_menu.base_path' => $root]);

        $base = $root . '/WEBSITE-MENU/ABOUT';
        File::ensureDirectoryExists($base . '/safe-page');
        File::put($base . '/safe-page/text.txt', 'Hello safe');

        $response = $this->get('/about/safe-page');
        $response->assertOk();
        $response->assertSee('Hello safe');
    }

    public function test_blocks_path_traversal_like_dot_dot(): void
    {
        $root = storage_path('testing-website-info');
        config(['website_menu.base_path' => $root]);

        $base = $root . '/WEBSITE-MENU/ABOUT';
        File::ensureDirectoryExists($base);

        $this->get('/about/..')->assertNotFound();
        $this->get('/about/%2e%2e')->assertNotFound();
        $this->get('/about/..%2f..')->assertNotFound();
    }
}
