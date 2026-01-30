<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Factura</title>
    <style>
        body{font-family: Arial, sans-serif; color:#111; margin:0; padding:0}
        .container{max-width:820px; margin:0 auto; padding:24px}
        .muted{color:#666}
        .header{display:flex; justify-content:space-between; gap:16px; align-items:flex-start}
        .tag{font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:#666; font-weight:700}
        .h1{font-size:28px; font-weight:900; margin:6px 0 0}
        .box{border:1px solid #ddd; border-radius:12px; padding:14px}
        .grid{display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:16px}
        table{width:100%; border-collapse:collapse; margin-top:16px}
        th,td{border-bottom:1px solid #eee; padding:10px 8px; text-align:left; vertical-align:top}
        th{font-size:11px; text-transform:uppercase; letter-spacing:.12em; color:#666}
        td.num, th.num{text-align:right}
        .totals{margin-top:16px; display:flex; justify-content:flex-end}
        .totals .inner{width:320px; border:1px solid #ddd; border-radius:12px; padding:12px}
        .row{display:flex; justify-content:space-between; gap:12px; margin-top:8px}
        .row strong{font-weight:900}
        .tickets{margin-top:24px}
        .ticket{border:1px solid #ddd; border-radius:12px; padding:12px; margin-top:12px}
        .qr{margin-top:8px}
    </style>
</head>
<body>
@php($issuer = (array) (((is_object($doc) ? ($doc->issuer ?? null) : null) ?: config('billing.issuer', []))))
@php($recipient = (array) ((is_object($doc) ? ($doc->recipient ?? null) : null) ?: []))
@php($lines = (array) ((is_object($doc) ? ($doc->lines ?? null) : null) ?: []))
@php($vatRate = (float) ((is_object($doc) ? ($doc->vat_rate ?? null) : null) ?? config('billing.vat_rate', 21.0)))
@php($service = app(\App\Services\TicketingService::class))
<div class="container">
    <div class="header">
        <div>
            <div class="tag">{{ ($doc && ($doc->kind ?? '') === 'invoice') ? 'FACTURA' : 'FACTURA PROFORMA' }}</div>
            <div class="h1">{{ $issuer['name'] ?? config('app.name') }}</div>
            <div class="muted">{{ $issuer['email'] ?? '' }} {{ ($issuer['phone'] ?? '') ? '• ' . $issuer['phone'] : '' }}</div>
        </div>
        <div class="box">
            <div><strong>Nº</strong> {{ (is_object($doc) ? ($doc->number ?? null) : null) ?? $tx->id }}</div>
            <div class="muted" style="margin-top:6px"><strong>Fecha</strong> {{ optional((is_object($doc) ? ($doc->issued_at ?? null) : null) ?? $tx->created_at)->format('d/m/Y') }}</div>
            <div class="muted" style="margin-top:6px"><strong>Moneda</strong> {{ strtoupper((is_object($doc) ? ($doc->currency ?? null) : null) ?? $tx->currency ?? 'EUR') }}</div>
        </div>
    </div>

    <div class="grid">
        <div class="box">
            <div class="tag" style="margin-bottom:8px">Emisor</div>
            <div><strong>{{ $issuer['name'] ?? '' }}</strong></div>
            @if(!empty($issuer['tax_id']))<div class="muted">NIF/CIF: {{ $issuer['tax_id'] }}</div>@endif
            @if(!empty($issuer['address_line1']))<div class="muted" style="margin-top:6px">{{ $issuer['address_line1'] }}</div>@endif
            @if(!empty($issuer['address_line2']))<div class="muted">{{ $issuer['address_line2'] }}</div>@endif
            @php($issuerCity = trim(implode(' ', array_filter([$issuer['postal_code'] ?? '', $issuer['city'] ?? '']))))
            @if($issuerCity !== '')<div class="muted">{{ $issuerCity }}</div>@endif
            @if(!empty($issuer['province']))<div class="muted">{{ $issuer['province'] }}</div>@endif
            @if(!empty($issuer['country']))<div class="muted">{{ $issuer['country'] }}</div>@endif
        </div>
        <div class="box">
            <div class="tag" style="margin-bottom:8px">Cliente</div>
            <div><strong>{{ trim(($recipient['name'] ?? '').' '.($recipient['last_name'] ?? '')) ?: ($tx->user->name ?? '') }}</strong></div>
            <div class="muted">{{ $recipient['email'] ?? ($tx->user->email ?? '') }}</div>
            @if(!empty($recipient['phone']))<div class="muted">{{ $recipient['phone'] }}</div>@endif
            @if(!empty($recipient['address_line1']))<div class="muted" style="margin-top:6px">{{ $recipient['address_line1'] }}</div>@endif
            @if(!empty($recipient['address_line2']))<div class="muted">{{ $recipient['address_line2'] }}</div>@endif
            @php($recCity = trim(implode(' ', array_filter([$recipient['postal_code'] ?? '', $recipient['city'] ?? '', $recipient['country'] ?? '']))))
            @if($recCity !== '')<div class="muted">{{ $recCity }}</div>@endif
        </div>
    </div>

    <table>
        <thead>
        <tr>
            <th>Concepto</th>
            <th class="num">Unidades</th>
            <th class="num">Precio (sin IVA)</th>
            <th class="num">IVA</th>
            <th class="num">Importe</th>
        </tr>
        </thead>
        <tbody>
        @foreach($lines as $l)
            @php($qty = (int) ($l['quantity'] ?? 0))
            @php($unitGross = (float) ($l['unit_price'] ?? 0))
            @php($unitBase = (float) ($l['base'] ?? 0) / max(1, $qty))
            @php($vat = (float) ($l['vat'] ?? 0))
            <tr>
                <td>{{ $l['description'] ?? 'Item' }}</td>
                <td class="num">{{ $qty }}</td>
                <td class="num">{{ number_format($unitBase, 2) }} €</td>
                <td class="num">{{ number_format($vatRate, 2) }}%</td>
                <td class="num"><strong>{{ number_format((float) ($l['total'] ?? 0), 2) }} €</strong></td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <div class="totals">
        <div class="inner">
            <div class="row"><span class="muted">Base imponible</span><strong>{{ number_format((float) ((is_object($doc) ? ($doc->subtotal_amount ?? 0) : 0)), 2) }} €</strong></div>
            <div class="row"><span class="muted">IVA ({{ number_format($vatRate, 2) }}%)</span><strong>{{ number_format((float) ((is_object($doc) ? ($doc->vat_amount ?? 0) : 0)), 2) }} €</strong></div>
            <div class="row" style="border-top:1px solid #eee; padding-top:10px; margin-top:10px"><span>Total</span><strong>{{ number_format((float) ((is_object($doc) ? ($doc->total_amount ?? null) : null) ?? $tx->total_amount ?? 0), 2) }} €</strong></div>
        </div>
    </div>

    @if(($doc && ($doc->kind ?? '') !== 'invoice'))
        <p class="muted" style="margin-top:16px">Documento provisional (proforma). No constituye una factura a efectos fiscales.</p>
    @endif

    @php($ticketItems = collect($tx->items ?? [])->filter(fn($it) => ($it->kind ?? null) === 'ticket' && $it->ticket))
    @if($ticketItems->count() > 0)
        <div class="tickets">
            <h3>Entradas / Tickets</h3>
            <p class="muted">Presenta el QR en el acceso. Cada ticket es único.</p>
            @foreach($ticketItems as $it)
                @php($payload = $service->buildTicketQrPayload($it->ticket, $tx))
                <div class="ticket">
                    <div><strong>{{ strtoupper($it->title ?? 'TICKET') }}</strong></div>
                    @if($it->ticket->event)
                        <div class="muted">{{ $it->ticket->event->name['es'] ?? $it->ticket->event->name['en'] ?? 'Evento' }}</div>
                    @endif
                    <div class="muted">UUID: {{ $it->ticket->id }}</div>
                    <div class="qr">
                        <img alt="QR" src="data:image/png;base64,{{ $service->generateQrImage($payload) }}" />
                    </div>
                </div>
            @endforeach
        </div>
    @endif
</div>
</body>
</html>
