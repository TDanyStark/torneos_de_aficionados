# Fase 15 · Formularios de inscripción personalizables

> **Objetivo**: que el organizador defina los **formularios de equipo y jugador** (campos por defecto + personalizados), un **límite de inscritos por equipo** y un **párrafo informativo** para quien se registra. La fase más estructural; va al final.
> Depende de: Fase 9 (columnas `roster_limit`/`registration_info` y upload de imágenes). Habilita: inscripciones a medida.

---

## 1. Formulario del equipo

**Campos por defecto**: Escudo, Nombre del equipo, **Entrenador** (NUEVO).
**Personalizables**: el organizador puede **agregar campos** indicando:
- si es **obligatorio** o no,
- el **tipo**: número, texto o párrafo.

## 2. Formulario del jugador

**Campos por defecto**:
- foto (no obligatoria)
- Nombre del jugador (obligatorio)
- **Alias** (NUEVO)
- N° camiseta (obligatorio)
- ID / documento (obligatorio)
- fecha de nacimiento
- teléfono

**Personalizables**: agregar campos (mismos tipos: número/texto/párrafo, obligatorio o no).

## 3. Límite de inscritos por equipo

- Configurable: 5, 10, 20… o **sin límite**. Rango de **5 a 100** o sin límite.
- Usa `tournaments.roster_limit` (creado en Fase 9; NULL = sin límite).
- Enforcement en `RegisterTeamService` / al añadir jugadores al roster.

## 4. Párrafo informativo

- Texto que verán quienes se registran. Usa `tournaments.registration_info` (Fase 9).
- Se muestra en `SelfRegistrationPage`.

---

## 5. Backend

### 5.1 Migración (form builder)
- `registration_form_fields`: `id`, `tournament_id` FK, `scope` ENUM(`team`,`player`), `label`, `type` ENUM(`number`,`text`,`paragraph`), `required` TINYINT(1), `position`, timestamps.
- Valores: `registration_field_values` (`field_id` FK, `tournament_team_id` o `player_id`, `value` TEXT) **o** columnas JSON en `tournament_teams`/`players`.
- Añadir `entrenador` (equipo) y `alias` (jugador) como columnas o como campos por defecto sembrados.

### 5.2 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/tournaments/{id}/form-fields?scope=team\|player` | Definición del formulario. |
| POST | `/api/v1/tournaments/{id}/form-fields` | Crear campo personalizado. |
| PUT/DELETE | `/api/v1/form-fields/{id}` | Editar / eliminar. |

- `RegisterTeamService`: validar campos requeridos + tipos, guardar valores, **respetar `roster_limit`**.
- Archivos: nuevo `api/src/Application/Actions/RegistrationForm/*`, `Domain/RegistrationForm/*`; ajustar `RegisterTeamService.php`, `Actions/Registration/*`.

### Entregables backend
- [ ] Tablas de definición + valores de campos.
- [ ] CRUD de campos personalizados (equipo y jugador).
- [ ] Validación de obligatorios/tipos y `roster_limit` en el registro.

---

## 6. Frontend

- **Form builder** para el organizador: agregar/editar/quitar campos (label, tipo, obligatorio) por scope (equipo/jugador), configurar límite de inscritos y el párrafo informativo.
- **Render dinámico** del formulario en `SelfRegistrationPage` según la definición, con el párrafo informativo arriba y el uploader de foto/escudo (Fase 9).
- Archivos: nuevo `frontend/src/features/teams/components/RegistrationFormBuilder.tsx`, `DynamicRegistrationForm.tsx`; `pages/SelfRegistrationPage.tsx`.

### Entregables frontend
- [ ] Constructor de formularios (equipo y jugador) con tipos y obligatoriedad.
- [ ] Config de límite de inscritos (5–100 o sin límite) y párrafo informativo.
- [ ] Render dinámico del formulario en la inscripción pública.

---

## Criterios de aceptación de la Fase 15
1. El organizador agrega campos personalizados (número/texto/párrafo, obligatorio o no) a equipo y jugador.
2. Los campos por defecto incluyen Entrenador (equipo) y Alias (jugador).
3. Se respeta el límite de inscritos por equipo (5–100 o sin límite).
4. El párrafo informativo se muestra a quien se registra.
5. El formulario público se renderiza dinámicamente según la definición y valida obligatorios/tipos.
