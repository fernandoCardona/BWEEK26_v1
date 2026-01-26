<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (!Schema::hasColumn('events', 'parent_event_id')) {
                $table->foreignUuid('parent_event_id')->nullable()->after('id')->constrained('events')->nullOnDelete();
            }
            if (!Schema::hasColumn('events', 'start_at')) {
                $table->timestamp('start_at')->nullable()->after('event_date');
            }
            if (!Schema::hasColumn('events', 'end_at')) {
                $table->timestamp('end_at')->nullable()->after('start_at');
            }
            if (!Schema::hasColumn('events', 'address')) {
                $table->string('address')->nullable()->after('location');
            }
            if (!Schema::hasColumn('events', 'banner_path')) {
                $table->string('banner_path')->nullable();
            }
            if (!Schema::hasColumn('events', 'logo_path')) {
                $table->string('logo_path')->nullable();
            }
            if (!Schema::hasColumn('events', 'flyer_path')) {
                $table->string('flyer_path')->nullable();
            }
        });

        DB::table('events')->whereNull('start_at')->whereNotNull('event_date')->update([
            'start_at' => DB::raw('event_date'),
        ]);
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (Schema::hasColumn('events', 'parent_event_id')) {
                $table->dropConstrainedForeignId('parent_event_id');
            }
            $cols = ['start_at', 'end_at', 'address', 'banner_path', 'logo_path', 'flyer_path'];
            $existing = array_values(array_filter($cols, fn ($c) => Schema::hasColumn('events', $c)));
            if (count($existing) > 0) {
                $table->dropColumn($existing);
            }
        });
    }
};

