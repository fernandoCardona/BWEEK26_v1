$ErrorActionPreference = "Stop"

$DbUser = $args[0]
$DbName = $args[1]

if ([string]::IsNullOrWhiteSpace($DbUser)) { $DbUser = "bweek_admin" }
if ([string]::IsNullOrWhiteSpace($DbName)) { $DbName = "ecommerce_db" }

$queries = @(
  "select 'events' as t, count(*)::int as n, max(updated_at) as last_update from events",
  "select 'agenda_locations' as t, count(*)::int as n, max(updated_at) as last_update from agenda_locations",
  "select 'agenda_subevent_templates' as t, count(*)::int as n, max(updated_at) as last_update from agenda_subevent_templates",
  "select 'event_program_items' as t, count(*)::int as n, max(updated_at) as last_update from event_program_items",
  "select 'event_ticket_types' as t, count(*)::int as n, max(updated_at) as last_update from event_ticket_types",
  "select 'ticket_templates' as t, count(*)::int as n, max(updated_at) as last_update from ticket_templates",
  "select 'tickets' as t, count(*)::int as n, max(updated_at) as last_update from tickets"
)

Write-Host "Docker services:" -ForegroundColor Cyan
docker compose ps

Write-Host "`nDB summary ($DbName):" -ForegroundColor Cyan
foreach ($q in $queries) {
  docker compose exec -T postgres psql -U $DbUser -d $DbName -c $q
}

Write-Host "`nRecent backups:" -ForegroundColor Cyan
Get-ChildItem -Path ".\\postgres\\backups" -Filter "*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -First 10 Name,LastWriteTime,Length
