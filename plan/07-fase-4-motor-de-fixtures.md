# Fase 4 · Motor de Fixtures, Tablas y Avance

> **Objetivo (fase de mayor complejidad)**: generar calendarios para cualquier formato configurado, calcular tablas de posiciones, resolver el avance entre fases y **regenerar fixtures** ante inscripciones tardías.
> Depende de: Fase 2 (formato) y Fase 3 (equipos aprobados). Habilita: Fase 5 (partidos en vivo).

---

## 1. Servicios de dominio

Toda la lógica vive en `Domain/Fixture/` como **servicios de dominio puros y testeables** (no en Actions):

| Servicio | Responsabilidad |
|---|---|
| `FixtureGenerator` | Genera `rounds` + `matches` según el tipo de fase. |
| `RoundRobinScheduler` | Algoritmo round-robin (círculo) para liga/grupos. Soporta `legs` (ida/vuelta). |
| `KnockoutBuilder` | Construye `bracket_slots` y sus enlaces (`next_slot_id`). |
| `StandingsCalculator` | Calcula la tabla aplicando `tiebreakers`. |
| `AdvancementResolver` | Aplica `advancement_rules` para poblar la siguiente fase. |
| `FixtureRegenerator` | Recalcula jornadas futuras tras inscripción tardía. |

---

## 2. Generación por tipo de fase

### 2.1 Liga / Grupos (round-robin)
- Algoritmo del círculo (round-robin): N equipos → N-1 jornadas (N par) o N jornadas (N impar, con "bye").
- `legs=2` ⇒ se duplican las jornadas invirtiendo local/visitante (ida y vuelta).
- Grupos asimétricos: cada grupo genera su propio round-robin independiente (uno de 10 y otro de 11 conviven sin problema).
- Genera `rounds` (por grupo) y `matches` con `home_team_id`/`away_team_id`.

### 2.2 Eliminación directa (knockout)
- `KnockoutBuilder` crea `bracket_slots` por ronda (Octavos→…→Final).
- `home_source`/`away_source` definen el origen de cada lado:
  - `group:{id}#1` (1.º del grupo), `winner:slot:{id}` (ganador de otro slot).
- `next_slot_id` encadena el avance del ganador.
- `legs=2` ⇒ ida y vuelta también soportado en cruces.

### 2.3 Endpoint
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/v1/stages/{id}/generate-fixtures` | organizador |

Pre-condición: equipos del grupo asignados (`group_teams`) o reglas de origen definidas (knockout).

---

## 3. Tabla de posiciones (`StandingsCalculator`)

> La **estructura** de la tabla (filas, orden, posición) es core, pero **cómo se puntúa depende del deporte**. `StandingsCalculator` delega en la `StandingsStrategy` del módulo (`SportModule.standingsStrategy()`, ver [`01-arquitectura.md`](./01-arquitectura.md) §7). El MVP usa la estrategia del módulo `football`.

Estrategia de fútbol (módulo `football`) — calcula por grupo: `PJ, PG, PE, PP, GF, GC, DG, Pts`.
- Puntos según `tournaments.points_win/draw/loss`.
- Fuente del marcador: `matches.home_score/away_score`/`winner_team_id` (consolidados por el módulo al finalizar el partido, Fase 5).
- **Desempates** según `stages.tiebreakers` (orden configurable): puntos → diferencia de gol → goles a favor → enfrentamiento directo (head-to-head) → etc.

> Otro deporte puede ofrecer una estrategia distinta (p. ej. ranking por victorias sin empates, o sin tabla cuando es bracket puro) sin tocar el core.

### Endpoint
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/v1/groups/{id}/standings` | público |

Respuesta: filas ordenadas con posición, equipo y métricas.

---

## 4. Avance entre fases (`AdvancementResolver`)

- Al finalizar una fase, lee `advancement_rules` por grupo.
- Selecciona top-N (clasifican) y descarta bottom-N (eliminados) según `qualifies_count`/`eliminates_count`.
- Vuelca los clasificados al `target_stage_id`:
  - si destino es grupos/liga → crea `group_teams`,
  - si destino es knockout → resuelve `home_source`/`away_source` de los `bracket_slots`.

Soporta el caso pedido: grupo de 10 elimina 4, grupo de 11 elimina 5, y los restantes pasan a eliminación.

---

## 5. Re-generación por inscripción tardía (`FixtureRegenerator`)

Disparador: equipo aprobado con `registrations.is_late=1` y `joined_at_round=K`.

Estrategia (round-robin):
1. **Conservar** jornadas/partidos ya jugados o en curso (`< K`).
2. **Recalcular** las jornadas futuras (`>= K`) incluyendo al nuevo equipo.
3. **Agregar** los partidos que el nuevo equipo aún no jugó contra los ya existentes, distribuidos en jornadas nuevas/futuras.
4. Recalcular numeración y fechas de jornadas futuras.

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/v1/stages/{id}/regenerate-fixtures` | organizador |

Reglas:
- Nunca altera resultados ya consolidados.
- Operación **idempotente** sobre lo no jugado.
- Devuelve resumen: jornadas afectadas, partidos creados.

> Es el punto de mayor riesgo del sistema → **cobertura de tests unitarios obligatoria** en `FixtureRegenerator` y `RoundRobinScheduler`.

---

## 6. Otros endpoints de lectura

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/v1/tournaments/{id}/rounds` | público |
| GET | `/api/v1/tournaments/{id}/matches` | público (filtros: `round`, `group`, `status`) |
| PUT | `/api/v1/matches/{id}` | organizador (sede, fecha, árbitro) |

Fixtures se ordenan por jornada **ASC** (natural del calendario); listados administrativos por `updated_at DESC`.

---

## 7. Frontend

### Pantallas
- **Generar fixture** (organizador): botón por fase con preview y confirmación.
- **Calendario / Fixtures** (público): por jornada y por grupo, navegable por URL (`?group=A&round=3`).
- **Tabla de posiciones** (público): por grupo, con tooltips de desempate.
- **Bracket** (público): vista de cuadro de eliminación.
- **Re-generar** (organizador): acción visible cuando hay inscripción tardía pendiente de integrar, con resumen del impacto antes de confirmar.

### Detalles
- Skeletons en tablas y bracket.
- Estado (grupo/jornada activa) en URL.
- Tipos exactos en `features/fixtures/types.ts`.

---

## Criterios de aceptación
1. Una liga de N equipos genera el round-robin correcto (ida; ida y vuelta si `legs=2`).
2. Dos grupos asimétricos (10 y 11) generan sus calendarios independientes.
3. La tabla aplica los desempates configurados en orden.
4. El avance traslada correctamente clasificados a la fase destino (grupos o bracket).
5. Una inscripción tardía en la fecha 3 conserva lo jugado y recalcula las fechas futuras incluyendo al nuevo equipo, agregando sus partidos faltantes.
6. `FixtureRegenerator` y `RoundRobinScheduler` tienen tests unitarios verdes.
