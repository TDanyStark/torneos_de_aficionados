# Guía de Pruebas (QA) por Roles — Torneos de Aficionados

> Qué probar como usuario y qué revisar/ajustar, **ordenado por rol** en el **orden correcto de uso** del producto.
> El flujo real del producto sigue esta cadena: **Admin → Organizador → Delegado → Árbitro → Visitante (público)**.
> Cada quien depende de que el anterior haya dejado algo listo (sin torneo no hay inscripción; sin inscripción aprobada no hay fixture; sin fixture no hay partido en vivo; sin partido no hay vista pública con datos).

---

## 0. Preparación del entorno (antes de empezar)

**Backend (carpeta `api/`)** — requiere MySQL:
```bash
# en api/
cp .env.example .env        # editar: DB y un JWT_SECRET cualquiera
composer install
composer db:migrate          # crea todas las tablas
composer db:seed             # crea sports + usuarios semilla
composer start               # API en http://localhost:8080
```
> Atajo para resetear todo: `composer db:fresh` (rollback + migrate + seed).

**Frontend (carpeta `frontend/`)**:
```bash
# en frontend/
npm install
npm run dev                  # app en http://localhost:5173
```

**Datos semilla que ya existen** (no hay que crearlos):
- **Admin:** `admin@torneos.test` / `admin1234`
- **Organizador de prueba:** `organizador@torneos.test` / `organizador1234`
- **Deportes:** Fútbol 11, Fútbol 8, Fútbol 5, Microfútbol (necesarios para crear torneos).
- **No hay torneo de ejemplo** → lo creas tú en el flujo del Organizador.

**Cómo cambiar de rol al probar:** cierra sesión (menú del header) y entra con otro usuario, o usa una ventana de incógnito por rol. El token se guarda en `localStorage` (`torneos-auth`).

---

## ⚠️ Avisos importantes antes de probar (2 huecos de navegación conocidos)

Estos NO son fallas de lógica (el backend funciona), son **botones/enlaces que faltan en la UI**. Tenlos presentes para no frustrarte y márcalos como ajustes:

1. **No hay botón para "asignar árbitro a un partido".** El backend lo soporta (`PUT /matches/{id}` con `referee_user_id`), pero ningún componente lo usa. → Por ahora, **el Organizador puede dirigir cualquier partido** (tiene permiso), así que el flujo de partido en vivo se prueba con el Organizador. Asignar un árbitro específico **no es alcanzable desde la interfaz**.
2. **La página de gestión de plantilla (`TeamManagePage`) no tiene enlace.** Existe en `/tournaments/{id}/teams/{teamId}/manage` pero **ningún botón lleva ahí**. Después de aprobar una inscripción, el Organizador **no tiene un camino visible** para agregar/editar jugadores del roster (toca escribir la URL a mano).
3. **No hay "agregar equipo manual".** Los equipos entran **solo** por autoinscripción + aprobación. No existe un botón de "crear equipo" en la UI.

> Estos 3 puntos están en la sección final **"Ajustes sugeridos"** con prioridad.

---

# 1) ROL: ADMIN (global)

**Cómo se obtiene:** solo viene sembrado (`is_admin=1`). No hay UI para volver admin a alguien.
**Para qué sirve en el orden de uso:** prepara la **publicidad** (modelo de negocio) que luego se verá en las vistas públicas. Idealmente es lo primero, para que cuando el visitante navegue ya haya slots configurados.

### Pasos a probar
1. Login con `admin@torneos.test` / `admin1234`.
2. En el header debe aparecer el enlace **"Publicidad"** (solo lo ve el admin).
3. Entra a **`/admin/ads`**.
4. Click **"Nuevo slot"** → crea un slot **global** (sin torneo), placement `header`.
   - Verifica que al crearse aparece automáticamente un **creative por defecto** (banner "Este espacio está disponible") con botón a **WhatsApp**.
5. Sube un **creative vendido**: usa el campo de subir media (imagen o video), define un **CTA** opcional, guárdalo y actívalo.
6. Crea también un slot `between_matches` y uno `match_live` (para verlos luego en fixtures y en el partido en vivo).

### Qué revisar / posibles ajustes
- [ ] El enlace "Publicidad" del header **solo** se ve siendo admin (entrar como no-admin a `/admin/ads` debe redirigir a `/`).
- [ ] El slot recién creado trae su **banner por defecto** automáticamente.
- [ ] La **subida** acepta imagen (jpeg/png/webp/gif ≤5MB) y video (mp4/webm ≤20MB); rechaza otros tipos con mensaje claro (toast, sin `alert()`).
- [ ] Al subir y **vender** un creative, el banner por defecto deja de mostrarse y aparece el vendido.
- [ ] **No** debe permitir borrar el creative por defecto (debe dar error claro).
- [ ] Las imágenes/videos cargan bien (en dev se sirven vía proxy `/uploads`).
- [ ] Feedback siempre con **toasts**, nunca `alert()`.

