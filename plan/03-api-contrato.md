# 03 · Contrato de la API

> Documento base. Define convenciones transversales de la API y el listado de endpoints por módulo.
> Lee también: [`01-arquitectura.md`](./01-arquitectura.md) · [`02-modelo-de-datos.md`](./02-modelo-de-datos.md)

---

## 1. Convenciones generales

- **Base URL**: `/api/v1`. Todas las rutas viven bajo este prefijo y se agrupan por módulo.
- **Formato**: JSON en request y response. `Content-Type: application/json`.
- **Nomenclatura de rutas**: plural + `kebab-case` (`/api/v1/tournament-teams`).
- **Métodos**: `GET` (leer), `POST` (crear), `PUT/PATCH` (actualizar), `DELETE` (borrar).
- **Auth**: `Authorization: Bearer <jwt>` en rutas privadas (ver §6).
- **Zona horaria**: fechas en ISO 8601. MVP usa una sola zona (`America/Bogota`).

---

## 2. Formato de respuesta estándar

### Éxito (recurso único)
```json
{
  "success": true,
  "data": { "id": 1, "name": "..." }
}
```

### Éxito (colección paginada)
```json
{
  "success": true,
  "data": [ { "id": 10 }, { "id": 9 } ],
  "meta": {
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 134,
      "total_pages": 7,
      "has_next": true
    }
  }
}
```

### Error (formato uniforme — obligatorio)
```json
{
  "success": false,
  "message": "Mensaje legible para el usuario",
  "errors": { "email": "El correo ya está en uso" }
}
```

- **Nunca** se exponen stack traces de PHP. El `HttpErrorHandler` traduce excepciones a este formato.
- `errors` es opcional (presente en validaciones de formulario).

---

## 3. Paginación (obligatoria en colecciones)

- Toda lista usa paginación **offset/limit**: `?page=1&per_page=20`.
- `per_page` por defecto 20, máximo 100.
- Las colecciones con `updated_at` se devuelven **ordenadas `updated_at DESC`** (registro más reciente primero), salvo que el endpoint indique otro orden natural (ej. fixtures por jornada ASC).
- Filtros y búsqueda van como query params y deben reflejarse en la URL del frontend.

---

## 4. Códigos de estado HTTP

| Código | Uso |
|---|---|
| 200 | OK (lectura/actualización) |
| 201 | Creado |
| 204 | Sin contenido (borrado) |
| 400 | Request mal formado |
| 401 | No autenticado (token ausente/expirado) |
| 403 | Autenticado pero sin permiso (rol incorrecto) |
| 404 | Recurso no encontrado |
| 409 | Conflicto (duplicado, estado inválido) |
| 422 | Validación fallida (con `errors`) |
| 429 | Rate limit (botón "actualizar" en vivo) |
| 500 | Error interno (sin stack trace) |

---

## 5. Health check

`GET /api/v1/health` — público. Valida conexión a la base de datos.

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected",
    "timestamp": "2026-06-01T10:00:00-05:00"
  }
}
```
Si la DB falla: `success:false`, `data.database:"disconnected"`, HTTP 503.

---

## 6. Autenticación y autorización

- **JWT** firmado con `JWT_SECRET`. TTL configurable (`JWT_TTL`).
- Token en `Authorization: Bearer <jwt>`.
- Payload incluye `sub` (user_id), `is_admin`, y se resuelven roles por torneo bajo demanda.
- **Middlewares**:
  - `JwtAuthMiddleware`: valida el token, inyecta el usuario en el request.
  - `RoleMiddleware('organizer'|'referee'|'delegate'|'admin')`: verifica el rol en el torneo del contexto (`tournament_id` de la ruta).
- Rutas públicas (sin token): health, login, vistas públicas de torneos/fixtures/tablas, click de banner.

### Endpoints de auth
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/auth/login` | `LoginAction` — email+password → JWT |
| POST | `/api/v1/auth/register` | crear cuenta de usuario |
| GET | `/api/v1/auth/me` | `MeAction` — usuario actual + sus roles por torneo |

---

## 7. Endpoints por módulo (MVP)

> Detalle de cada uno en su documento de fase. Aquí el mapa general.

### 7.1 Catálogo
| Método | Ruta |
|---|---|
| GET | `/api/v1/sports` |

