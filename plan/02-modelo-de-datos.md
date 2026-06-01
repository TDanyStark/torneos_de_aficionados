# 02 · Modelo de Datos (Esquema completo MySQL)

> Documento base y **núcleo del proyecto**. Define todas las tablas, columnas, relaciones e índices.
> El **core** es genérico (torneos, fases, equipos, fixtures). El **detalle de partido** es **por módulo de deporte** (con sus propias tablas y código). No es "todo configurable por JSON".
> Lee también: [`07-fase-4-motor-de-fixtures.md`](./07-fase-4-motor-de-fixtures.md)

---

## Convenciones

- Motor **InnoDB**, charset `utf8mb4`, collation `utf8mb4_unicode_ci`.
- Todas las tablas en plural `snake_case`, columnas `snake_case`.
- PK: `id` `BIGINT UNSIGNED AUTO_INCREMENT`.
- Timestamps estándar: `created_at`, `updated_at` (`TIMESTAMP`). Borrado lógico con `deleted_at NULL` donde aplica.
- FKs con `ON DELETE` explícito (CASCADE para hijos dependientes, RESTRICT para referencias duras).
- Listados con `updated_at` se devuelven **ordenados DESC** (más reciente primero) — ver [`03-api-contrato.md`](./03-api-contrato.md).

---

## Diagrama lógico (alto nivel)

```
sports ──< tournaments ──< stages ──< groups ──< group_teams
                │              │         │
                │              │         └──< rounds ──< matches ──< match_periods
                │              │                            │           └──< match_events
                │              └──< advancement_rules        │
                │                                            └─ home_team / away_team (tournament_teams)
                ├──< tournament_user_roles >── users
                ├──< tournament_teams ──< team_players >── players
                ├──< registrations
                └──< ad_slots ──< ad_creatives

users (organizador) ──< players (pool privado por organizador, clave = cédula) ──< team_players
```

---

## 1. Identidad y acceso

### 1.1 `users`
Cuenta global de una persona. El rol NO vive aquí (es contextual por torneo), salvo `is_admin`.

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| name | VARCHAR(120) | |
| email | VARCHAR(160) | UNIQUE |
| phone | VARCHAR(30) NULL | WhatsApp/contacto |
| password_hash | VARCHAR(255) | bcrypt/argon2 |
| is_admin | TINYINT(1) | default 0. Único rol global. |
| avatar_url | VARCHAR(255) NULL | |
| email_verified_at | TIMESTAMP NULL | |
| created_at / updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP NULL | |

Índices: `UNIQUE(email)`, `INDEX(is_admin)`.

### 1.2 `tournament_user_roles`
**Pieza clave**: define el rol de un usuario **dentro de un torneo**. Un usuario puede tener varios roles en distintos torneos (o varios en el mismo).

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| tournament_id | BIGINT UNSIGNED FK → tournaments | CASCADE |
| user_id | BIGINT UNSIGNED FK → users | CASCADE |
| role | ENUM('organizer','referee','delegate','player') | `admin` no va aquí (es global) |
| team_id | BIGINT UNSIGNED FK → tournament_teams NULL | para delegate/player: a qué equipo pertenece |
| created_at / updated_at | TIMESTAMP | |

Índices: `UNIQUE(tournament_id, user_id, role, team_id)`, `INDEX(user_id)`, `INDEX(tournament_id, role)`.

---

## 2. Catálogo de deportes y módulos por deporte

> **Postura honesta sobre multideporte** (ver [`01-arquitectura.md`](./01-arquitectura.md) §7):
> El **core** (torneos, fases, grupos, equipos, inscripciones, roles, fixtures, publicidad) es genérico y se reutiliza.
> El **modelo de partido** (resultado, eventos, cómo se puntúa) **NO** es genérico: cada deporte es un **módulo** con su propia tabla de eventos y su lógica. Agregar un deporte = migración(es) + código de su módulo, NO solo una fila de configuración.
> La tabla `sports` es un **catálogo/registro de módulos**, no un motor universal.

