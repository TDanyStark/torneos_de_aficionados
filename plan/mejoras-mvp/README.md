# Mejoras del MVP — Plan por fases

> **Objetivo global**: que el organizador pueda **empezar un torneo con la mínima fricción** (elegir deporte + nombre y listo), y que toda la configuración avanzada quede disponible **después**, opcional, sin estorbar el arranque.
> Basado en [`../../Mejoras-del-MVP.md`](../../Mejoras-del-MVP.md). Continúa el plan del MVP (Fases 1–7, ya completas).

---

## Principio rector

1. **Lo necesario primero, lo personalizado después.** Crear torneo = solo deporte + nombre. Todo lo demás (logo, fechas, reglas, premios, puntos, suspensiones) se edita luego.
2. **Quitar fricción del frontend**: nada de editar números de posición, IDs de grupo crudos, ni autogeneraciones mágicas que confunden.
3. **Reusar lo que ya existe** (esquema de ads por torneo, bracket horizontal, cascadas de borrado en DB) antes de construir nuevo.

---

## Orden de fases (de lo más fácil/alto impacto a lo más estructural)

| Fase | Doc | Entrega | Tamaño |
|------|-----|---------|--------|
| 8 | [`08-onboarding-y-bugfix.md`](./08-onboarding-y-bugfix.md) | Arreglar el bug del 404, crear torneo solo con deporte+nombre, quitar edición de posiciones, checkbox "inscripciones cerradas" | S |
| 9 | [`09-edicion-rica-y-logo.md`](./09-edicion-rica-y-logo.md) | Editar fecha fin, reglas, premios, puntos, suspensiones; subir logo comprimido 398×398 (Imagick) | M |
| 10 | [`10-publicidad-por-torneo.md`](./10-publicidad-por-torneo.md) | Mover la publicidad a la vista del torneo (rol admin), quitar `/admin/ads` global | S–M |
| 11 | [`11-vista-por-fase.md`](./11-vista-por-fase.md) | Selector de fase activa, render por tipo (liga/grupos/eliminatoria), goleadores filtrables por fase, coloreo verde/rojo, borrar fase con confirmación | M |
| 12 | [`12-editor-de-grupos-y-eliminatoria.md`](./12-editor-de-grupos-y-eliminatoria.md) | Crear grupos tras los equipos (cantidad, auto-reparto, aleatorio, mover manual), eliminatoria por tamaño (4–128) | M–L |
| 13 | [`13-arbitros.md`](./13-arbitros.md) | Directorio de árbitros por torneo (solo nombre), asignar a partidos, asignación en bucle | M |
| 14 | [`14-fixtures-manuales.md`](./14-fixtures-manuales.md) | Quitar autogeneración; el organizador crea fechas y partidos manualmente (incluso repetidos / equipos tardíos) | L |
| 15 | [`15-formularios-de-inscripcion.md`](./15-formularios-de-inscripcion.md) | Constructor de formularios de equipo y jugador (campos personalizados), límite de inscritos, párrafo informativo | L |

---

## Grafo de dependencias

```
8 (bugfix + crear simple) ─┬─> 9 (editar + subir logo) ─┬─> 10 (ads por torneo)
                           │                            └─> 15 (form builder: usa columnas + upload)
                           └─> 11 (vista por fase) ─────────> 14 (fixtures manuales)
12 (editor de grupos)  — independiente (necesita equipos creados)
13 (árbitros)          — independiente
```

**Recomendación de entrega**: 8 → 9 → 10/11 (en paralelo) → 12/13 (en paralelo) → 14 → 15.

---

## Convenciones (heredadas del MVP)

- Tablas DB plural snake_case; PKs/FKs `INT UNSIGNED` (`integer` + `signed => false`).
- Endpoints plural kebab-case bajo `/api/v1`; JSON uniforme (`success`/`message`/`data`).
- Migraciones Phinx en secuencia continua (ver `api/database/migrations`).
- Frontend: React 19 + TS estricto (sin `any`), un componente por archivo, sin `alert()` (toasts).
- Backend: Slim 4 + Clean Architecture + PHP-DI; servicios transaccionales.
