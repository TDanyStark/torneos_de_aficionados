# Torneos de Aficionados

Plataforma web **gratuita e ilimitada** para que organizadores creen y gestionen campeonatos amateur (fútbol 5/8/11, micro). **Mobile-first**, monetizada con publicidad. Arquitectura **modular por deporte** (core genérico + módulos), preparada para escalar a otros deportes y esports.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | PHP 8.2 · Slim 4 (Clean Architecture) · PHP-DI · Phinx · MySQL |
| Frontend | React 19 · TypeScript · Vite · TanStack Query · Zustand · React Hook Form · Shadcn UI · Tailwind CSS |
| Auth | JWT |
| Despliegue | Hostinger (hosting compartido) |

## Estructura

```
torneos_de_aficionados/
├── api/        # Backend Slim (API REST en /api/v1)
│   └── database/   # Migraciones y seeders (Phinx)
├── frontend/   # SPA React + Vite
└── plan/       # Documentación de fases de desarrollo
```

## Requisitos

- PHP >= 8.2 y Composer
- MySQL >= 8
- Node >= 20

## Puesta en marcha

### Backend (`api/`)

```bash
cd api
composer install
cp .env.example .env        # configura credenciales de MySQL y JWT_SECRET
composer db:fresh           # crea esquema + datos de prueba (rollback + migrate + seed)
composer start              # servidor en http://localhost:8080
```

Health check: `GET http://localhost:8080/api/v1/health`

Usuarios demo (seed):
- Admin: `admin@torneos.test` / `admin1234`
- Organizador: `organizador@torneos.test` / `organizador1234`

### Frontend (`frontend/`)

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxy /api -> :8080)
```

## Scripts de base de datos (backend)

| Comando | Descripción |
|---|---|
| `composer db:migrate` | Aplica migraciones |
| `composer db:seed` | Ejecuta seeders |
| `composer db:rollback` | Revierte la última migración |
| `composer db:fresh` | Reinicia: rollback total + migrate + seed |

## Documentación

El plan completo de desarrollo está en [`plan/`](./plan/README.md): visión y alcance, arquitectura, modelo de datos y las fases de implementación.

## Licencia

Privado.