### 2.1 `sports` (registro de módulos de deporte)
Identifica qué módulo de deporte está instalado y sus parámetros comunes. No pretende describir todas las reglas vía JSON.

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| module_key | VARCHAR(60) | UNIQUE. Clave del módulo de código: `football`, `lol`, `valorant`... |
| name | VARCHAR(80) | "Fútbol 11", "League of Legends" |
| slug | VARCHAR(80) | UNIQUE, kebab: `futbol-11` |
| variant | VARCHAR(40) NULL | variante del módulo: `11`, `8`, `5`, `micro` (fútbol comparte módulo) |
| players_per_side | SMALLINT NULL | 11, 8, 5... (puede no aplicar a esports) |
| default_config | JSON | parámetros comunes del módulo (períodos, puntos, etc.) — **no** reglas de eventos |
| is_active | TINYINT(1) | default 1 |
| created_at / updated_at | TIMESTAMP | |

Índices: `UNIQUE(slug)`, `INDEX(module_key)`.

> **Variantes vs deportes distintos**: fútbol 11/8/5/micro = **mismo módulo** (`football`) con `variant` distinta → comparten modelo de partido (goles, tarjetas, períodos).
> Un esport (ej. LoL) = **módulo distinto** (`lol`) → trae sus propias tablas de partido y su lógica. No reutiliza `match_events` de fútbol.

### 2.2 Modelo de partido por módulo
- El **core** define la entidad neutra `matches` (quién juega, cuándo, estado, equipo ganador, marcador resumido).
- Cada **módulo** define **sus propias tablas** para el detalle del partido. En el MVP solo existe el módulo **football** (tablas §5.3 `match_periods` y §5.4 `match_events`).
- Para un esport futuro se agregarían, por ejemplo, `lol_games`, `lol_game_stats`, etc., en su propia migración. **Esto es código y esquema nuevo, no configuración.**

Detalle del contrato de módulo (`SportModule`) en [`01-arquitectura.md`](./01-arquitectura.md) §7 y [`11-roadmap-y-futuro.md`](./11-roadmap-y-futuro.md) §4.

---

## 3. Torneos y formato

### 3.1 `tournaments`

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| sport_id | BIGINT UNSIGNED FK → sports | RESTRICT |
| owner_user_id | BIGINT UNSIGNED FK → users | organizador creador |
| name | VARCHAR(150) | |
| slug | VARCHAR(170) | UNIQUE, para URL pública |
| description | TEXT NULL | |
| logo_url | VARCHAR(255) NULL | |
| status | ENUM('draft','registration','in_progress','finished','archived') | default 'draft' |
| periods_count | TINYINT | tiempos por partido (1–3, default 2) |
| points_win / points_draw / points_loss | TINYINT | copiados del deporte, editables |
| allow_late_registration | TINYINT(1) | permite inscripción tardía |
| registration_open | TINYINT(1) | inscripción abierta ahora |
| registration_code | VARCHAR(40) NULL | código/enlace de autoinscripción |
| starts_at | DATE NULL | |
| timezone | VARCHAR(40) | default 'America/Bogota' |
| created_at / updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP NULL | |

Índices: `UNIQUE(slug)`, `UNIQUE(registration_code)`, `INDEX(status)`, `INDEX(owner_user_id)`, `INDEX(updated_at)`.

### 3.2 `stages` (fases encadenables)
Una fase del torneo. Las fases se ordenan por `position` y se encadenan (la salida de una alimenta la entrada de la siguiente).

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| tournament_id | BIGINT UNSIGNED FK → tournaments | CASCADE |
| name | VARCHAR(120) | "Fase de grupos", "Eliminación" |
| type | ENUM('league','groups','knockout') | |
| position | SMALLINT | orden de la fase (1,2,3...) |
| legs | TINYINT | 1 = partido único, 2 = ida y vuelta |
| tiebreakers | JSON | orden de criterios: `["points","goal_diff","goals_for","head_to_head"]` |
| status | ENUM('pending','in_progress','finished') | default 'pending' |
| created_at / updated_at | TIMESTAMP | |

Índices: `INDEX(tournament_id, position)`.

