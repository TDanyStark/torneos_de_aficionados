# Fase 3 · Equipos, Jugadores e Inscripciones

> **Objetivo**: gestionar equipos y plantillas, el **registro reutilizable de jugadores por organizador** (identidad = cédula), y el flujo de inscripción **mixto** (carga manual del organizador + autoinscripción del delegado por link/código), incluyendo **inscripción tardía**.
> Depende de: Fase 2. Habilita: Fase 4 (fixtures necesitan equipos aprobados).

---

## 1. Equipos (`tournament_teams`)

- Los equipos son **por torneo** (aislados, no compartidos entre torneos en el MVP).
- Estado: `pending` → `approved` / `rejected` / `withdrawn`.
- `delegate_user_id` vincula al delegado responsable.

### Endpoints
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/v1/tournaments/{id}/teams` | público, paginado |
| POST | `/api/v1/tournaments/{id}/teams` | organizador o delegado |
| PUT | `/api/v1/tournament-teams/{id}` | organizador o delegado dueño |
| DELETE | `/api/v1/tournament-teams/{id}` | organizador |

---

## 2. Jugadores y plantilla

### 2.1 Registro reutilizable por organizador (identidad = cédula)
- `players` es el **pool privado del organizador** (`organizer_user_id`). La **cédula (`document_id`) es obligatoria y única por organizador** (`UNIQUE(organizer_user_id, document_id)`).
- `team_players`: roster de un equipo concreto, con `shirt_number`, `position`, `is_captain`, `is_delegate`, `status`. Dorsal único por equipo.

### 2.2 Reutilización: "escribe la cédula y aparecen los datos"
Cuando el organizador/delegado agrega un jugador al equipo:
1. Ingresa la **cédula**.
2. El sistema busca en el pool del organizador (`GET .../players/lookup?document_id=...`).
3. **Si existe** → precarga nombre, fecha de nacimiento, foto, teléfono; solo se piden los datos del roster (dorsal, posición). Se crea el `team_players` reutilizando el `players` existente.
4. **Si no existe** → se piden los datos completos, se crea el `players` en el pool del organizador y luego el `team_players`.

> El `organizer_user_id` del jugador se resuelve desde el **dueño del torneo** (`tournaments.owner_user_id`), no desde quien hace la petición (puede ser un delegado). Así el pool siempre pertenece al organizador correcto.

### 2.3 Historial del jugador
- Se **deriva** (no es tabla nueva) de las apariciones del `players` en distintos torneos **del mismo organizador**: equipos jugados (`team_players`), goles/tarjetas (`match_events`), partidos.
- Visible solo dentro del organizador dueño. Otro organizador no ve nada aunque sea la misma persona.

### Endpoints
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/v1/tournaments/{id}/players/lookup?document_id=` | organizador / delegado (busca en el pool del organizador del torneo) |
| GET | `/api/v1/tournament-teams/{id}/players` | público (roster del equipo) |
| POST | `/api/v1/tournament-teams/{id}/players` | delegado / organizador (reutiliza por cédula o crea) |
| PUT | `/api/v1/team-players/{id}` | delegado / organizador |
| DELETE | `/api/v1/team-players/{id}` | delegado / organizador |
| GET | `/api/v1/players/{id}/history` | organizador dueño (historial entre sus torneos) |

> `POST .../players` recibe `document_id` (obligatorio). Si ya existe en el pool, ignora los datos personales enviados y solo crea el vínculo de roster; si no, crea el `players` primero.

---

## 3. Inscripciones (`registrations`)

### 3.1 Dos canales (ambos válidos)
- **Manual** (`channel='manual'`): el organizador crea el equipo y lo aprueba directamente. Puede ayudar al delegado.
- **Autoinscripción** (`channel='self_link'`): el organizador comparte un **link/código** (`tournaments.registration_code`). El delegado:
  1. Abre el link público.
  2. Registra equipo + plantilla.
  3. **Opcionalmente se marca a sí mismo como jugador** del equipo (ver §3.2).
  4. Queda en estado `submitted`/`pending` hasta aprobación del organizador.

### 3.2 Delegado que también juega
Un delegado puede inscribirse **además como jugador** de su propio equipo. Roles y roster son independientes pero combinables:

