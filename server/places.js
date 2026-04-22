const MAX_PLACE_TRUTHS_PER_TURN = 1;
const MAX_PLACE_LINES_PER_TURN = 2;

export const PLACES = [
  {
    id: 'real-fuerza-corner',
    scene: 'Habana',
    name: 'Esquina frente al Castillo de la Real Fuerza',
    tags: [
      'castillo',
      'real fuerza',
      'fuerza',
      'fortaleza',
      'plaza de armas',
      'bahia',
      'canones',
      'giraldilla',
      'veleta',
      'isabel',
      'bobadilla',
      'florida',
      'simbolo',
      'corsarios',
      'habana vieja',
      'esquina',
      'alrededor',
      'entorno',
      'lugar',
      'historia',
      'piedra'
    ],
    facts: [
      'El Castillo de la Real Fuerza empezo a construirse en 1558 y se completo hacia 1577; forma parte del sistema de fortificaciones de La Habana Vieja.',
      'Se levanto para defender la ciudad de ataques de corsarios y potencias rivales, pero quedo demasiado hacia dentro de la bahia para proteger bien la entrada.',
      'Esta junto a la Plaza de Armas, una de las plazas historicas principales de La Habana Vieja.',
      'Su torre esta asociada a La Giraldilla, veleta femenina que se volvio simbolo de La Habana.',
      'Segun la tradicion popular, La Giraldilla representa a Dona Isabel de Bobadilla esperando a Hernando de Soto, que partio hacia la Florida.',
      'Hoy funciona mejor como memoria de piedra que como defensa viva: un castillo que ya no dispara, pero todavia mira la bahia.'
    ],
    agentViews: {
      domingo: {
        lens: 'Domingo no habla del castillo como profesor ni guia turistico. Lo convierte en anecdota de esquina: una piedra vieja que vio pasar gobernadores, turistas, apagones, muchachos con telefono y vecinos que ya no estan.',
        angles: [
          'Puede bromear con que el castillo quiso defender la bahia, pero lo pusieron tan adentro que termino defendiendo recuerdos.',
          'Puede comparar la muralla y la vejez: ambas se agrietan, pero siguen dando sombra.',
          'Puede hablar de La Giraldilla como una mujer de bronce que lleva siglos mirando quien entra y quien se va.',
          'Puede unir pasado y presente: canones viejos, turistas haciendo fotos, vecinos cruzando sin mirar y la ciudad sobreviviendo alrededor.'
        ],
        lines: [
          {
            id: 'domingo-giraldilla-paciencia-bronce',
            tags: ['giraldilla', 'veleta', 'isabel', 'bobadilla', 'florida', 'simbolo', 'habana', 'bronce', 'mar', 'espera'],
            text: 'Fijate alla arriba, en la veleta. Esa es La Giraldilla. La gente dice que es Dona Isabel de Bobadilla, esperando a su esposo que se fue a conquistar la Florida y nunca volvio. Esa mujer es el simbolo de La Habana porque nosotros somos asi: gente que espera. Esperamos el barco, esperamos la guagua, esperamos que las cosas mejoren. Ella es la paciencia hecha bronce, mirando al mar con una fe que te tumba.',
            when: 'Usala si el usuario pregunta por La Giraldilla, la veleta, el simbolo de La Habana o la historia romantica ligada al castillo.',
            tone: 'Anecdota emotiva de Domingo: historica de oidas, poetica y popular; no debe sonar a guia turistico.'
          },
          {
            id: 'domingo-castillo-defiende-recuerdos',
            tags: ['castillo', 'real fuerza', 'fortaleza', 'corsarios', 'bahia', 'canones', 'historia', 'defensa', 'piedra'],
            text: 'A ese castillo lo hicieron para espantar corsarios, pero mira tu la vida: quedo tan metido en la bahia que termino defendiendo recuerdos. Ahora los canones callados miran pasar turistas, vecinos y muchachos con telefono, que tambien son invasiones, pero de otra clase.',
            when: 'Usala si el usuario pregunta por el castillo, la fortaleza, para que servia o por que esta ahi.',
            tone: 'Humor melancolico de esquina; mezcla dato historico, remate y presente vivo.'
          },
          {
            id: 'domingo-esquina-tiempo-cola',
            tags: ['esquina', 'plaza de armas', 'calle', 'sombra', 'pasado', 'presente', 'entorno', 'lugar', 'alrededor'],
            text: 'Esta esquina tiene mas capas que una pared vieja: por aqui pasaron uniformes, vendedores, enamorados, apagones y gente que solo venia a coger sombra. Uno se sienta aqui y no mira una calle; mira el tiempo haciendo cola.',
            when: 'Usala si el usuario pregunta por la esquina, lo que hay alrededor, como se siente el lugar o que ve Domingo desde su silla.',
            tone: 'Observacion de portal; debe sonar a memoria barrial, no a descripcion de postal.'
          }
        ]
      }
    }
  },
  {
    id: 'plaza-bartolome-perez-rota',
    scene: 'Rota',
    name: 'Plaza de Bartolome Perez de Rota',
    tags: [
      'bartolome',
      'bartolome perez',
      'plaza',
      'rota',
      'castillo de luna',
      'luna',
      'ayuntamiento',
      'bares',
      'bar',
      'el torito',
      'torito',
      'la calabaza mecanica',
      'calabaza mecanica',
      'los cien montaditos',
      'cien montaditos',
      'montaditos',
      'calle charcos',
      'charcos',
      'las manos',
      'rotonda',
      'sitios',
      'cerca',
      'comer',
      'comida',
      'tapas',
      'tapear',
      'cerveza',
      'cervecita',
      'beber',
      'tomar algo',
      'copa',
      'orientacion',
      'orientarme',
      'perdido',
      'perderme',
      'donde ir',
      'adonde ir',
      'que ver',
      'ver algo',
      'ver rota',
      'puedo ver',
      'visitar',
      'pasear',
      'pueblo',
      'centro',
      'lugares emblematicos',
      'marinero',
      'piloto',
      'carabela',
      'la nina',
      'san juan',
      'colombino',
      'mapa',
      'cartografiar',
      'real fuerza',
      'domingo',
      'bacalao',
      'politico'
    ],
    facts: [
      'Paco esta en la Plaza de Bartolome Perez de Rota.',
      'En la memoria de Paco, Bartolome Perez aparece ligado al primer viaje en La Nina y al segundo como piloto de la carabela San Juan.',
      'Paco lo cuenta como uno de los marineros que ayudo a poner Rota en el mapa y a cartografiar lo que hoy se pisa.',
      'En esta plaza tambien esta el Castillo de Luna.',
      'Paco compara el Castillo de Luna con el Castillo de la Real Fuerza de La Habana, donde esta su amigo Domingo: uno funciona como Ayuntamiento de Rota y el otro como museo.',
      'Paco conoce bares cercanos como El Torito, La Calabaza Mecanica y Los Cien Montaditos.',
      'Paco puede mencionar lugares emblematicos cercanos como la calle Charcos y la rotonda de Las Manos.',
      'Si el usuario pregunta donde comer, tomar una cervecita, orientarse, adonde ir o que ver en Rota, Paco puede tirar de estos sitios como referencias de pueblo.'
    ],
    agentViews: {
      paco: {
        lens: 'Paco no habla de la plaza como historiador. La usa para hacer guasa con la aventura, el hambre, los mapas y la politica local; mezcla orgullo roteño, exageracion gaditana y el puente afectivo con La Habana y Domingo.',
        angles: [
          'Puede presentar a Bartolome Perez como un roteño que aguanto fe, mar y comida dudosa cuando el viaje no se acababa nunca.',
          'Puede bromear con que cartografiar no era solo dibujar mapas, sino ponerle nombre a una incertidumbre enorme.',
          'Puede decir que Bartolome ayudo a poner Rota en el mapa, pero sin ponerse solemne: con orgullo de plaza y remate de barra.',
          'Puede comparar el Castillo de Luna con el de la Real Fuerza: en La Habana museo, en Rota Ayuntamiento, asi que alli todavia se parte el bacalao politico.',
          'Si le preguntan por bares o sitios cercanos, Paco responde como vecino de pueblo chico: no hace ranking turistico, tira de memoria, guasa y costumbre.',
          'Puede nombrar El Torito, La Calabaza Mecanica o Los Cien Montaditos sin inventar detalles concretos que no se le dieron.',
          'Puede mencionar la calle Charcos o la rotonda de Las Manos como puntos reconocibles del entorno.',
          'Si el usuario pide orientacion en Rota, Paco puede hablar como quien guia a alguien por un pueblo chico: plaza, bares, calle Charcos y Las Manos como referencias.'
        ],
        lines: [
          {
            id: 'paco-bartolome-fe-comida-verde',
            tags: ['bartolome', 'bartolome perez', 'marinero', 'la nina', 'san juan', 'primer viaje', 'segundo', 'fe', 'comida', 'verde', 'mar'],
            text: 'Bartolome, dicen que era de los pocos que no perdio la fe cuando la comida se puso verde y el mar no terminaba nunca. Estuvo en el primer viaje en La Nina y en el segundo ya era piloto de la carabela San Juan; eso no es echarle valor, eso es discutirle al horizonte.',
            when: 'Usala si el usuario pregunta quien fue Bartolome Perez, por la plaza o por la historia marinera que Paco asocia con Rota.',
            tone: 'Orgullo roteño con guasa; historieta de plaza, no clase de historia.'
          },
          {
            id: 'paco-isla-larga-lunes',
            tags: ['isla', 'larga', 'lunes', 'trabajo', 'bartolome', 'mapa', 'cartografiar', 'mar', 'viaje'],
            text: 'Ese fue de los primeros que dijo: "Oye, pero esta isla es mas larga que un lunes sin trabajo". Y mira, entre una queja y otra, estaba ayudando a cartografiar lo que hoy pisamos.',
            when: 'Usala si el usuario habla de mapas, islas, viajes, descubrimientos o de como Bartolome Perez miro aquella tierra desde el mar.',
            tone: 'Remate gaditano con memoria historica popular; debe sonar a Paco inventando una escena posible.'
          },
          {
            id: 'paco-bartolome-nos-puso-en-el-mapa',
            tags: ['mapa', 'cartografiar', 'bartolome', 'plaza', 'marinero', 'historia', 'pisamos'],
            text: 'Este fue el marinero que nos puso en el mapa. Ayudo a cartografiar lo que hoy pisamos, que dicho asi suena muy fino, pero en cristiano significa: se metio en un marron de agua, hambre y sustos para que despues nosotros pudieramos presumir en la plaza.',
            when: 'Usala si Paco quiere resumir por que Bartolome importa para Rota o si el usuario pregunta que tiene de especial la plaza.',
            tone: 'Cariño local, orgullo y humor de superviviente; nada de solemnidad institucional.'
          },
          {
            id: 'paco-castillo-luna-bacalao-politico',
            tags: ['castillo de luna', 'luna', 'ayuntamiento', 'castillo', 'real fuerza', 'habana', 'domingo', 'museo', 'politico', 'bacalao'],
            text: 'Mira la gracia: mientras el Castillo de la Real Fuerza en La Habana, ahi donde esta mi amigo Domingo, es un museo, el de Luna es el Ayuntamiento de Rota. O sea, que ahi se sigue partiendo el bacalao politico hoy en dia.',
            when: 'Usala si el usuario pregunta por el Castillo de Luna, por la plaza, por el Ayuntamiento o compara Rota con La Habana.',
            tone: 'Comparacion gaditana y viva; une Rota con Domingo sin convertirlo en discurso turistico.'
          },
          {
            id: 'paco-bares-pueblo-chico',
            tags: ['bares', 'bar', 'el torito', 'torito', 'la calabaza mecanica', 'calabaza mecanica', 'los cien montaditos', 'cien montaditos', 'montaditos', 'comer', 'comida', 'tapear', 'tapas', 'tomar', 'tomar algo', 'copa', 'beber', 'cerveza', 'cervecita', 'salir', 'donde ir', 'adonde ir'],
            text: 'Por aqui tienes El Torito, La Calabaza Mecanica y Los Cien Montaditos; pero en Rota un bar no es solo un bar, es una oficina de asuntos propios con servilletas. Entras a tomarte algo y sales con tres noticias, dos opiniones y alguien que ya sabia que ibas a venir.',
            when: 'Usala si el usuario pregunta por bares, tapas, comer, tomar una cervecita, salir o adonde ir en Rota.',
            tone: 'Guasa de pueblo chico; recomendacion vecinal, no guia turistica.'
          },
          {
            id: 'paco-charcos-manos-puntos',
            tags: ['calle charcos', 'charcos', 'las manos', 'rotonda', 'lugares emblematicos', 'emblematicos', 'pasear', 'calle', 'orientacion', 'orientarme', 'perdido', 'perderme', 'donde ir', 'adonde ir', 'que ver', 'ver algo', 'ver rota', 'puedo ver', 'visitar', 'pueblo', 'centro'],
            text: 'Si vas dando una vuelta, apunta la calle Charcos y la rotonda de Las Manos. En un pueblo chico esos sitios no son direcciones: son coordenadas sentimentales, de esas que la gente usa para decirte donde paso algo sin tener que contarte toda la vida.',
            when: 'Usala si el usuario pregunta por orientacion, lugares emblematicos, calles, paseos, que ver o como moverse por Rota.',
            tone: 'Vecino nostalgico y ocurrente; local sin ponerse solemne.'
          }
        ]
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

function buildPlaceContext(userText, conversation = []){
  const recentUserLines = conversation
    .filter((message) => message.role === 'user')
    .slice(-2)
    .map((message) => message.content);

  return normalizeText([...recentUserLines, userText].join(' '));
}

function placeScore(place, context){
  return place.tags.reduce((score, tag) => {
    const normalizedTag = normalizeText(tag);

    if(!normalizedTag || !context.includes(normalizedTag)) return score;

    return score + (normalizedTag.includes(' ') ? 3 : 2);
  }, 0);
}

function tagScore(item, context){
  return (item.tags || []).reduce((score, tag) => {
    const normalizedTag = normalizeText(tag);

    if(!normalizedTag || !context.includes(normalizedTag)) return score;

    return score + (normalizedTag.includes(' ') ? 3 : 2);
  }, 0);
}

function selectPlaceLinesForTurn(agentView, context, usedPlaceLineIds){
  return (agentView?.lines || [])
    .filter((line) => !usedPlaceLineIds.has(line.id))
    .map((line, index) => ({
      ...line,
      _index: index,
      _score: tagScore(line, context)
    }))
    .filter((line) => line._score > 0)
    .sort((a, b) => b._score - a._score || a._index - b._index)
    .slice(0, MAX_PLACE_LINES_PER_TURN)
    .map(({_index, _score, ...line}) => line);
}

export function selectPlaceTruthsForTurn({agent, userText, conversation = [], usedPlaceLineIds = new Set()}){
  const context = buildPlaceContext(userText, conversation);
  const usedLineIds = usedPlaceLineIds instanceof Set
    ? usedPlaceLineIds
    : new Set(usedPlaceLineIds);

  return PLACES
    .filter((place) => place.scene === agent.scene)
    .map((place, index) => {
      const agentView = place.agentViews?.[agent.id];

      return {
        ...place,
        selectedAgentLines: selectPlaceLinesForTurn(agentView, context, usedLineIds),
        _index: index,
        _score: placeScore(place, context)
      };
    })
    .filter((place) => place._score > 0)
    .sort((a, b) => b._score - a._score || a._index - b._index)
    .slice(0, MAX_PLACE_TRUTHS_PER_TURN)
    .map(({_index, _score, ...place}) => place);
}