### 3.3 `groups`
Subdivisión dentro de una fase `league`/`groups`. Permite **grupos asimétricos** (uno con 10 equipos, otro con 11). En una liga simple hay un único grupo.

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| stage_id | BIGINT UNSIGNED FK → stages | CASCADE |
| name | VARCHAR(80) | "Grupo A" |
| position | SMALLINT | |
| created_at / updated_at | TIMESTAMP | |

Índices: `INDEX(stage_id, position)`.

### 3.4 `group_teams`
Qué equipos integran un grupo (en una fase). Para knockout puro puede no usarse (se usa `bracket_slots`).

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| group_id | BIGINT UNSIGNED FK → groups | CASCADE |
| tournament_team_id | BIGINT UNSIGNED FK → tournament_teams | CASCADE |
| seed | SMALLINT NULL | siembra/cabeza de serie |
| created_at / updated_at | TIMESTAMP | |

Índices: `UNIQUE(group_id, tournament_team_id)`.

### 3.5 `advancement_rules` (reglas de avance/eliminación)
**Pieza clave del motor configurable.** Por cada grupo (o fase) define cuántos clasifican y cuántos se eliminan hacia la siguiente fase. Soporta el caso "del grupo de 10 se eliminan 4, del de 11 se eliminan 5".

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| stage_id | BIGINT UNSIGNED FK → stages | CASCADE. Fase origen. |
| group_id | BIGINT UNSIGNED FK → groups NULL | si la regla es específica de un grupo |
| qualifies_count | SMALLINT NULL | cuántos clasifican (top N) |
| eliminates_count | SMALLINT NULL | cuántos se eliminan (bottom N) |
| target_stage_id | BIGINT UNSIGNED FK → stages NULL | fase destino de los clasificados |
| created_at / updated_at | TIMESTAMP | |

Índices: `INDEX(stage_id)`, `INDEX(group_id)`.

### 3.6 `bracket_slots` (eliminación directa)
Estructura del cuadro de eliminación. Cada slot es una posición del bracket que se resuelve con un partido y alimenta al siguiente.

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| stage_id | BIGINT UNSIGNED FK → stages | CASCADE |
| round_label | VARCHAR(40) | "Octavos","Cuartos","Semifinal","Final" |
| position | SMALLINT | orden dentro de la ronda |
| home_source | VARCHAR(60) NULL | de dónde sale el local: `group:{id}#1`, `winner:slot:{id}` |
| away_source | VARCHAR(60) NULL | idem visitante |
| match_id | BIGINT UNSIGNED FK → matches NULL | partido que resuelve el slot |
| next_slot_id | BIGINT UNSIGNED FK → bracket_slots NULL | a qué slot avanza el ganador |
| created_at / updated_at | TIMESTAMP | |

Índices: `INDEX(stage_id, position)`.

---

## 4. Equipos, jugadores e inscripciones

### 4.1 `tournament_teams`
Equipo **dentro de un torneo** (los equipos no se comparten entre torneos en el MVP; se mantienen aislados).

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| tournament_id | BIGINT UNSIGNED FK → tournaments | CASCADE |
| name | VARCHAR(120) | |
| short_name | VARCHAR(20) NULL | abreviatura para tablas |
| logo_url | VARCHAR(255) NULL | |
| delegate_user_id | BIGINT UNSIGNED FK → users NULL | delegado responsable |
| status | ENUM('pending','approved','rejected','withdrawn') | default 'pending' |
| created_at / updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP NULL | |

Índices: `INDEX(tournament_id, status)`, `INDEX(updated_at)`.

### 4.2 `players` (registro reutilizable por organizador)
Persona jugadora **registrada bajo un organizador**. Su identidad es la **cédula/documento** (`document_id`), que es **obligatoria y única por organizador**. Así, cuando el mismo organizador crea otro torneo, al escribir la cédula el sistema **recupera nombre y datos** del jugador y acumula su historial.

