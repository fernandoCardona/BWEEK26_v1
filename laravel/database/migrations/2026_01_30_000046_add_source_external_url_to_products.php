<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'source')) {
                $table->string('source', 30)->nullable()->after('category');
            }
            if (!Schema::hasColumn('products', 'external_url')) {
                $table->string('external_url')->nullable()->after('source');
            }
            $table->index(['source', 'external_url']);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['source', 'external_url']);
            $cols = [];
            if (Schema::hasColumn('products', 'external_url')) $cols[] = 'external_url';
            if (Schema::hasColumn('products', 'source')) $cols[] = 'source';
            if (!empty($cols)) $table->dropColumn($cols);
        });
    }
};

