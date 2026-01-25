<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->nullable();
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('source')->nullable();
            $table->string('interest')->nullable();
            $table->string('status')->default('new');
            $table->integer('lead_score')->default(0);
            $table->integer('engagement_count')->default(0);
            $table->integer('nurturing_count')->default(0);
            $table->timestamp('last_interaction')->nullable();
            $table->foreignUuid('converted_to_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('newsletter_campaigns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->json('subject');
            $table->json('content');
            $table->string('segment')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->integer('total_recipients')->default(0);
            $table->integer('total_sent')->default(0);
            $table->integer('total_failed')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('newsletter_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('campaign_id')->constrained('newsletter_campaigns')->onDelete('cascade');
            $table->foreignUuid('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('email');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('clicked_at')->nullable();
            $table->string('status')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_logs');
        Schema::dropIfExists('newsletter_campaigns');
        Schema::dropIfExists('leads');
    }
};
