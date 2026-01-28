<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('event_ticket_types', function (Blueprint $table) {
            if (!Schema::hasColumn('event_ticket_types', 'description')) {
                $table->text('description')->nullable()->after('image_path');
            }
            if (!Schema::hasColumn('event_ticket_types', 'legal_terms')) {
                $table->text('legal_terms')->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('event_ticket_types', function (Blueprint $table) {
            if (Schema::hasColumn('event_ticket_types', 'legal_terms')) {
                $table->dropColumn('legal_terms');
            }
            if (Schema::hasColumn('event_ticket_types', 'description')) {
                $table->dropColumn('description');
            }
        });
    }
};

