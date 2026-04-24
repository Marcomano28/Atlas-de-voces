import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {AGENTS, getAgent, getPublicAgents} from './agents.js';
import {createMemoryStore} from './memory.js';
import {createFallbackReply, buildChatMessages} from './prompts.js';
import {selectNamePromptForTurn, selectRelationshipContext, selectRelayMessagesForTurn, selectRepertoireForTurn} from './repertoire.js';
import {selectPlaceTruthsForTurn} from './places.js';
import {createChatCompletion, createChatCompletionStream, getOpenRouterModel, hasOpenRouterKey} from './openrouter.js';

loadEnvFile();

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_BODY_SIZE = 1024 * 1024;
const BETA_ACCESS_HEADER = 'x-beta-access-code';
const CHAT_RATE_LIMIT_WINDOW_MS = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
const CHAT_RATE_LIMIT_MAX = Number(process.env.CHAT_RATE_LIMIT_MAX || 30);

const memory = createMemoryStore();
const chatRateLimits = new Map();

function loadEnvFile(){
  const envPath = resolve(process.cwd(), '.env');

  if(!existsSync(envPath)) return;

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();

    if(!trimmed || trimmed.startsWith('#')) return;

    const index = trimmed.indexOf('=');
    if(index === -1) return;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');

    if(key && !process.env[key]){
      process.env[key] = value;
    }
  });
}

function sendJson(res, status, payload){
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Beta-Access-Code'
  });
  res.end(JSON.stringify(payload));
}

function sendOptions(res){
  res.writeHead(204, {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Beta-Access-Code'
  });
  res.end();
}

function sendEventStream(res){
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Beta-Access-Code'
  });

  res.flushHeaders?.();
}

function writeEventStream(res, event, payload){
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function isBetaProtected(){
  return Boolean(process.env.BETA_ACCESS_CODE);
}

function hasBetaAccess(req){
  if(!isBetaProtected()) return true;

  return req.headers[BETA_ACCESS_HEADER] === process.env.BETA_ACCESS_CODE;
}

function requireBetaAccess(req, res){
  if(hasBetaAccess(req)) return true;

  sendJson(res, 401, {
    error: 'Access code required',
    code: 'beta_access_required'
  });
  return false;
}

function getRequestIp(req){
  const forwardedFor = req.headers['x-forwarded-for'];

  if(forwardedFor){
    return String(forwardedFor).split(',')[0].trim();
  }

  return req.socket.remoteAddress || 'unknown';
}

function requireChatRateLimit(req, res){
  if(!CHAT_RATE_LIMIT_MAX) return true;

  const now = Date.now();
  const key = getRequestIp(req);
  const existing = chatRateLimits.get(key);
  const bucket = existing && existing.resetAt > now
    ? existing
    : {count: 0, resetAt: now + CHAT_RATE_LIMIT_WINDOW_MS};

  bucket.count += 1;
  chatRateLimits.set(key, bucket);

  if(bucket.count <= CHAT_RATE_LIMIT_MAX) return true;

  sendJson(res, 429, {
    error: 'Too many chat messages',
    code: 'rate_limited',
    retryAfterMs: Math.max(bucket.resetAt - now, 0)
  });
  return false;
}

function readJsonBody(req){
  return new Promise((resolveBody, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;

      if(body.length > MAX_BODY_SIZE){
        reject(Object.assign(new Error('Request body too large'), {status: 413}));
        req.destroy();
      }
    });

    req.on('end', () => {
      if(!body){
        resolveBody({});
        return;
      }

      try{
        resolveBody(JSON.parse(body));
      }catch(error){
        reject(Object.assign(new Error('Invalid JSON body'), {status: 400}));
      }
    });

    req.on('error', reject);
  });
}

function createAgentObservation(agent, userText, reply){
  const shortUser = userText.replace(/\s+/g, ' ').slice(0, 90);
  const shortReply = reply.replace(/\s+/g, ' ').slice(0, 90);

  return `${agent.name} converso con el usuario sobre "${shortUser}" y respondio desde "${shortReply}".`;
}

