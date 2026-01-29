<?php

namespace Tests;

use Illuminate\Foundation\Application;

trait CreatesApplication
{
    public function createApplication(): Application
    {
        $app = require __DIR__ . '/../bootstrap/app.php';
        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

        if ($app->environment('testing') || defined('PHPUNIT_COMPOSER_INSTALL') || defined('PHPUNIT_RUNNING')) {
            $default = (string) $app['config']->get('database.default');
            $database = (string) $app['config']->get("database.connections.{$default}.database");
            if ($default === 'pgsql' && $database === 'ecommerce_db') {
                throw new \RuntimeException('Unsafe test configuration: tests are pointing to ecommerce_db. Use ecommerce_test_db.');
            }
        }

        return $app;
    }
}