### 7.2 Torneos — Fase 2
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/v1/tournaments` | público (listado, filtros) |
| GET | `/api/v1/tournaments/{slug}` | público |
| POST | `/api/v1/tournaments` | organizador |
| PUT | `/api/v1/tournaments/{id}` | organizador (dueño) |
| DELETE | `/api/v1/tournaments/{id}` | organizador (dueño) |
| GET | `/api/v1/tournaments/{id}/roles` | organizador |
| POST | `/api/v1/tournaments/{id}/roles` | organizador (asignar árbitro/delegado) |
| GET/POST/PUT/DELETE | `/api/v1/tournaments/{id}/stages` | organizador (fases) |
| GET/POST/PUT/DELETE | `/api/v1/stages/{id}/groups` | organizador |
| GET/POST/PUT/DELETE | `/api/v1/stages/{id}/advancement-rules` | organizador |

### 7.3 Equipos e inscripciones — Fase 3
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/v1/tournaments/{id}/teams` | público (paginado) |
| POST | `/api/v1/tournaments/{id}/teams` | organizador / delegado |
| PUT | `/api/v1/tournament-teams/{id}` | organizador / delegado dueño |
| GET | `/api/v1/tournaments/{id}/players/lookup?document_id=` | organizador / delegado (busca jugador en el pool del organizador del torneo) |
| GET | `/api/v1/players/{id}/history` | organizador dueño (historial entre sus torneos) |
| GET | `/api/v1/tournament-teams/{id}/players` | público |
| POST | `/api/v1/tournament-teams/{id}/players` | delegado / organizador (reutiliza por cédula o crea) |
| PUT/DELETE | `/api/v1/team-players/{id}` | delegado / organizador |
| POST | `/api/v1/tournaments/{id}/registrations` | delegado (autoinscripción por código) |
| GET | `/api/v1/tournaments/{id}/registrations` | organizador |
| PATCH | `/api/v1/registrations/{id}` | organizador (approve/reject) |

**Payload de `POST /registrations`** (el delegado puede inscribirse también como jugador). La **cédula (`document_id`) es obligatoria** en cada jugador:
```json
{
  "registration_code": "ABC123",
  "team": { "name": "Los Tigres", "short_name": "TIG", "logo_url": null },
  "delegate_as_player": true,
  "delegate_player": { "document_id": "1098765432", "shirt_number": 10, "position": "Mediocampo", "is_captain": true },
  "players": [
    { "document_id": "1090000001", "full_name": "Juan Pérez", "shirt_number": 7, "position": "Delantero" }
  ]
}
```
- Cada jugador se resuelve por `document_id` contra el pool del **organizador dueño del torneo** (`tournaments.owner_user_id`): si existe, se reutiliza (se ignoran los datos personales enviados); si no, se crea en el pool.
- Si `delegate_as_player` es `true`, el backend obtiene/crea el `players` del delegado (enlazando `players.user_id`) y su `team_players` (`is_delegate=1`, con los datos de `delegate_player`).
- El rol `delegate` se registra siempre en `tournament_user_roles`; el rol `player` es implícito al estar en el roster.

### 7.4 Fixtures y tablas — Fase 4
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/v1/stages/{id}/generate-fixtures` | organizador |
| POST | `/api/v1/stages/{id}/regenerate-fixtures` | organizador (tras inscripción tardía) |
| GET | `/api/v1/tournaments/{id}/rounds` | público |
| GET | `/api/v1/tournaments/{id}/matches` | público (filtros: round, group, status) |
| GET | `/api/v1/groups/{id}/standings` | público (tabla de posiciones) |
| PUT | `/api/v1/matches/{id}` | organizador (editar programación/sede) |

### 7.5 Partido en vivo — Fase 5
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/v1/matches/{id}` | público |
| GET | `/api/v1/matches/{id}/live` | público (polling: marcador + eventos + períodos) |
| POST | `/api/v1/matches/{id}/periods/start` | árbitro |
| POST | `/api/v1/matches/{id}/periods/end` | árbitro |
| POST | `/api/v1/matches/{id}/events` | árbitro (gol/tarjeta) |
| DELETE | `/api/v1/match-events/{id}` | árbitro (corrección) |
| POST | `/api/v1/matches/{id}/finish` | árbitro |
| GET | `/api/v1/tournaments/{id}/top-scorers` | público (goleadores) |
| GET | `/api/v1/tournaments/{id}/cards` | público (disciplina) |

### 7.6 Publicidad — Fase 6
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/v1/tournaments/{id}/ads` | público (slots + creative activo) |
| GET | `/api/v1/ads` | público (slots globales) |
| GET/POST/PUT/DELETE | `/api/v1/ad-slots` | admin |
| POST/PUT/DELETE | `/api/v1/ad-creatives` | admin |

---

## 8. Rate limiting del "actualizar" en vivo

- `GET /api/v1/matches/{id}/live` admite polling automático cada ~60s.
- El botón manual "actualizar" se limita en cliente (cooldown visible) y, opcionalmente, en servidor (HTTP 429 con `Retry-After`) para proteger el hosting compartido.

---

## 9. Sincronización de tipos con el frontend

Cada response definida aquí tiene su `interface` TypeScript equivalente en `frontend/src/features/<modulo>/types.ts`. Sin `any`. Los enums del backend se replican como *union types* en TS.
