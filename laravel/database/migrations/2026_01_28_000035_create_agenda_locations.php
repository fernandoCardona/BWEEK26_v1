<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('agenda_locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->json('name');
            $table->json('location')->nullable();
            $table->string('address')->nullable();
            $table->string('google_maps_url', 2048)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agenda_locations');
    }
};

