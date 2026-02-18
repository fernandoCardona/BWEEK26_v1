# 🚀 Guía de Acceso y Visualización - Bears Week 2026

Esta guía explica paso a paso cómo levantar el ecosistema completo y acceder a cada una de las partes del proyecto (Web, Administración y Automatización).

---

## 🛠️ 1. Levantar el Proyecto (Docker)

Asegúrate de estar en la carpeta raíz del proyecto (donde está `docker-compose.yml`).

### Paso A: Preparar Entorno
```bash
# Copiar el archivo de ejemplo a real
copy .env.example .env

# (macOS / Linux)
# cp .env.example .env

# Editar .env con tus claves (Stripe, OpenAI, Telegram, etc.)
# Si no tienes las claves ahora, el proyecto arrancará igual con valores demo.
```

### Paso B: Encender Motores
```bash
# Primera vez (Windows): inicializa keys, JWT, migraciones, seeders y build
.\BearsUp.ps1

# Siguientes arranques (Windows): arranque persistente sin borrar datos
# .\BearsRun.ps1

# Alternativa multiplataforma
# docker-compose up -d --build
```

### Si aparece “error de credenciales” (PostgreSQL)
Cuando ya existe el volumen `bweek_postgres_data`, cambiar `DB_USER/DB_PASSWORD` en el `.env` **no actualiza** automáticamente la contraseña dentro de Postgres (solo se aplica en la primera inicialización). Para arreglarlo sin borrar nada:

```bash
# Opción recomendada en Windows: usar el arranque “persistente”
.\BearsRun.ps1
```

O manualmente (sin perder datos):

```bash
docker-compose exec -T postgres psql -U postgres -d postgres -c "ALTER ROLE \"TU_DB_USER\" WITH PASSWORD 'TU_DB_PASSWORD';"
```

### Paso C: Inicializar Base de Datos y Claves
```bash
# Entrar al contenedor de aplicaciones
docker-compose exec laravel bash

# Dentro del contenedor ejecutar:
php artisan key:generate
php artisan migrate --seed
php artisan jwt:secret
exit
```

---

## 🌐 2. Visualización Web (Frontend)

El proyecto utiliza **Laravel 12 + React + Inertia.js** con un diseño premium.

### Acceso a la Web Pública
Abre tu navegador en: **[http://localhost](http://localhost)**

**Secciones disponibles:**
- 🏠 **Home**: Diseño dinámico con animaciones Framer Motion.
- 🎟️ **Eventos**: Calendario de ticketing (`/events`).
- 🛒 **Tienda**: Catálogo de merchandising (`/shop`).
- 🔐 **Login/Registro**: Sistema de cuentas de usuario.

### Acceso al Panel de Administración
Para ver métricas y gestión de leads:
Abre: **[http://localhost/admin/dashboard](http://localhost/admin/dashboard)**

*Nota: Las cuentas fijas (user/admin/super_admin) se definen en tu `.env` con `BSW_FIXED_*`.*

---

## 🤖 3. Acceder a n8n (Cerebro IA)

El servicio de n8n está configurado para ser **interno y seguro**, no expuesto directamente a internet sin protección.

### Método A: Acceso Local (Docker Network)
Si estás en la misma máquina o red local, puedes acceder a través de n8n:
URL: **[http://localhost:5678](http://localhost:5678)**

### Método B: Credenciales de Acceso
Al acceder, te pedirá autenticación básica (Basic Auth) definida en el `.env`:
- **Usuario**: `admin`
- **Contraseña**: Ver `N8N_BASIC_AUTH_PASSWORD` en tu `.env`.

### Visualizar Workflows
Una vez dentro:
1. Ve a **Workflows**.
2. Verás el workflow inicial: **`BW_Personal_Assistant`**.
3. Este workflow ya está conectado internamente con la API de Laravel en `http://laravel:80`.

---

## 📄 4. Documentación de Referencia

He creado varios documentos detallados para cada módulo:

1. 📘 **README.md**: Instrucciones técnicas completas.
2. 📗 **API_DOCUMENTATION.md**: Endpoints para n8n y desarrolladores.

---

## ✅ Resumen de Salud del Sistema

Para verificar que todo está correcto, puedes correr:

```bash
# Ver estado de salud
docker-compose ps

# Ver logs de un servicio específico si algo no carga
docker-compose logs -f n8n
```

¡Ya tienes todo el ecosistema Bears Week 2026 listo para ser explorado! 🐻🚀
