<?php

namespace Tests;

use Illuminate\Foundation\Application;

trait CreatesApplication
{
    public function createApplication(): Application
    {
        // Force the testing database before Laravel boots so config/env driven
        // defaults cannot fall back to the live ecommerce database.
        putenv('APP_ENV=testing');
        putenv('DB_CONNECTION=pgsql');
        putenv('DB_HOST=postgres');
        putenv('DB_PORT=5432');
        putenv('DB_DATABASE=ecommerce_test_db');

        $_ENV['APP_ENV'] = 'testing';
        $_ENV['DB_CONNECTION'] = 'pgsql';
        $_ENV['DB_HOST'] = 'postgres';
        $_ENV['DB_PORT'] = '5432';
        $_ENV['DB_DATABASE'] = 'ecommerce_test_db';

        $_SERVER['APP_ENV'] = 'testing';
        $_SERVER['DB_CONNECTION'] = 'pgsql';
        $_SERVER['DB_HOST'] = 'postgres';
        $_SERVER['DB_PORT'] = '5432';
        $_SERVER['DB_DATABASE'] = 'ecommerce_test_db';

        $app = require __DIR__ . '/../bootstrap/app.php';
        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

        $app['config']->set('app.env', 'testing');
        $app['config']->set('database.default', 'pgsql');
        $app['config']->set('database.connections.pgsql.host', 'postgres');
        $app['config']->set('database.connections.pgsql.port', '5432');
        $app['config']->set('database.connections.pgsql.database', 'ecommerce_test_db');

        if ($app->bound('db')) {
            $app->make('db')->purge('pgsql');
        }

        $default = (string) $app['config']->get('database.default');
        $database = (string) $app['config']->get("database.connections.{$default}.database");
        if ($default === 'pgsql' && $database === 'ecommerce_db') {
            throw new \RuntimeException('Unsafe test configuration: tests are pointing to ecommerce_db. Use ecommerce_test_db.');
        }

        return $app;
    }
}
