<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('billing_counters', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 20);
            $table->unsignedInteger('year');
            $table->unsignedInteger('next_sequence')->default(1);
            $table->timestamps();
            $table->unique(['kind', 'year']);
        });

        Schema::create('billing_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('transaction_id')->constrained('transactions')->onDelete('cascade');
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');

            $table->string('kind', 20); // proforma | invoice
            $table->string('series', 20);
            $table->unsignedInteger('year');
            $table->unsignedInteger('sequence');
            $table->string('number', 50)->unique();
            $table->timestamp('issued_at')->nullable();

            $table->string('currency', 3)->default('EUR');
            $table->decimal('vat_rate', 5, 2)->default(21.00);
            $table->decimal('subtotal_amount', 10, 2)->default(0);
            $table->decimal('vat_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);

            $table->json('issuer')->nullable();
            $table->json('recipient')->nullable();
            $table->json('lines')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['kind', 'year', 'sequence']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_documents');
        Schema::dropIfExists('billing_counters');
    }
};

