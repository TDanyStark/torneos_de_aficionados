# Fase 16 — Ajustes de inscripción, edición y vista de torneos

## Principio transversal (CRÍTICO)
Los roles son **por-torneo**, no globales. Un mismo usuario puede ser
organizador en el torneo A, delegado en el B, jugador en el C, árbitro en el D y
espectador en el E, todo al mismo tiempo. Por tanto:

- **Todo gating de UI** se hace por `hasRole(tournamentId, role)` del `authStore`
  (`roles: { tournament_id, role }[]`), nunca por un rol global del usuario.
- **Todo filtro de endpoint** filtra por `tournament_id` + `user_id` + `role`.
- Un mismo torneo puede aparecer en "Mis torneos" (si soy organizador) **y** en
  "Mis inscripciones" (si además inscribí un equipo como delegado). Son vistas
  distintas por rol y eso es correcto.
- "Mis torneos" = `GET /tournaments/mine` (organizador). "Mis inscripciones" =
  torneos donde soy `delegate` de algún equipo.

## Resumen de decisiones (confirmadas)
- Jugadores del roster → lista del **organizador dueño** del torneo, reusados por cédula.
- Roster en inscripción pública: **nombre + cédula obligatorios, mínimo 1 jugador**;
  foto opcional (cámara/galería + upload).
- Logo de equipo: **upload opcional** redimensionado a 398×398 (`ImageUploadService`).
- "Mis inscripciones": lista automática derivada del rol `delegate`. Ruta `/mis-inscripciones`.
- Inscripción **requiere login** (como hoy).
- Botón **"Roles" → "Equipos"** en la card; ruta `/roles` queda sin link visible.
- Quitar checkbox "delegado también es jugador".
- Guardar en edición: barra sticky inferior, `disabled = !isDirty`, feedback de validación,
  tras guardar exitoso **queda en la página** + toast + `reset`.

---

## Bloque A — Vista "Mis Torneos" (OrganizerTournamentCard)
- A1. Logo o gradiente determinístico (seed = `id`/`name`) con inicial encima.
- A2. Reemplazar botón "Roles" por "Equipos" → `/tournaments/:id/teams`.

## Bloque B — Página "Equipos del organizador"
- Ruta `/tournaments/:id/teams` → `TournamentTeamsPage`.
- Listado con `name`, `logo_url`, `channel` (`manual`|`self_link`), `status`.
- Filtros por canal y estado. Enlace a `/tournaments/:id/teams/:teamId/manage`.
- Exponer `channel` en el listado backend de equipos del organizador si falta.

## Bloque C — Página de edición (TournamentEditPage)
- C0. Añadir primitivo Accordion (shadcn/Radix).
- C1. "Datos" abierto; resto en acordeón.
- C2. Botón Atrás (`navigate(-1)`).
- C3. Barra sticky Guardar (`disabled = !isDirty || isSubmitting`).
- C4. `onInvalid` → toast + abrir sección con el primer error (fix "no hace nada").
- C5. Verificar bug "inscripciones cerradas" (ligado a C4 + backend ya bloquea).

## Bloque D — Inscripción por link
### Backend
- D1. `POST /tournaments/{id}/registration-photo` (valida code) → `storeSquare(398)` → `photo_url`.
- D2. `POST /tournaments/{id}/registration-logo` (valida code) → `storeSquare(398)` → `logo_url`.
- D3. `RegisterTeamService.execute`: roster múltiple (`players[]`), min 1, cédula+nombre
  obligatorios, reusar/crear por cédula bajo `organizer_user_id = ownerUserId`, dorsales únicos,
  respetar `roster_limit`. Quitar rama `is_player` única.
- D4. `CreateRegistrationAction`: parsear/validar `players[]`.
### Frontend
- D5. Schema: quitar `is_player` + campos sueltos; añadir `players: array(min 1)`.
- D6. Form: quitar checkbox + bloque condicional; roster dinámico (`useFieldArray`) con foto
  (`capture`), uploader de logo de equipo.
- D7. Tipos/API/payload + hooks de upload.

## Bloque E — "Mis inscripciones" (delegado)
- E1. `GET /me/registrations` (JWT): torneos donde soy `delegate`, con torneo + equipo + estado + canal.
- E2. Ruta `/mis-inscripciones` + entrada en nav. Cards con logo/gradiente, estado (badge), link al torneo.

---

## Orden de ejecución
1. C — Edición (desbloquea bug de guardar + cerradas).
2. A — Card.
3. B — Página Equipos.
4. D backend → D frontend.
5. E — Mis inscripciones.

## Gates
- Backend: `composer test` (objetivo verde), pruebas roster múltiple + uploads + closed-enforcement.
- Frontend: `tsc` 0, `lint` 0, `build` 0.
- Sin migraciones nuevas esperadas.

## Riesgos
- Uploads públicos con código: validar `registration_code` + MIME/tamaño (ya en `ImageUploadService`).
- Dorsales/roster_limit en lote: validar colisiones dentro del request.
- Acordeón nuevo: confirmar dep Radix antes de instalar.
- `onInvalid` + scroll a sección colapsada: mapear campo→acordeón.
