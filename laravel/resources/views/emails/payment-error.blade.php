<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Payment error</title>
</head>
<body>
<h3>Error de webhook de pago</h3>
<ul>
    <li>Provider: {{ $provider }}</li>
    <li>Event ID: {{ $eventId ?? '—' }}</li>
    <li>External ID: {{ $externalId ?? '—' }}</li>
    <li>Transaction ID: {{ $transactionId ?? '—' }}</li>
    <li>Attempts: {{ $attempts }}</li>
</ul>
<pre style="white-space:pre-wrap">{{ $error }}</pre>
</body>
</html>

