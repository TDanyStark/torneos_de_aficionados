# Fase 6 · Publicidad (modelo de negocio)

> **Objetivo**: monetización vía **slots publicitarios** con banner/video y CTA. Por defecto muestran un banner "espacio disponible → WhatsApp"; el **admin** los edita por torneo.
> Depende de: Fase 1 (admin) y Fase 2 (torneos). Transversal a las vistas (Fase 7).

---

## 1. Concepto

- Un **slot** (`ad_slots`) es una posición fija en la UI (`header`, `sidebar`, `between_matches`, `footer`, `match_live`).
- Un slot puede ser **global** (`tournament_id = NULL`) o **por torneo**.
- Cada slot muestra un **creative activo** (`ad_creatives`): imagen o video, con CTA opcional.
- Si no hay creative vendido, se muestra el **creative por defecto** (`is_default=1`): banner "Este espacio está disponible" con CTA a WhatsApp del admin (`ADMIN_WHATSAPP`).

---

## 2. Backend

### Lectura (pública)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/ads` | slots globales + creative activo |
| GET | `/api/v1/tournaments/{id}/ads` | slots del torneo (con fallback a globales) + creative activo |

Resolución del creative a servir por slot:
1. Creative `is_active=1` dentro de vigencia (`starts_at`/`ends_at`) → se sirve.
2. Si no hay → creative `is_default=1` (banner WhatsApp).

### Gestión (admin)
| Método | Ruta |
|---|---|
| GET/POST | `/api/v1/ad-slots` |
| PUT/DELETE | `/api/v1/ad-slots/{id}` |
| POST | `/api/v1/ad-creatives` |
| PUT/DELETE | `/api/v1/ad-creatives/{id}` |

- Solo `users.is_admin` puede gestionar.
- Subida de media (imagen/video) a almacenamiento (carpeta pública del hosting); se guarda `media_url`.
- Al crear un slot, se genera automáticamente su creative por defecto (WhatsApp).

---

## 3. Creatives: imagen o video + CTA

`ad_creatives` (ver [`02-modelo-de-datos.md`](./02-modelo-de-datos.md) §6.2):
- `media_type`: `image` | `video`.
- `media_url`: recurso.
- `cta_url` (opcional): destino al hacer clic.
- `cta_label` (opcional): texto del botón.
- `is_default`: el banner "disponible".

Click del banner: el frontend abre `cta_url` (o WhatsApp del admin si es el default). Las **métricas de impresiones/clics** son **fase futura**.

---

## 4. Frontend

### Componentes (atómicos, en `components/shared/ads/`)
- `AdSlot.tsx`: dado un `placement`, renderiza el creative resuelto.
- `AdImage.tsx` / `AdVideo.tsx`: render por tipo de media.
- `AdDefaultBanner.tsx`: banner "espacio disponible" con CTA WhatsApp.

### Integración
- Los slots se insertan en el layout mobile-first: `header`, `sidebar` (desktop), `between_matches` (en listados de fixtures), `footer`, `match_live` (en partido en vivo).
- Carga diferida/`lazy` de videos para no afectar rendimiento móvil.
- Hook `useAds(tournamentId?)` con TanStack Query.

### Panel admin
- Vista admin dentro del torneo: lista de slots, editar creative (subir imagen/video, definir CTA), activar/desactivar.
- Sin `alert()`: feedback con toasts.

---

## Criterios de aceptación
1. Todo slot sin venta muestra el banner por defecto con CTA a WhatsApp del admin.
2. El admin edita un slot de un torneo subiendo imagen o video y un CTA opcional.
3. Al hacer clic en un banner con `cta_url`, se navega al destino; el default abre WhatsApp.
4. Los slots se renderizan en las posiciones definidas sin romper el layout mobile-first.
