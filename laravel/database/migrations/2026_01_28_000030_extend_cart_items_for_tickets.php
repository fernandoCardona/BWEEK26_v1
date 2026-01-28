<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->string('kind', 20)->default('product')->after('id');
            $table->uuid('event_ticket_type_id')->nullable()->after('product_id');
            $table->uuid('product_variant_id')->nullable()->after('event_ticket_type_id');
        });

        // Drop existing unique to replace with partial uniques
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropUnique(['cart_id', 'product_id']);
        });

        // Partial unique indexes for Postgres
        DB::statement('CREATE UNIQUE INDEX cart_items_unique_product ON cart_items (cart_id, product_id) WHERE product_id IS NOT NULL;');
        DB::statement('CREATE UNIQUE INDEX cart_items_unique_ticket ON cart_items (cart_id, event_ticket_type_id) WHERE event_ticket_type_id IS NOT NULL;');
        DB::statement('CREATE UNIQUE INDEX cart_items_unique_variant ON cart_items (cart_id, product_variant_id) WHERE product_variant_id IS NOT NULL;');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS cart_items_unique_product;');
        DB::statement('DROP INDEX IF EXISTS cart_items_unique_ticket;');
        DB::statement('DROP INDEX IF EXISTS cart_items_unique_variant;');

        Schema::table('cart_items', function (Blueprint $table) {
            $table->unique(['cart_id', 'product_id']);
            $table->dropColumn('event_ticket_type_id');
            $table->dropColumn('product_variant_id');
            $table->dropColumn('kind');
        });
    }
};
