const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export function hasOpenRouterKey(){
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export function getOpenRouterModel(agent = null){
  return agent?.model || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
}

export async function createChatCompletion({messages, sessionId, agentId, model}){
  const apiKey = process.env.OPENROUTER_API_KEY;

  if(!apiKey){
    throw new Error('Missing OPENROUTER_API_KEY');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:5173',
      'X-OpenRouter-Title': process.env.OPENROUTER_APP_NAME || 'Planeta Barrio',
      'X-Session-Id': sessionId
    },
    body: JSON.stringify({
      model: model || getOpenRouterModel(),
      messages,
      temperature: Number(process.env.OPENROUTER_TEMPERATURE || 0.82),
      max_tokens: Number(process.env.OPENROUTER_MAX_TOKENS || 420),
      session_id: `${sessionId}:${agentId}`
    })
  });

  const payload = await response.json().catch(() => ({}));

  if(!response.ok){
    const message = payload?.error?.message || payload?.message || `OpenRouter request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  const content = payload?.choices?.[0]?.message?.content?.trim();

  if(!content){
    throw new Error('OpenRouter returned an empty response');
  }

  return {
    content,
    model: payload.model,
    usage: payload.usage || null,
    id: payload.id || null
  };
}
