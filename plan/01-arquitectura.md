# 01 · Arquitectura y Convenciones

> Documento base. Define **cómo** está organizado el código en backend y frontend, y las convenciones obligatorias.
> Lee también: [`00-vision-y-alcance.md`](./00-vision-y-alcance.md) · [`03-api-contrato.md`](./03-api-contrato.md)

---

## 1. Estructura del repositorio

```
torneos_de_aficionados/
├── api/                # Backend Slim 4 (Clean Architecture)
│   ├── app/            # Bootstrap: dependencies, middleware, routes, settings
│   ├── database/       # Phinx: migrations/ y seeds/  (a crear)
│   ├── public/         # index.php + .htaccess (document root)
│   ├── src/
│   │   ├── Application/     # Actions, ResponseEmitter, Handlers, Middleware
│   │   ├── Domain/          # Entidades, contratos (Repository interfaces), DTOs, excepciones
│   │   └── Infrastructure/  # Implementaciones (PDO repos, JWT, persistencia)
│   └── tests/
├── frontend/           # React 19 + TS + Vite
│   └── src/
└── plan/               # Esta documentación
```

El esqueleto de Slim ya está instalado (namespace `App\`, PSR-4 sobre `src/`). Falta agregar Phinx y la capa de Infrastructure con MySQL.

---

## 2. Backend — Clean Architecture (Slim 4)

### 2.1 Capas y dirección de dependencias

```
Application (Actions/HTTP)  ──►  Domain (reglas, contratos)  ◄──  Infrastructure (DB, JWT)
```

- **Domain** no depende de nada externo. Contiene entidades, *value objects*, DTOs, interfaces de repositorio y servicios de dominio (ej. el motor de fixtures).
- **Application** orquesta casos de uso vía Actions HTTP. Recibe request, llama a servicios/repos (por interfaz), devuelve respuesta JSON.
- **Infrastructure** implementa las interfaces del Domain (repositorios PDO/MySQL, emisor JWT). Se cablea con **PHP-DI** en `app/dependencies.php` y `app/repositories.php`.

### 2.2 Organización por módulos

Cada módulo de negocio agrupa sus Actions y su lógica:

```
src/
├── Application/
│   ├── Actions/
│   │   ├── Auth/        (LoginAction, MeAction)
│   │   ├── Tournaments/
│   │   ├── Teams/
│   │   ├── Registrations/
│   │   ├── Fixtures/
│   │   ├── Matches/     (vista árbitro, eventos)
│   │   ├── Ads/
│   │   └── Health/
│   ├── Middleware/      (JwtAuthMiddleware, RoleMiddleware, JsonBodyParser...)
│   ├── Handlers/        (HttpErrorHandler, ShutdownHandler)
│   └── Settings/
├── Domain/
│   ├── Tournament/      (Tournament entity, TournamentRepository interface, services)
│   ├── Team/
│   ├── Match/
│   ├── Fixture/         (FixtureGenerator, StandingsCalculator -> servicios de dominio)
│   └── Shared/          (Pagination, excepciones de dominio)
└── Infrastructure/
    ├── Persistence/     (PdoTournamentRepository, etc.)
    ├── Database/        (PDO factory, conexión)
    └── Auth/            (JwtService)
```

### 2.3 Principios DRY obligatorios

- **Auditoría previa**: antes de escribir lógica nueva, buscar si ya existe una abstracción. No duplicar.
- Lógica de negocio en **Services / Use Cases** del Domain, nunca en las Actions.
- Tareas transversales (auth, logging, CORS) en **Middlewares**.
- Funciones puras y helpers reutilizables en `Domain/Shared`.
- Las **Actions son delgadas**: parsean input, delegan, formatean salida.

---

## 3. Frontend — React 19 + TypeScript

### 3.1 Stack

| Necesidad | Librería |
|---|---|
| Core | React 19 + TypeScript estricto |
| Build | Vite |
| Estado servidor / fetching | **TanStack Query** |
| Estado global cliente | **Zustand** |
| Formularios + validación | **React Hook Form** (+ Zod) |
| UI base | **Shadcn UI** (instalar con `npx shadcn@latest add ...`) |
| Estilos | **Tailwind CSS** |
| Routing + estado en URL | React Router + `useSearchParams` |
| Selects con muchos datos / creables | **React Select** |

> Instalar siempre **últimas versiones** y validar la API con **MCP Context7** antes de implementar.

### 3.2 Estructura de carpetas

```
frontend/src/
├── main.tsx
├── App.tsx
├── routes/              # Definición de rutas
├── pages/               # Una página por archivo
├── features/            # Módulos por dominio (tournaments, teams, matches, ads...)
│   └── tournaments/
│       ├── api/         # hooks de TanStack Query (useTournaments.ts...)
│       ├── components/  # componentes específicos del feature
│       └── types.ts     # interfaces que reflejan el JSON del backend
├── components/
│   ├── ui/              # Shadcn (generado)
│   └── shared/          # Componentes reutilizables propios
├── hooks/               # Custom hooks transversales (useAuth, useDarkMode...)
├── lib/                 # apiClient (wrapper fetch), queryClient, utils
├── stores/              # Zustand stores (authStore, themeStore...)
├── types/               # Tipos globales / compartidos
└── styles/index.css     # Tailwind + variables de tema (:root y .dark)
```

### 3.3 Reglas de atomicidad (obligatorias)

- **PROHIBIDO** definir varios componentes en un mismo archivo. Un componente = un archivo `.tsx`.
- Sub-componentes se extraen a archivos independientes.
- Cada archivo hace **una sola cosa**.

### 3.4 Estado en la URL

Todo estado de vista (filtros, paginación, búsqueda, pestaña activa) se refleja en query params (`?page=2&status=active`). Vistas navegables (atrás/adelante) y compartibles. Se usa `useSearchParams`.

### 3.5 Dark mode

- Soporte claro/oscuro con clases de Shadcn/Tailwind.
- **Por defecto, el tema del sistema**.
- El usuario puede alternar; la preferencia **persiste** (Zustand + localStorage).
- Variables de color en `index.css`: bloque `:root` (claro) y `.dark` (oscuro), con **1–2 colores de marca** que se mantienen en ambos modos.

### 3.6 Manejo de errores y feedback

- Wrapper central de `fetch` en `lib/apiClient.ts` que interpreta el formato de error estándar de la API.
- Integrado con TanStack Query (errores globales).
- Feedback al usuario con **Toast de Shadcn**. Nunca `alert()` nativo.

### 3.7 Sincronización de tipos

- Cada respuesta JSON del backend tiene su `interface`/`type` exacto en el frontend.
- **Prohibido `any`**. TypeScript en modo estricto.

---

## 4. Convenciones de nomenclatura

| Ámbito | Convención | Ejemplo |
|---|---|---|
| Tablas DB | plural, `snake_case` | `tournaments`, `match_events` |
| Columnas DB | `snake_case` | `created_at`, `home_team_id` |
| Clases/Archivos PHP | `PascalCase` | `TournamentRepository.php` |
| Métodos/Variables PHP | `camelCase` | `findById()`, `$homeTeamId` |
| Componentes React + archivo | `PascalCase` | `TournamentCard.tsx` |
| Hooks React | `use` + `camelCase` | `useTournaments.ts` |
| Endpoints API | plural, `kebab-case` | `/api/v1/match-events` |

---

## 5. Despliegue en Hostinger (compartido)

- **Document root del backend** apunta a `api/public/`. El `.htaccess` redirige todo a `index.php`.
- **Frontend** se compila (`vite build`) y se sirve como estático; sus llamadas a `/api` se resuelven contra el backend desplegado.
- **Proxy en desarrollo**: `vite.config.ts` redirige `/api` al backend local (ver Fase 1).
- Rutas **relativas**, sin dependencia de procesos persistentes.
- Sin WebSockets propios: el tiempo real se hace con **polling**.
- Tareas diferidas (si surgen) vía **cron de Hostinger**, no daemons.
- Variables sensibles (DB, JWT secret) en `.env` fuera del control de versiones.

---

## 6. Configuración (.env backend)

```
APP_ENV=production
DB_HOST=localhost
DB_NAME=torneos
DB_USER=...
DB_PASS=...
DB_CHARSET=utf8mb4
JWT_SECRET=...
JWT_TTL=3600
ADMIN_WHATSAPP=57XXXXXXXXXX
```

---

## 7. Multideporte: core genérico + módulos de deporte

> **Postura realista**: NO existe un modelo universal que sirva a todos los deportes solo con configuración. Cada deporte tiene su propio modelo de partido, eventos, forma de puntuar y reglas. Por eso separamos en dos capas.

### 7.1 Capas

| Capa | Qué incluye | Cambia al sumar un deporte |
|---|---|---|
| **Core (genérico)** | Torneos, fases, grupos, equipos, jugadores, inscripciones, roles, fixtures (round-robin/bracket), avance entre fases, tabla por puntos, publicidad. | **No.** |
| **Módulo de deporte** | Modelo de partido y su detalle: eventos, marcador, cómo se determina el ganador, estadísticas, vista del juez. | **Sí: tablas + código nuevos.** |

El core conoce `matches` de forma neutra (quién juega, estado, `home_score`/`away_score`/`winner_team_id` resumidos). Cómo se llega a ese resultado lo resuelve el módulo.

### 7.2 Contrato del módulo de deporte (backend)

Cada deporte implementa una interfaz `SportModule` en `Domain/Sport/Contracts/`:

```
interface SportModule {
  key(): string;                       // 'football', 'lol'...
  // Validación y registro del detalle del partido (eventos propios del deporte)
  recordEvent(Match $m, array $payload): void;
  // Calcula y persiste el resultado resumido en `matches` al finalizar
  finalizeMatch(Match $m): MatchResult; // -> home_score, away_score, winner_team_id
  // Cómo se construye la tabla de posiciones (puede no aplicar / variar)
  standingsStrategy(): StandingsStrategy;
  // Tipos de eventos/estadísticas que expone su API y UI
  statsProviders(): array;
}
```

- Implementaciones en `Infrastructure/Sport/<Deporte>/` (ej. `FootballModule`).
- Un **registro** (`SportModuleRegistry`) mapea `sports.module_key` → implementación (cableado en PHP-DI).
- Las **Actions del core** (fixtures, avance, standings) llaman al módulo vía la interfaz; **no** contienen lógica de fútbol embebida.
- Cada módulo trae sus **migraciones** (carpeta `api/database/migrations/<modulo>/` o prefijo) y sus **rutas** propias bajo `/api/v1/sports/<deporte>/...` cuando el detalle es específico (ej. eventos de fútbol).

> **MVP**: solo se implementa `FootballModule`. La interfaz y el registro existen desde el inicio para que sumar un deporte sea "implementar el contrato + sus migraciones + su UI", no reescribir el core.

### 7.3 Módulo de deporte (frontend)

- `features/sports/<deporte>/` contiene la **vista del juez/árbitro**, los componentes de marcador y la línea de tiempo específicos del deporte.
- Un **registro** en `features/sports/registry.ts` mapea `module_key` → componentes (`RefereeView`, `LiveScore`, `StatsTabs`).
- Las páginas del core (página del torneo, partido) renderizan el componente del deporte según `module_key`, con un **fallback** claro si el deporte no está soportado en el cliente.
- Tipos del detalle de partido viven en `features/sports/<deporte>/types.ts`; los tipos neutros (`Match`, `Tournament`) en el core.

### 7.4 Qué NO hacemos

- No describimos reglas de juego en JSON pretendiendo cubrir cualquier deporte.
- No metemos `if (sport === 'football')` en el core.
- No reutilizamos `match_events` (fútbol) para esports: cada módulo tiene su propio detalle.

Backlog de deportes y el costo real de cada uno: [`11-roadmap-y-futuro.md`](./11-roadmap-y-futuro.md) §4.
