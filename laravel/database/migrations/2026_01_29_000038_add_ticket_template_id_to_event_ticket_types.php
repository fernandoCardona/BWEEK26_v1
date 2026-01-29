<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('event_ticket_types', function (Blueprint $table) {
            if (!Schema::hasColumn('event_ticket_types', 'ticket_template_id')) {
                $table->foreignUuid('ticket_template_id')->nullable()->after('event_id');
            }
        });

        Schema::table('event_ticket_types', function (Blueprint $table) {
            if (Schema::hasColumn('event_ticket_types', 'ticket_template_id')) {
                $table->foreign('ticket_template_id')->references('id')->on('ticket_templates')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('event_ticket_types', function (Blueprint $table) {
            if (Schema::hasColumn('event_ticket_types', 'ticket_template_id')) {
                try {
                    $table->dropForeign(['ticket_template_id']);
                } catch (\Throwable $e) {
                }
                $table->dropColumn('ticket_template_id');
            }
        });
    }
};

