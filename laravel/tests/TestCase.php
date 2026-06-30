<?php

namespace Tests;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Spatie\Permission\PermissionRegistrar;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();

        if (app()->environment('testing') && (!Schema::hasTable('roles') || !Schema::hasTable('permissions'))) {
            Artisan::call('migrate:fresh', ['--force' => true]);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
