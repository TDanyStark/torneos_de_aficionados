# 00 · Visión y Alcance

> Documento base. Define **qué** estamos construyendo, **para quién** y **hasta dónde** llega el MVP.
> Lee también: [`01-arquitectura.md`](./01-arquitectura.md) · [`02-modelo-de-datos.md`](./02-modelo-de-datos.md)

---

## 1. Resumen del producto

Plataforma web para que **organizadores de campeonatos amateur** creen y gestionen sus torneos de forma **gratuita e ilimitada**. El público puede seguir resultados, tablas y fixtures en tiempo casi real desde el celular.

- **Sin suscripciones**: el uso es 100% gratis e ilimitado para organizadores.
- **Modelo de negocio**: venta de **espacios publicitarios** (banners/videos) dentro de la app.
- **Mobile-first**: diseñado primero para celular, funcional en navegador de escritorio.
- **Multideporte por arquitectura modular**: el MVP entrega **fútbol** (5, 8, 11, micro). El sistema separa un **core genérico** (torneos, fases, equipos, fixtures, publicidad) de **módulos por deporte** (modelo de partido, eventos, marcador). Sumar un deporte (p. ej. un esport) implica **un módulo nuevo: tablas + código + UI**, no solo configuración. El core se reutiliza; el detalle del deporte se implementa. Ver [`01-arquitectura.md`](./01-arquitectura.md) §7.

Referentes de mercado: Copa Fácil y similares.

---

## 2. Modelo de negocio (publicidad)

- Cada torneo y vista pública incluye **slots de publicidad** en posiciones fijas (header, sidebar, entre partidos, pie).
- Por defecto, cada slot muestra un **banner "este espacio está disponible"** con CTA a WhatsApp del admin.
- El **admin** puede entrar a un torneo y **editar el banner** de cada slot.
- Un anuncio puede ser **imagen o video**, con **CTA opcional** (link de destino al hacer clic).
- La gestión avanzada de campañas (anunciantes, métricas de impresiones/clics, fechas) es **fase futura** (ver [`11-roadmap-y-futuro.md`](./11-roadmap-y-futuro.md)).

---

## 3. Personas y roles

> Regla central: **los roles son contextuales por torneo**, excepto `admin` que es global y único.
> Un mismo usuario puede ser delegado en un torneo y jugador en otro al mismo tiempo.

| Rol | Alcance | Qué puede hacer |
|---|---|---|
| **Admin** | Global (único) | Gestiona publicidad de cualquier torneo, modera, ve métricas globales. |
| **Organizador** | Por torneo | Crea y configura el torneo, equipos, fixtures, designa árbitros y aprueba inscripciones. |
| **Árbitro** | Por torneo / por partido | Vista móvil simple: inicia/termina períodos, registra goles y tarjetas en vivo. |
| **Delegado** | Por torneo | Inscribe su equipo y carga su plantilla de jugadores. |
| **Jugador** | Por torneo | (Fase posterior) sigue su equipo, favoritos, notificaciones. |
| **Visitante** | Anónimo | Ve el torneo: tablas, fixtures, resultados. Sin cuenta. |

Detalle del modelo de permisos en [`02-modelo-de-datos.md`](./02-modelo-de-datos.md) (tabla `tournament_user_roles`).

---

## 4. Alcance del MVP

### Incluido
- Registro/login de usuarios con **JWT** (`LoginAction`, `MeAction`).
- Roles contextuales por torneo.
- CRUD de **torneos** con configuración de **formato y deporte**.
- **Motor de torneos configurable**: fases encadenables (liga / grupos / eliminación), grupos asimétricos, reglas de clasificación/eliminación por grupo, partidos a uno o ida y vuelta.
- **Equipos, jugadores e inscripciones** (carga manual + autoinscripción por link/código + aprobación).
- **Registro reutilizable de jugadores por organizador** (identidad = cédula): al reescribir la cédula en otro torneo del mismo organizador se recuperan nombre/datos. **Historial por organizador** (torneos, goles, tarjetas), aislado entre organizadores.
- **Inscripción tardía** con re-generación de fixtures futuros.
- **Generador de fixtures** y **tabla de posiciones**.
- **Partido en vivo** (vista árbitro): cronómetro por períodos (configurable, default 2), goles y tarjetas.
- **Seguimiento público** por **polling (~60s)** + botón manual rate-limited.
- **Estadísticas básicas**: goleadores y disciplina (tarjetas).
- **Publicidad**: slots con banner por defecto (CTA WhatsApp), edición por admin, imagen o video.
- **Vistas públicas** mobile-first con estado en la URL (filtros, paginación, búsqueda).
- **Dark mode** con preferencia del sistema por defecto y persistencia.
- Solo **español**, una sola **zona horaria**.

