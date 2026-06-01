# Fase 7 · Vistas Públicas (mobile-first)

> **Objetivo**: experiencia pública pulida y compartible para visitantes (sin login): página del torneo, tablas, fixtures, resultados y partido en vivo. Integra la publicidad.
> Depende de: Fases 2–6. Cierra el MVP.

---

## 1. Principios

- **Mobile-first**, funcional en escritorio.
- **Sin login** para visitantes.
- **Estado en la URL**: filtros, jornada, grupo, pestaña, búsqueda (`?tab=fixtures&group=A&round=3`). Navegable (atrás/adelante) y compartible.
- **Minimalista**: poco desorden, pocos clics.
- **Dark mode** (default del sistema) con colores de marca consistentes.
- **Skeletons** durante la carga (TanStack Query).
- **SEO básico**: títulos y metadatos por torneo (slug en URL).

---

## 2. Páginas públicas

| Ruta | Contenido |
|---|---|
| `/` | Home: torneos destacados/recientes, buscador. Slots de publicidad. |
| `/torneos` | Listado paginado con filtros (deporte, estado, búsqueda) en URL. |
| `/t/{slug}` | **Página del torneo** con pestañas: Resumen, Fixtures, Tabla, Equipos, Goleadores. |
| `/t/{slug}/equipo/{teamId}` | Detalle de equipo + plantilla. |
| `/partido/{id}` | Partido (en vivo o finalizado): marcador, línea de tiempo, botón actualizar. |
| `/inscripcion/{code}` | Autoinscripción de equipo (Fase 3). |

---

## 3. Página del torneo (tabs)

- **Resumen**: estado, deporte, formato, próximos partidos, slot publicitario `header`.
- **Fixtures**: por jornada/grupo (selector en URL), tarjetas de partido con marcador/estado. Slot `between_matches` intercalado.
- **Tabla**: posiciones por grupo (Fase 4) con desempates.
- **Equipos**: grilla paginada.
- **Goleadores / Disciplina**: rankings (Fase 5).

Cada cambio de pestaña/filtro actualiza `?tab=...` sin recargar.

---

## 4. Componentes compartidos (atómicos)

En `components/shared/`:
- `MatchCard.tsx`, `StandingsTable.tsx`, `RoundSelector.tsx`, `GroupTabs.tsx`, `TeamCard.tsx`, `ScorerRow.tsx`, `LiveBadge.tsx`, `EmptyState.tsx`, `LoadingSkeleton.tsx`.
- Slots de publicidad (`AdSlot`, Fase 6) embebidos en layout y listados.

Cada componente en su propio archivo (regla de atomicidad de [`01-arquitectura.md`](./01-arquitectura.md)).

---

## 5. Rendimiento móvil

- Listas paginadas (sin cargar todo).
- Imágenes/videos con carga diferida.
- Polling solo en partido en vivo (Fase 5), no en vistas estáticas.
- Cache de TanStack Query con `staleTime` razonable para datos públicos.

---

## Criterios de aceptación
1. Un visitante sin cuenta navega torneo, fixtures, tabla y partido en vivo desde el celular.
2. Compartir una URL reproduce exactamente la vista (pestaña, grupo, jornada).
3. Los slots de publicidad aparecen en header, entre partidos, footer y en el partido en vivo.
4. Dark mode respeta el sistema y mantiene la identidad de marca.
5. Las páginas muestran skeletons mientras cargan y estados vacíos claros cuando no hay datos.
