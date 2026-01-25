# BearsUp.ps1 - Script de Arranque Seguro para Bears Week 2026
# Ejecucion: .\BearsUp.ps1

Write-Host "--- Iniciando levantamiento de Bears Week 2026 ---" -ForegroundColor Cyan

# Asegurar que el script se ejecuta en su propio directorio
Set-Location $PSScriptRoot

# 1. Limpieza de contenedores previos
Write-Host "CLEANING Docker environment..." -ForegroundColor Yellow
docker-compose down --remove-orphans

# 2. Asegurar archivos criticos
Write-Host "CHECKING critical files..." -ForegroundColor Yellow
if (-not (Test-Path "laravel\.env")) {
    Copy-Item ".env" "laravel\.env"
}

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
} while (($status -ne "healthy") -and ($l_status -ne "healthy"))

# 5. Inicializacion de Laravel
Write-Host "CONFIGURING Laravel internally..." -ForegroundColor Yellow
docker-compose exec -T laravel composer dump-autoload
docker-compose exec -T laravel php artisan key:generate
docker-compose exec -T laravel php artisan jwt:secret --force
docker-compose exec -T laravel php artisan config:clear
docker-compose exec -T laravel php artisan cache:clear

# 6. Base de Datos
Write-Host "PREPARING extra databases..." -ForegroundColor Yellow
docker-compose exec -T postgres psql -U bweek_admin -c "CREATE DATABASE n8n_db;" 2>$null
docker-compose exec -T postgres psql -U bweek_admin -c "CREATE DATABASE ai_memory_db;" 2>$null

Write-Host "RUNNING migrations and seeders..." -ForegroundColor Yellow
docker-compose exec -T laravel php artisan migrate --seed --force

# 7. Reinicio de servicios
Write-Host "RESTARTING workers and n8n..." -ForegroundColor Yellow
docker-compose restart n8n queue scheduler nginx

Write-Host "`nProject Bears Week 2026 deployed successfully!" -ForegroundColor Green
Write-Host "URL Web: http://localhost" -ForegroundColor Cyan
Write-Host "URL Admin: http://localhost/admin/dashboard" -ForegroundColor Cyan
Write-Host "URL n8n: http://localhost:5678" -ForegroundColor Cyan
