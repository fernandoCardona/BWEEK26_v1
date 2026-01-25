<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('auth_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('channel');
            $table->string('action');
            $table->string('ip', 45);
            $table->text('user_agent')->nullable();
            $table->string('location')->nullable();
            $table->boolean('success')->default(false);
            $table->timestamps();
        });

        Schema::create('incomplete_registrations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('channel');
            $table->string('user_identifier');
            $table->json('partial_data')->nullable();
            $table->string('last_step')->nullable();
            $table->timestamp('reminder_sent_at')->nullable();
            $table->foreignUuid('converted_to_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignUuid('converted_to_lead_id')->nullable()->constrained('leads')->onDelete('set null');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incomplete_registrations');
        Schema::dropIfExists('auth_logs');
    }
};
