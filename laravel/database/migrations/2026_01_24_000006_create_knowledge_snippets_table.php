<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('knowledge_snippets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('source_type');
            $table->string('source_id')->nullable();
            $table->string('title');
            $table->text('content');
            $table->string('locale', 5);
            $table->string('hash');
            $table->timestamp('indexed_at')->nullable();
            $table->timestamps();

            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_snippets');
    }
};
