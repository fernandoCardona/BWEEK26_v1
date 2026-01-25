# 🐻 Bears Week 2026 - Ecosistema Digital Completo

Sistema completo de ecommerce + automatización con IA para Bears Sitges Week 2026.

## 📋 Stack Tecnológico

- **Backend**: Laravel 12 (PHP 8.4)
- **Frontend**: React + Inertia.js + Tailwind CSS
- **Base de Datos**: PostgreSQL 16 + pgvector
- **Caché**: Redis 7
- **Automatización**: n8n + Model Context Protocol (MCP)
- **Orquestación**: Docker Compose
- **Proxy**: Nginx + Nginx Proxy Manager

## 🚀 Instalación Rápida

### Requisitos Previos

- Docker Desktop instalado
- Git
- Mínimo 4GB RAM disponible
- 10GB espacio en disco

### Paso 1: Clonar el Proyecto

```bash
cd c:\Users\fernandocardona\Documents\ContentWorkPC26\BEARSWEEK26_V1
# El proyecto ya está en BWeek26/
```

### Paso 2: Configurar Variables de Entorno

```bash
cd BWeek26
copy .env.example .env
```

**IMPORTANTE**: Edita el archivo `.env` y cambia:

```env
# Seguridad (CAMBIAR OBLIGATORIAMENTE)
DB_PASSWORD=tu_password_seguro_aqui
N8N_API_TOKEN=generar_token_aleatorio_32_caracteres
N8N_ENCRYPTION_KEY=generar_key_aleatoria_32_caracteres
JWT_SECRET=generar_secret_aleatorio_32_caracteres
N8N_BASIC_AUTH_PASSWORD=tu_password_n8n_aqui

# Generar APP_KEY de Laravel (se hace después)
APP_KEY=
```

**Generar claves seguras** (PowerShell):
```powershell
# Generar string aleatorio de 32 caracteres
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Paso 3: Levantar los Servicios

```bash
# Levantar todos los contenedores
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Verificar que todos los servicios están corriendo
docker-compose ps
```

**Servicios que deben estar "Up"**:
- ✅ bweek_postgres
- ✅ bweek_redis
- ✅ bweek_laravel
- ✅ bweek_nginx
- ✅ bweek_n8n
- ✅ bweek_proxy
- ✅ bweek_queue
- ✅ bweek_scheduler

### Paso 4: Inicializar Laravel

```bash
# Entrar al contenedor de Laravel
docker-compose exec laravel bash

# Generar APP_KEY
php artisan key:generate

# Ejecutar migraciones
php artisan migrate

# Crear usuario admin
php artisan db:seed --class=AdminUserSeeder

# Generar JWT secret
php artisan jwt:secret

# Limpiar caché
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Salir del contenedor
exit
```

### Paso 5: Acceder a las Aplicaciones

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Web Principal** | http://localhost | - |
| **Nginx Proxy Manager** | http://localhost:81 | admin@example.com / changeme |
| **n8n** (solo interno) | Túnel SSH | Ver .env |

## 🔧 Configuración Post-Instalación

### Configurar SSL (Nginx Proxy Manager)

1. Acceder a http://localhost:81
2. Login con credenciales por defecto
3. Ir a "Proxy Hosts" → "Add Proxy Host"
4. Configurar:
   - **Domain**: bearssitges.com
   - **Forward to**: nginx:80
   - **SSL**: Request SSL Certificate (Let's Encrypt)

### Configurar n8n

```bash
# Acceder a n8n vía túnel SSH
ssh -L 5678:localhost:5678 usuario@tu-vps-ip

# Luego abrir en navegador: http://localhost:5678
```

**Credenciales n8n**: Ver `N8N_BASIC_AUTH_USER` y `N8N_BASIC_AUTH_PASSWORD` en `.env`

### Importar Workflows de n8n

1. Acceder a n8n
2. Ir a "Workflows" → "Import from File"
3. Importar archivos de `n8n/workflows/`:
   - `BW_Personal_Assistant.json`
   - `Lead_Management.json`
   - `Newsletter_Campaign.json`
   - `User_Registration.json`

## 📱 Configurar Integraciones

### WhatsApp Business (Twilio)

1. Crear cuenta en [Twilio](https://www.twilio.com/)
2. Obtener:
   - Account SID
   - Auth Token
   - WhatsApp Phone Number
3. Añadir al `.env`:
```env
WHATSAPP_ACCOUNT_SID=tu_account_sid
WHATSAPP_AUTH_TOKEN=tu_auth_token
WHATSAPP_PHONE_NUMBER=+34612345678
```

### Telegram Bot

1. Hablar con [@BotFather](https://t.me/botfather)
2. Crear bot: `/newbot`
3. Copiar token
4. Añadir al `.env`:
```env
TELEGRAM_BOT_TOKEN=tu_bot_token_aqui
TELEGRAM_BOT_USERNAME=BearsWeekBot
```

### Google Workspace (Service Account)

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear proyecto
3. Habilitar APIs: Calendar, Gmail, Drive
4. Crear Service Account
5. Descargar JSON de credenciales
6. Copiar contenido al `.env` en `GOOGLE_SERVICE_ACCOUNT_JSON`

### OpenAI (Traducción Automática)

1. Obtener API key de [OpenAI](https://platform.openai.com/)
2. Añadir al `.env`:
```env
OPENAI_API_KEY=sk-tu_api_key_aqui
```

## 🗄️ Gestión de Base de Datos

### Acceder a PostgreSQL

```bash
# Desde línea de comandos
docker-compose exec postgres psql -U bweek_admin -d ecommerce_db

