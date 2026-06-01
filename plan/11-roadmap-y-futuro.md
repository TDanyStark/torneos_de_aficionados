# 11 · Roadmap y Funcionalidades Futuras (post-MVP)

> Backlog de lo que **NO** entra en el MVP pero el modelo ya deja preparado.

---

## 1. Notificaciones y favoritos
- Marcar torneos/equipos como **favoritos** (jugadores/visitantes con cuenta).
- Notificaciones: "tu equipo marcó", "inicia tu partido", cambios de programación.
- Canales: web push, email. En Hostinger compartido, vía servicio externo (ej. proveedor de push/email) — no daemons.
- Tablas nuevas: `favorites`, `notifications`.

## 2. Perfil de jugador con cuenta propia (cross-organizador)
> El **historial por organizador** ya está en el **MVP** (Fase 3: `players` reutilizable por cédula, pool privado del organizador). Lo que queda como futuro es la capa de **cuenta del propio jugador**:
- Que el jugador (con su `users` account) reclame/vincule sus registros `players` (vía cédula) y vea **su** trayectoria él mismo.
- Vista cross-organizador **consentida**: el jugador ve su historial agregado entre organizadores, respetando que cada organizador no ve el pool del otro.
- Notificaciones y favoritos para el jugador (ver §1).

## 3. Suspensiones automáticas por disciplina
- Reglas configurables: X amarillas acumuladas = N fechas; roja = N fechas.
- Cálculo sobre `match_events`; bloqueo del jugador en `team_players.status='suspended'` para el próximo partido.

## 4. Esports y otros deportes (módulos)
> No es "una fila de configuración". Cada deporte nuevo es un **módulo** con código y esquema propios. El core (torneos, fases, equipos, fixtures, publicidad) se reutiliza tal cual.

**Costo real de agregar un deporte** (ver contrato en [`01-arquitectura.md`](./01-arquitectura.md) §7):
1. **Registro**: fila en `sports` con su `module_key`.
2. **Backend — implementar `SportModule`**: `recordEvent`, `finalizeMatch` (escribe `home_score`/`away_score`/`winner_team_id` en `matches`), `standingsStrategy`, `statsProviders`. Cablearlo en `SportModuleRegistry`.
3. **Migraciones del módulo**: sus propias tablas de detalle de partido (p. ej. `lol_games`, `lol_game_stats`). No reutiliza `match_periods`/`match_events` de fútbol.
4. **Rutas propias** del detalle bajo `/api/v1/sports/<deporte>/...`.
5. **Frontend — módulo**: vista del juez, marcador y stats en `features/sports/<deporte>/`, registrado en `features/sports/registry.ts`. Fallback si el cliente no soporta el deporte.

**Diferencias típicas a resolver por módulo**:
- Marcador por sets/mapas/rondas en vez de goles.
- Sin empates (siempre hay `winner_team_id`).
- Eventos propios (no goles/tarjetas).
- Tabla de posiciones con criterios distintos (o bracket puro sin tabla).
- Sin "árbitro con cronómetro": reporte de resultado por el juez/admin.

**Ejemplos de módulos candidatos**: `football` (MVP), `futsal`/`micro` (variantes del módulo football), `lol`, `valorant`, `basketball`, `volleyball`.

> El valor de la arquitectura no es "cero código", es **aislamiento**: agregar un deporte no obliga a tocar el core ni los demás módulos.

## 5. Internacionalización (i18n)
- Extraer textos a recursos de traducción.
- Multiidioma (español + inglés) y multi-zona horaria por torneo.

## 6. Publicidad avanzada (campañas)
- Anunciantes, campañas con fechas, segmentación por torneo/deporte.
- **Métricas**: impresiones y clics (`ad_impressions`, `ad_clicks`).
- Reportes para el admin; posible autogestión de anunciantes.

## 7. Tiempo real mejorado
- Si se migra a hosting con soporte de procesos: SSE/WebSockets o integración con Pusher/Ably para push instantáneo, sustituyendo el polling.

## 8. Operación y calidad
- Exportar fixtures/tablas a PDF/imagen para compartir.
- Auditoría de cambios (log de acciones del organizador/árbitro).
- Multi-cancha y programación con conflictos de horario.
- App instalable (PWA) con caché offline de vistas públicas.

---

## Orden sugerido post-MVP
1. Suspensiones automáticas (alto valor, bajo costo, usa datos existentes).
2. Favoritos + notificaciones básicas.
3. Publicidad con métricas (mejora el modelo de negocio).
4. Cuenta propia del jugador (historial cross-organizador consentido).
5. Esports y multideporte real.
6. i18n y PWA.
