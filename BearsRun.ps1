# BearsRun.ps1 - Lanzamiento persistente para Bears Week 2026
# Ejecucion: .\BearsRun.ps1

Write-Host "--- Iniciando Bears Week 2026 (Modo Persistente) ---" -ForegroundColor Cyan

# Asegurar que el script se ejecuta en su propio directorio
Set-Location $PSScriptRoot

function Get-DotEnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Key
    )

    if (-not (Test-Path $Path)) {
        return $null
    }

    $line = Get-Content $Path | Where-Object { $_ -match "^\s*$Key\s*=" } | Select-Object -First 1
    if (-not $line) {
        return $null
    }

    $value = ($line -replace "^\s*$Key\s*=\s*", "").Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        if ($value.Length -ge 2) {
            $value = $value.Substring(1, $value.Length - 2)
        }
    }

    return $value
}

function Escape-SqlLiteral {
    param([Parameter(Mandatory = $true)][string]$Value)
    return $Value.Replace("'", "''")
}

# 1. Verificar y sincronizar archivos criticos
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: No se encuentra el archivo .env principal." -ForegroundColor Red
    exit
}
Copy-Item ".env" "laravel\.env" -Force

# 2. Levantamiento inteligente (sin borrar nada)
Write-Host "STARTING containers..." -ForegroundColor Yellow
docker-compose up -d

# 3. Esperar a servicios liquidos
Write-Host "WAITING for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 3.5 Sincronizar credenciales de Postgres (sin borrar volumen)
Write-Host "SYNCING Postgres credentials with .env..." -ForegroundColor Yellow
$dbUser = Get-DotEnvValue -Path ".env" -Key "DB_USERNAME"
if (-not $dbUser) { $dbUser = Get-DotEnvValue -Path ".env" -Key "DB_USER" }
if (-not $dbUser) { $dbUser = "bweek_admin" }

$dbPassword = Get-DotEnvValue -Path ".env" -Key "DB_PASSWORD"
if (-not $dbPassword) { $dbPassword = "changeme_secure_password" }

$sqlUserLiteral = Escape-SqlLiteral -Value $dbUser
$sqlUserIdent = $dbUser.Replace('"', '""')
$sqlPassLiteral = Escape-SqlLiteral -Value $dbPassword

$sql = "DO `$$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$sqlUserLiteral') THEN CREATE ROLE `"$sqlUserIdent`" LOGIN PASSWORD '$sqlPassLiteral'; ELSE ALTER ROLE `"$sqlUserIdent`" WITH PASSWORD '$sqlPassLiteral'; END IF; END `$$;"
docker-compose exec -T postgres psql -U postgres -d postgres -c "$sql" | Out-Null

# 3.6 Asegurar migraciones y usuarios base para login
Write-Host "ENSURING migrations and default users..." -ForegroundColor Yellow
$fixedPassword = Get-DotEnvValue -Path ".env" -Key "BSW_FIXED_USERS_PASSWORD"
if (-not $fixedPassword) { $fixedPassword = "c4c4v4c4" }

$superAdminEmail = Get-DotEnvValue -Path ".env" -Key "BSW_FIXED_SUPERADMIN_EMAIL_1"
if (-not $superAdminEmail) { $superAdminEmail = "fernandocardonatoro@gmail.com" }

$adminEmail = Get-DotEnvValue -Path ".env" -Key "BSW_FIXED_ADMIN_EMAIL"
if (-not $adminEmail) { $adminEmail = "fernandocardonatoro2@gmail.com" }

$userEmail = Get-DotEnvValue -Path ".env" -Key "BSW_FIXED_USER_EMAIL"
if (-not $userEmail) { $userEmail = "fct.registro@gmail.com" }

docker-compose exec -T laravel php artisan migrate --force | Out-Null
docker-compose exec -T laravel php artisan users:ensure $superAdminEmail $fixedPassword --role=super_admin | Out-Null
docker-compose exec -T laravel php artisan users:ensure $adminEmail $fixedPassword --role=admin | Out-Null
docker-compose exec -T laravel php artisan users:ensure $userEmail $fixedPassword --role=user | Out-Null

# 3.7 Compilar assets frontend (para reflejar cambios en resources/js)
Write-Host "BUILDING frontend assets..." -ForegroundColor Yellow
docker-compose exec -T laravel npm run build

# 4. Verificación de salud rápida
$l_status = docker inspect --format='{{.State.Health.Status}}' bweek_laravel
Write-Host "Laravel Status: $l_status"

if ($l_status -ne "healthy") {
    Write-Host "RE-CONFIGURING Laravel (just in case)..." -ForegroundColor Gray
    docker-compose exec -T laravel php artisan config:cache
    docker-compose exec -T laravel php artisan route:cache
}

Write-Host "`nProject Bears Week 2026 is RUNNING!" -ForegroundColor Green
Write-Host "URL Web: http://localhost" -ForegroundColor Cyan
Write-Host "URL Admin: http://localhost/admin/dashboard" -ForegroundColor Cyan
Write-Host "URL n8n: http://localhost:5678" -ForegroundColor Cyan
