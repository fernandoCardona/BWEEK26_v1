<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('validation_hash', 80)->nullable()->after('qr_code');
            $table->timestamp('scanned_at')->nullable()->after('validated_at');
            $table->index('validation_hash');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['validation_hash']);
            $table->dropColumn(['scanned_at', 'validation_hash']);
        });
    }
};