### Excluido del MVP (fase futura)
- Notificaciones push / email y favoritos.
- **Cuenta propia del jugador** (que el jugador reclame y vea su historial cross-organizador). El historial *por organizador* sí está en el MVP.
- Esports y deportes no-fútbol (solo se deja el modelo preparado).
- i18n / multiidioma.
- Sistema avanzado de campañas publicitarias con métricas.
- Pagos / suscripciones (no aplica, el producto es gratis).

---

## 5. Restricciones técnicas

- **Hosting**: Hostinger compartido. Sin procesos persistentes (no WebSockets propios, no workers daemon). Rutas relativas, `.htaccess`, cron de Hostinger para tareas diferidas si hicieran falta.
- **Tiempo real**: resuelto con **polling**, no push.
- **Backend**: Slim 4 + Clean Architecture + PHP-DI + Phinx + MySQL.
- **Frontend**: React 19 + TypeScript estricto + Vite + TanStack Query + Zustand + React Hook Form + Shadcn UI + Tailwind.

---

## 6. Glosario de dominio

| Término | Definición |
|---|---|
| **Torneo** (`tournament`) | Competición creada por un organizador. Tiene un deporte y una o más fases. |
| **Deporte** (`sport`) | Configuración base (fútbol 11, fútbol 5, micro...). Define reglas por defecto. |
| **Fase** (`stage`) | Etapa del torneo. Tipo: `league` (liga), `groups` (grupos) o `knockout` (eliminación). Las fases se encadenan. |
| **Grupo** (`group`) | Subdivisión dentro de una fase de tipo grupos/liga. Puede tener distinta cantidad de equipos (asimétrico). |
| **Jornada / Fecha** (`round`) | Conjunto de partidos que se juegan en una vuelta del calendario. |
| **Partido** (`match`) | Enfrentamiento entre dos equipos. Tiene períodos y eventos. |
| **Jugador** (`player`) | Persona registrada en el **pool privado de un organizador**, identificada por su **cédula** (`document_id`). Reutilizable entre los torneos de ese organizador; su historial es por organizador. |
| **Roster** (`team_player`) | Vínculo de un jugador a un equipo de un torneo (dorsal, posición, capitán, delegado). |
| **Período** (`match_period`) | Tiempo de juego dentro de un partido (1.º, 2.º...). Configurable (default 2). |
| **Evento** (`match_event`) | Acción registrada en vivo: gol, tarjeta, inicio/fin de período. |
| **Inscripción** (`registration`) | Vínculo de un equipo a un torneo (puede ser tardía). |
| **Regla de avance** (`advancement_rule`) | Cuántos/cuáles equipos de un grupo clasifican o se eliminan hacia la siguiente fase. |
| **Slot publicitario** (`ad_slot`) | Posición fija en la UI donde se muestra un banner/video. |

---

## 7. Mapa de fases de desarrollo

| Fase | Documento | Entrega |
|---|---|---|
| Base | [`01-arquitectura.md`](./01-arquitectura.md) | Arquitectura y convenciones |
| Base | [`02-modelo-de-datos.md`](./02-modelo-de-datos.md) | Esquema completo de DB |
| Base | [`03-api-contrato.md`](./03-api-contrato.md) | Contrato y convenciones de la API |
| 1 | [`04-fase-1-fundaciones.md`](./04-fase-1-fundaciones.md) | Setup backend+frontend, JWT, health |
| 2 | [`05-fase-2-identidad-y-torneos.md`](./05-fase-2-identidad-y-torneos.md) | Usuarios, roles, torneos |
| 3 | [`06-fase-3-equipos-e-inscripciones.md`](./06-fase-3-equipos-e-inscripciones.md) | Equipos, jugadores, inscripciones |
| 4 | [`07-fase-4-motor-de-fixtures.md`](./07-fase-4-motor-de-fixtures.md) | Fixtures, tablas, re-generación |
| 5 | [`08-fase-5-partidos-en-vivo.md`](./08-fase-5-partidos-en-vivo.md) | Vista árbitro, eventos, polling |
| 6 | [`09-fase-6-publicidad.md`](./09-fase-6-publicidad.md) | Slots y banners |
| 7 | [`10-fase-7-vistas-publicas.md`](./10-fase-7-vistas-publicas.md) | Páginas públicas |
| Futuro | [`11-roadmap-y-futuro.md`](./11-roadmap-y-futuro.md) | Backlog post-MVP |