> **Aislamiento entre organizadores**: el pool de jugadores es **privado del organizador** (`organizer_user_id`). Si otro organizador hace un torneo con el mismo jugador (misma cédula), crea **su propio registro independiente**; no ve nada del pool ajeno.

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| organizer_user_id | BIGINT UNSIGNED FK → users | dueño del registro (RESTRICT). Define el alcance del pool/historial. |
| user_id | BIGINT UNSIGNED FK → users NULL | opcional (si el jugador tiene cuenta propia) |
| document_id | VARCHAR(40) | **cédula/identificación. Obligatoria.** Identidad del jugador dentro del organizador. |
| full_name | VARCHAR(140) | |
| birthdate | DATE NULL | |
| photo_url | VARCHAR(255) NULL | |
| phone | VARCHAR(30) NULL | contacto opcional |
| created_at / updated_at | TIMESTAMP | |

Índices: `UNIQUE(organizer_user_id, document_id)` (núcleo de la reutilización), `INDEX(user_id)`, `INDEX(organizer_user_id)`.

> El **historial** del jugador no es una tabla nueva: se deriva de sus apariciones en `team_players` (qué equipos), `matches`/`match_events` (goles, tarjetas) a lo largo de los torneos **de ese mismo organizador**.

### 4.3 `team_players` (plantilla / roster)
Vincula un jugador a un equipo de un torneo, con dorsal y posición.

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| tournament_team_id | BIGINT UNSIGNED FK → tournament_teams | CASCADE |
| player_id | BIGINT UNSIGNED FK → players | CASCADE |
| shirt_number | SMALLINT NULL | dorsal |
| position | VARCHAR(40) NULL | "Portero","Defensa"... |
| is_captain | TINYINT(1) | default 0 |
| is_delegate | TINYINT(1) | default 0. El jugador es además el delegado del equipo. |
| status | ENUM('active','suspended','injured','inactive') | default 'active' |
| created_at / updated_at | TIMESTAMP | |

Índices: `UNIQUE(tournament_team_id, player_id)`, `UNIQUE(tournament_team_id, shirt_number)`.

> **Delegado que también es jugador**: roles y plantilla son cosas distintas pero compatibles.
> - El **rol** `delegate` vive en `tournament_user_roles` (apunta a `users` + `team_id`).
> - Que esa persona **juegue** se modela en el roster: se obtiene/crea un `players` (en el pool del organizador, por su cédula) y se agrega un `team_players` en su equipo. Si el delegado tiene cuenta, se enlaza `players.user_id`.
> - `is_delegate=1` en `team_players` es una **conveniencia de UI** para marcar/filtrar rápido "el delegado juega", sin tener que cruzar tablas. La fuente de verdad del rol sigue siendo `tournament_user_roles`.
> - Así, un mismo `user` puede ser simultáneamente delegado (rol) y jugador (entrada en el roster) del mismo equipo, e incluso capitán.

### 4.4 `registrations` (inscripciones, incl. tardías)
Registro del proceso de inscripción de un equipo. Soporta autoinscripción por código e **inscripción tardía** (cuando el torneo ya empezó).

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| tournament_id | BIGINT UNSIGNED FK → tournaments | CASCADE |
| tournament_team_id | BIGINT UNSIGNED FK → tournament_teams NULL | equipo resultante (al aprobar) |
| submitted_by_user_id | BIGINT UNSIGNED FK → users NULL | delegado que inició |
| channel | ENUM('manual','self_link') | manual (organizador) o autoinscripción |
| is_late | TINYINT(1) | default 0. Inscripción después del inicio. |
| joined_at_round | SMALLINT NULL | jornada desde la que entra (para re-fixtures) |
| status | ENUM('submitted','approved','rejected') | default 'submitted' |
| reviewed_by_user_id | BIGINT UNSIGNED FK → users NULL | organizador que aprobó |
| notes | TEXT NULL | |
| created_at / updated_at | TIMESTAMP | |

Índices: `INDEX(tournament_id, status)`, `INDEX(updated_at)`.

---

## 5. Fixtures y partidos

> `rounds` y `matches` son **del core** (sirven a cualquier deporte: definen quién juega, cuándo y el resultado resumido).
> `match_periods` y `match_events` (§5.3–5.4) pertenecen al **módulo `football`**. Otro deporte aporta sus propias tablas de detalle de partido en su propia migración.

