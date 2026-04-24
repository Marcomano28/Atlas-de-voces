const MAX_REPERTOIRE_PER_TURN = 3;
const MAX_RELATIONSHIPS_PER_TURN = 2;
const MAX_RELAY_MESSAGES_PER_TURN = 1;
const MAX_NAME_PROMPTS_PER_TURN = 1;

const SITUATION_PATTERNS = {
  advice: /\b(mala suerte|cansad|limpi|despojo|miedo|enferm|dengue|maleficio|piojo|sacudir)\b/,
  aging_desire: /\b(edad|viejo|vieja|deseo|belleza|mirar|tentacion|vida|funeraria)\b/,
  cultural_bridge: /\b(cuba|cubano|cadiz|cadiz|rota|habana|panama|asere|pisha|barrio|jerga)\b/,
  comic_roast: /\b(cara|descaro|perdido|lejos|triste|detalle|simple|promete|pulla|broma)\b/,
  gossip_opening: /\b(chisme|secreto|enter|vio|viste|pared|vecin|poste|confidencia|cuento)\b/,
  neighborhood_observation: /\b(calle|barrio|moda|joven|telefono|selfie|redes|mirar|mujer|antes|ahora)\b/,
  selling: /\b(compr|vend|precio|peso|dinero|plumon|plumones|boligrafo|mani|masticar|pagar)\b/,
  sensory_selling: /\b(olor|huele|hueles|aroma|mani|tostad|hambre|caliente|caldero)\b/,
  setting_boundary: /\b(respeto|bruto|agresiv|provoc|mirad|hombre|sentimiento|promesa|dinero|arrim|limite)\b/,
  name_memory_surprise: /\b(de donde sabes mi nombre|de dónde sabes mi nombre|como sabes mi nombre|cómo sabes mi nombre|quien te dijo mi nombre|quién te dijo mi nombre|yo no te dije mi nombre|no te dije mi nombre|sabes mi nombre)\b/,
  local_name_denial: /\b(no soy esa|no soy ese|no soy la|no soy el|no,? no soy|te equivocas|esa no soy|ese no soy)\b/,
  neighborhood_entry: /\b(vengo de visita|estoy de visita|quiero conocer|conocer el barrio|mirar el barrio|nuevo por aqui|nueva por aqui|ca[ií] por aqui|acabo de llegar|entrar al barrio)\b/,
  talking_about_character: /\b(domingo|paco|yanislaidis|marta|nora|manisera)\b/,
  relay_message: /\b(dile|decirle|recado|mensaje|cuando lo veas|cuando la veas|si lo ves|si la ves)\b/,
  ask_user_name: /\b(nombre|llamas|llaman|present|registro|amigos|mama|mam[aá])\b/
};

function normalizeText(value = ''){
  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function buildTurnContext(userText, conversation = []){
  const recentUserLines = conversation
    .filter((message) => message.role === 'user')
    .slice(-2)
    .map((message) => message.content);

  return normalizeText([...recentUserLines, userText].join(' '));
}

function agentAliases(agent){
  return [
    agent.id,
    agent.id.replace(/-/g, ' '),
    agent.name,
    agent.name.replace(/\s+/g, ' '),
    agent.name.split(/\s+/).find((part) => part.length > 2)
  ].map(normalizeText);
}

function getMentionedAgentIds(context, agents, activeAgentId){
  const mentioned = new Set();

  agents
    .filter((agent) => agent.id !== activeAgentId)
    .forEach((agent) => {
      if(agentAliases(agent).some((alias) => alias && context.includes(alias))){
        mentioned.add(agent.id);
      }
    });

  return mentioned;
}

function tagScore(item, context){
  return (item.tags || []).reduce((score, tag) => {
    const normalizedTag = normalizeText(tag);

    if(!normalizedTag || !context.includes(normalizedTag)) return score;

    return score + (normalizedTag.includes(' ') ? 3 : 2);
  }, 0);
}

function situationScore(item, context){
  const pattern = SITUATION_PATTERNS[item.situation];

  return pattern?.test(context) ? 3 : 0;
}

function targetScore(item, mentionedAgentIds){
  if(!item.target) return 0;

  return mentionedAgentIds.has(item.target) ? 8 : -4;
}

function scoreRepertoireItem(item, context, mentionedAgentIds){
  return (
    tagScore(item, context) +
    situationScore(item, context) +
    targetScore(item, mentionedAgentIds)
  );
}

function isRelayMessage(item){
  return item.situation === 'relay_message';
}

function isNamePrompt(item){
  return item.situation === 'ask_user_name';
}

export function selectRepertoireForTurn({agent, agents, availableRepertoire, userText, conversation = []}){
  const context = buildTurnContext(userText, conversation);
  const mentionedAgentIds = getMentionedAgentIds(context, agents, agent.id);

  return availableRepertoire
    .filter((item) => !isRelayMessage(item))
    .filter((item) => !isNamePrompt(item))
    .map((item, index) => ({
      ...item,
      _index: index,
      _score: scoreRepertoireItem(item, context, mentionedAgentIds)
    }))
    .filter((item) => item._score > 0)
    .sort((a, b) => b._score - a._score || a._index - b._index)
    .slice(0, MAX_REPERTOIRE_PER_TURN)
    .map(({_index, _score, ...item}) => item);
}

export function selectNamePromptForTurn({availableRepertoire, shouldPromptForUserName}){
  if(!shouldPromptForUserName) return [];

  return availableRepertoire
    .filter(isNamePrompt)
    .slice(0, MAX_NAME_PROMPTS_PER_TURN);
}

export function selectRelayMessagesForTurn({agent, agents, availableRepertoire, userText, conversation = []}){
  const context = buildTurnContext(userText, conversation);
  const mentionedAgentIds = getMentionedAgentIds(context, agents, agent.id);

  return availableRepertoire
    .filter(isRelayMessage)
    .filter((item) => item.target && mentionedAgentIds.has(item.target))
    .map((item, index) => ({
      ...item,
      _index: index,
      _score: scoreRepertoireItem(item, context, mentionedAgentIds) + 4
    }))
    .filter((item) => item._score > 0)
    .sort((a, b) => b._score - a._score || a._index - b._index)
    .slice(0, MAX_RELAY_MESSAGES_PER_TURN)
    .map(({_index, _score, ...item}) => item);
}

export function selectRelationshipContext({agent, agents, userText, conversation = []}){
  const relationships = Object.entries(agent.relationships || {});

  if(!relationships.length) return [];

  const context = buildTurnContext(userText, conversation);
  const mentionedAgentIds = getMentionedAgentIds(context, agents, agent.id);

  return relationships
    .filter(([otherId]) => mentionedAgentIds.has(otherId))
    .slice(0, MAX_RELATIONSHIPS_PER_TURN)
    .map(([id, relation]) => ({id, relation}));
}
