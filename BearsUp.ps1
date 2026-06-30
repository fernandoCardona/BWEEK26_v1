# BearsUp.ps1 - Script de Arranque Seguro para Bears Week 2026
# Ejecucion: .\BearsUp.ps1

Write-Host "--- Iniciando levantamiento de Bears Week 2026 ---" -ForegroundColor Cyan

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

# 1. Limpieza de contenedores previos
Write-Host "CLEANING Docker environment..." -ForegroundColor Yellow
docker-compose down --remove-orphans

# 2. Asegurar archivos criticos
Write-Host "CHECKING critical files..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: No se encuentra el archivo .env principal." -ForegroundColor Red
    exit
}
Copy-Item ".env" "laravel\.env" -Force

# 3. Build y Levantamiento
Write-Host "BUILDING and Starting containers..." -ForegroundColor Yellow
docker-compose up -d --build

# 4. Esperar a que los servicios esten listos
Write-Host "WAITING for Postgres and Laravel to be healthy..." -ForegroundColor Yellow
do {
    Start-Sleep -Seconds 3
    $status = docker inspect --format='{{.State.Health.Status}}' bweek_postgres
    $l_status = docker inspect --format='{{.State.Health.Status}}' bweek_laravel
    Write-Host "Status: Postgres=$status, Laravel=$l_status"
} while (($status -ne "healthy") -or ($l_status -ne "healthy"))

# 4.5 Sincronizar credenciales de Postgres (sin borrar volumen)
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
try {
    docker-compose exec -T postgres psql -U $dbUser -d postgres -c "$sql" | Out-Null
} catch {
    Write-Host "WARNING: Postgres credentials sync skipped. Continuing startup..." -ForegroundColor DarkYellow
}

# 5. Inicializacion de Laravel
Write-Host "CONFIGURING Laravel internally..." -ForegroundColor Yellow
docker-compose exec -T laravel composer dump-autoload
docker-compose exec -T laravel php artisan key:generate
docker-compose exec -T laravel php artisan jwt:secret --force
docker-compose exec -T laravel php artisan config:clear
docker-compose exec -T laravel php artisan cache:clear

# 6. Base de Datos
Write-Host "PREPARING extra databases..." -ForegroundColor Yellow
docker-compose exec -T postgres psql -U $dbUser -c "CREATE DATABASE n8n_db;" 2>$null
docker-compose exec -T postgres psql -U $dbUser -c "CREATE DATABASE ai_memory_db;" 2>$null

Write-Host "RUNNING migrations and seeders..." -ForegroundColor Yellow
docker-compose exec -T laravel php artisan migrate --seed --force

$fixedPassword = Get-DotEnvValue -Path ".env" -Key "BSW_FIXED_USERS_PASSWORD"
if (-not $fixedPassword) { $fixedPassword = "changeme_fixed_users_password" }

$superAdminEmail = Get-DotEnvValue -Path ".env" -Key "BSW_FIXED_SUPERADMIN_EMAIL_1"
if (-not $superAdminEmail) { $superAdminEmail = "superadmin@example.com" }

$adminEmail = Get-DotEnvValue -Path ".env" -Key "BSW_FIXED_ADMIN_EMAIL"
if (-not $adminEmail) { $adminEmail = "admin@example.com" }

$userEmail = Get-DotEnvValue -Path ".env" -Key "BSW_FIXED_USER_EMAIL"
if (-not $userEmail) { $userEmail = "user@example.com" }

docker-compose exec -T laravel php artisan users:ensure $superAdminEmail $fixedPassword --role=super_admin | Out-Null
docker-compose exec -T laravel php artisan users:ensure $adminEmail $fixedPassword --role=admin | Out-Null
docker-compose exec -T laravel php artisan users:ensure $userEmail $fixedPassword --role=user | Out-Null

# 6.5 Compilar assets frontend (para reflejar cambios en resources/js)
Write-Host "BUILDING frontend assets..." -ForegroundColor Yellow
docker-compose exec -T laravel npm install
docker-compose exec -T laravel npm run build

# 7. Reinicio de servicios
Write-Host "RESTARTING workers and n8n..." -ForegroundColor Yellow
docker-compose restart n8n queue scheduler nginx

Write-Host "`nProject Bears Week 2026 deployed successfully!" -ForegroundColor Green
Write-Host "URL Web: http://localhost" -ForegroundColor Cyan
Write-Host "URL Admin: http://localhost/admin/dashboard" -ForegroundColor Cyan
Write-Host "URL n8n: http://localhost:5678" -ForegroundColor Cyan
