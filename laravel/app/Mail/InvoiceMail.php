<?php

namespace App\Mail;

use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $transactionId)
    {
    }

    public function build()
    {
        $tx = Transaction::query()
            ->with([
                'billingDocument',
                'items.ticket.event',
            ])
            ->where('id', $this->transactionId)
            ->first();

        if (!$tx) {
            return $this->subject('Factura / Proforma')->view('emails.invoice-missing');
        }

        $subject = ($tx->billingDocument && $tx->billingDocument->kind === 'invoice')
            ? ('Tu factura ' . $tx->billingDocument->number)
            : 'Tu proforma';

        return $this->subject($subject)
            ->view('emails.invoice', [
                'tx' => $tx,
                'doc' => $tx->billingDocument,
            ]);
    }
}

