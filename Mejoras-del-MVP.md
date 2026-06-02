# Admin:
- la publicidad debe estar relacionada a un torneo (no debe haber publicidad general, pues la unica publicidad general es invitar a que los organizadores se inscriban), entonces en el selector de publicidad debe hacerse desde la vista de un torneo con el rol de admin, no con /admin/ads, esto para que sea mas facil:
* quiero poder entrar a un torneo, y que aparezcan los slots y que me deje editarlos


# Organizador:
- Crear un torneo: solo debe pedir, Nombre, deporte:
luego debe dejarme editar nombre, deporte no
debe dejarme editar:
* logo (uploads, dejarme subir una imagen y comprimirla en 398 x 398 con imagick)
* descripcion
* fecha inicio
* fecha fin
* reglas de campeonato
* premios (1er puesto, 2do puesto, 3er puesto, otros)
* Puntos victoria (defecto 3)
* Puntos empate (defecto 1)
* puntos derrota (defecto 0)
* Suspencion por tarjeta roja (defecto no)
* suspencion doble tarjeta amarilla seguida (defecto no)

aunque cuando le de a nuevo torneo, debe pedirme de primero que tipo de torneo es, y luego ahi si el titulo y ya

- Los arbitros deben registrarse dentro de la vista del organizador por torneo, tambien debe ser una base de datos del organizador, solo el nombre, y pueden haber varios por torneo, y se deben poder asignar a los partidos, debo poder asignarlos en bucle por si siempre son los mismo o el mismo

- en las fases las posiciones de la fase no deben ser editables, quita del frontend lo de cambiar el numero
- Igual en los grupos tampoco debo poder cambiar el numero debe quedar el orden de creacion, pero quita eso de pos 1, pos 2, enreda

los grupos deben de crearse despues de crear los equipos, donde debe pedirme la cantidad de grupos, ejemplo 1, 2, 3 etc, y el sistema dividir los equipos en la cantidad de grupos, puede que todos queden igual o uno quede con mas, tambien debe haber un boton para distribuir de manera aleatoria, y tambien dejarme editar los grupos, seleccionar equipos de un lado para otro, puedo tener un grupo de 2 equipos otros 10, es decir no debe tener regla genral que sean iguales, por defecto si si se genera automaticamente, pero el organizador puede organizarlo como quiera

debe pedirme crear las fases pueden ser muchas, liga, grupos, eliminatoria, y se pueden organizar de diferente manera, la forma de coenctarlas es que cada fase tiene reglas, por ejemplo en grupos decir cuantos clasifican por grupo, tambien permitirme colorear los que pasan y los que se eliminan por defecto coloreados en verde los que pasan y en rojo los eliminados

en las eliminatorias debe decirme de que es la eliminatoria, de 4 equipos, 8, 16, 32, 64, 128 y hasta ahi

id del grupo(opcional)
todo eso quitarlo, debe ser facil para el organizador


- cuando voy a mis torneo despues de crear uno me dice Algo salió mal

No se pudieron cargar tus torneos.
http://localhost:5173/api/v1/tournaments/32
{"success":false,"message":"Torneo no encontrado."}


pero si voy a todos los torneos si aparece pero no me deja editarlo

en cada torneo debe haber un select arriba para que la gente busque la fase que quiere ver, y por defecto le cargue la fase activa por el organizador, es decir si ya paso la fase 1 no tiene sentido que cargue de primeras, y segun la fase si es liga se vea de una forma, si es grupo se vean como grupos, si es eliminatoria debe verse asi como eliminatorias, como un arbol horizontal

para lo de goleadores y eso debe sumar en todas las fases y permitirme filtrar por fases, quien fue en x fase o en todas, o en 2 fases es deecir un select

debe dejarme eliminar fases por completo esto debe pedir confirmacion y elminaria todo, resultados, partidos, goleadores, todooo



# inscripciones:

debe haber una seccion en la administracion del torneo donde el organizador coloque un check con inscripciones cerradas,
## importante
- quitar toda la logica de la autogeneracion de equipos despues de la inscripcion, ese proceso deberia hacerlo manual el organizador pues podra crear partidos en fechas, incluso partidos rtepedidos

el roganizador puede crear nuevas fechas, y tambien partidos en ltodas las fechas si es que quiere y necesita, esto para estos casos de equipos que entren despues 

- en la parte de inscripciones debe permitirme crear un formulario del equipo a crear por defecto solo: Escudo, NOmbre del equipo, entrenador, pero debe permitirme agregar campos y si es obligatorio o no, y si solo numero, texto, y parrafo
- y el formulario del jugador: por defecto:
foto(no obligatoria)
Nombre del jugador (obligatorio)
Alias
N camiseta (obligatorio)
ID - documento (obligatorio)
fecha de nacimiento
telefono
y agregar campos personalizados

debe permitirme agregar un limite de inscritos por equipo, ejemplo 5, 10 20 o sin limite, el numero puede ir de 5 a 100 o sin limite

debe permitirme tambien como organizador agregar como una informacion que veran los que se esten registrando un parrafo