- El **rol** `delegate` se asigna en `tournament_user_roles` (apunta a su `user_id` + `team_id`).
- Para que **juegue**, en el roster se crea un `players` con `user_id` = el del delegado y su `team_players` (con dorsal, posición; puede ser `is_captain`).
- Se marca `team_players.is_delegate = 1` como atajo de UI (la fuente de verdad del rol sigue en `tournament_user_roles`).

**Flujo en el formulario de autoinscripción**:
1. El delegado completa sus datos (los que ya tiene como `user`).
2. Aparece un checkbox **"Quiero inscribirme también como jugador"**.
3. Si lo marca, el formulario pide sus datos de jugador (dorsal, posición) y lo agrega al roster como un jugador más, vinculado a su `user_id`, con `is_delegate=1`.
4. El backend, al procesar la inscripción, crea en una sola operación: el equipo, el `tournament_user_roles` (delegate) y, si aplica, el `players` + `team_players` del delegado-jugador.

> Nota: nada impide que el delegado-jugador sea también capitán (`is_captain=1`). Son flags ortogonales.

### 3.3 Aprobación
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/v1/tournaments/{id}/registrations` | delegado (con código) |
| GET | `/api/v1/tournaments/{id}/registrations` | organizador (paginado, `updated_at DESC`) |
| PATCH | `/api/v1/registrations/{id}` | organizador → `approved`/`rejected` |

Al aprobar: el equipo pasa a `approved` y queda disponible para fixtures.

### 3.4 Inscripción tardía
- Habilitada por `tournaments.allow_late_registration` + `registration_open`.
- Si el torneo ya está `in_progress`, la inscripción marca `is_late=1` y `joined_at_round` (jornada desde la que entra).
- **Efecto en fixtures**: dispara la **re-generación de jornadas futuras** y la creación de los partidos pendientes del nuevo equipo. La lógica vive en Fase 4 (`regenerate-fixtures`).

> Ejemplo: torneo en la fecha 3, entra un equipo nuevo → las fechas posteriores se recalculan incluyéndolo y se agregan los partidos que le faltan contra los demás.

---

## 4. Frontend

### Pantallas
- **Lista de equipos** del torneo (pública, paginada).
- **Detalle de equipo** con su plantilla (pública).
- **Gestión de equipo** (delegado/organizador): editar datos, agregar/quitar jugadores.
- **Página pública de autoinscripción** (`/inscripcion/{registration_code}`): formulario equipo + jugadores, con checkbox **"Quiero inscribirme también como jugador"** que, al activarse, agrega al delegado al roster (dorsal/posición) marcándolo `is_delegate=1`.
- **Bandeja de inscripciones** (organizador): aprobar/rechazar, ver pendientes primero.

### Detalles
- **Agregar jugador por cédula**: el campo `document_id` dispara el `lookup` (debounce); si existe en el pool del organizador, autocompleta nombre/datos y deja editar solo dorsal/posición (los datos personales quedan de solo lectura). Si no, se piden completos.
- Formularios con React Hook Form + Zod (cédula obligatoria, dorsal único, campos requeridos).
- React Select (creatable) para asignar/crear jugadores cuando la lista del pool es grande.
- **Perfil/Historial de jugador** (organizador): vista con sus torneos jugados, equipos, goles y tarjetas acumulados dentro del organizador.
- Skeletons de carga; toasts de éxito/error.
- Estado (filtros de estado de equipo, búsqueda) en URL.

---

## Criterios de aceptación
1. Un organizador carga equipos manualmente y un delegado se autoinscribe por código; ambos flujos terminan en un equipo `approved`.
2. El delegado gestiona su plantilla con dorsales únicos.
3. **Reutilización por cédula**: al escribir la cédula de un jugador ya registrado en un torneo previo del **mismo organizador**, el sistema recupera su nombre y datos automáticamente y lo agrega sin volver a capturarlos.
4. **Aislamiento por organizador**: la misma cédula registrada por otro organizador crea un registro independiente; ningún organizador ve el pool/historial ajeno.
5. El **historial** de un jugador (torneos, equipos, goles, tarjetas) se consulta correctamente y solo dentro del organizador dueño.
6. Un delegado puede marcarse como jugador durante la inscripción: queda con rol `delegate` en `tournament_user_roles` y, a la vez, en el roster (`team_players`, `is_delegate=1`), reutilizando o creando su `players` por cédula.
7. Una inscripción tardía queda marcada `is_late` con su `joined_at_round` y deja al equipo listo para que Fase 4 regenere el fixture.
8. La bandeja de inscripciones del organizador pagina y muestra pendientes primero.
