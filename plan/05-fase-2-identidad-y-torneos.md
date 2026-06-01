# Fase 2 · Identidad, Roles y Torneos

> **Objetivo**: gestión de usuarios con **roles contextuales por torneo** y el **CRUD de torneos** con su configuración de formato (deporte, fases, grupos, reglas de avance).
> Depende de: Fase 1. Habilita: Fase 3 (equipos), Fase 4 (fixtures).

---

## 1. Roles contextuales por torneo

Modelo en `tournament_user_roles` (ver [`02-modelo-de-datos.md`](./02-modelo-de-datos.md) §1.2).

- `admin` es global (`users.is_admin`), no se asigna por torneo.
- Roles por torneo: `organizer`, `referee`, `delegate`, `player`.
- Un usuario puede acumular roles en **distintos** torneos **y también dentro del mismo torneo** (varias filas en `tournament_user_roles`). Caso típico: un **delegado que también es jugador** de su equipo (ver Fase 3 §3.2). El `UNIQUE(tournament_id, user_id, role, team_id)` permite múltiples roles del mismo usuario en el mismo torneo siempre que difiera el `role`/`team_id`.
- `MeAction` devuelve, junto al usuario, la lista de `{ tournament_id, role, team_id }` (puede incluir varias entradas por torneo).
- `RoleMiddleware` autoriza si el usuario tiene **al menos uno** de los roles requeridos en el `tournament_id` de la ruta.

### Endpoints
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/v1/tournaments/{id}/roles` | organizador |
| POST | `/api/v1/tournaments/{id}/roles` | organizador (designar árbitro/delegado por email) |
| DELETE | `/api/v1/tournament-roles/{id}` | organizador |

---

## 2. CRUD de torneos

### Backend
- `Domain/Tournament/Tournament.php` (entidad) + `TournamentRepository` (interfaz).
- `Infrastructure/Persistence/PdoTournamentRepository.php`.
- `Application/Actions/Tournaments/*` (List, Show, Create, Update, Delete).
- Al crear: tomar los valores comunes desde `sports.default_config` (JSON) del deporte elegido y copiarlos a `tournaments` (puntos, períodos) como valores editables. Las reglas específicas del deporte las aporta su **módulo** (`SportModule`), no `tournaments` (ver [`01-arquitectura.md`](./01-arquitectura.md) §7).
- `slug` autogenerado y único; `registration_code` generado al abrir inscripción.

### Endpoints
| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/v1/tournaments` | público, paginado, filtros: `sport`, `status`, `q` (búsqueda) |
| GET | `/api/v1/tournaments/{slug}` | público, detalle completo |
| POST | `/api/v1/tournaments` | organizador |
| PUT | `/api/v1/tournaments/{id}` | organizador dueño |
| DELETE | `/api/v1/tournaments/{id}` | organizador dueño (soft delete) |

Listado ordenado `updated_at DESC`.

---

## 3. Configuración de formato (fases, grupos, reglas)

Esta es la base del **motor configurable**. El organizador arma el torneo encadenando fases.

### 3.1 Fases (`stages`)
| Método | Ruta |
|---|---|
| GET/POST | `/api/v1/tournaments/{id}/stages` |
| PUT/DELETE | `/api/v1/stages/{id}` |

Campos: `name`, `type` (`league`/`groups`/`knockout`), `position`, `legs` (1 o 2), `tiebreakers`.

### 3.2 Grupos (`groups`) — permite asimetría
| Método | Ruta |
|---|---|
| GET/POST | `/api/v1/stages/{id}/groups` |
| PUT/DELETE | `/api/v1/groups/{id}` |
| POST | `/api/v1/groups/{id}/teams` (asignar equipos al grupo) |

Un grupo puede tener 10 equipos y otro 11 — el sistema no fuerza simetría.

### 3.3 Reglas de avance (`advancement_rules`)
| Método | Ruta |
|---|---|
| GET/POST | `/api/v1/stages/{id}/advancement-rules` |
| PUT/DELETE | `/api/v1/advancement-rules/{id}` |

Permite: "del grupo A (10 equipos) clasifican 6 / se eliminan 4; del grupo B (11) clasifican 6 / se eliminan 5; los clasificados pasan a la fase de eliminación".

---

## 4. Frontend

### Pantallas (mobile-first)
- **Lista de torneos** (pública): cards paginadas, filtros en URL.
- **Dashboard del organizador**: mis torneos.
- **Wizard de creación de torneo**:
  1. Datos básicos + deporte (React Select para deporte).
  2. Configuración (períodos, puntos, inscripción).
  3. Fases (agregar fase, tipo, ida/vuelta).
  4. Grupos por fase + asignación de equipos (cuando existan).
  5. Reglas de avance.
- **Editar torneo** y **gestión de roles** (designar árbitros/delegados por email).

### Detalles
- Formularios con **React Hook Form + Zod**.
- Estado de fase del wizard reflejado en URL.
- `features/tournaments/api/` con hooks de TanStack Query.
- `features/tournaments/types.ts` con interfaces exactas del backend.

---

## Criterios de aceptación
1. Un organizador crea un torneo, define fases, grupos asimétricos y reglas de avance.
2. Puede designar un árbitro y un delegado por email; estos obtienen su rol **solo en ese torneo**.
3. El mismo usuario puede ser delegado en un torneo y árbitro en otro sin conflicto.
4. El listado público de torneos pagina, filtra y ordena por `updated_at DESC`.
5. Todo el estado de filtros/wizard vive en la URL.
