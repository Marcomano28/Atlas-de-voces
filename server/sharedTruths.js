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
  },
  {
    id: 'mame-pulsera-protectora',
    title: 'La pulsera de la Mame',
    tags: ['mame', 'pulsera', 'amuleto', 'proteccion', 'protectora', 'ana', 'annia', 'rota', 'levante', 'energia', 'artesana', 'collar', 'conchas'],
    summary: 'La Mame hizo una pulsera supuestamente protectora que paso por Ana, Annia y medio Rota, dejando detras mas chisme que magia confirmada.',
    versions: {
      domingo: {
        angle: 'Domingo ve la pulsera como un amuleto de barrio: menos magia comprobada y mas necesidad humana de creer que algo nos cuida.',
        opening: 'La pulsera de la Mame, mi hijo... eso no era una joya, eso era una tesis popular sobre el miedo.',
        line: 'La gente se rie de los amuletos hasta que la vida aprieta; entonces cualquier hilo con dos cuentas parece un pararrayos contra la desgracia.',
        tone: 'Filosofia de portal, humor seco y ternura por las supersticiones domesticas.'
      },
      paco: {
        angle: 'Paco cree que la pulsera tenia mas expediente que un ministerio: cada mano por la que paso dejo una historia nueva.',
        opening: '¿La pulsera de la Mame? Quillo, eso tenia mas expediente que un ministerio.',
        line: 'La Mame decia que era proteccion, pero aquello pasaba de muñeca en muñeca y siempre dejaba detras un lio, dos versiones y alguien diciendo que no habia sido para tanto.',
        tone: 'Guasa roteña, cariño por la Mame y exageracion de pueblo chico.'
      },
      manisera: {
        angle: 'La manisera no sabe si la pulsera protegia, pero reconoce buen oficio, buena venta y una artesana que sabia ponerle cuento a una pieza.',
        opening: 'Ay, mi vida, yo no se si esa pulsera protegia, pero la Mame sabia venderla como si viniera bendecida por tres santos y una vecina curiosa.',
        line: 'Proteccion o no, la muchacha tenia mano: dos cuentas, un hilo, una concha, y ya la gente caminaba mas derecha creyendo que la suerte la llevaba puesta.',
        tone: 'Vendedora vieja que respeta el oficio de otra vendedora; humor practico y ternura.'
      },
      'marta-nora': {
        angle: 'Marta Nora sospecha que la pulsera no tenia magia: tenia circulacion social. Cada cambio de mano movia informacion.',
        opening: 'La pulsera de la Mame no era magia, mi vida; era un archivo portatil de chisme.',
        line: 'Cada vez que cambiaba de muñeca, alguien decia que era por energia, pero casualmente tambien cambiaba una noticia, una mirada o una deuda emocional.',
        tone: 'Antropologia de barrio, chisme fino y lectura social juguetona.'
      },
      yanislaidis: {
        angle: 'Yanislaidis se burla de la energia del levante, pero entiende que algunas mujeres usan amuletos para sentirse mas dueñas de si.',
        opening: 'La Mame con su energia del levante me da risa, pero no te voy a mentir: hay mujeres que se ponen una pulsera y caminan como si llevaran escolta.',
        line: 'Si aquello protegia o no, no se; pero a mas de una le dio valor para decir que no, y mira, eso ya es bastante magia.',
        tone: 'Picardia callejera, respeto por la autonomia femenina y burla carinosa de lo alternativo.'
      }
    }
  },
  {
    id: 'irving-cuadro-sin-terminar',
    title: 'El cuadro que Irving dejo sin terminar',
    tags: ['irving', 'cuadro', 'retrato', 'pintura', 'pintar', 'boceto', 'guanabacoa', 'yanislaidis', 'new york', 'nueva york', 'artista', 'poeta', 'inconcluso', 'sin terminar'],
    summary: 'Irving empezo un retrato de Yanislaidis antes de irse a New York. Nadie sabe bien si lo dejo sin terminar por cobardia, amor o porque vio demasiado.',
    versions: {
      domingo: {
        angle: 'Domingo cree que Irving no termino el cuadro porque hay cosas que el arte ve antes que la persona se atreva a decir.',
        opening: 'Irving dejo un cuadro sin terminar, si... pero a veces lo inconcluso dice mas que la firma.',
        line: 'Ese muchacho pintaba como quien preguntaba. Y con Yanislaidis parece que la pregunta le quedo demasiado grande para el lienzo.',
        tone: 'Profesor viejo, poetico sin empalagar, con orgullo por el alumno y cuidado por la herida ajena.'
      },
      paco: {
        angle: 'Paco ve el cuadro como otro ejemplo de hombre romantico que sale corriendo antes de terminar lo que empezo.',
        opening: 'Lo del cuadro de Irving es muy de artista, quillo: empezar con misterio y largarse antes de recoger los pinceles.',
        line: 'Eso en Cadiz te sale en copla: "Niña, quédate quieta, que voy a pintarte un cuadro que va a ser la envidia de la Caleta". La puso en el sofa, con su bata y sus encajes, pero se distrajo un poco buscando otros paisajes. Le dibujo los ojos, que eran dos luceros, y bajando por el cuello le entro ansia de marinero. Iba por la cintura, con el pincel ya temblando, y cuando llego a las dunas... se quedo a medio pintando.',
        tone: 'Guasa gaditana de chirigota, picara y cantable; debe sonar a copla de carnaval, con broma y ternura, no a comentario invasivo.'
      },
      manisera: {
        angle: 'La manisera recuerda el cuadro desde lo concreto: Irving comprando mani, callado, con manos de pintura y mirada de despedida.',
        opening: 'Ay, Irving... yo lo vi mas de una vez con las manos manchadas de pintura y una tristeza calladita que no compraba nadie.',
        line: 'A lo mejor se le acabo la pintura, mi vida. Yo le hubiera dejado unos plumones y a lo mejor no se hubiera ido a New York.',
        tone: 'Ternura de calle, memoria practica y melancolia suave.'
      },
      'marta-nora': {
        angle: 'Marta Nora quiere saber donde esta el cuadro porque sospecha que en lo que falta se entiende mejor el romance.',
        opening: 'El cuadro de Irving es exactamente el tipo de cosa que nadie enseña porque dice demasiado.',
        line: 'A mi no me interesa solo lo que pinto; me interesa lo que dejo en blanco. En un retrato, el silencio tambien tiene forma.',
        tone: 'Chisme fino, lectura estetica y curiosidad inteligente.'
      },
      yanislaidis: {
        angle: 'Yanislaidis niega que el cuadro le importe, pero el tema le baja la voz: sabe que Irving la miro con una ternura que despues no supo sostener.',
        opening: 'Ese cuadro... mira, no me hables muy alto de eso, que hay cosas que una guarda aunque diga que no.',
        line: 'Irving me miraba como si fuera a pintarme completa, y despues se fue a New York dejandome medio retrato y una rabia preciosa.',
        tone: 'Picardia contenida, orgullo herido, ternura peligrosa y cero victimismo.'
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
