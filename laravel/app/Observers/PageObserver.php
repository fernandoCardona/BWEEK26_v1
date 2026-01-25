<?php

namespace App\Observers;

use App\Models\Page;
use App\Services\AISyncService;

class PageObserver
{
    public function __construct(protected AISyncService $aiSyncService)
    {
    }

    public function saved(Page $page)
    {
        // For each locale, sync to Knowledge Base
        foreach (['es', 'ca', 'en', 'fr', 'de'] as $locale) {
            $title = $page->getTranslation('title', $locale, false);
            $content = "";

            foreach ($page->sections as $section) {
                // Heuristic: accumulate text from section config
                $text = $section->config['text'][$locale] ?? "";
                $content .= $text . "\n\n";
            }

            if (!empty($content)) {
                $this->aiSyncService->syncContent(
                    'Page',
                    $page->id,
                    $title ?: "Page {$page->slug}",
                    $content,
                    $locale
                );
            }
        }
    }
}
