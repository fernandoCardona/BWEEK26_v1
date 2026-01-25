<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class LeadService
{
    /**
     * Create or update a lead from a source.
     */
    public function updateLead(array $data): Lead
    {
        $lead = Lead::updateOrCreate(
            ['email' => $data['email']],
            [
                'name' => $data['name'] ?? null,
                'phone' => $data['phone'] ?? null,
                'source' => $data['source'] ?? 'api',
                'interest' => $data['interest'] ?? 'general',
                'last_interaction' => now(),
            ]
        );

        $lead->increment('engagement_count');

        // Recalculate score
        $lead->lead_score = $this->calculateScore($lead);
        $lead->save();

        return $lead;
    }

    /**
     * Convert a lead to a registered user.
     */
    public function convertToUser(Lead $lead, User $user): void
    {
        $lead->update([
            'status' => 'converted',
            'converted_to_user_id' => $user->id,
        ]);

        Log::info("Lead {$lead->id} converted to User {$user->id}");
    }

    /**
     * Scoring logic: Simple implementation.
     */
    private function calculateScore(Lead $lead): int
    {
        $score = 0;

        // Points by source
        $sources = ['chatbot_whatsapp' => 20, 'chatbot_web' => 15, 'web_form' => 10];
        $score += $sources[$lead->source] ?? 5;

        // Points by interest
        $interests = ['tickets' => 30, 'events' => 20, 'products' => 15];
        $score += $interests[$lead->interest] ?? 5;

        // Points by engagement
        $score += ($lead->engagement_count * 5);

        // Max score 100
        return min($score, 100);
    }
}
