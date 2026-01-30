<?php

namespace App\Http\Controllers;

use App\Mail\PaymentErrorMail;
use App\Models\Ticket;
use App\Models\Transaction;
use App\Services\OrderFulfillmentService;
use App\Services\PayPalService;
use App\Services\StockReservationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class PaymentWebhookController extends Controller
{
    public function stripe(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $secret = env('STRIPE_WEBHOOK_SECRET');
        if ($secret) {
            if (!$this->verifyStripeSignature($payload, $sigHeader, $secret)) {
                return response()->json(['error' => 'invalid_signature'], 400);
            }
        }

        $event = json_decode($payload, true);
        if (!is_array($event)) {
            return response()->json(['error' => 'invalid_payload'], 400);
        }

        $eventId = (string) ($event['id'] ?? '');
        if ($eventId === '') {
            return response()->json(['error' => 'missing_event_id'], 400);
        }

        if ($this->alreadyProcessed('stripe', $eventId)) {
            return response()->json(['received' => true]);
        }

        try {
            $type = (string) ($event['type'] ?? '');
            $obj = $event['data']['object'] ?? [];

            if ($type === 'checkout.session.completed') {
                $orderId = (string) ($obj['metadata']['order_id'] ?? '');
                if ($orderId !== '') {
                    $sessionId = (string) ($obj['id'] ?? '');
                    $paymentIntent = (string) ($obj['payment_intent'] ?? '');
                    $tx = Transaction::query()->where('id', $orderId)->first();
                    if ($tx) {
                        $tx->update([
                            'provider' => 'stripe',
                            'external_id' => $tx->external_id ?: ($sessionId !== '' ? $sessionId : null),
                            'meta' => array_merge($tx->meta ?? [], [
                                'stripe_session_id' => $sessionId !== '' ? $sessionId : null,
                                'stripe_payment_intent' => $paymentIntent !== '' ? $paymentIntent : null,
                            ]),
                        ]);
                    }

                    app(OrderFulfillmentService::class)->fulfill($orderId);
                    $this->markProcessed('stripe', $eventId, $sessionId, $orderId, $event);
                    return response()->json(['received' => true]);
                }
            }

            if ($type === 'checkout.session.expired') {
                $orderId = (string) ($obj['metadata']['order_id'] ?? '');
                $sessionId = (string) ($obj['id'] ?? '');
                if ($orderId !== '') {
                    $this->markFailed($orderId, 'stripe_session_expired');
                    $this->markProcessed('stripe', $eventId, $sessionId, $orderId, $event);
                    return response()->json(['received' => true]);
                }
            }

            if ($type === 'payment_intent.payment_failed') {
                $orderId = (string) ($obj['metadata']['order_id'] ?? '');
                $paymentIntent = (string) ($obj['id'] ?? '');
                if ($orderId !== '') {
                    $this->markFailed($orderId, 'stripe_payment_failed');
                    $this->markProcessed('stripe', $eventId, $paymentIntent, $orderId, $event);
                    return response()->json(['received' => true]);
                }

                if ($paymentIntent !== '') {
                    $tx = Transaction::query()->whereRaw("(meta->>'stripe_payment_intent') = ?", [$paymentIntent])->first();
                    if ($tx) {
                        $this->markFailed($tx->id, 'stripe_payment_failed');
                        $this->markProcessed('stripe', $eventId, $paymentIntent, $tx->id, $event);
                        return response()->json(['received' => true]);
                    }
                }
            }

            if ($type === 'charge.refunded') {
                $paymentIntent = (string) ($obj['payment_intent'] ?? '');
                if ($paymentIntent !== '') {
                    $tx = Transaction::query()->whereRaw("(meta->>'stripe_payment_intent') = ?", [$paymentIntent])->first();
                    if ($tx) {
                        $this->markRefunded($tx->id);
                        $this->markProcessed('stripe', $eventId, $paymentIntent, $tx->id, $event);
                        return response()->json(['received' => true]);
                    }
                }
            }

            $this->markProcessed('stripe', $eventId, null, null, $event);
            return response()->json(['received' => true]);
        } catch (\Throwable $e) {
            $this->recordPaymentError('stripe', $eventId, null, null, $event, $e);
            return response()->json(['error' => 'processing_failed'], 500);
        }
    }

    public function paypal(Request $request)
    {
        $payload = $request->getContent();
        $json = json_decode($payload, true);
        if (!is_array($json)) {
            return response()->json(['error' => 'invalid_payload'], 400);
        }

        $eventId = (string) ($json['id'] ?? '');
        if ($eventId === '') {
            return response()->json(['error' => 'missing_event_id'], 400);
        }

        if (!app(PayPalService::class)->verifyWebhookSignature($request->headers->all(), $payload)) {
            return response()->json(['error' => 'invalid_signature'], 400);
        }

        if ($this->alreadyProcessed('paypal', $eventId)) {
            return response()->json(['received' => true]);
        }

        try {
            $eventType = (string) ($json['event_type'] ?? '');
            $resource = $json['resource'] ?? [];

            $txId = (string) ($resource['custom_id'] ?? '');
            $orderId = (string) ($resource['supplementary_data']['related_ids']['order_id'] ?? '');
            $externalId = $orderId !== '' ? $orderId : ((string) ($resource['id'] ?? ''));

            $tx = null;
            if ($txId !== '') {
                $tx = Transaction::query()->where('id', $txId)->first();
            }
            if (!$tx && $orderId !== '') {
                $tx = Transaction::query()->where('provider', 'paypal')->where('external_id', $orderId)->first();
            }

            if ($eventType === 'PAYMENT.CAPTURE.COMPLETED') {
                if ($tx) {
                    app(OrderFulfillmentService::class)->fulfill($tx->id);
                    $this->markProcessed('paypal', $eventId, $externalId, $tx->id, $json);
                    return response()->json(['received' => true]);
                }
            }

            if (in_array($eventType, ['PAYMENT.CAPTURE.DENIED', 'PAYMENT.CAPTURE.DECLINED', 'CHECKOUT.ORDER.CANCELLED'], true)) {
                if ($tx) {
                    $this->markFailed($tx->id, $eventType);
                    $this->markProcessed('paypal', $eventId, $externalId, $tx->id, $json);
                    return response()->json(['received' => true]);
                }
            }

            if ($eventType === 'PAYMENT.CAPTURE.REFUNDED') {
                if ($tx) {
                    $this->markRefunded($tx->id);
                    $this->markProcessed('paypal', $eventId, $externalId, $tx->id, $json);
                    return response()->json(['received' => true]);
                }
            }

            $this->markProcessed('paypal', $eventId, $externalId !== '' ? $externalId : null, $tx?->id, $json);
            return response()->json(['received' => true]);
        } catch (\Throwable $e) {
            $this->recordPaymentError('paypal', $eventId, null, null, $json, $e);
            return response()->json(['error' => 'processing_failed'], 500);
        }
    }

    private function alreadyProcessed(string $provider, string $eventId): bool
    {
        return DB::table('payment_webhook_events')
            ->where('provider', $provider)
            ->where('event_id', $eventId)
            ->exists();
    }

    private function markProcessed(string $provider, string $eventId, ?string $externalId, ?string $transactionId, $payload): void
    {
        DB::table('payment_webhook_events')->insert([
            'provider' => $provider,
            'event_id' => $eventId,
            'external_id' => $externalId,
            'transaction_id' => $transactionId,
            'payload' => is_array($payload) ? json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
            'processed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function markFailed(string $transactionId, string $reason): void
    {
        DB::transaction(function () use ($transactionId, $reason) {
            $tx = Transaction::query()->where('id', $transactionId)->lockForUpdate()->first();
            if (!$tx) return;
            $status = strtolower((string) $tx->status);
            if (in_array($status, ['completed', 'refunded'], true)) {
                return;
            }
            $tx->update([
                'status' => 'failed',
                'meta' => array_merge($tx->meta ?? [], ['failed_reason' => $reason]),
            ]);

            try {
                app(StockReservationService::class)->releaseTickets($tx);
            } catch (\Throwable $e) {
            }
        });
    }

    private function markRefunded(string $transactionId): void
    {
        DB::transaction(function () use ($transactionId) {
            $tx = Transaction::query()->where('id', $transactionId)->lockForUpdate()->first();
            if (!$tx) return;
            if (strtolower((string) $tx->status) === 'refunded') {
                return;
            }
            $tx->update(['status' => 'refunded']);
            Ticket::query()->where('transaction_id', $tx->id)->update([
                'status' => 'void',
            ]);
        });
    }

    private function recordPaymentError(string $provider, ?string $eventId, ?string $externalId, ?string $transactionId, $payload, \Throwable $e): void
    {
        $base = [
            'provider' => $provider,
            'event_id' => $eventId,
            'external_id' => $externalId,
            'transaction_id' => $transactionId,
            'error' => mb_substr($e->getMessage(), 0, 2000),
            'payload' => is_array($payload) ? json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
            'last_attempt_at' => now(),
            'updated_at' => now(),
        ];

        $existing = null;
        if ($eventId) {
            $existing = DB::table('payment_errors')
                ->where('provider', $provider)
                ->where('event_id', $eventId)
                ->orderByDesc('id')
                ->first();
        }

        $attempts = 1;
        if ($existing) {
            $attempts = ((int) ($existing->attempts ?? 0)) + 1;
            DB::table('payment_errors')->where('id', $existing->id)->update([
                ...$base,
                'attempts' => $attempts,
            ]);
        } else {
            DB::table('payment_errors')->insert([
                ...$base,
                'attempts' => 1,
                'created_at' => now(),
            ]);
        }

        if ($attempts >= 3) {
            $adminEmail = $this->adminEmail();
            if ($adminEmail) {
                try {
                    Mail::to($adminEmail)->send(new PaymentErrorMail(
                        $provider,
                        $eventId,
                        $externalId,
                        $transactionId,
                        (string) $base['error'],
                        $attempts
                    ));
                } catch (\Throwable $mailError) {
                }
            }
        }
    }

    private function adminEmail(): ?string
    {
        $candidates = [
            env('BSW_FIXED_ADMIN_EMAIL'),
            env('BSW_FIXED_SUPERADMIN_EMAIL_1'),
            env('BSW_FIXED_SUPERADMIN_EMAIL_2'),
        ];
        foreach ($candidates as $email) {
            $email = trim((string) $email);
            if ($email !== '') return $email;
        }
        return null;
    }

    private function verifyStripeSignature(string $payload, ?string $sigHeader, string $secret): bool
    {
        if (!$sigHeader) return false;
        $parts = [];
        foreach (explode(',', $sigHeader) as $piece) {
            [$k, $v] = array_pad(explode('=', trim($piece), 2), 2, null);
            if ($k && $v) $parts[$k] = $v;
        }
        $t = $parts['t'] ?? null;
        $v1 = $parts['v1'] ?? null;
        if (!$t || !$v1) return false;
        $signedPayload = "{$t}.{$payload}";
        $expected = hash_hmac('sha256', $signedPayload, $secret);
        return hash_equals($expected, $v1);
    }
}
