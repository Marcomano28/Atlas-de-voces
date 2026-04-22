# Deploy beta

Guia corta para publicar Planeta Barrio como beta privada usando Vercel para el frontend y Railway para la API.

## 1. Antes de publicar

- Rota cualquier `OPENROUTER_API_KEY` que haya vivido fuera de un gestor de secretos.
- Crea una key nueva para esta beta y ponle limite de gasto en OpenRouter.
- Define un codigo beta largo, dificil de adivinar, y cambialo cuando deje de ser privado.

## 2. Railway API

Despliega este repo como servicio Node.

Railway puede arrancar la API con:

```sh
npm start
```

Variables recomendadas en Railway:

```env
NODE_ENV=production
CORS_ORIGIN=https://TU-FRONT.vercel.app
BETA_ACCESS_CODE=un-codigo-largo-y-privado
CHAT_RATE_LIMIT_WINDOW_MS=600000
CHAT_RATE_LIMIT_MAX=30

OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_APP_NAME=Planeta Barrio
OPENROUTER_SITE_URL=https://TU-FRONT.vercel.app
OPENROUTER_TEMPERATURE=0.82
OPENROUTER_MAX_TOKENS=420
```

Notas:

- No definas `PORT`; Railway lo proporciona.
- La API escucha en `0.0.0.0:$PORT`.
- Si `BETA_ACCESS_CODE` esta vacio, `/api/chat` queda sin codigo beta.
- `CHAT_RATE_LIMIT_MAX=30` limita cada IP a 30 mensajes cada 10 minutos.
- `GET /api/health` y `GET /api/agents` quedan publicos; `/api/chat` y memoria de sesiones requieren codigo cuando `BETA_ACCESS_CODE` existe.

## 3. Vercel frontend

Despliega el mismo repo como proyecto Vite.

Build command:

```sh
npm run build
```

Output directory:

```txt
dist
```

Variables recomendadas en Vercel:

```env
VITE_API_URL=https://TU-API.up.railway.app
VITE_BETA_ACCESS_REQUIRED=true
```

`VITE_BETA_ACCESS_REQUIRED=true` muestra una pantalla de codigo de acceso en el frontend. El codigo real no vive en Vercel; solo se guarda temporalmente en el navegador del usuario y se manda a Railway en el header `X-Beta-Access-Code`.

## 4. Prueba rapida

Sin codigo, la API debe rechazar chat:

```sh
curl -i https://TU-API.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"agentId":"paco","message":"hola"}'
```

Con codigo, debe responder:

```sh
curl -i https://TU-API.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -H "X-Beta-Access-Code: un-codigo-largo-y-privado" \
  -d '{"sessionId":"demo","agentId":"paco","message":"hola"}'
```

## 5. Cierre de seguridad minimo

- Usa una key de OpenRouter distinta para beta.
- Ponle limite de gasto.
- Mantén `CORS_ORIGIN` apuntando al dominio real de Vercel.
- Comparte el codigo beta solo con quienes vayan a probar.
- Cambia `BETA_ACCESS_CODE` si el enlace se mueve demasiado.
