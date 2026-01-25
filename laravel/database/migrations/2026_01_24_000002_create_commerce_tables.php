<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->json('name');
            $table->json('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('category')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->json('name');
            $table->json('description')->nullable();
            $table->timestamp('event_date');
            $table->json('location')->nullable();
            $table->integer('capacity')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('qr_code')->unique();
            $table->string('ticket_type');
            $table->decimal('price', 10, 2);
            $table->string('status')->default('active');
            $table->timestamp('purchased_at')->useCurrent();
            $table->timestamp('validated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('events');
        Schema::dropIfExists('products');
    }
};
