# Fase 1 · Fundaciones (setup backend + frontend)

> **Objetivo**: dejar el proyecto ejecutable de punta a punta: conexión a DB, migraciones, health check, autenticación JWT y un frontend con todo el ecosistema cableado (tema, routing, query, errores).
> Depende de: docs base. Habilita: todas las fases siguientes.

---

## A. Backend

### A.1 Phinx (migraciones + seeders)
- Instalar: `composer require robmorgan/phinx`.
- Crear `api/phinx.php` apuntando a:
  - migraciones: `api/database/migrations`
  - seeders: `api/database/seeds`
  - conexión MySQL leída del `.env`.
- Flujo de reseteo rápido (objetivo del proyecto):
  ```
  vendor/bin/phinx rollback -t 0   # o drop manual
  vendor/bin/phinx migrate
  vendor/bin/phinx seed:run
  ```
- **Entregable**: scripts en `composer.json` (`db:migrate`, `db:seed`, `db:fresh`).

### A.2 Conexión a base de datos
- `Infrastructure/Database/PdoFactory.php`: crea PDO (utf8mb4, `ERRMODE_EXCEPTION`).
- Registrar PDO como singleton en `app/dependencies.php` (PHP-DI).
- `.env` con credenciales (ver [`01-arquitectura.md`](./01-arquitectura.md) §6).

### A.3 Respuesta y errores uniformes
- `Application/Responder/JsonResponder.php`: helpers `success()`, `created()`, `paginated()`, `error()` con el formato de [`03-api-contrato.md`](./03-api-contrato.md).
- Adaptar `HttpErrorHandler` para emitir el JSON de error estándar (sin stack traces en producción).
- `Domain/Shared/Pagination.php`: value object con `page`, `perPage`, `total`.

### A.4 Health check
- `Application/Actions/Health/HealthAction.php` → `GET /api/v1/health`.
- Ejecuta `SELECT 1`; responde `database: connected/disconnected` (503 si falla).

### A.5 Autenticación JWT
- Instalar `firebase/php-jwt`.
- `Infrastructure/Auth/JwtService.php`: `issue(user)`, `validate(token)`.
- `Application/Middleware/JwtAuthMiddleware.php` y `RoleMiddleware.php`.
- Actions: `Auth/LoginAction.php`, `Auth/RegisterAction.php`, `Auth/MeAction.php`.
- `users` con `password_hash` (argon2id / bcrypt).

### A.6 Routing base
- En `app/routes.php`, grupo `/api/v1` con sub-grupos por módulo.
- Middleware CORS para permitir el frontend en dev.

### Entregables backend
- [ ] Phinx configurado + carpeta `api/database/{migrations,seeds}`.
- [ ] Migración inicial con tablas base (al menos `users`, `sports`, `tournaments`) o todas (ver [`02-modelo-de-datos.md`](./02-modelo-de-datos.md)).
- [ ] Seeder de `sports`: filas de fútbol 11/8/5 y micro, todas con `module_key='football'` y distinta `variant` (mismo módulo) + `default_config` (períodos/puntos). Usuario admin demo.
- [ ] Esqueleto del módulo de deporte: interfaz `SportModule`, `SportModuleRegistry` y `FootballModule` registrados en PHP-DI (aunque su lógica completa llegue en Fase 5). Ver [`01-arquitectura.md`](./01-arquitectura.md) §7.
- [ ] `GET /api/v1/health` funcionando.
- [ ] `login`, `register`, `me` con JWT.
- [ ] Respuestas y errores en formato estándar.

---

## B. Frontend

### B.1 Tailwind + Shadcn
- Instalar Tailwind (última versión) y configurar.
- Inicializar Shadcn: `npx shadcn@latest init`.
- Definir variables de tema en `src/styles/index.css`: `:root` (claro) y `.dark` (oscuro) con **1–2 colores de marca**.
- Validar pasos con **MCP Context7** (versiones recientes de Tailwind/Shadcn).

### B.2 Dark mode
- `stores/themeStore.ts` (Zustand + persist en localStorage).
- Por defecto: **tema del sistema** (`prefers-color-scheme`).
- `hooks/useDarkMode.ts` + toggle en el layout.

### B.3 Routing y layout
- React Router con layout **mobile-first** (header, contenedor, slots de publicidad).
- Estado de vista en URL vía `useSearchParams`.

### B.4 Data layer
- `lib/queryClient.ts` (TanStack Query) en `main.tsx`.
- `lib/apiClient.ts`: wrapper de `fetch` que:
  - antepone `/api/v1`,
  - adjunta `Authorization: Bearer` desde `authStore`,
  - interpreta el formato de error estándar y lanza errores tipados.
- `stores/authStore.ts` (Zustand): token + usuario + roles.

### B.5 Errores y feedback
- Manejador global de errores en TanStack Query → **Toast de Shadcn** (`npx shadcn@latest add sonner`/`toast`).
- Sin `alert()`.

### B.6 Proxy de desarrollo (Vite)
- Configurar en `vite.config.ts`:
  ```ts
  server: {
    proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } }
  }
  ```

### B.7 Tipos base
- `types/api.ts`: `ApiSuccess<T>`, `ApiError`, `Paginated<T>`, `Pagination`.

### Entregables frontend
- [ ] Tailwind + Shadcn operativos con tema de marca.
- [ ] Dark mode con default del sistema + persistencia.
- [ ] Router + layout mobile-first.
- [ ] TanStack Query + apiClient + authStore.
- [ ] Toasts globales de error.
- [ ] Proxy `/api` en dev.
- [ ] Pantalla de login funcional contra el backend.

---

## Criterios de aceptación de la Fase 1
1. `composer db:fresh` borra, migra y siembra la DB sin intervención manual.
2. `GET /api/v1/health` responde `connected`.
3. Un usuario puede registrarse, hacer login y `GET /me` devuelve sus datos.
4. El frontend arranca, alterna dark/light (persistente), y hace login mostrando toasts ante errores.
5. No hay `any` en TS ni stack traces de PHP expuestos.
