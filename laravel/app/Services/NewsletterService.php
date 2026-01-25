<?php

namespace App\Services;

use App\Models\NewsletterCampaign;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NewsletterService
{
    /**
     * Schedule a newsletter campaign.
     */
    public function sendCampaign(NewsletterCampaign $campaign): void
    {
        $users = User::where('newsletter_subscribed', true)
            ->where(function ($query) use ($campaign) {
                if ($campaign->segment) {
                    $query->where('interests', 'like', "%{$campaign->segment}%");
                }
            })->get();

        $campaign->update([
            'total_recipients' => $users->count(),
            'sent_at' => now(),
        ]);

        foreach ($users as $user) {
            try {
                // Here we would use a real Mailable or n8n trigger
                // For demo, we just log and update campaign stats
                $campaign->increment('total_sent');

                // Track log record
                $campaign->logs()->create([
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'sent_at' => now(),
                    'status' => 'sent'
                ]);

            } catch (\Exception $e) {
                $campaign->increment('total_failed');
                Log::error("Failed to send newsletter to {$user->email}: " . $e->getMessage());
            }
        }
    }

    /**
     * Subscribe a user or lead to the newsletter.
     */
    public function subscribe(string $email): void
    {
        $user = User::where('email', $email)->first();
        if ($user) {
            $user->update(['newsletter_subscribed' => true]);
        }
    }
}
