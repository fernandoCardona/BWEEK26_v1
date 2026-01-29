<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('agenda_subevent_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->json('name');
            $table->json('description')->nullable();
            $table->foreignUuid('agenda_location_id')->nullable()->constrained('agenda_locations')->nullOnDelete();

            $table->json('location')->nullable();
            $table->string('address')->nullable();
            $table->string('google_maps_url', 2048)->nullable();
            $table->string('external_ticket_url', 2048)->nullable();

            $table->time('default_start_time')->nullable();
            $table->time('default_end_time')->nullable();

            $table->boolean('tickets_enabled')->default(false);
            $table->string('ticket_code')->default('vip');
            $table->decimal('ticket_price', 10, 2)->default(0);
            $table->integer('ticket_stock')->default(0);
            $table->string('ticket_external_purchase_url', 2048)->nullable();
            $table->string('ticket_image_path')->nullable();
            $table->text('ticket_description')->nullable();
            $table->text('ticket_legal_terms')->nullable();

            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agenda_subevent_templates');
    }
};

