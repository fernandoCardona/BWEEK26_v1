<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Validación de Ticket</title>
    <style>
        body{font-family: Arial, sans-serif; background:#0b0b0f; color:#fff; padding:24px}
        .card{max-width:720px; margin:0 auto; background:#14141c; border:1px solid rgba(255,255,255,.12); border-radius:18px; padding:18px}
        .badge{display:inline-block; padding:6px 10px; border-radius:999px; font-weight:900; letter-spacing:.14em; font-size:11px; text-transform:uppercase}
        .ok{background:rgba(16,185,129,.15); color:#34d399; border:1px solid rgba(52,211,153,.3)}
        .bad{background:rgba(239,68,68,.15); color:#f87171; border:1px solid rgba(248,113,113,.3)}
        .muted{color:rgba(255,255,255,.65)}
        .row{display:flex; justify-content:space-between; gap:14px; margin-top:10px; flex-wrap:wrap}
        .kv{min-width:260px}
        .kv b{display:block; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.55)}
        .kv span{display:block; font-size:14px; font-weight:800; margin-top:4px}
    </style>
</head>
<body>
<div class="card">
    <div class="row" style="align-items:center">
        <div>
            <div class="badge {{ $ok ? 'ok' : 'bad' }}">{{ $ok ? 'VÁLIDO' : 'NO VÁLIDO' }}</div>
            <h1 style="margin:10px 0 0; font-size:22px; font-weight:900">Ticket</h1>
            <div class="muted" style="margin-top:6px">{{ $ticket->id }}</div>
        </div>
        <div class="muted">{{ $ticket->validated_at ? 'Escaneado: ' . $ticket->validated_at->format('d/m/Y H:i') : 'Sin escanear' }}</div>
    </div>

    @if(!$ok && $message)
        <div class="muted" style="margin-top:12px">{{ $message }}</div>
    @endif

    <div class="row" style="margin-top:16px">
        <div class="kv">
            <b>Asistente</b>
            <span>{{ $ticket->user?->name ?? '—' }} {{ $ticket->user?->last_name ?? '' }}</span>
            <div class="muted" style="margin-top:6px">{{ $ticket->user?->email ?? '' }}{{ $ticket->user?->phone ? ' • ' . $ticket->user->phone : '' }}</div>
        </div>
        <div class="kv">
            <b>Evento</b>
            <span>{{ $ticket->event ? ($ticket->event->name['es'] ?? $ticket->event->name['en'] ?? 'Evento') : '—' }}</span>
            @if($ticket->event && $ticket->event->parent)
                <div class="muted" style="margin-top:6px">{{ $ticket->event->parent->name['es'] ?? $ticket->event->parent->name['en'] ?? '' }}</div>
            @endif
            <div class="muted" style="margin-top:6px">{{ $ticket->event?->address ?? '' }}</div>
        </div>
    </div>
</div>
</body>
</html>

