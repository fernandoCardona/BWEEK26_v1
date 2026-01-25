# BearsRun.ps1 - Lanzamiento persistente para Bears Week 2026
# Ejecucion: .\BearsRun.ps1

Write-Host "--- Iniciando Bears Week 2026 (Modo Persistente) ---" -ForegroundColor Cyan

# Asegurar que el script se ejecuta en su propio directorio
Set-Location $PSScriptRoot

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
