const MAX_SHARED_TRUTHS_PER_TURN = 1;

export const SHARED_TRUTHS = [
  {
    id: 'paco-desaparece-habana',
    title: 'La noche que Paco desaparecio en La Habana',
    tags: ['paco', 'habana', 'panama', 'amor', 'perdido', 'perderse', 'noche', 'desaparecio', 'desaparecer'],
    summary: 'Un episodio ambiguo de Paco en La Habana que todos recuerdan distinto.',
    versions: {
      domingo: {
        angle: 'Paco se perdio por romantico, por hacerse el valiente y por no saber quedarse quieto.',
        opening: '¿Paco? Ay, mi hijo, no me tires de esa lengua, que todavia hay una noche en La Habana que cada cual cuenta como le conviene.',
        line: 'Ese dia Paco no se perdio en La Habana; se perdio en una idea que tenia de si mismo.',
        tone: 'Profesor viejo, carinoso, con ironia de portal y cuidado de no delatar demasiado al amigo.'
      },
      paco: {
        angle: 'Fue una aventura absurda y Paco no piensa confesar la parte mas sentimental.',
        opening: 'Perderme, lo que se dice perderme, no me perdi. La Habana y yo tuvimos una diferencia de criterio.',
        line: 'Aquella noche habia mas calor que juicio, y yo segui una calle pensando que era destino, cuando seguramente era una muchacha y dos tragos hablando por mi.',
        tone: 'Guasa gaditana defensiva, romantica sin admitirlo, con media verdad y mucho teatro.'
      },
      manisera: {
        angle: 'Paco aparecio con cara de susto, sin un peso claro, y tratando de comprar mani como si nada.',
        opening: 'Ay, Paco... ese hombre una noche aparecio por aqui con cara de haber visto un fantasma y todavia queria que le fiara mani.',
        line: 'Yo no se donde estuvo, mi vida, pero el que vuelve con los zapatos hablando solos y los ojos mirando para atras, algo dejo perdido en la calle.',
        tone: 'Ternura de vendedora vieja, picardia y sospecha practica.'
      },
      'marta-nora': {
        angle: 'Marta Nora sospecha que habia una mujer detras y que Paco embellece la historia para no quedar vulnerable.',
        opening: '¿Paco te conto lo de La Habana? Mira, cuando un hombre adorna tanto una perdida, casi siempre esta tapando un nombre propio.',
        line: 'Yo no tengo pruebas, pero tengo intuicion, que en el barrio muchas veces llega antes que la evidencia.',
        tone: 'Chisme fino, lectura social, curiosidad elegante sin crueldad.'
      },
      yanislaidis: {
        angle: 'Yanislaidis no le cree ni la mitad a Paco, pero reconoce cuando una mentira protege algo cierto.',
        opening: 'Paco habla bonito, pero a mi el cuento ese de La Habana me camina raro desde lejos.',
        line: 'Yo no digo que mienta completo; digo que hay verdades que el hombre envuelve en papel de chiste para que no se le vea la herida.',
        tone: 'Astucia callejera, limite claro y respeto por lo que no se confiesa de frente.'
      }
    }
  }
];

function normalizeText(value = ''){
  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function buildSharedTruthContext(userText, conversation = []){
  const recentUserLines = conversation
    .filter((message) => message.role === 'user')
    .slice(-2)
    .map((message) => message.content);

  return normalizeText([...recentUserLines, userText].join(' '));
}

function sharedTruthScore(sharedTruth, context){
  return sharedTruth.tags.reduce((score, tag) => {
    const normalizedTag = normalizeText(tag);

    if(!normalizedTag || !context.includes(normalizedTag)) return score;

    return score + (normalizedTag.includes(' ') ? 3 : 2);
  }, 0);
}

export function selectSharedTruthsForTurn({agent, userText, conversation = []}){
  const context = buildSharedTruthContext(userText, conversation);

  return SHARED_TRUTHS
    .filter((sharedTruth) => sharedTruth.versions?.[agent.id])
    .map((sharedTruth, index) => ({
      ...sharedTruth,
      activeVersion: sharedTruth.versions[agent.id],
      _index: index,
      _score: sharedTruthScore(sharedTruth, context)
    }))
    .filter((sharedTruth) => sharedTruth._score > 0)
    .sort((a, b) => b._score - a._score || a._index - b._index)
    .slice(0, MAX_SHARED_TRUTHS_PER_TURN)
    .map(({_index, _score, ...sharedTruth}) => sharedTruth);
}
