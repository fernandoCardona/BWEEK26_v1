# Credenciales de Acceso

Este archivo documenta las credenciales de desarrollo que usa el proyecto para iniciar sesion en las areas privadas cuando se arranca desde cero con `.env.example`.

Estado actual:
- Verificado contra la base de datos activa del proyecto.
- Reseteado y confirmado para poder entrar hoy en el area privada.

Importante:
- Las credenciales reales activas las define tu archivo `.env`.
- Si cambias `BSW_FIXED_*` en `.env`, este documento deja de reflejar los valores reales.
- No guardes aqui credenciales de produccion ni secretos privados.

## Area privada de administracion

URL de login:
- `http://localhost/login`

Panel admin:
- `http://localhost/admin/dashboard`

Usuarios fijos de desarrollo:

1. Super admin
- Email: `superadmin@example.com`
- Password: `changeme_fixed_users_password`
- Variable `.env`: `BSW_FIXED_SUPERADMIN_EMAIL_1`

2. Admin
- Email: `admin@example.com`
- Password: `changeme_fixed_users_password`
- Variable `.env`: `BSW_FIXED_ADMIN_EMAIL`

3. Usuario base
- Email: `user@example.com`
- Password: `changeme_fixed_users_password`
- Variable `.env`: `BSW_FIXED_USER_EMAIL`

Estas tres cuentas existen actualmente en la tabla `users` y estan activas.

Variable de password comun:
- `BSW_FIXED_USERS_PASSWORD=changeme_fixed_users_password`

Credencial recomendada para entrar al panel admin:
- Email: `superadmin@example.com`
- Password: `changeme_fixed_users_password`

Credencial alternativa:
- Email: `admin@example.com`
- Password: `changeme_fixed_users_password`

## n8n

URL:
- `http://localhost:5678`

Credenciales por defecto de desarrollo:
- Usuario: `admin`
- Password: `changeme_n8n_password`

Variables `.env`:
- `N8N_BASIC_AUTH_USER`
- `N8N_BASIC_AUTH_PASSWORD`

## Nginx Proxy Manager

URL:
- `http://localhost:81`

Nota:
- Las credenciales iniciales de Nginx Proxy Manager no forman parte del login Laravel.
- Si necesitas documentarlas despues, conviene confirmarlas directamente en la instancia levantada antes de fijarlas aqui.

## Comando recomendado

Si arrancas el proyecto en otro ordenador y quieres asegurar estos usuarios:

```powershell
copy .env.example .env
.\BearsUp.ps1
```

Los scripts `BearsUp.ps1` y `BearsRun.ps1` vuelven a asegurar los usuarios fijos con las variables `BSW_FIXED_*`.
