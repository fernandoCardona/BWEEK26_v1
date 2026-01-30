<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('provider', 20)->nullable()->after('type');
            $table->string('external_id', 191)->nullable()->after('provider');
            $table->index('external_id');
            $table->index(['provider', 'external_id']);
            $table->unique(['provider', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropUnique(['provider', 'external_id']);
            $table->dropIndex(['provider', 'external_id']);
            $table->dropIndex(['external_id']);
            $table->dropColumn(['external_id', 'provider']);
        });
    }
};
