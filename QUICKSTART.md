# 🚀 Guía de Acceso y Visualización - Bears Week 2026

Esta guía explica paso a paso cómo levantar el ecosistema completo y acceder a cada una de las partes del proyecto (Web, Administración y Automatización).

---

## 🛠️ 1. Levantar el Proyecto (Docker)

Asegúrate de estar en la carpeta raíz del proyecto: `c:\Users\fernandocardona\Documents\ContentWorkPC26\BEARSWEEK26_V1\BWeek26`.

### Paso A: Preparar Entorno
```bash
# Copiar el archivo de ejemplo a real
copy .env.example .env

# Editar .env con tus claves (Stripe, OpenAI, Telegram, etc.)
# Si no tienes las claves ahora, el proyecto arrancará igual con valores demo.
```

### Paso B: Encender Motores
```bash
# Levantar todos los contenedores en segundo plano
docker-compose up -d

# Esperar 30-60 segundos a que PostgreSQL y Redis estén saludables.
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

*Nota: Debes estar logueado como admin (ver `DatabaseSeeder.php` para credenciales por defecto: `admin@bearssitges.com` / `password`).*

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

1. 📘 [**README.md**](file:///c:/Users/fernandocardona/Documents/ContentWorkPC26/BEARSWEEK26_V1/BWeek26/README.md): Instrucciones técnicas completas.
2. 📗 [**API_DOCUMENTATION.md**](file:///c:/Users/fernandocardona/Documents/ContentWorkPC26/BEARSWEEK26_V1/BWeek26/API_DOCUMENTATION.md): Endpoints para n8n y desarrolladores.
3. 📙 [**design_system.md**](file:///C:/Users/fernandocardona/.gemini/antigravity/brain/2059434e-3401-4f37-875a-9ee360b0b4b1/design_system.md): Guía de estilos y componentes.

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
