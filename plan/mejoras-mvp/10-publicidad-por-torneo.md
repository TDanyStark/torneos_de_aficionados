# Fase 10 · Publicidad por torneo

> **Objetivo**: que la publicidad se gestione **desde la vista de un torneo con rol admin**, no en `/admin/ads` global. No hay publicidad general (la única "general" es invitar a organizadores a inscribirse). Entrar a un torneo como admin → ver los slots → editarlos.
> Depende de: Fase 9 (reusa el pipeline de upload de imágenes). Habilita: monetización por torneo.

---

## 1. Concepto

- Toda creatividad/publicidad está **asociada a un torneo**.
- El admin entra a un torneo y ve sus **slots**; puede editar las creatividades de cada slot.
- Se elimina/oculta la página global `/admin/ads`.

**Ventaja**: el esquema ya soporta esto — `ad_slots.tournament_id` es **nullable y ya existe** (migración `...063`). Esta fase es mayormente **relocalización de UI + un listado admin por torneo**.

## 2. Backend

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/admin/tournaments/{id}/ad-slots` | (admin) Slots del torneo con sus creatividades, para gestión. |
| POST/PUT | `/api/v1/ad-creatives` (+ `/ad-creatives/upload`) | (admin) Ya existen; se reutilizan. |

- Auto-sembrar **slots por defecto** al crear/abrir un torneo (los espacios estándar de layout), para que el admin no parta de cero.
- Archivos: `api/src/Application/Actions/Ad/*` (incl. `ListAdSlotsAction.php` — hoy global; añadir variante por torneo), `CreateAdSlotService.php`, `AdminMiddleware`.

### Entregables backend
- [ ] Listado de slots por torneo para admin.
- [ ] Auto-seed de slots por defecto por torneo.
- [ ] Reuso de creación/edición/subida de creatividades (Fase 6/9).

---

## 3. Frontend

- Nueva **pestaña/panel "Publicidad"** dentro de la vista del torneo, visible solo con rol **admin**.
- Muestra los slots del torneo y permite editar la creatividad de cada uno (imagen/video + CTA opcional + ventana de validez), subiendo media con el uploader de Fase 9.
- **Quitar** la ruta global `/admin/ads` (o dejarla como redirección/deprecada).
- Archivos: nuevo `frontend/src/features/ads/components/TournamentAdsPanel.tsx`, reusar `SlotCard`/`SlotDialog`/`useAds`; quitar `frontend/src/pages/AdminAdsPage.tsx` del router (`app/router.tsx` ~L126).

### Entregables frontend
- [ ] Panel "Publicidad" en la vista del torneo (solo admin).
- [ ] Editar creatividades por slot desde ahí.
- [ ] `/admin/ads` global eliminada/deprecada.

---

## Criterios de aceptación de la Fase 10
1. Un admin entra a un torneo, ve los slots y edita sus creatividades sin salir del torneo.
2. No existe gestión de publicidad "general" salvo el banner por defecto de invitación.
3. La ruta `/admin/ads` ya no es el punto de gestión.
4. Las creatividades subidas se sirven correctamente en las vistas públicas del torneo.