### 5.1 `rounds` (jornadas / fechas) — core

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| stage_id | BIGINT UNSIGNED FK → stages | CASCADE |
| group_id | BIGINT UNSIGNED FK → groups NULL | jornadas dentro de un grupo |
| number | SMALLINT | número de jornada (1,2,3...) |
| name | VARCHAR(80) NULL | "Fecha 1" |
| scheduled_date | DATE NULL | |
| status | ENUM('pending','in_progress','finished') | default 'pending' |
| created_at / updated_at | TIMESTAMP | |

Índices: `INDEX(stage_id, number)`, `INDEX(group_id)`.

### 5.2 `matches` (partidos) — core, neutro al deporte
Entidad genérica: quién juega, cuándo, estado y **resultado resumido**. El detalle (cómo se llegó al marcador, eventos) lo aporta el módulo del deporte. `home_score`/`away_score` son numéricos genéricos que cada módulo interpreta a su manera (goles en fútbol, mapas/sets en esports).

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| tournament_id | BIGINT UNSIGNED FK → tournaments | CASCADE (denormalizado para consultas públicas) |
| round_id | BIGINT UNSIGNED FK → rounds NULL | |
| group_id | BIGINT UNSIGNED FK → groups NULL | |
| home_team_id | BIGINT UNSIGNED FK → tournament_teams NULL | NULL en bracket sin definir |
| away_team_id | BIGINT UNSIGNED FK → tournament_teams NULL | |
| leg | TINYINT | 1 = ida, 2 = vuelta |
| home_score | SMALLINT NULL | marcador resumido local (genérico; lo escribe el módulo al finalizar) |
| away_score | SMALLINT NULL | marcador resumido visitante (genérico) |
| winner_team_id | BIGINT UNSIGNED FK → tournament_teams NULL | ganador (clave para deportes sin empate; lo resuelve el módulo) |
| status | ENUM('scheduled','live','paused','finished','postponed','walkover') | default 'scheduled' |
| referee_user_id | BIGINT UNSIGNED FK → users NULL | juez/árbitro designado (genérico) |
| venue | VARCHAR(120) NULL | cancha/servidor |
| scheduled_at | DATETIME NULL | |
| started_at | DATETIME NULL | inicio real |
| finished_at | DATETIME NULL | |
| created_at / updated_at | TIMESTAMP | |

Índices: `INDEX(tournament_id, status)`, `INDEX(round_id)`, `INDEX(home_team_id)`, `INDEX(away_team_id)`, `INDEX(referee_user_id)`, `INDEX(updated_at)`.

> El **módulo del deporte** es responsable de, al finalizar un partido, escribir `home_score`, `away_score` y `winner_team_id` en `matches` a partir de su propio detalle. Así el core (tablas, brackets, avance) funciona sin conocer las reglas internas del deporte.

### 5.3 `match_periods` (tiempos del partido) — **módulo `football`**
El árbitro inicia/termina cada período desde el móvil. Cantidad = `tournaments.periods_count`. Tabla específica del módulo de fútbol; otro deporte no la usa.

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| match_id | BIGINT UNSIGNED FK → matches | CASCADE |
| number | TINYINT | 1, 2, 3... |
| status | ENUM('pending','running','finished') | default 'pending' |
| started_at | DATETIME NULL | |
| ended_at | DATETIME NULL | |
| created_at / updated_at | TIMESTAMP | |

Índices: `UNIQUE(match_id, number)`.

### 5.4 `match_events` (eventos en vivo) — **módulo `football`**
Goles, tarjetas e hitos de cronómetro. Fuente de verdad para el marcador y las estadísticas **de fútbol**. El `type` es un ENUM fijo del módulo (no se "configura" desde `sports`); ampliar eventos = migración del módulo. Otro deporte tendría su propia tabla de detalle (p. ej. `lol_game_stats`).

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| match_id | BIGINT UNSIGNED FK → matches | CASCADE |
| match_period_id | BIGINT UNSIGNED FK → match_periods NULL | |
| type | ENUM('goal','own_goal','yellow_card','red_card','period_start','period_end') | ENUM del módulo football |
| team_id | BIGINT UNSIGNED FK → tournament_teams NULL | equipo afectado |
| player_id | BIGINT UNSIGNED FK → players NULL | jugador (anotador/amonestado) |
| minute | SMALLINT NULL | minuto de juego |
| created_by_user_id | BIGINT UNSIGNED FK → users NULL | árbitro que lo registró |
| created_at / updated_at | TIMESTAMP | |

