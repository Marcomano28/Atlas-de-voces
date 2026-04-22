# Evolucion posible: de personajes situados a guia conversacional local

Este apunte describe una evolucion gradual para Planeta Barrio si el proyecto crece hacia un chatbot capaz de hablar de un pueblo, una ciudad o un barrio con informacion local, tono conversacional y personajes con voz propia.

La idea central: los datos del lugar no deberian vivir dentro del modelo ni depender de fine-tuning. El modelo deberia recibir contexto bien seleccionado y convertirlo en conversacion viva desde la voz del personaje.

## Estado actual

Ahora mismo el sistema tiene cuatro capas principales:

- `agents.js`: define personalidad, voz, limites, relaciones y frases de repertorio de cada personaje.
- `repertoire.js`: selecciona frases de repertorio segun tags, situacion y personaje mencionado.
- `places.js`: introduce verdades del barrio y frases de entorno por escena/personaje.
- `memory.js`: guarda memoria de sesion, nombre del usuario, notas, conversacion reciente y frases ya usadas.

Esto funciona bien para una experiencia pequena o mediana: personajes concretos, escenas concretas y algunas anecdotas situadas.

El limite aparece cuando se quiere cubrir muchos temas locales: bares, playas, historia, calles, rutas, horarios, fiestas, transporte, orientacion, recomendaciones, etc.

## Fase 1: ordenar lo que ya existe

Objetivo: mantener el sistema actual, pero nombrarlo mejor.

`places.js` puede crecer hacia una idea mas amplia:

```txt
places.js -> localKnowledge.js
```

O, si queremos mantener el nombre actual, al menos pensar que ya no guarda solo lugares, sino tambien:

- lugares
- anecdotas
- orientacion
- bares
- historia local
- referencias de barrio
- frases situadas por personaje

En esta fase no hace falta cambiar mucho codigo. Basta con seguir el patron actual:

```js
{
  id: 'rota-bares-cercanos',
  scene: 'Rota',
  name: 'Bares cercanos de Paco',
  tags: ['comer', 'cervecita', 'bares', 'tapear', 'donde ir'],
  facts: [
    'Paco conoce El Torito, La Calabaza Mecanica y Los Cien Montaditos.'
  ],
  agentViews: {
    paco: {
      lens: 'Paco recomienda como vecino de pueblo chico, no como guia turistico.',
      angles: [
        'Puede bromear con que en Rota un bar es tambien oficina de asuntos propios.'
      ],
      lines: [...]
    }
  }
}
```

## Fase 2: separar conocimiento por ciudad o escena

Objetivo: que el archivo no se vuelva inmanejable.

Cuando `places.js` empiece a crecer, conviene dividirlo:

```txt
server/knowledge/
  index.js
  habana.js
  rota.js
  trinidad.js
```

Cada archivo exportaria bloques de conocimiento local. `index.js` los juntaria para que el selector siga funcionando igual.

Esto no cambia la logica de conversacion. Solo ordena mejor los datos.

## Fase 3: distinguir tipos de conocimiento

Objetivo: que el selector entienda mejor que clase de informacion esta usando.

Cada bloque podria tener un `kind`:

```js
kind: 'bar'
kind: 'landmark'
kind: 'orientation'
kind: 'history'
kind: 'anecdote'
kind: 'route'
kind: 'local_custom'
```

Ejemplo:

```js
{
  id: 'rota-orientacion-centro',
  scene: 'Rota',
  kind: 'orientation',
  tags: ['perdido', 'orientarme', 'donde ir', 'que ver', 'pasear'],
  facts: [
    'Paco usa la Plaza de Bartolome Perez, la calle Charcos y la rotonda de Las Manos como referencias cercanas.'
  ]
}
```

Esto permitiria que una pregunta como:

```txt
Paco, estoy perdido, donde tiro?
```

active orientacion, no historia.

## Fase 4: separar dato local y voz del personaje

Objetivo: que el mismo lugar pueda ser contado distinto por cada personaje.

La estructura ideal:

```js
{
  id: 'castillo-luna',
  scene: 'Rota',
  kind: 'landmark',
  facts: [
    'El Castillo de Luna esta asociado al Ayuntamiento de Rota.'
  ],
  agentViews: {
    paco: {
      lens: 'Lo mira con guasa politica y orgullo local.',
      lines: [...]
    },
    domingo: {
      lens: 'Lo compararia con la Real Fuerza desde memoria de La Habana.',
      lines: [...]
    }
  }
}
```

