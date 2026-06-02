# Fase 11 · Vista por fase (selector, render, goleadores, coloreo, borrado)

> **Objetivo**: que cada torneo se vea según la **fase activa**, con un selector arriba, render distinto por tipo de fase, goleadores filtrables por fase, coloreo de clasificados/eliminados y borrado de fase con confirmación.
> Depende de: MVP (fases/standings/bracket ya existen). Habilita: navegación clara de torneos con múltiples fases.

---

## 1. Selector de fase + render por tipo

- En cada torneo, un **`<select>` arriba** para que el público elija qué fase ver.
- Por defecto carga la **fase activa** marcada por el organizador (si ya pasó la fase 1, no tiene sentido cargarla de primeras). Derivable de `stages.status` (`pending|in_progress|finished`).
- Render según tipo:
  - **liga** → tabla de posiciones
  - **grupos** → vista de grupos
  - **eliminatoria** → **árbol horizontal** (ya existe `BracketView.tsx`)
- Archivos: `frontend/src/pages/TournamentPage.tsx`, `useTournamentTabs`, `features/fixtures/components/{BracketView,FixturesPanel,TablaPanel}.tsx`, nuevo `PhaseSelector.tsx`.
- Backend: opcionalmente exponer "fase activa" (campo derivado o `tournament.active_stage_id`).

### Entregables (selector/render)
- [ ] Selector de fase visible que carga por defecto la fase activa.
- [ ] Render correcto por tipo (liga/grupos/eliminatoria horizontal).

---

## 2. Goleadores por fase

- Hoy `GET /tournaments/{id}/top-scorers` agrega goles de **todo el torneo**.
- Añadir filtro **por fase(s)**: una fase, todas, o varias (multi-select).

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/tournaments/{id}/top-scorers?stage_id[]=` | Goleadores filtrados por una o varias fases (omitir = todas). |

- Backend: `TopScorersAction.php` + `MatchEventRepository::topScorers` (JOIN `match_events → matches.stage_id`, filtro `stage_id IN (...)`).
- Frontend: multi-select de fases en `GoleadoresPanel.tsx`.

### Entregables (goleadores)
- [ ] Filtro `stage_id[]` en el endpoint de goleadores.
- [ ] Multi-select de fases en el panel de goleadores.

---

## 3. Coloreo de clasificados / eliminados

- En cada fase, colorear por defecto en **verde** los que pasan y en **rojo** los eliminados, según `qualifies_count` / `eliminates_count` de las reglas de avance.
- Render-only en el frontend (los conteos ya existen en `advancement_rules`).
- Archivos: `TablaPanel.tsx` / vista de grupos.

### Entregables (coloreo)
- [ ] Top-N en verde, bottom-M en rojo en las tablas de fase.

---

## 4. Borrar fase con confirmación (cascada total)

- El organizador puede **eliminar fases por completo**: pide confirmación y borra **todo** (resultados, partidos, goleadores, grupos, reglas).
- La cascada ya funciona a nivel DB (FKs `ON DELETE CASCADE`: stages→groups/advancement_rules, matches por stage_id, match_events/match_periods por match).
- Solo falta **diálogo de confirmación** claro en el frontend.
- Archivos: `frontend/src/features/tournaments/components/StageManager.tsx`, `DeleteStageAction.php` (ya existe).

### Entregables (borrado)
- [ ] Diálogo de confirmación que advierte "se eliminará todo: resultados, partidos, goleadores".
- [ ] Al confirmar, la fase y todo lo asociado desaparece.

---

## Criterios de aceptación de la Fase 11
1. El torneo carga por defecto la fase activa y permite cambiarla con un selector.
2. Cada tipo de fase se renderiza distinto (tabla / grupos / árbol horizontal).
3. Los goleadores se pueden filtrar por una o varias fases.
4. Clasificados en verde y eliminados en rojo según las reglas de avance.
5. Borrar una fase pide confirmación y elimina todo en cascada.
