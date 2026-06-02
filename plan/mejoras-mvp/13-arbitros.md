# Fase 13 · Árbitros (directorio por torneo)

> **Objetivo**: que el organizador tenga un **directorio de árbitros por torneo** (solo el nombre), pueda registrarlos dentro de la vista del torneo, asignarlos a los partidos y hacerlo **en bucle** cuando siempre es el mismo.
> Depende de: MVP (partidos existen). Habilita: gestión real de partidos.

---

## 1. Concepto y decisión de diseño

- Los árbitros son una **base de datos del organizador por torneo**: **solo nombre**, sin cuenta de usuario. Puede haber varios por torneo.
- **Conflicto con el modelo actual**: hoy los árbitros son **usuarios** (`matches.referee_user_id` + `MatchRefereeAuthorizer` para el control en vivo).
- **Decisión**: separar conceptos.
  - `matches.referee_user_id` (existente) = usuario que **controla el partido en vivo** (auth).
  - **`matches.referee_id`** (NUEVO, nullable, FK → `referees`) = "nombre en la planilla".

## 2. Backend

### 2.1 Migración
- Nueva tabla `referees`: `id` PK INT UNSIGNED, `tournament_id` FK, `name` VARCHAR, timestamps.
- `ALTER matches` añadir `referee_id` INT UNSIGNED nullable, FK → `referees` (`ON DELETE SET NULL`).

### 2.2 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/tournaments/{id}/referees` | Lista de árbitros del torneo. |
| POST | `/api/v1/tournaments/{id}/referees` | Crear árbitro (solo nombre). |
| PUT | `/api/v1/referees/{id}` | Renombrar. |
| DELETE | `/api/v1/referees/{id}` | Eliminar. |
| POST | `/api/v1/matches/{id}/referee` | Asignar `referee_id` a un partido. |
| POST | `/api/v1/stages/{id}/assign-referee` | **Bucle**: asignar un árbitro a todos los partidos (de una fecha/fase). |

- Archivos: nuevo `api/src/Application/Actions/Referee/*`, `Domain/Referee/*`, `Infrastructure/Persistence/Referee/*`; `UpdateMatchAction.php` (acepta `referee_id`).

### Entregables backend
- [ ] Tabla `referees` + columna `matches.referee_id`.
- [ ] CRUD de árbitros por torneo.
- [ ] Asignación individual y en bucle.

---

## 3. Frontend

- Sección **"Árbitros"** dentro de la vista del organizador del torneo: registrar (solo nombre), listar, editar, borrar.
- En la edición de partido / fecha: **select de árbitro** y opción **"asignar el mismo a todos"** (bucle).
- Archivos: nuevo `frontend/src/features/tournaments/components/RefereesManager.tsx`, integración en la pantalla de fixtures/partido.

### Entregables frontend
- [ ] Gestor de árbitros (nombre) por torneo.
- [ ] Asignar árbitro a un partido y en bucle a varios.

---

## Criterios de aceptación de la Fase 13
1. El organizador registra árbitros (solo nombre) dentro del torneo; puede haber varios.
2. Puede asignar un árbitro a un partido.
3. Puede asignar el mismo árbitro a todos los partidos en bucle.
4. El control en vivo (usuario árbitro) sigue funcionando sin romperse.