function prepareChatTurn(body){
  const agentId = body.agentId;
  const userText = String(body.message || '').trim();
  const sessionId = body.sessionId || randomUUID();
  const agent = getAgent(agentId);

  if(!agent){
    throw Object.assign(new Error(`Unknown agent: ${agentId}`), {status: 404});
  }

  if(!userText){
    throw Object.assign(new Error('message is required'), {status: 400});
  }

  const conversation = memory.getConversation(sessionId, agentId);

  const nameEcho = memory.rememberFromUserMessage(sessionId, agentId, userText, AGENTS);

  const availableRepertoire = memory.getAvailableRepertoire(sessionId, agent);
  const selectedRepertoire = selectRepertoireForTurn({
    agent,
    agents: AGENTS,
    availableRepertoire,
    userText,
    conversation
  });
  const selectedRelationships = selectRelationshipContext({
    agent,
    agents: AGENTS,
    userText,
    conversation
  });
  const selectedRelayMessages = selectRelayMessagesForTurn({
    agent,
    agents: AGENTS,
    availableRepertoire,
    userText,
    conversation
  });
  const pendingRelayMessages = memory.getPendingRelayMessagesForAgent(sessionId, agentId);
  const selectedNamePrompts = selectNamePromptForTurn({
    availableRepertoire,
    shouldPromptForUserName: memory.shouldPromptForUserName(sessionId, agentId)
  });
  const selectedPlaceTruths = selectPlaceTruthsForTurn({
    agent,
    userText,
    conversation,
    usedPlaceLineIds: memory.getUsedPlaceLineIds(sessionId, agentId)
  });

  const messages = buildChatMessages({
    agent,
    memoryContext: memory.buildMemoryContext(sessionId, agentId),
    conversation,
    userText,
    selectedRepertoire,
    availableRepertoireCount: availableRepertoire.length,
    selectedRelationships,
    selectedRelayMessages,
    pendingRelayMessages,
    selectedNamePrompts,
    selectedPlaceTruths,
    nameEcho: nameEcho
      ? {
        ...nameEcho,
        activeAgentId: agentId
      }
      : null
  });

  return {
    agentId,
    userText,
    sessionId,
    agent,
    messages,
    selectedRelayMessages,
    pendingRelayMessages,
    selectedPlaceTruths
  };
}

function finalizeChatTurn(context, content){
  const {sessionId, agentId, agent, userText, selectedRelayMessages, pendingRelayMessages, selectedPlaceTruths} = context;

  memory.appendMessage(sessionId, agentId, {role: 'user', content: userText});
  memory.appendMessage(sessionId, agentId, {role: 'assistant', content});
  memory.markNamePromptAskedFromReply(sessionId, agentId, content);
  memory.markPendingRelayMessagesFromReply(sessionId, agent, selectedRelayMessages, content);
  memory.markPendingRelayMessagesDelivered(sessionId, agentId, pendingRelayMessages.slice(0, 1).map((item) => item.id));
  memory.markUsedRepertoireFromReply(sessionId, agent, content);
  memory.markUsedPlaceLinesFromReply(sessionId, agentId, selectedPlaceTruths, content);
  memory.addAgentObservation(sessionId, agentId, createAgentObservation(agent, userText, content));
}

async function handleChat(body, res){
  const context = prepareChatTurn(body);
  const {agentId, userText, sessionId, agent, messages} = context;

  let provider = 'local-fallback';
  let model = null;
  let usage = null;
  let generationId = null;
  let content;

  try{
    const completion = await createChatCompletion({
      messages,
      sessionId,
      agentId,
      model: getOpenRouterModel(agent)
    });

    content = completion.content;
    provider = 'openrouter';
    model = completion.model;
    usage = completion.usage;
    generationId = completion.id;
  }catch(error){
    if(hasOpenRouterKey()){
      console.error('[openrouter]', error);
    }

    content = createFallbackReply(agent, userText);
    model = hasOpenRouterKey() ? getOpenRouterModel(agent) : null;
  }

  finalizeChatTurn(context, content);

  sendJson(res, 200, {
    sessionId,
    agent: {
      id: agent.id,
      name: agent.name,
      scene: agent.scene,
      color: agent.color
    },
    message: {
      role: 'assistant',
      content
    },
    provider,
    model,
    usage,
    generationId
  });
}

