<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('users') || !Schema::hasColumn('users', 'country')) {
            return;
        }

        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE users ALTER COLUMN country TYPE varchar(120)");
            return;
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY country varchar(120) NULL");
            return;
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('users') || !Schema::hasColumn('users', 'country')) {
            return;
        }

        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE users ALTER COLUMN country TYPE varchar(2)");
            return;
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY country varchar(2) NULL");
            return;
        }
    }
};

