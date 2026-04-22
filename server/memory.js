const MAX_MESSAGES_PER_AGENT = 18;
const MAX_MEMORY_NOTES = 12;

function normalizeText(value = ''){
  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function createSession(sessionId){
  return {
    id: sessionId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userName: null,
    userNotes: [],
    agentNotes: {},
    crossAgentNotes: [],
    namePromptAskedByAgent: {},
    namePromptCount: 0,
    usedRepertoire: {},
    usedPlaceLines: {},
    conversations: {}
  };
}

export function createMemoryStore(){
  const sessions = new Map();

  function getSession(sessionId){
    if(!sessions.has(sessionId)){
      sessions.set(sessionId, createSession(sessionId));
    }

    return sessions.get(sessionId);
  }

  function appendMessage(sessionId, agentId, message){
    const session = getSession(sessionId);

    if(!session.conversations[agentId]){
      session.conversations[agentId] = [];
    }

    session.conversations[agentId].push({
      ...message,
      at: new Date().toISOString()
    });
    session.conversations[agentId] = session.conversations[agentId].slice(-MAX_MESSAGES_PER_AGENT);
    session.updatedAt = new Date().toISOString();
  }

  function getConversation(sessionId, agentId){
    return getSession(sessionId).conversations[agentId] || [];
  }

  function addUniqueNote(notes, note){
    if(!note || notes.includes(note)) return;

    notes.push(note);

    while(notes.length > MAX_MEMORY_NOTES){
      notes.shift();
    }
  }

  function rememberFromUserMessage(sessionId, agentId, text, agents){
    const session = getSession(sessionId);
    const clean = text.trim();

    if(!clean) return;

    const explicitNameMatch = clean.match(/\b(?:me llamo|mi nombre es|me dicen|me llaman)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]*(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]*){0,2})(?=\s*(?:[,.;!?]|$|\sy\b|\spero\b))/i);
    const soyNameMatch = !/\bsoy\s+(?:de|un|una|el|la|del|de la)\b/i.test(clean)
      ? clean.match(/^\s*soy\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]*(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]*){0,2})\s*[.!?]?$/i)
      : null;
    const shortNameReplyMatch = session.namePromptAskedByAgent[agentId]
      && !/^(?:hola|bien|gracias|no|si|sí|jaja|jajaja|ok|vale)$/i.test(clean)
      ? clean.match(/^\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]*(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]*){0,2})\s*[.!?]?$/i)
      : null;
    const nameMatch = explicitNameMatch || soyNameMatch || shortNameReplyMatch;
    const originMatch = clean.match(/\b(?:soy de|vengo de|vivo en|estoy en)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]{1,46})/i);
    const likesMatch = clean.match(/\b(?:me gusta|me encanta|me interesa)\s+([^.!?]{2,90})/i);
    const rememberMatch = clean.match(/\b(?:recuerda que|acuérdate que|acuerdate que)\s+([^.!?]{2,110})/i);

    if(nameMatch){
      session.userName = nameMatch[1].trim();
      addUniqueNote(session.userNotes, `El usuario se presento como ${session.userName}.`);
    }
    if(originMatch) addUniqueNote(session.userNotes, `El usuario menciono relacion con ${originMatch[1].trim()}.`);
    if(likesMatch) addUniqueNote(session.userNotes, `Al usuario le interesa ${likesMatch[1].trim()}.`);
    if(rememberMatch) addUniqueNote(session.userNotes, `El usuario pidio recordar: ${rememberMatch[1].trim()}.`);

    const lower = clean.toLowerCase();
    const mentionedAgents = agents
      .filter((agent) => agent.id !== agentId)
      .filter((agent) => lower.includes(agent.name.toLowerCase()) || lower.includes(agent.id.replace('-', ' ')));

    mentionedAgents.forEach((agent) => {
      addUniqueNote(
        session.crossAgentNotes,
        `Hablando con ${agentId}, el usuario menciono a ${agent.name}: "${clean.slice(0, 140)}".`
      );
    });
  }

  function addAgentObservation(sessionId, agentId, note){
    const session = getSession(sessionId);

    if(!session.agentNotes[agentId]){
      session.agentNotes[agentId] = [];
    }

    addUniqueNote(session.agentNotes[agentId], note);
    session.updatedAt = new Date().toISOString();
  }

  function buildMemoryContext(sessionId, agentId){
    const session = getSession(sessionId);
    const userNotes = session.userNotes.length
      ? session.userNotes.map((note) => `- ${note}`).join('\n')
      : '- Aun no hay memoria estable sobre el usuario.';
    const agentNotes = session.agentNotes[agentId]?.length
      ? session.agentNotes[agentId].map((note) => `- ${note}`).join('\n')
      : '- Este personaje aun no ha guardado notas propias sobre el usuario.';
    const crossNotes = session.crossAgentNotes.length
      ? session.crossAgentNotes.map((note) => `- ${note}`).join('\n')
      : '- Aun no hay referencias entre personajes.';

    return [
      'Memoria disponible para esta sesion:',
      'Usuario:',
      session.userName ? `- Nombre conocido: ${session.userName}.` : '- Aun no se conoce el nombre del usuario.',
      userNotes,
      'Notas de este personaje:',
      agentNotes,
      'Ecos de otros personajes:',
      crossNotes,
      'Usa la memoria con naturalidad. No digas "segun mi memoria" salvo que el usuario pregunte.'
    ].join('\n');
  }

  function userMessageCount(sessionId, agentId){
    return getConversation(sessionId, agentId)
      .filter((message) => message.role === 'user')
      .length;
  }

  function shouldPromptForUserName(sessionId, agentId){
    const session = getSession(sessionId);

    return !session.userName
      && !session.namePromptAskedByAgent[agentId]
      && session.namePromptCount < 2
      && userMessageCount(sessionId, agentId) >= 2;
  }

  function markNamePromptAsked(sessionId, agentId){
    const session = getSession(sessionId);

    if(session.namePromptAskedByAgent[agentId]) return;

    session.namePromptAskedByAgent[agentId] = new Date().toISOString();
    session.namePromptCount += 1;
    session.updatedAt = new Date().toISOString();
  }

  function markNamePromptAskedFromReply(sessionId, agentId, reply){
    const normalizedReply = reply.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const asksForName = /\b(como te llamas|como se llama|que nombre|por que nombre|nombre te puso|te llaman|te dicen|te echaron el agua)\b/.test(normalizedReply);

    if(asksForName){
      markNamePromptAsked(sessionId, agentId);
    }
  }

  function getAvailableRepertoire(sessionId, agent){
    const session = getSession(sessionId);
    const used = session.usedRepertoire[agent.id] || {};

    return (agent.repertoire || []).filter((item) => !used[item.id]);
  }

  function markRepertoireUsed(sessionId, agentId, repertoireId){
    const session = getSession(sessionId);

    if(!session.usedRepertoire[agentId]){
      session.usedRepertoire[agentId] = {};
    }

    session.usedRepertoire[agentId][repertoireId] = new Date().toISOString();
    session.updatedAt = new Date().toISOString();
  }

  function markUsedRepertoireFromReply(sessionId, agent, reply){
    const normalizedReply = reply.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

    (agent.repertoire || []).forEach((item) => {
      const normalizedText = item.text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
      const firstChunk = normalizedText.slice(0, Math.min(42, normalizedText.length));

      if(normalizedReply.includes(normalizedText) || normalizedReply.includes(firstChunk)){
        markRepertoireUsed(sessionId, agent.id, item.id);
      }
    });
  }

  function getUsedPlaceLineIds(sessionId, agentId){
    const used = getSession(sessionId).usedPlaceLines[agentId] || {};

    return Object.keys(used);
  }

  function markPlaceLineUsed(sessionId, agentId, lineId){
    const session = getSession(sessionId);

    if(!session.usedPlaceLines[agentId]){
      session.usedPlaceLines[agentId] = {};
    }

    session.usedPlaceLines[agentId][lineId] = new Date().toISOString();
    session.updatedAt = new Date().toISOString();
  }

  function markUsedPlaceLinesFromReply(sessionId, agentId, selectedPlaceTruths, reply){
    const normalizedReply = normalizeText(reply);

    selectedPlaceTruths
      .flatMap((place) => place.selectedAgentLines || [])
      .forEach((line) => {
        const normalizedText = normalizeText(line.text);
        const firstChunk = normalizedText.slice(0, Math.min(42, normalizedText.length));

        if(normalizedReply.includes(normalizedText) || normalizedReply.includes(firstChunk)){
          markPlaceLineUsed(sessionId, agentId, line.id);
        }
      });
  }

  function snapshot(sessionId){
    const session = getSession(sessionId);

    return {
      id: session.id,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      userName: session.userName,
      userNotes: session.userNotes,
      agentNotes: session.agentNotes,
      crossAgentNotes: session.crossAgentNotes,
      namePromptAskedByAgent: session.namePromptAskedByAgent,
      namePromptCount: session.namePromptCount,
      usedRepertoire: session.usedRepertoire,
      usedPlaceLines: session.usedPlaceLines,
      conversations: session.conversations
    };
  }

  function reset(sessionId){
    sessions.delete(sessionId);
  }

  return {
    addAgentObservation,
    appendMessage,
    buildMemoryContext,
    getAvailableRepertoire,
    getConversation,
    getSession,
    getUsedPlaceLineIds,
    markNamePromptAskedFromReply,
    markUsedRepertoireFromReply,
    markUsedPlaceLinesFromReply,
    rememberFromUserMessage,
    reset,
    shouldPromptForUserName,
    snapshot
  };
}
