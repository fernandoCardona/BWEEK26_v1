<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PaymentErrorMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $provider,
        public ?string $eventId,
        public ?string $externalId,
        public ?string $transactionId,
        public string $error,
        public int $attempts
    ) {
    }

    public function build()
    {
        return $this->subject("Payment webhook error ({$this->provider})")
            ->view('emails.payment-error', [
                'provider' => $this->provider,
                'eventId' => $this->eventId,
                'externalId' => $this->externalId,
                'transactionId' => $this->transactionId,
                'error' => $this->error,
                'attempts' => $this->attempts,
            ]);
    }
}

