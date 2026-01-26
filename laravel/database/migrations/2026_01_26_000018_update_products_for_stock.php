<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'stock')) {
                $table->integer('stock')->default(0)->after('price');
            }
            if (!Schema::hasColumn('products', 'image_path')) {
                $table->string('image_path')->nullable()->after('category');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('products', 'stock')) $cols[] = 'stock';
            if (Schema::hasColumn('products', 'image_path')) $cols[] = 'image_path';
            if (count($cols) > 0) {
                $table->dropColumn($cols);
            }
        });
    }
};

