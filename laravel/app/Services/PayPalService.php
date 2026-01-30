<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

class PayPalService
{
    public function baseUrl(): string
    {
        $mode = (string) (Config::get('services.paypal.mode') ?? env('PAYPAL_MODE', 'sandbox'));
        return $mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    }

    public function accessToken(): string
    {
        $clientId = Config::get('services.paypal.client_id') ?? env('PAYPAL_CLIENT_ID');
        $secret = Config::get('services.paypal.secret') ?? env('PAYPAL_SECRET');
        if (!$clientId || !$secret) {
            abort(500, 'PayPal no configurado');
        }

        $baseUrl = $this->baseUrl();
        $resp = Http::withBasicAuth($clientId, $secret)
            ->asForm()
            ->post("{$baseUrl}/v1/oauth2/token", [
                'grant_type' => 'client_credentials',
            ]);

        if (!$resp->successful()) {
            abort(502, 'Error autenticando con PayPal');
        }

        $json = $resp->json();
        $token = $json['access_token'] ?? null;
        if (!$token) {
            abort(502, 'Token PayPal inválido');
        }

        return (string) $token;
    }

    public function verifyWebhookSignature(array $headers, string $body): bool
    {
        $webhookId = (string) env('PAYPAL_WEBHOOK_ID', '');
        if ($webhookId === '') {
            return true;
        }

        $algo = (string) ($headers['paypal-auth-algo'][0] ?? '');
        $certUrl = (string) ($headers['paypal-cert-url'][0] ?? '');
        $transmissionId = (string) ($headers['paypal-transmission-id'][0] ?? '');
        $transmissionSig = (string) ($headers['paypal-transmission-sig'][0] ?? '');
        $transmissionTime = (string) ($headers['paypal-transmission-time'][0] ?? '');

        if ($algo === '' || $certUrl === '' || $transmissionId === '' || $transmissionSig === '' || $transmissionTime === '') {
            return false;
        }

        $token = $this->accessToken();
        $baseUrl = $this->baseUrl();
        $payload = json_decode($body, true);
        if (!is_array($payload)) {
            return false;
        }

        $resp = Http::withToken($token)->post("{$baseUrl}/v1/notifications/verify-webhook-signature", [
            'auth_algo' => $algo,
            'cert_url' => $certUrl,
            'transmission_id' => $transmissionId,
            'transmission_sig' => $transmissionSig,
            'transmission_time' => $transmissionTime,
            'webhook_id' => $webhookId,
            'webhook_event' => $payload,
        ]);

        if (!$resp->successful()) {
            return false;
        }

        return (string) ($resp->json()['verification_status'] ?? '') === 'SUCCESS';
    }
}

