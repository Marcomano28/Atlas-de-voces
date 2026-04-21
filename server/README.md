# Planeta Barrio API

Backend ligero para conversar con los personajes del barrio.

## Arranque local

1. Crea `.env` a partir de `.env.example`.
2. Pon tu `OPENROUTER_API_KEY`.
3. Ejecuta:

```bash
npm run dev:api
```

La API escucha por defecto en `http://localhost:8787`.

El frontend usa `VITE_API_URL`; si no se define, apunta a `http://localhost:8787`.

## Endpoints

- `GET /api/health`: estado, proveedor y modelo.
- `GET /api/agents`: lista publica de personajes.
- `GET /api/agents/:id`: definicion completa del personaje.
- `POST /api/chat`: conversa con un personaje.
- `GET /api/sessions/:sessionId/memory`: inspecciona memoria en RAM.
- `DELETE /api/sessions/:sessionId`: borra memoria de sesion.

## Chat

```bash
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "demo",
    "agentId": "yanislaidis",
    "message": "Me llamo Marco y quiero conocer el barrio."
  }'
```

Agentes disponibles:

- `domingo`
- `paco`
- `yanislaidis`
- `marta-nora`
- `manisera`

## Memoria

Ahora mismo la memoria vive en RAM y se pierde al reiniciar el servidor.
La estructura ya separa:

- notas del usuario;
- notas propias de cada personaje;
- ecos entre personajes.

Cuando haga falta persistencia, el reemplazo natural es mover `server/memory.js` a SQLite, Postgres o Redis sin cambiar el contrato de `/api/chat`.