# Ver bases de datos
\l

# Conectar a otra BD
\c ai_memory_db

# Ver tablas
\dt

# Salir
\q
```

### Backup Manual

```bash
# Backup de todas las bases de datos
docker-compose exec postgres pg_dumpall -U bweek_admin > backup_$(date +%Y%m%d).sql

# Backup de una BD específica
docker-compose exec postgres pg_dump -U bweek_admin ecommerce_db > ecommerce_backup.sql
```

### Restaurar Backup

```bash
# Restaurar todas las BDs
docker-compose exec -T postgres psql -U bweek_admin < backup_20260124.sql

# Restaurar una BD específica
docker-compose exec -T postgres psql -U bweek_admin -d ecommerce_db < ecommerce_backup.sql
```

## 🔍 Scraping de Contenido

### Ejecutar Scraper

```bash
# Instalar dependencias de Python
pip install scrapy

# Ejecutar scraper
python scraping/scraper.py

# Importar contenido a Laravel
docker-compose exec laravel php artisan scraping:import --source=scraping/pages/home
```

## 🌐 Multilenguaje

### Añadir Traducciones Manualmente

```bash
# Editar archivos de traducción
# resources/lang/es/app.php
# resources/lang/ca/app.php
# resources/lang/en/app.php
# resources/lang/fr/app.php
# resources/lang/de/app.php
```

### Traducción Automática con n8n

```bash
# Desde Laravel, llamar al webhook de n8n
POST http://n8n:5678/webhook/auto-translate
{
  "translatable_type": "Product",
  "translatable_id": "uuid",
  "source_lang": "es",
  "target_langs": ["ca", "en", "fr", "de"],
  "fields": ["name", "description"]
}
```

## 🧪 Testing

### Tests de Laravel

```bash
# Ejecutar todos los tests
docker-compose exec laravel php artisan test

# Tests específicos
docker-compose exec laravel php artisan test --filter=AuthenticationTest
```

### Verificar Health Checks

```bash
# Laravel
curl http://localhost/health

# PostgreSQL
docker-compose exec postgres pg_isready

# Redis
docker-compose exec redis redis-cli ping

# n8n
curl http://localhost:5678/healthz
```

## 📊 Monitoreo

### Ver Logs

```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f laravel
docker-compose logs -f postgres
docker-compose logs -f n8n

# Últimas 100 líneas
docker-compose logs --tail=100 laravel
```

### Estadísticas de Contenedores

```bash
# Uso de recursos
docker stats

# Espacio en disco
docker system df

# Limpiar recursos no usados
docker system prune -a
```

## 🛠️ Comandos Útiles

### Reiniciar Servicios

```bash
# Reiniciar todo
docker-compose restart

# Reiniciar servicio específico
docker-compose restart laravel
docker-compose restart n8n
```

### Reconstruir Contenedores

```bash
# Reconstruir Laravel (después de cambios en Dockerfile)
docker-compose build laravel
docker-compose up -d laravel

# Reconstruir todo
docker-compose build
docker-compose up -d
```

### Limpiar y Empezar de Cero

```bash
# ADVERTENCIA: Esto eliminará TODOS los datos
docker-compose down -v
docker-compose up -d
```

## 🐛 Troubleshooting

### Error: "Cannot connect to PostgreSQL"

```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Error: "Permission denied" en Laravel

```bash
# Arreglar permisos
docker-compose exec laravel chown -R www-data:www-data /var/www/html/storage
docker-compose exec laravel chmod -R 755 /var/www/html/storage
```

### Error: "Redis connection refused"

```bash
# Verificar Redis
docker-compose exec redis redis-cli ping

# Debe responder: PONG
```

### n8n no arranca

```bash
# Ver logs
docker-compose logs n8n

# Verificar que PostgreSQL está listo
docker-compose exec postgres pg_isready

# Reiniciar n8n
docker-compose restart n8n
```

## 📚 Documentación Adicional

- [Master Prompt](MASTER_PROMPT_ARQUITECTURA.md) - Especificaciones completas
- [Sistema de Diseño](design_system.md) - Guía de frontend
- [Plan de Implementación](implementation_plan.md) - Detalles técnicos
- [API Documentation](API_DOCUMENTATION.md) - Endpoints y ejemplos

## 🔐 Seguridad

### Checklist Pre-Producción

- [ ] Cambiar todas las contraseñas del `.env`
- [ ] Generar nuevas claves (APP_KEY, JWT_SECRET, etc.)
- [ ] Configurar firewall UFW
- [ ] Habilitar SSL en Nginx Proxy Manager
- [ ] Configurar backups automáticos
- [ ] Revisar logs de seguridad
- [ ] Configurar 2FA para admin
- [ ] Limitar acceso a n8n (solo VPN/SSH)

### Firewall (UFW)

```bash
# Habilitar firewall
sudo ufw enable

# Permitir solo puertos necesarios
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Verificar
sudo ufw status
```

## 👥 Soporte

Para problemas o preguntas:
- Email: soporte@bearssitges.com
- Documentación: Ver archivos en `/docs`

## 📄 Licencia

© 2026 Bears Week Sitges. Todos los derechos reservados.
