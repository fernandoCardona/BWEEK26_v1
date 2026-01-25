<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\AuthLog;
use Symfony\Component\HttpFoundation\Response;

class AuditChatbotMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->is('api/*')) {
            AuthLog::create([
                'user_id' => $request->user()?->id,
                'channel' => $request->header('X-Chatbot-Channel', 'unknown'),
                'action' => $request->path(),
                'ip' => $request->ip(),
                'user_agent' => $request->header('User-Agent'),
                'success' => $response->isSuccessful(),
                'location' => null, // Would require geoip integration
            ]);
        }

        return $response;
    }
}
