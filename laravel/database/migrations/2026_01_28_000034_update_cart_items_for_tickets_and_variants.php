<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->uuid('product_variant_id')->nullable()->after('product_id');
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
        });

        DB::statement('ALTER TABLE cart_items ALTER COLUMN product_id DROP NOT NULL;');

        Schema::table('cart_items', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->onDelete('cascade');
        });

        DB::statement('DROP INDEX IF EXISTS cart_items_unique_product;');
        DB::statement('DROP INDEX IF EXISTS cart_items_unique_ticket;');

        DB::statement('CREATE UNIQUE INDEX cart_items_unique_product ON cart_items (cart_id, product_id) WHERE product_id IS NOT NULL AND product_variant_id IS NULL AND event_ticket_type_id IS NULL;');
        DB::statement('CREATE UNIQUE INDEX cart_items_unique_variant ON cart_items (cart_id, product_variant_id) WHERE product_variant_id IS NOT NULL;');
        DB::statement('CREATE UNIQUE INDEX cart_items_unique_ticket ON cart_items (cart_id, event_ticket_type_id) WHERE event_ticket_type_id IS NOT NULL;');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS cart_items_unique_product;');
        DB::statement('DROP INDEX IF EXISTS cart_items_unique_variant;');
        DB::statement('DROP INDEX IF EXISTS cart_items_unique_ticket;');

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropForeign(['product_variant_id']);
            $table->dropForeign(['product_id']);
        });

        DB::statement('ALTER TABLE cart_items ALTER COLUMN product_id SET NOT NULL;');

        Schema::table('cart_items', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->dropColumn('product_variant_id');
        });

        DB::statement('CREATE UNIQUE INDEX cart_items_unique_product ON cart_items (cart_id, product_id) WHERE product_id IS NOT NULL;');
        DB::statement('CREATE UNIQUE INDEX cart_items_unique_ticket ON cart_items (cart_id, event_ticket_type_id) WHERE event_ticket_type_id IS NOT NULL;');
    }
};

