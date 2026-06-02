# Fase 12 · Editor de grupos + Eliminatoria por tamaño

> **Objetivo**: que los grupos se creen **después** de los equipos, de forma flexible (cantidad, auto-reparto, aleatorio, mover manual), sin regla de tamaños iguales; y que las eliminatorias se definan por **tamaño** (4–128). Quitar lo que enreda (IDs de grupo crudos, posiciones).
> Depende de: equipos creados (Fase 3 del MVP). Habilita: armado de fases real y fácil.

---

## 1. Editor de grupos

**Flujo deseado** (los grupos se crean **tras** crear los equipos):
1. Pedir **cantidad de grupos** (1, 2, 3, …).
2. El sistema **divide los equipos** en esa cantidad (pueden quedar iguales o uno con más — **sin regla de tamaños iguales**).
3. Botón **"Distribuir aleatoriamente"**.
4. **Editar grupos**: seleccionar equipos y moverlos de un grupo a otro. Puedo tener un grupo de 2 y otro de 10.
5. Por defecto el reparto es automático, pero el organizador lo organiza como quiera.
6. Quitar etiquetas "pos 1 / pos 2" y el id de grupo crudo.

## 2. Backend

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/stages/{id}/groups/distribute` | Crea N grupos y reparte los equipos aprobados (param `count`, `random` opcional). |
| POST | `/api/v1/groups/{id}/teams` | (existe) Asignar equipo a grupo. |
| DELETE | `/api/v1/group-teams/{id}` | (existe) Quitar equipo de grupo. |

- Servicio transaccional `DistributeGroupsService`: borra grupos previos de la fase, crea `count` grupos, reparte `tournament_teams` (round-robin o aleatorio).
- Reusa primitivas existentes `AssignTeamToGroupAction` / `RemoveTeamFromGroupAction` para mover manual.
- Archivos: `api/src/Application/Actions/{Group,GroupTeam}/*`, nuevo servicio; migraciones `...049_groups`, `...055_group_teams` (sin cambios de esquema esperados).

### Entregables backend
- [ ] Endpoint de distribución (N grupos + reparto, con opción aleatoria).
- [ ] Mover equipo entre grupos vía endpoints existentes.

---

## 3. Eliminatoria por tamaño

- Al crear una fase **eliminatoria**, pedir el **tamaño**: 4, 8, 16, 32, 64, 128 (hasta ahí).
- Hoy los participantes se derivan de `group_teams`; falta la **UI de tamaño de bracket** (y posiblemente un campo `bracket_size` en la config de la fase).
- Simplificar las **reglas de avance**: quitar el input crudo "id del grupo (opcional)" y el `target_stage_id` numérico; reemplazar por **dropdowns** (selector de grupo / fase destino) o eliminarlos.
- Archivos: `frontend/src/features/tournaments/components/{StageManager,AdvancementRuleManager,GroupManager}.tsx`, `GenerateFixtureService::buildKnockoutPlan`, `FixtureGenerator`.

### Entregables (eliminatoria)
- [ ] Selector de tamaño (4/8/16/32/64/128) al crear eliminatoria.
- [ ] Reglas de avance con selectores amigables (sin IDs crudos).

---

## 4. Frontend — editor

- Nuevo `GroupBuilder.tsx`: input de cantidad, botón aleatorio, y panel para mover equipos entre grupos (drag o select + mover).
- Sin números de posición ni etiquetas "pos N".
- Archivos: `frontend/src/features/tournaments/components/GroupBuilder.tsx`, `api/{useGroups,useGroupTeams}.ts`.

### Entregables frontend
- [ ] `GroupBuilder` con cantidad, auto-reparto, aleatorio y mover manual.
- [ ] Grupos de tamaños distintos permitidos.

---

## Criterios de aceptación de la Fase 12
1. Los grupos se crean tras los equipos: indico cantidad y el sistema reparte.
2. Hay botón de reparto aleatorio y puedo mover equipos manualmente entre grupos.
3. Se permiten grupos de tamaños distintos (no hay regla de iguales).
4. Al crear una eliminatoria elijo su tamaño (4–128).
5. No hay inputs de id de grupo crudos ni posiciones en la UI.
