<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (!Schema::hasColumn('events', 'google_maps_url')) {
                $table->string('google_maps_url', 2048)->nullable()->after('address');
            }
            if (!Schema::hasColumn('events', 'external_ticket_url')) {
                $table->string('external_ticket_url', 2048)->nullable()->after('google_maps_url');
            }
        });

        Schema::table('event_sponsors', function (Blueprint $table) {
            if (!Schema::hasColumn('event_sponsors', 'website_url')) {
                $table->string('website_url', 2048)->nullable()->after('logo_path');
            }
        });

        Schema::table('event_program_items', function (Blueprint $table) {
            if (!Schema::hasColumn('event_program_items', 'flyer_path')) {
                $table->string('flyer_path')->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (Schema::hasColumn('events', 'external_ticket_url')) {
                $table->dropColumn('external_ticket_url');
            }
            if (Schema::hasColumn('events', 'google_maps_url')) {
                $table->dropColumn('google_maps_url');
            }
        });

        Schema::table('event_sponsors', function (Blueprint $table) {
            if (Schema::hasColumn('event_sponsors', 'website_url')) {
                $table->dropColumn('website_url');
            }
        });

        Schema::table('event_program_items', function (Blueprint $table) {
            if (Schema::hasColumn('event_program_items', 'flyer_path')) {
                $table->dropColumn('flyer_path');
            }
        });
    }
};

