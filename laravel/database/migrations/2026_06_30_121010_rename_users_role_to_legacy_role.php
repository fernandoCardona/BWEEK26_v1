<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        if (Schema::hasColumn('users', 'role') && !Schema::hasColumn('users', 'legacy_role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->renameColumn('role', 'legacy_role');
            });
        }

        if (!Schema::hasColumn('users', 'legacy_role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('legacy_role')->default('user')->after('email_verified_at');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        if (Schema::hasColumn('users', 'legacy_role') && !Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->renameColumn('legacy_role', 'role');
            });
        }
    }
};