async function handleChatStream(body, res){
  const context = prepareChatTurn(body);
  const {agent, sessionId, messages} = context;

  sendEventStream(res);

  let provider = 'local-fallback';
  let model = null;
  let usage = null;
  let generationId = null;
  let content = '';

  try{
    if(hasOpenRouterKey()){
      provider = 'openrouter';
      model = getOpenRouterModel(agent);

      const completion = await createChatCompletionStream({
        messages,
        sessionId,
        agentId: context.agentId,
        model,
        onDelta: (delta) => {
          content += delta;
          writeEventStream(res, 'delta', {content: delta});
        }
      });

      content = content || completion.content;
      model = completion.model;
      usage = completion.usage;
      generationId = completion.id;
    }else{
      content = createFallbackReply(agent, context.userText);
      writeEventStream(res, 'delta', {content});
    }
  }catch(error){
    if(hasOpenRouterKey()){
      console.error('[openrouter]', error);
    }

    if(!content){
      provider = 'local-fallback';
      model = hasOpenRouterKey() ? getOpenRouterModel(agent) : null;
      content = createFallbackReply(agent, context.userText);
      writeEventStream(res, 'delta', {content});
    }
  }

  finalizeChatTurn(context, content);

  writeEventStream(res, 'done', {
    sessionId,
    agent: {
      id: agent.id,
      name: agent.name,
      scene: agent.scene,
      color: agent.color
    },
    message: {
      role: 'assistant',
      content
    },
    provider,
    model,
    usage,
    generationId
  });

  res.end();
}

async function route(req, res){
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if(req.method === 'OPTIONS'){
    sendOptions(res);
    return;
  }

  if(req.method === 'GET' && path === '/api/health'){
    sendJson(res, 200, {
      ok: true,
      provider: hasOpenRouterKey() ? 'openrouter' : 'local-fallback',
      model: getOpenRouterModel(),
      agents: AGENTS.length
    });
    return;
  }

  if(req.method === 'GET' && path === '/api/agents'){
    sendJson(res, 200, {agents: getPublicAgents()});
    return;
  }

  if(req.method === 'GET' && path.startsWith('/api/agents/')){
    const agentId = decodeURIComponent(path.split('/').pop());
    const agent = getAgent(agentId);

    if(!agent){
      sendJson(res, 404, {error: `Unknown agent: ${agentId}`});
      return;
    }

    sendJson(res, 200, {agent});
    return;
  }

  if(req.method === 'POST' && path === '/api/chat'){
    if(!requireBetaAccess(req, res)) return;
    if(!requireChatRateLimit(req, res)) return;

    const body = await readJsonBody(req);

    if(body.stream){
      await handleChatStream(body, res);
      return;
    }

    await handleChat(body, res);
    return;
  }

  if(req.method === 'GET' && path.startsWith('/api/sessions/') && path.endsWith('/memory')){
    if(!requireBetaAccess(req, res)) return;

    const sessionId = decodeURIComponent(path.split('/')[3]);
    sendJson(res, 200, {session: memory.snapshot(sessionId)});
    return;
  }

  if(req.method === 'DELETE' && path.startsWith('/api/sessions/')){
    if(!requireBetaAccess(req, res)) return;

    const sessionId = decodeURIComponent(path.split('/')[3]);
    memory.reset(sessionId);
    sendJson(res, 200, {ok: true, sessionId});
    return;
  }

  sendJson(res, 404, {error: 'Not found'});
}

const server = createServer((req, res) => {
  route(req, res).catch((error) => {
    const status = error.status || 500;

    if(status >= 500){
      console.error(error);
    }

    if(res.headersSent){
      res.end();
      return;
    }

    sendJson(res, status, {error: error.message || 'Server error'});
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Planeta Barrio API listening on http://${HOST}:${PORT}`);
  console.log(`Provider: ${hasOpenRouterKey() ? 'openrouter' : 'local-fallback'} (${getOpenRouterModel()})`);
});
