<?php

namespace App\Mail;

use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TicketOrderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Transaction $transaction)
    {
    }

    public function build()
    {
        $tx = $this->transaction->loadMissing(['items.ticket.event']);
        return $this->subject('Tus entradas de Bears Week 2026')
            ->view('emails.ticket-order', ['tx' => $tx]);
    }
}
