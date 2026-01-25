<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();
            $table->json('title');
            $table->json('meta_description')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });

        Schema::create('sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('page_id')->constrained()->onDelete('cascade');
            $table->string('type'); // hero, feature, events_grid, etc.
            $table->integer('order')->default(0);
            $table->json('config'); // configuration and translatable content
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sections');
        Schema::dropIfExists('pages');
    }
};
