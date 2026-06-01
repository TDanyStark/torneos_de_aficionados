# Fase 5 · Partidos en Vivo y Estadísticas (módulo `football`)

> **Objetivo**: vista de **árbitro** para controlar el partido desde el móvil (cronómetro por períodos, goles y tarjetas) y **seguimiento público** vía polling. Más estadísticas básicas (goleadores, disciplina).
> Depende de: Fase 4 (existen partidos). Habilita: estadísticas y vistas públicas (Fase 7).
>
> **Alcance de capa**: esta fase es la **implementación del módulo de deporte `football`** (ver [`01-arquitectura.md`](./01-arquitectura.md) §7). Las tablas `match_periods`/`match_events`, la vista del árbitro, el cronómetro y las estadísticas de goles/tarjetas son **específicas de fútbol**. Al finalizar un partido, el módulo escribe el resultado resumido (`home_score`, `away_score`, `winner_team_id`) en `matches`, que es la entidad neutra del core. Otro deporte implementaría su propia versión de esta fase con sus tablas y su UI.

---

## 1. Modelo de tiempo de juego

- Un partido tiene **N períodos** = `tournaments.periods_count` (1–3, default 2).
- El **árbitro** controla el cronómetro: inicia un período, registra eventos, lo cierra, y repite hasta finalizar.
- Tablas: `match_periods` (estado por período) y `match_events` (acciones).

### Estados del partido (`matches.status`)
`scheduled` → `live` (al iniciar 1.er período) → `paused` (entre períodos) → `finished`.
También: `postponed`, `walkover`.

---

## 2. Vista del árbitro (acciones)

Flujo mínimo en pantalla móvil:
1. **Iniciar período** → crea/activa `match_periods` (`running`), marca `matches.status='live'` y `started_at`.
2. **Registrar evento**: gol (equipo + jugador + minuto), amarilla, roja.
3. **Finalizar período** → `match_periods.status='finished'`, `matches.status='paused'`.
4. Repetir por cada período.
5. **Finalizar partido** → consolida `home_score`/`away_score` desde los goles, `status='finished'`, `finished_at`.

### Endpoints (acceso: árbitro designado del partido)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/matches/{id}/periods/start` | inicia el siguiente período |
| POST | `/api/v1/matches/{id}/periods/end` | cierra el período activo |
| POST | `/api/v1/matches/{id}/events` | registra gol/tarjeta (`type`, `team_id`, `player_id`, `minute`) |
| DELETE | `/api/v1/match-events/{id}` | corrige (elimina) un evento mal cargado |
| POST | `/api/v1/matches/{id}/finish` | finaliza y consolida marcador |

- `match_events` también guarda hitos `period_start`/`period_end` para reconstruir la línea de tiempo.
- El marcador en vivo se **deriva de los eventos `goal`/`own_goal`** (no se edita a mano salvo corrección).
- Validaciones: no registrar eventos sin período activo; jugador debe pertenecer al equipo.

---

## 3. Seguimiento público (polling)

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/v1/matches/{id}/live` | público |

Devuelve: estado, marcador, período activo y su tiempo, lista de eventos ordenada.

### Estrategia de polling (protección del hosting compartido)
- **Polling automático** cada **~60s** mientras el partido esté `live`/`paused`.
- **Botón manual "Actualizar"** con **cooldown** en cliente (ej. 15–20s) para evitar abuso.
- Opcional servidor: rate limit → **HTTP 429** con `Retry-After` si se excede.
- Sin WebSockets (no viable en Hostinger compartido).
- Respuesta cacheable brevemente / liviana (solo el delta necesario).

---

## 4. Estadísticas

Calculadas leyendo `match_events` (sin tablas nuevas en MVP):

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/v1/tournaments/{id}/top-scorers` | público (goleadores, paginado) |
| GET | `/api/v1/tournaments/{id}/cards` | público (amarillas/rojas por jugador) |

> **Suspensiones por acumulación** (ej. 2 amarillas = 1 fecha): documentado como **fase futura**; se calcularía sobre `match_events`.

---

## 5. Frontend

### Pantallas
- **Vista árbitro** (`/arbitro/partido/{id}`): mobile-first, botones grandes:
  - cronómetro por período (start/stop),
  - registrar gol/amarilla/roja con selección rápida de jugador (React Select),
  - deshacer último evento,
  - finalizar partido.
- **Partido en vivo público** (`/partido/{id}`): marcador, minuto, línea de tiempo de eventos, botón actualizar con cooldown, indicador de "en vivo".
- **Goleadores** y **Disciplina** (públicas, paginadas).

### Detalles
- TanStack Query con `refetchInterval` (~60s) para `/live` solo cuando el partido está activo.
- Estados optimistas para el árbitro (registro inmediato + reconciliación).
- Skeletons y toasts.

---

## Criterios de aceptación
1. El árbitro inicia y cierra cada período según `periods_count`, registrando goles y tarjetas con jugador y minuto.
2. El marcador público se actualiza solo (~60s) y con botón manual rate-limited.
3. Al finalizar, `home_score`/`away_score` quedan consolidados y alimentan la tabla (Fase 4).
4. Goleadores y disciplina se derivan correctamente de los eventos.
5. No es posible registrar eventos sin período activo ni con jugadores ajenos al equipo.
