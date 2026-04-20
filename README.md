# Planeta Barrio: Atlas de Voces

Un prototipo web inmersivo donde un planeta funciona como mapa de entrada a escenas 360 de ciudades y barrios. Cada lugar puede convertirse en un entorno conversacional habitado por personajes-agentes de IA, presentados como figuras dentro del panorama con burbujas de texto estilo comic.

## Idea

El proyecto explora una forma de navegar el mundo desde lo cercano: elegir un punto del planeta, entrar a una escena local y conversar con voces/personajes del lugar.

## Estado Actual

- Planeta interactivo con puntos de ciudad.
- Drag del planeta con cámara fija.
- Transición shader entre vista planeta y escena 360.
- Panoramas por ciudad con orientación inicial configurable.
- Límite de cámara dentro de cada escena.
- Botón de salida para volver al planeta.
- Fondo espacial y atmósfera visual alrededor de la Tierra.
- Interfaz responsive para desktop, tablet y móvil.

## Comandos

```sh
npm install
npm run dev
```

Para crear una versión de producción:

```sh
npm run build
```

## Agregar Escenas

1. Añade una imagen equirectangular 2:1 en `public/`.
2. Importa la imagen en `src/main.js`.
3. Añade una entrada en `cityPoints`:

```js
{
  title: 'Nombre',
  coords: {
    lat: 0,
    lng: 0
  },
  texture: nombrePanorama,
  view: {yaw: 0, pitch: 0}
}
```

`view.yaw` y `view.pitch` controlan hacia dónde mira la cámara al entrar en la escena.
