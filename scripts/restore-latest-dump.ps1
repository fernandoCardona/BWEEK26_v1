param(
  [string]$Database = "ecommerce_db",
  [switch]$All
)

$ErrorActionPreference = "Stop"

function Get-EnvValue([string]$FilePath, [string]$Key, [string]$DefaultValue) {
  if (!(Test-Path -LiteralPath $FilePath)) { return $DefaultValue }
  $line = Get-Content -LiteralPath $FilePath | Where-Object { $_ -match "^\s*$Key\s*=" } | Select-Object -First 1
  if (!$line) { return $DefaultValue }
  $val = ($line -split "=", 2)[1].Trim()
  if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Substring(1, $val.Length - 2) }
  if ($val.StartsWith("'") -and $val.EndsWith("'")) { $val = $val.Substring(1, $val.Length - 2) }
  if ($val -eq "") { return $DefaultValue }
  return $val
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$envPath = Join-Path $root ".env"
$user = Get-EnvValue $envPath "DB_USERNAME" "bweek_admin"
$pass = Get-EnvValue $envPath "DB_PASSWORD" "changeme_secure_password"

$backupsDir = Join-Path $root "postgres\\backups"
if (!(Test-Path -LiteralPath $backupsDir)) {
  throw "No existe la carpeta de backups: $backupsDir"
}

function Restore-One([string]$Db) {
  $pattern = Join-Path $backupsDir ("{0}_*.dump" -f $Db)
  $latest = Get-ChildItem -LiteralPath $backupsDir -Filter ("{0}_*.dump" -f $Db) -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (!$latest) {
    throw "No hay dumps para $Db en $backupsDir"
  }
  $fileName = $latest.Name
  Write-Host ("Restaurando {0} desde {1}" -f $Db, $fileName)
  $cmd = "export PGPASSWORD='$pass'; pg_restore --clean --if-exists --no-owner --no-privileges -U '$user' -d '$Db' '/backups/$fileName'"
  docker-compose -f (Join-Path $root "docker-compose.yml") exec -T postgres sh -lc $cmd | Write-Host
  Write-Host ("OK {0}" -f $Db)
}

if ($All) {
  Restore-One "ecommerce_db"
  Restore-One "n8n_db"
  Restore-One "ai_memory_db"
  exit 0
}

Restore-One $Database