---

# 2) ROL: ORGANIZADOR

**Cómo se obtiene:** **automáticamente** al crear un torneo (cualquier usuario registrado puede crear uno → queda como organizer de ese torneo).
**Para qué sirve:** es el rol "motor". Crea el torneo, su formato, abre inscripciones, aprueba equipos, genera fixtures y (por el hueco #1) también dirige los partidos.

### 2.1 Registro / acceso
1. Cierra sesión del admin. **Regístrate** como usuario nuevo en `/register` (nombre, email, password ≥8) — o entra con `organizador@torneos.test` / `organizador1234`.
2. Al registrarte, debe dejarte logueado y llevarte directo a **crear torneo**.

### 2.2 Crear torneo (asistente)
3. Ve a **`/tournaments/new`** (o botón "Crear torneo" en `/dashboard`).
4. **Paso 1 (obligatorio):** selecciona un **Deporte** (de los sembrados) + nombre del torneo. (Sin deporte no avanza.)
5. **Paso 2 (config):** activa el toggle **"inscripción abierta" (registration_open)**, define períodos/puntos, etc.
6. **Pasos 3–5:** define **fases (stages)**, **grupos** y **reglas de avance**. (Esto es necesario para poder generar fixtures después.)
7. Finaliza → vuelves al **`/dashboard`**, donde aparece la tarjeta de tu torneo.

### 2.3 Abrir inscripción y compartir enlace
8. En la tarjeta del torneo en el dashboard, usa **"Copiar enlace"** de autoinscripción.
   - El enlace tiene forma `/inscripcion/{id}/{código}` y **solo funciona si la inscripción está abierta** (si no, da toast de error).
9. Guarda ese enlace: es el que usará el **Delegado** en el siguiente rol.

### 2.4 (Más adelante) Aprobar inscripciones, generar fixtures, dirigir
> Estos pasos se hacen **después** de que el Delegado se inscriba (ver rol 3). Se listan aquí para tener la foto completa del organizador.
10. **Aprobar equipos:** `/tournaments/{id}/registrations` → botón **Aprobar** (o Rechazar) en cada tarjeta.
11. **(Ajuste/hueco #2)** Agregar jugadores al roster del equipo aprobado: **no hay botón**; entra manualmente a `/tournaments/{id}/teams/{teamId}/manage`.
12. **Generar fixtures:** `/tournaments/{id}/fixtures` → botón **Generar** por cada fase. Reusa **Regenerar** para inscripciones tardías.
13. **(Roles opcional)** `/tournaments/{id}/roles`: asignar **árbitro** o **delegado** por **email** (el usuario debe existir ya). Nota: el rol "player" no se asigna aquí.
14. **Dirigir partido:** en la pestaña **Fixtures**, los partidos muestran botón **"Dirigir"** (visible para organizadores y árbitros) → lleva a `/arbitro/partido/{id}`. (Ver rol 4.)

### Qué revisar / posibles ajustes
- [ ] El asistente **bloquea** el avance si no eliges deporte.
- [ ] El toggle de **inscripción abierta** realmente habilita el enlace de autoinscripción.
- [ ] "Copiar enlace" copia un enlace **completo** (`/inscripcion/{id}/{código}`).
- [ ] Tras **aprobar** una inscripción, el equipo aparece como aprobado y entra a la tabla/fixtures.
- [ ] **AJUSTE (hueco #2):** falta enlace visible a "Gestionar equipo/roster" tras aprobar. Verifica que `/tournaments/{id}/teams/{teamId}/manage` funcione escribiéndola a mano y **anótalo como pendiente de UI**.
- [ ] **Generar fixtures** crea jornadas/partidos coherentes con las fases/grupos definidos.
- [ ] **Regenerar** tras una inscripción tardía **no** rompe resultados ya jugados.
- [ ] Asignar **árbitro por email** funciona, pero **no hay forma en UI de ligarlo a un partido concreto** (hueco #1) → por ahora dirige el organizador.
- [ ] **AJUSTE (hueco #3):** no hay "agregar equipo manual"; confirma si es aceptable que todo entre por autoinscripción.

---

# 3) ROL: DELEGADO (de equipo) — vía autoinscripción

**Cómo se obtiene:** al autoinscribir un equipo con el enlace del organizador queda como delegado del equipo (`tournament_teams.delegate_user_id`). También un organizador puede asignar el rol `delegate` por email en la página de Roles.
**Para qué sirve:** representa a un equipo: lo inscribe y (en principio) gestiona su plantilla.

### Pasos a probar
1. Cierra sesión del organizador. Abre el **enlace de autoinscripción** que copió el organizador: `/inscripcion/{id}/{código}`.
2. Te pedirá **iniciar sesión o registrarte** (regístrate como un usuario nuevo "delegado"). Debe **volver automáticamente** a la página de inscripción tras autenticarte.
3. Completa el **formulario de equipo**: nombre del equipo, datos; opcionalmente **agregarte como jugador**.
4. Envía → debe mostrar **"Inscripción enviada"**.
5. (El organizador la aprueba en su inbox — paso 2.4.10.)

### Qué revisar / posibles ajustes
- [ ] El enlace **completo** abre el formulario; el enlace **incompleto** (`/inscripcion/{código}` sin id) muestra un aviso de error claro (comportamiento esperado).
- [ ] Tras login/registro desde el enlace, **regresa solo** al formulario (no te deja perdido).
- [ ] El equipo enviado aparece luego en el **inbox del organizador** como "pendiente".
- [ ] **AJUSTE (hueco #2):** una vez aprobado, ¿el delegado tiene cómo administrar su plantilla? Hoy **no hay enlace** a esa pantalla; revisa si es un bloqueante para tu operación.
- [ ] Validaciones del formulario claras (campos requeridos, dorsales, etc.).

---

# 4) ROL: ÁRBITRO (o el Organizador haciendo de árbitro)

**Cómo se obtiene:** el organizador asigna el rol `referee` por email en `/tournaments/{id}/roles`. **Limitación (hueco #1):** no hay UI para ligarlo a un partido específico → en la práctica **prueba este flujo logueado como Organizador**, que puede dirigir cualquier partido de su torneo.
**Para qué sirve:** controla el partido en vivo desde el móvil.

### Pasos a probar (mobile-first: pruébalo en ventana angosta o celular)
1. Logueado como **Organizador** (o árbitro asignado), ve a la pestaña **Fixtures** del torneo y pulsa **"Dirigir"** en un partido programado → `/arbitro/partido/{id}`.
2. **Iniciar período** → el partido pasa a estado **"en vivo"**; arranca el cronómetro del período.
3. Registrar eventos con botones grandes: **Gol** (elige equipo + jugador + minuto), **Autogol**, **Amarilla**, **Roja**.
4. **Deshacer** un evento mal cargado (borrar último gol/tarjeta).
5. **Finalizar período** → estado "descanso (paused)"; **Iniciar** el siguiente período (según `periods_count`).
6. **Finalizar partido** → consolida marcador (`home_score`/`away_score`) y ganador; estado "finalizado".

### Qué revisar / posibles ajustes
- [ ] Botones grandes y usables en **móvil**.
- [ ] El **marcador en vivo** se deriva de los goles (autogol suma al rival).
- [ ] **No** deja registrar eventos **sin período activo** (mensaje claro).
- [ ] **No** deja registrar un jugador que **no pertenece** al equipo.
- [ ] No deja iniciar **más períodos** que `periods_count`.
- [ ] No deja borrar marcadores de inicio/fin de período (solo goles/tarjetas).
- [ ] Al **finalizar**, el resultado alimenta la **Tabla** (standings) y los **Goleadores**.
- [ ] **AJUSTE (hueco #1):** un usuario con rol "árbitro" puro (sin ser organizador) **no tiene cómo** llegar a dirigir un partido concreto desde la UI → anótalo.

---

# 5) ROL: VISITANTE / PÚBLICO (sin login)

**Cómo se obtiene:** por defecto, cualquiera sin cuenta.
**Para qué sirve:** es la experiencia final que cierra el MVP. Aquí se ve todo lo que produjeron los roles anteriores + la publicidad.

### Pasos a probar (idealmente desde el **celular** y en **incógnito** sin sesión)
1. Abre **`/`** (Home): hero de marca, **buscador**, torneos recientes, y los **slots de publicidad** globales (header/footer/sidebar en desktop).
2. Usa el buscador → debe llevarte a **`/torneos?q=...`** (listado con filtros por deporte/estado/búsqueda en la URL).
3. Entra a un torneo: **`/t/{slug}`** con pestañas **Resumen, Fixtures, Tabla, Equipos, Goleadores, Disciplina**.
4. Cambia de pestaña/jornada/grupo y **copia la URL** (`?tab=fixtures&group=A&round=3`) → ábrela en otra pestaña: debe **reproducir exactamente la misma vista**. Prueba **atrás/adelante** del navegador.
5. En **Fixtures**, verifica que aparece el slot **`between_matches`** intercalado.
6. Abre un **partido en vivo**: **`/partido/{id}`** → marcador, línea de tiempo, **botón actualizar** (con enfriamiento) y autorefresco mientras está en vivo; verifica el slot **`match_live`**.
7. Mira **Goleadores** y **Disciplina** (rankings paginados).
8. Abre **detalle de equipo**: `/t/{slug}/equipo/{teamId}` (plantilla).

### Qué revisar / posibles ajustes
- [ ] **Sin login** todo lo público funciona (criterio 1).
- [ ] **Compartir URL reproduce la vista** exacta: pestaña + grupo + jornada + búsqueda (criterio 2).
- [ ] Los **slots de publicidad** aparecen en **header, entre partidos, footer y partido en vivo** (criterio 3). Donde no haya venta, se muestra el **banner por defecto a WhatsApp**, y si no hay slot, **no rompe el layout** (no debe quedar hueco).
- [ ] **Dark mode** respeta el **sistema** y mantiene los **colores de marca**; cambia el tema del SO y verifica que la app reacciona (criterio 4).
- [ ] **Skeletons** mientras carga y **estados vacíos** claros cuando no hay datos (criterio 5).
- [ ] **Título del navegador (SEO)** cambia por torneo/partido/equipo.
- [ ] El **polling** solo ocurre en partido en vivo, no en vistas estáticas.
- [ ] Click en un banner con CTA navega al destino; el banner por defecto abre **WhatsApp**.

---

## Resumen del orden de prueba (cadena de dependencias)

```
ADMIN          → configura publicidad (slots + creatives)            [opcional pero recomendado primero]
   ↓
ORGANIZADOR    → crea torneo + formato + abre inscripción            [obligatorio: habilita todo]
   ↓ (comparte enlace)
DELEGADO       → autoinscribe su equipo                              [crea los equipos]
   ↓
ORGANIZADOR    → aprueba inscripciones + (roster) + genera fixtures  [crea los partidos]
   ↓
ÁRBITRO/ORG.   → dirige el partido en vivo (goles, tarjetas, fin)    [genera resultados/stats]
   ↓
VISITANTE      → navega Home/torneo/fixtures/tabla/partido/goleadores [experiencia final + publicidad]
```

---

## Ajustes sugeridos (consolidado, por prioridad)

| # | Prioridad | Ajuste | Dónde | Impacto |
|---|-----------|--------|-------|---------|
| 1 | **Alta** | Agregar UI para **asignar un árbitro a un partido** (consumir `PUT /matches/{id}` con `referee_user_id`). | Pestaña Fixtures / partido | Sin esto, el rol "árbitro" no puede dirigir un partido concreto; solo el organizador. |
| 2 | **Alta** | Agregar **enlace/botón a "Gestionar equipo / plantilla"** tras aprobar una inscripción. | `RegistrationsInbox` / detalle de equipo → `TeamManagePage` | Hoy `TeamManagePage` es inalcanzable salvo escribiendo la URL. |
| 3 | Media | Decidir si hace falta **"crear equipo manual"** (canal `manual`). | Pestaña Equipos / gestión | Hoy todo equipo entra solo por autoinscripción + aprobación. |
| 4 | Baja | Listener ya agregado para dark mode del SO; verificar en navegadores reales. | `themeStore` | Pulido. |
| 5 | Baja | **Code-splitting** del bundle (warning >500kB) y namespacing del `?page=` compartido entre Goleadores/Disciplina. | build / hub | Rendimiento/pulido. |
| 6 | Baja | No hay **torneo de ejemplo** sembrado: para demos rápidas, considerar un seeder de muestra. | `api/database/seeds` | Conveniencia de QA/demo. |

---

### Checklist rápido de "todo verde"
- [ ] Admin configura publicidad y se ve en lo público.
- [ ] Organizador crea torneo, abre inscripción, comparte enlace.
- [ ] Delegado autoinscribe equipo; organizador aprueba.
- [ ] Organizador genera fixtures.
- [ ] Se dirige un partido en vivo de principio a fin.
- [ ] Visitante navega todo sin login, comparte URLs, ve publicidad, dark mode y skeletons.
- [ ] Los 3 huecos de UI (árbitro→partido, gestión de roster, equipo manual) quedan anotados.