Asi el dato no cambia, pero la manera de contarlo si.

## Fase 5: mejorar el selector sin hacerlo pesado

Objetivo: ir mas alla de tags exactos, pero sin meter todavia una base de datos grande.

El selector actual funciona por coincidencia de palabras. Es claro y barato, pero limitado.

Mejoras posibles:

- Agrupar sinonimos: `cervecita`, `cerveza`, `tomar algo`, `tapeo`.
- Puntuar por intencion: comer, orientacion, historia, salir, playa.
- Dar prioridad a bloques con `kind` compatible.
- Evitar que tags demasiado generales como `rota` o `pueblo` ganen sobre tags mas concretos.

Esta fase puede hacerse en codigo simple, sin embeddings.

## Fase 6: pasar a busqueda semantica si crece mucho

Objetivo: cubrir muchas preguntas sin escribir infinitos tags.

Si el contenido crece bastante, convendria usar busqueda semantica:

```txt
pregunta del usuario
  -> embedding
  -> buscar fragmentos parecidos
  -> meter los mejores en el prompt
```

Esto serviria para preguntas mas naturales:

```txt
Donde puedo tomarme algo sin sentirme turista?
Que hago si tengo una tarde libre?
Donde llevo a alguien que viene por primera vez?
```

El modelo no inventaria la informacion: responderia con los fragmentos recuperados.

## Fase 7: memoria del visitante

Objetivo: que el usuario no sea siempre un desconocido.

La memoria podria guardar:

- nombre
- si viene de visita o vive cerca
- gustos: bares tranquilos, historia, playa, comer barato, caminar
- cosas que ya pregunto
- recomendaciones ya dadas
- personajes con los que hablo

Ejemplo:

```txt
El usuario dijo que viene con poco tiempo y quiere tomar una cerveza cerca.
```

Luego Paco podria responder mejor:

```txt
Como me dijiste que no quieres alejarte mucho, yo no te mando a dar vueltas: por aqui tienes...
```

## Fase 8: editor humano de conocimiento

Objetivo: que los datos se puedan mantener sin tocar codigo cada vez.

Opciones:

- Markdown por tema.
- JSON editable.
- SQLite.
- Un pequeno panel admin.

Ejemplo en Markdown:

```txt
server/knowledge/rota/bares.md
server/knowledge/rota/orientacion.md
server/knowledge/rota/historia.md
```

Luego un script podria convertir esos archivos en bloques estructurados.

## Fase 9: fine-tuning solo para estilo

Objetivo: mejorar la voz, no almacenar datos.

El fine-tuning podria servir para que Paco aprenda mejor:

- ritmo
- guasa
- remates
- naturalidad conversacional
- como recomendar sin sonar a guia turistico
- como mezclar memoria, ironia y ternura

Pero no conviene usar fine-tuning como base de datos de Rota. Si cambia un bar, una calle, un horario o una recomendacion, es mejor editar conocimiento externo que reentrenar un modelo.

Formula recomendada:

```txt
Datos locales editables + recuperacion de contexto + personaje bien modelado
```

Fine-tuning solo cuando ya haya muchos ejemplos buenos de respuestas y se quiera fijar mejor el estilo.

## Fase 10: version guia conversacional de Rota

Objetivo final posible: que Paco pueda orientar a visitantes sin perder personalidad.

Capacidades:

- recomendar donde comer o tomar algo
- orientar por zonas y referencias locales
- hablar de historia y lugares emblematicos
- adaptar recomendaciones al visitante
- contar anecdotas en vez de recitar fichas
- decir cuando no sabe algo
- mantener tono de vecino, no de folleto turistico

Flujo ideal:

```txt
Usuario pregunta
  -> se detecta intencion
  -> se recupera conocimiento local relevante
  -> se recupera voz del personaje
  -> se evita repetir frases ya usadas
  -> se responde con tono conversacional
```

## Recomendacion de avance

No saltar directamente a fine-tuning.

Primero:

1. Consolidar `places.js` como conocimiento local situado.
2. Dividir por escena cuando crezca.
3. Distinguir tipos: bares, historia, orientacion, lugares, anecdotas.
4. Mejorar tags e intenciones.
5. Solo despues pensar en embeddings o fine-tuning.

El alma del proyecto no esta en que el modelo se sepa todos los datos de memoria. Esta en que cada personaje sepa mirar su entorno de una forma que ningun mapa turistico puede copiar.
