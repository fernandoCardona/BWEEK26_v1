<?php

namespace App\Services;

use App\Models\KnowledgeSnippet;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AISyncService
{
    /**
     * Sync content with n8n Knowledge Base.
     */
    public function syncContent(string $sourceType, string $sourceId, string $title, string $content, string $locale): void
    {
        $hash = md5($content);

        $snippet = KnowledgeSnippet::updateOrCreate(
            ['source_type' => $sourceType, 'source_id' => $sourceId, 'locale' => $locale],
            ['title' => $title, 'content' => $content, 'hash' => $hash]
        );

        if ($snippet->wasRecentlyCreated || $snippet->wasChanged('hash')) {
            $this->triggerN8nSync($snippet);
        }
    }

    /**
     * Send data to n8n webhook.
     */
    private function triggerN8nSync(KnowledgeSnippet $snippet): void
    {
        try {
            $webhook = config('services.n8n.sync_webhook');

            if (!is_string($webhook) || trim($webhook) === '') {
                Log::warning('Skipping n8n sync because services.n8n.sync_webhook is not configured.');
                return;
            }

            $response = Http::post($webhook, [
                'id' => $snippet->id,
                'title' => $snippet->title,
                'content' => $snippet->content,
                'locale' => $snippet->locale,
                'source' => $snippet->source_type,
                'timestamp' => now()->toDateTimeString(),
            ]);

            if ($response->successful()) {
                $snippet->update(['indexed_at' => now()]);
                Log::info("Content synced to n8n: {$snippet->title}");
            }
        } catch (\Exception $e) {
            Log::error("Failed to sync content to n8n: " . $e->getMessage());
        }
    }
}
