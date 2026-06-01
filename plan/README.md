# Plan de Desarrollo · Plataforma de Torneos de Aficionados

Documentación de fases del proyecto. Lee en orden: primero los **documentos base** (00–03), luego las **fases** (04–10) y el **roadmap** (11).

## Resumen del producto
Plataforma web **gratuita e ilimitada** para que organizadores creen y gestionen campeonatos amateur. **Mobile-first**, monetizada con **publicidad**. MVP en **fútbol** (5, 8, 11, micro). Arquitectura **modular por deporte**: un **core genérico** reutilizable + **módulos de deporte** (cada deporte nuevo = tablas + código + UI propios, no solo configuración).

- **Backend**: Slim 4 + Clean Architecture + PHP-DI + Phinx + MySQL (`/api`).
- **Frontend**: React 19 + TypeScript + Vite + TanStack Query + Zustand + RHF + Shadcn + Tailwind (`/frontend`).
- **Despliegue**: Hostinger compartido (sin procesos persistentes; tiempo real por polling).

## Índice

### Documentos base
| Doc | Contenido |
|---|---|
| [00 · Visión y Alcance](./00-vision-y-alcance.md) | Producto, negocio, roles, alcance MVP, glosario. |
| [01 · Arquitectura](./01-arquitectura.md) | Estructura backend/frontend, convenciones, despliegue. |
| [02 · Modelo de Datos](./02-modelo-de-datos.md) | Esquema completo MySQL (19 tablas del MVP). |
| [03 · Contrato de API](./03-api-contrato.md) | Convenciones, respuestas, errores, endpoints. |

### Fases de implementación
| Fase | Doc | Entrega |
|---|---|---|
| 1 | [Fundaciones](./04-fase-1-fundaciones.md) | Setup, Phinx, health, JWT, frontend base. |
| 2 | [Identidad y Torneos](./05-fase-2-identidad-y-torneos.md) | Usuarios, roles por torneo, CRUD torneos + formato. |
| 3 | [Equipos e Inscripciones](./06-fase-3-equipos-e-inscripciones.md) | Equipos, plantillas, inscripción mixta + tardía. |
| 4 | [Motor de Fixtures](./07-fase-4-motor-de-fixtures.md) | Generación, tablas, avance, re-generación. |
| 5 | [Partidos en Vivo](./08-fase-5-partidos-en-vivo.md) | Vista árbitro, eventos, polling, estadísticas. |
| 6 | [Publicidad](./09-fase-6-publicidad.md) | Slots, banners/video, CTA, gestión admin. |
| 7 | [Vistas Públicas](./10-fase-7-vistas-publicas.md) | Páginas públicas mobile-first. |

### Futuro
| Doc | Contenido |
|---|---|
| [11 · Roadmap](./11-roadmap-y-futuro.md) | Backlog post-MVP (notificaciones, esports, métricas...). |

## Decisiones clave del producto
1. **Motor de torneos 100% configurable**: fases encadenables, grupos asimétricos, reglas de avance/eliminación por grupo, ida/vuelta, períodos configurables (default 2).
2. **Roles contextuales por torneo** (`admin` global; resto por torneo). Un usuario puede tener roles distintos en torneos distintos.
3. **Inscripción mixta** (manual + autoinscripción por link) con **inscripción tardía** que regenera fixtures.
4. **Tiempo real por polling** (~60s) + botón manual rate-limited (apto para hosting compartido).
5. **Publicidad** con slots por defecto (CTA WhatsApp), editables por admin, imagen o video.
6. **Multideporte modular**: core genérico + módulos de deporte (cada deporte = tablas + código + UI propios). Fútbol en el MVP.

## Convenciones rápidas
- DB: tablas plurales `snake_case`; PHP `PascalCase`/`camelCase`; React `PascalCase`, hooks `useX`; endpoints plural `kebab-case` bajo `/api/v1`.
- Respuestas JSON uniformes; errores `{ success:false, message, errors }` sin stack traces.
- Listados paginados; con `updated_at` → orden `DESC`.
- TypeScript estricto, sin `any`; un componente por archivo.
