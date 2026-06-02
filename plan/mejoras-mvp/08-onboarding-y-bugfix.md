# Fase 8 · Onboarding sin fricción + Bugfix

> **Objetivo**: que crear un torneo sea trivial (deporte → nombre → listo), arreglar el error 404 al entrar a "Mis torneos"/editar, y quitar del frontend lo que enreda (números de posición). Máximo impacto, mínimo costo.
> Depende de: MVP (Fases 1–7). Habilita: Fase 9 (la edición rica necesita la ruta por id arreglada).

---

## 1. Bugfix — error 404 al ver/editar "Mis torneos"

**Síntoma**: tras crear un torneo, el Dashboard muestra "Algo salió mal / No se pudieron cargar tus torneos" llamando a `GET /api/v1/tournaments/{id}` → `{"success":false,"message":"Torneo no encontrado."}`. En "todos los torneos" sí aparece, pero no deja editarlo.

**Causa raíz**: la ruta de detalle es **solo por slug** (`GET /tournaments/{slug}` → `ShowTournamentAction::findBySlug`), pero el frontend la llama con el **id numérico** en el Dashboard y en la edición.

### 2. Backend

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/tournaments/mine` | (auth) Torneos del organizador autenticado, entidades completas. Reemplaza el bucle de N fetches por id. |
| GET | `/api/v1/tournaments/by-id/{id}` | (auth, dueño/admin) Detalle por id numérico. Alternativa: hacer que `ShowTournamentAction` detecte numérico → `findById`, si no `findBySlug`. |

- Archivo ruta: `api/app/routes.php` (~L116, grupo tournaments).
- Action: `api/src/Application/Actions/Tournament/ShowTournamentAction.php` (L28–33, hoy solo `findBySlug`).
- Repo: `api/src/Domain/Tournament/TournamentRepository.php` ya tiene `findById`.

### 3. Frontend

- `frontend/src/features/tournaments/hooks/useMyOrganizerTournaments.ts` (L33–37): consumir `GET /tournaments/mine` (1 sola llamada).
- `frontend/src/pages/TournamentEditPage.tsx` (L45–49): usar la ruta por id.

### Entregables (bugfix)
- [ ] `GET /tournaments/mine` (o `by-id/{id}`) funcionando.
- [ ] Dashboard "Mis torneos" carga sin error.
- [ ] La edición abre con los datos del torneo.

---

## 4. Crear torneo con mínima fricción

**Hoy**: `TournamentWizardPage.tsx` es un asistente de 5 pasos que pide todo de entrada (lo inverso a lo deseado).

**Meta**: al dar "Nuevo torneo":
1. Primero preguntar **tipo de torneo (deporte)**.
2. Luego pedir **solo el nombre**.
3. Crear y redirigir a la **vista de edición** del torneo, donde aparece todo lo demás como opcional.

- Backend `CreateTournamentAction` ya acepta `name` + `sport_id` y siembra puntos/períodos desde `sport.default_config`. **No requiere cambios** (description/logo/fechas ya son opcionales).
- Frontend: reducir el wizard a 2 pasos mínimos (deporte → nombre) y mover Configuración/Fases/Grupos/Reglas a la edición.
- Archivos: `frontend/src/pages/TournamentWizardPage.tsx`, `components/{BasicsFields,ConfigFields}.tsx`, `features/tournaments/{schemas,mappers}.ts`.

### Entregables (crear)
- [ ] Flujo: deporte → nombre → torneo creado → vista de edición.
- [ ] El resto de la configuración ya no bloquea la creación.

---

## 5. Quitar edición de posiciones (frontend)

- En **fases**: las posiciones de la fase no deben ser editables; quitar el input de número. Se mantiene el **orden de creación** (`stages.position` lo asigna el backend).
- En **grupos**: quitar el campo de posición y las etiquetas "pos 1 / pos 2" (enreda). Mantener orden de creación.
- Archivos: `frontend/src/features/tournaments/components/{StageManager,GroupManager}.tsx`; quitar `position` de `schemas.ts`.
- Backend: `position` puede seguir existiendo; solo se deja de exponer en el frontend.

### Entregables (posiciones)
- [ ] Sin input de posición en `StageManager`.
- [ ] Sin input ni etiquetas "pos N" en `GroupManager`.

---

## 6. Checkbox "Inscripciones cerradas"

- Ya existe el toggle `registration_open` en el torneo, pero está enterrado en `ConfigFields`.
- Sacarlo como una **sección clara en la administración del torneo** ("Inscripciones") con un checkbox legible "Inscripciones cerradas".
- Archivos: `frontend/src/pages/TournamentEditPage.tsx` (sección Inscripciones), `UpdateTournamentAction.php` (ya soporta el campo).

### Entregables (inscripciones)
- [ ] Checkbox "Inscripciones cerradas" visible en la admin del torneo.

---

## Criterios de aceptación de la Fase 8
1. Entrar a "Mis torneos" tras crear uno **no** muestra error y permite **editar**.
2. Crear un torneo solo pide deporte y luego nombre; redirige a editar.
3. No hay inputs de número de posición en fases ni grupos.
4. El organizador puede cerrar/abrir inscripciones con un checkbox claro.
5. Sin `any` en TS; respuestas en formato estándar.
