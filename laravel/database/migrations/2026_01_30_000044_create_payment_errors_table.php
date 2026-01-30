<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_errors', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 20);
            $table->string('event_id', 191)->nullable();
            $table->string('external_id', 191)->nullable();
            $table->uuid('transaction_id')->nullable();
            $table->unsignedInteger('attempts')->default(0);
            $table->text('error')->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('last_attempt_at')->nullable();
            $table->timestamps();

            $table->index(['provider', 'event_id']);
            $table->index(['provider', 'external_id']);
            $table->index('transaction_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_errors');
    }
};

