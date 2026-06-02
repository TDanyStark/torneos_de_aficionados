# Fase 14 · Fixtures manuales (quitar autogeneración)

> **Objetivo**: quitar la autogeneración de equipos/partidos tras la inscripción. El organizador crea **manualmente** las fechas y los partidos (incluso partidos repetidos y para equipos que entren después).
> Depende de: Fases 8 y 11. Habilita: control total del calendario.

---

## 1. Concepto

- **Quitar** la lógica de autogeneración de equipos/partidos después de la inscripción: ese proceso debe ser **manual**.
- El organizador puede:
  - crear **nuevas fechas** (rounds) cuando quiera,
  - crear **partidos en cualquier fecha**, incluso **repetidos**,
  - manejar casos de **equipos que entran después**.
- La autogeneración (`GenerateFixtureService`) pasa a ser **opcional/secundaria**, no el camino por defecto.

## 2. Backend

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/stages/{id}/rounds` | Crear una fecha (round) manual. |
| PUT/DELETE | `/api/v1/rounds/{id}` | Editar / eliminar fecha. |
| POST | `/api/v1/rounds/{id}/matches` | Crear un partido manual (local vs visitante; permitir repetidos). |
| PUT/DELETE | `/api/v1/matches/{id}` | Editar / eliminar partido (existe `UpdateMatchAction`). |

- Servicios transaccionales `CreateRoundService`, `CreateMatchService`.
- Desacoplar el flujo registración → fixtures: **no** disparar generación automática.
- Archivos: `api/src/Application/Actions/Fixture/*`, `Service/{Generate,Regenerate}FixtureService.php` (volver opcional), `Domain/Fixture/*`, migraciones de `rounds`/`matches` (sin cambios de esquema esperados).

### Entregables backend
- [ ] Endpoints de crear/editar/borrar fecha.
- [ ] Endpoints de crear/editar/borrar partido (repetidos permitidos).
- [ ] Autogeneración ya no se dispara sola.

---

## 3. Frontend

- En la fase, panel para **añadir fechas** y, dentro de cada fecha, **añadir partidos** libremente (selector local/visitante).
- Dejar la generación automática como botón opcional ("generar calendario") si el organizador la quiere.
- Archivos: `frontend/src/pages/StageFixturesPage.tsx`, `features/fixtures/components/FixturesPanel.tsx`, nuevos diálogos de crear fecha/partido.

### Entregables frontend
- [ ] UI para crear fechas y partidos manualmente.
- [ ] Soporta partidos repetidos y equipos tardíos.
- [ ] Generación automática como opción, no por defecto.

---

## Criterios de aceptación de la Fase 14
1. El organizador crea fechas y partidos manualmente sin autogeneración.
2. Puede crear partidos repetidos y agregar partidos para equipos que entraron después.
3. La autogeneración no se ejecuta automáticamente tras la inscripción.
4. Editar/borrar fechas y partidos funciona y respeta cascadas.
