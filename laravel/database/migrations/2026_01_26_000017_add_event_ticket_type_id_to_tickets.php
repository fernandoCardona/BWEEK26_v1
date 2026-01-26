<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'event_ticket_type_id')) {
                $table->foreignUuid('event_ticket_type_id')->nullable()->after('event_id')->constrained('event_ticket_types')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (Schema::hasColumn('tickets', 'event_ticket_type_id')) {
                $table->dropConstrainedForeignId('event_ticket_type_id');
            }
        });
    }
};