Índices: `INDEX(match_id, id)`, `INDEX(player_id, type)`, `INDEX(team_id)`.

> **Suspensiones por acumulación**: fase futura. Se calcularán leyendo `match_events` (no requiere tabla nueva en MVP).

---

## 6. Publicidad

### 6.1 `ad_slots`
Posición fija de publicidad. Puede ser global (toda la app) o por torneo.

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| tournament_id | BIGINT UNSIGNED FK → tournaments NULL | NULL = slot global |
| placement | ENUM('header','sidebar','between_matches','footer','match_live') | posición en la UI |
| name | VARCHAR(80) | etiqueta interna |
| is_active | TINYINT(1) | default 1 |
| created_at / updated_at | TIMESTAMP | |

Índices: `INDEX(tournament_id, placement)`.

### 6.2 `ad_creatives`
El contenido del anuncio que se muestra en un slot. Imagen o video, con CTA opcional. Por defecto un creative "espacio disponible → WhatsApp".

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| ad_slot_id | BIGINT UNSIGNED FK → ad_slots | CASCADE |
| media_type | ENUM('image','video') | |
| media_url | VARCHAR(255) | |
| cta_url | VARCHAR(255) NULL | link al hacer clic (opcional) |
| cta_label | VARCHAR(80) NULL | |
| is_default | TINYINT(1) | default 0. El banner "disponible". |
| is_active | TINYINT(1) | default 1 |
| starts_at | DATETIME NULL | vigencia (opcional) |
| ends_at | DATETIME NULL | |
| created_at / updated_at | TIMESTAMP | |

Índices: `INDEX(ad_slot_id, is_active)`.

---

## 7. Soporte / operación

### 7.1 `phinxlog`
Tabla de control de migraciones (la gestiona Phinx automáticamente).

### 7.2 (Futuro) `notifications`, `favorites`, `ad_impressions`
No se crean en el MVP. Documentadas en [`11-roadmap-y-futuro.md`](./11-roadmap-y-futuro.md).

---

## 8. Resumen de tablas del MVP

Se separan en **CORE** (genéricas, reutilizables por cualquier deporte) y **MÓDULO football** (específicas de fútbol). Agregar un nuevo deporte añade tablas de su propio módulo, sin tocar las del core ni las de football.

| # | Tabla | Capa | Módulo lógico |
|---|---|---|---|
| 1 | users | CORE | Identidad |
| 2 | tournament_user_roles | CORE | Identidad / permisos |
| 3 | sports | CORE | Registro de módulos de deporte |
| 4 | tournaments | CORE | Torneos |
| 5 | stages | CORE | Formato |
| 6 | groups | CORE | Formato |
| 7 | group_teams | CORE | Formato |
| 8 | advancement_rules | CORE | Formato |
| 9 | bracket_slots | CORE | Formato (eliminación) |
| 10 | tournament_teams | CORE | Equipos |
| 11 | players | CORE | Equipos |
| 12 | team_players | CORE | Equipos |
| 13 | registrations | CORE | Inscripciones |
| 14 | rounds | CORE | Fixtures |
| 15 | matches | CORE | Fixtures (resultado resumido) |
| 16 | match_periods | **football** | Detalle de partido |
| 17 | match_events | **football** | Detalle de partido |
| 18 | ad_slots | CORE | Publicidad |
| 19 | ad_creatives | CORE | Publicidad |

- **CORE (17 tablas)**: no cambian al sumar deportes.
- **MÓDULO football (2 tablas)**: viven en la migración del módulo de fútbol.
- **Deporte futuro** (ej. `lol`): añade sus tablas (`lol_games`, `lol_game_stats`...) en su propia migración + su código de módulo. No reutiliza `match_periods`/`match_events`.

El orden de migración respeta dependencias de FK (de arriba hacia abajo). Las migraciones del core van primero; las del módulo football después.
