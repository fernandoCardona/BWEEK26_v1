<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('event_ticket_types', function (Blueprint $table) {
            if (!Schema::hasColumn('event_ticket_types', 'external_purchase_url')) {
                $table->string('external_purchase_url', 2048)->nullable()->after('stock');
            }
            if (!Schema::hasColumn('event_ticket_types', 'image_path')) {
                $table->string('image_path')->nullable()->after('external_purchase_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('event_ticket_types', function (Blueprint $table) {
            if (Schema::hasColumn('event_ticket_types', 'image_path')) {
                $table->dropColumn('image_path');
            }
            if (Schema::hasColumn('event_ticket_types', 'external_purchase_url')) {
                $table->dropColumn('external_purchase_url');
            }
        });
    }
};

