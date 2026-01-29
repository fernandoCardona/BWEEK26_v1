<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ticket_templates', function (Blueprint $table) {
            if (!Schema::hasColumn('ticket_templates', 'name')) {
                $table->string('name')->nullable()->after('id');
            }
        });

        try {
            DB::table('ticket_templates')
                ->whereNull('name')
                ->update(['name' => DB::raw('code')]);
        } catch (\Throwable $e) {
        }
    }

    public function down(): void
    {
        Schema::table('ticket_templates', function (Blueprint $table) {
            if (Schema::hasColumn('ticket_templates', 'name')) {
                $table->dropColumn('name');
            }
        });
    }
};

