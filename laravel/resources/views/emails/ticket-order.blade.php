<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Entradas</title>
    <style>
        body{font-family: Arial, sans-serif; color:#111}
        .ticket{border:1px solid #ddd; border-radius:12px; padding:12px; margin-bottom:12px}
        .qr{margin-top:8px}
    </style>
</head>
<body>
<h2>Tus entradas</h2>
<p>Gracias por tu compra. Aquí tienes tus entradas:</p>
@php($service = app(\App\Services\TicketingService::class))
@foreach(($tx->items ?? []) as $it)
    @if(($it->kind ?? null) === 'ticket' && $it->ticket)
        <div class="ticket">
            <div><strong>{{ strtoupper($it->title ?? 'TICKET') }}</strong></div>
            @if($it->ticket->event)
                <div>{{ $it->ticket->event->name['es'] ?? $it->ticket->event->name['en'] ?? 'Evento' }}</div>
                <div>{{ $it->ticket->event->address }}</div>
            @endif
            <div>Precio: {{ number_format((float)$it->unit_price, 2) }} €</div>
            <div>UUID: {{ $it->ticket->id }}</div>
            <div class="qr">
                <img alt="QR" src="data:image/png;base64,{{ $service->generateQrImage($it->ticket->qr_code) }}" />
            </div>
        </div>
    @endif
@endforeach
<p>Guarda este correo. También podrás ver tus transacciones en tu panel de usuario.</p>
</body>
</html>
