import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {AGENTS, getAgent, getPublicAgents} from './agents.js';
import {createMemoryStore} from './memory.js';
import {createFallbackReply, buildChatMessages} from './prompts.js';
import {selectNamePromptForTurn, selectRelationshipContext, selectRelayMessagesForTurn, selectRepertoireForTurn} from './repertoire.js';
import {createChatCompletion, getOpenRouterModel, hasOpenRouterKey} from './openrouter.js';

loadEnvFile();

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_BODY_SIZE = 1024 * 1024;

const memory = createMemoryStore();

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
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  });
  res.end(JSON.stringify(payload));
}

function sendOptions(res){
  res.writeHead(204, {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  });
  res.end();
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

async function handleChat(req, res){
  const body = await readJsonBody(req);
  const agentId = body.agentId;
  const userText = String(body.message || '').trim();
  const sessionId = body.sessionId || randomUUID();
  const agent = getAgent(agentId);

  if(!agent){
    sendJson(res, 404, {error: `Unknown agent: ${agentId}`});
    return;
  }

  if(!userText){
    sendJson(res, 400, {error: 'message is required'});
    return;
  }

  const conversation = memory.getConversation(sessionId, agentId);

  memory.rememberFromUserMessage(sessionId, agentId, userText, AGENTS);

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
  const selectedNamePrompts = selectNamePromptForTurn({
    availableRepertoire,
    shouldPromptForUserName: memory.shouldPromptForUserName(sessionId, agentId)
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
    selectedNamePrompts
  });

  let provider = 'local-fallback';
  let model = null;
  let usage = null;
  let generationId = null;
  let content;

  try{
    const completion = await createChatCompletion({
      messages,
      sessionId,
      agentId
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
    model = hasOpenRouterKey() ? getOpenRouterModel() : null;
  }

  memory.appendMessage(sessionId, agentId, {role: 'user', content: userText});
  memory.appendMessage(sessionId, agentId, {role: 'assistant', content});
  memory.markNamePromptAskedFromReply(sessionId, agentId, content);
  memory.markUsedRepertoireFromReply(sessionId, agent, content);
  memory.addAgentObservation(sessionId, agentId, createAgentObservation(agent, userText, content));

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
    await handleChat(req, res);
    return;
  }

  if(req.method === 'GET' && path.startsWith('/api/sessions/') && path.endsWith('/memory')){
    const sessionId = decodeURIComponent(path.split('/')[3]);
    sendJson(res, 200, {session: memory.snapshot(sessionId)});
    return;
  }

  if(req.method === 'DELETE' && path.startsWith('/api/sessions/')){
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

    sendJson(res, status, {error: error.message || 'Server error'});
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Planeta Barrio API listening on http://${HOST}:${PORT}`);
  console.log(`Provider: ${hasOpenRouterKey() ? 'openrouter' : 'local-fallback'} (${getOpenRouterModel()})`);
});
