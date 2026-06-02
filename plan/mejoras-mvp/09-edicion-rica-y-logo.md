# Fase 9 · Edición rica del torneo + Logo (Imagick)

> **Objetivo**: que el organizador edite toda la metadata del torneo (fechas, reglas, premios, puntos, suspensiones) y suba un logo comprimido a 398×398. Todo opcional, accesible desde la edición.
> Depende de: Fase 8 (ruta por id arreglada). Habilita: Fase 10 (reusa el pipeline de upload) y Fase 15 (usa `roster_limit` y `registration_info`).

---

## 1. Campos nuevos del torneo

El organizador podrá editar (nombre sí, **deporte no**):

- `logo` (upload + compresión, ver §3)
- `descripcion` (ya existe)
- `fecha inicio` (`starts_at` ya existe)
- **`fecha fin`** (`ends_at`) — NUEVO
- **`reglas`** (texto largo del campeonato) — NUEVO
- **`premios`** (1er, 2do, 3er puesto, otros) — NUEVO (JSON)
- `Puntos victoria` (defecto 3), `Puntos empate` (defecto 1), `puntos derrota` (defecto 0) — ya existen
- **`suspension_red_card`** (defecto no) — NUEVO
- **`suspension_double_yellow`** (defecto no) — NUEVO
- (preparar también `roster_limit` y `registration_info` para Fase 15)

## 2. Backend

### 2.1 Migración
- Continuar secuencia Phinx. `ALTER tournaments` añadiendo:
  - `ends_at` DATETIME nullable
  - `rules` TEXT nullable
  - `prizes` JSON/TEXT nullable (claves `first/second/third/others`)
  - `suspension_red_card` TINYINT(1) default 0
  - `suspension_double_yellow` TINYINT(1) default 0
  - `roster_limit` INT UNSIGNED nullable (NULL = sin límite)
  - `registration_info` TEXT nullable

### 2.2 Actions / entidad
- `UpdateTournamentAction.php`: aceptar y validar los nuevos campos.
- `Domain/Tournament/Tournament.php` + `PdoTournamentRepository`: mapear columnas nuevas.

### 2.3 Upload de imágenes con compresión

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/tournaments/{id}/logo` | (auth, dueño) Sube imagen, comprime a **398×398**, guarda y devuelve URL. |

- Servicio reutilizable `ImageUploadService` (Imagick): validar mime, recortar/redimensionar a 398×398, comprimir, escribir en `api/public/uploads/tournaments/`.
- **Imagick no está instalado hoy** → confirmar disponibilidad en Hostinger; incluir **fallback a GD** si Imagick no está.
- Reusar patrón de `UploadCreativeMediaAction.php` (validación mime/tamaño) pero añadiendo el resize.

### Entregables backend
- [ ] Migración con `ends_at`, `rules`, `prizes`, suspensiones, `roster_limit`, `registration_info`.
- [ ] `UpdateTournamentAction` soporta los nuevos campos.
- [ ] `POST /tournaments/{id}/logo` comprime a 398×398 (Imagick, fallback GD).

---

## 3. Frontend

- `TournamentEditPage.tsx`: secciones claras — **Datos**, **Reglas y premios**, **Puntuación**, **Disciplina (suspensiones)**, **Inscripciones**.
- Componente **uploader de logo** (reemplaza el input de URL actual): preview, sube vía FormData, muestra el 398×398 resultante.
- Premios: 4 campos (1°, 2°, 3°, otros). Suspensiones: 2 switches.
- Reutilizar el manejo de `FormData` del apiClient (ya soporta `body instanceof FormData`, ver Fase 6).
- Archivos: `frontend/src/pages/TournamentEditPage.tsx`, nuevo `components/LogoUploader.tsx`, `features/tournaments/{schemas,mappers,types}.ts`.

### Entregables frontend
- [ ] Uploader de logo con preview y compresión confirmada.
- [ ] Formulario de edición con fecha fin, reglas, premios, puntos y suspensiones.

---

## Criterios de aceptación de la Fase 9
1. El organizador edita fecha fin, reglas, premios, puntos y suspensiones, y persisten.
2. Subir un logo produce una imagen de 398×398 servida por URL.
3. El deporte no es editable; el nombre sí.
4. Funciona con Imagick o, si no está, con GD (sin romper).
5. Sin `any`; validación estricta en React Hook Form.
