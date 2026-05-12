export interface CatechismData {
  id: string;
  paragraph: number;
  tipo: "catecismo";
  type: "catechism"; // Consistency with Nexus
  titulo: string;
  conteudo: string;
  tags: string[];
  textoBase?: string;
}

export const CATECHISM_LOCAL_DATA: Record<number, CatechismData> = {
  1: {
    id: "cat_1",
    paragraph: 1,
    tipo: "catecismo",
    type: "catechism",
    titulo: "O desígnio de Deus para o homem",
    conteudo: "Deus, infinitamente perfeito e bem-aventurado em Si mesmo, num desígnio de pura bondade, criou livremente o homem para o tornar participante da sua vida bem-aventurada. Por isso, sempre e em toda a parte, Ele está próximo do homem. Chama-o e ajuda-o a procurá-Lo, a conhecê-Lo e a amá-Lo com todas as suas forças. Convoca todos os homens, dispersos pelo pecado, para a unidade da sua família que é a Igreja. Para tal, enviou o seu Filho como Redentor e Salvador na plenitude dos tempos. N'Ele e por Ele, chama os homens a tornarem-se, no Espírito Santo, seus filhos adoptivos e, portanto, herdeiros da sua vida bem-aventurada.",
    tags: ["criacao", "amor", "presenca-de-deus"],
    textoBase: "Deus criou o homem para o tornar participante da sua vida."
  },
  27: {
    id: "cat_27",
    paragraph: 27,
    tipo: "catecismo",
    type: "catechism",
    titulo: "O desejo de Deus",
    conteudo: "O desejo de Deus é um sentimento inscrito no coração do homem, porque o homem foi criado por Deus e para Deus. Deus não cessa de atrair o homem para Si e só em Deus é que o homem encontra a verdade e a felicidade que procura sem descanso: «A razão mais sublime da dignidade humana consiste na sua vocação à comunhão com Deus. Desde o começo da sua existência, o homem é convidado a dialogar com Deus: pois se existe, é só porque, criado por Deus por amor, é por Ele, e por amor, constantemente conservado: nem pode viver plenamente segundo a verdade, se não reconhecer livremente esse amor e não se entregar ao seu Criador».",
    tags: ["desejo", "felicidade", "busca-de-deus"],
    textoBase: "O homem tem um desejo natural de Deus."
  },
  67: {
    id: "cat_67",
    paragraph: 67,
    tipo: "catecismo",
    type: "catechism",
    titulo: "Revelações Privadas",
    conteudo: "Ao longo dos séculos tem havido revelações ditas 'privadas', algumas das quais foram reconhecidas pela autoridade da Igreja. Elas não pertencem, contudo, ao depósito da fé. O seu papel não é 'aperfeiçoar' ou 'completar' a Revelação definitiva de Cristo, mas ajudar a vivê-la mais plenamente numa determinada época da história.",
    tags: ["revelacao", "fe", "aparicoes"],
    textoBase: "Revelações privadas ajudam a viver a fé, mas não a completam."
  },
  142: {
    id: "cat_142",
    paragraph: 142,
    tipo: "catecismo",
    type: "catechism",
    titulo: "A fé",
    conteudo: "Pela fé, o homem submete completamente sua inteligência e vontade a Deus.",
    tags: ["fe", "verdade", "deus"]
  },
  143: {
    id: "cat_143",
    paragraph: 143,
    tipo: "catecismo",
    type: "catechism",
    titulo: "Obediência da fé",
    conteudo: "Pela fé, o homem entrega-se livremente a Deus.",
    tags: ["fe", "obediencia", "deus"]
  },
  150: {
    id: "cat_150",
    paragraph: 150,
    tipo: "catecismo",
    type: "catechism",
    titulo: "Crer é um ato humano",
    conteudo: "Crer é um ato humano, consciente e livre.",
    tags: ["fe", "liberdade"]
  },
  211: {
    id: "cat_211",
    paragraph: 211,
    tipo: "catecismo",
    type: "catechism",
    titulo: "O Nome de Deus",
    conteudo: "Ao revelar o seu nome misterioso de YHWH, «Eu Sou Aquele que Sou», ou «Eu Sou Aquele que É», ou ainda «Eu Sou Quem Eu Sou», Deus diz quem Ele é e por que nome se deve chamá-Lo.",
    tags: ["deus", "nome-de-deus", "revelacao"]
  },
  422: {
    id: "cat_422",
    paragraph: 422,
    tipo: "catecismo",
    type: "catechism",
    titulo: "Jesus Cristo",
    conteudo: "«Mas, quando veio a plenitude dos tempos, Deus enviou o seu Filho, nascido de uma mulher, nascido sob a Lei, para resgatar os que estavam sob a Lei, a fim de recebermos a adoção de filhos» (Gl 4, 4-5).",
    tags: ["jesus", "encarnacao", "redencao"]
  },
  683: {
    id: "cat_683",
    paragraph: 683,
    tipo: "catecismo",
    type: "catechism",
    titulo: "O Espírito Santo",
    conteudo: "«Ninguém pode dizer: 'Jesus é o Senhor', a não ser sob a ação do Espírito Santo» (1 Cor 12, 3). «Deus enviou aos nossos corações o Espírito do seu Filho, que clama: Abba, Pai!» (Gl 4, 6).",
    tags: ["espirito-santo", "fe", "trindade"]
  },
  1324: {
    id: "cat_1324",
    paragraph: 1324,
    tipo: "catecismo",
    type: "catechism",
    titulo: "A Eucaristia, fonte e cume",
    conteudo: "A Eucaristia é «fonte e cume de toda a vida cristã». «Os restantes sacramentos, assim como todos os ministérios eclesiásticos e obras de apostolado, estão vinculados à sagrada Eucaristia e a ela se ordenam. Com efeito, a santíssima Eucaristia contém todo o tesouro espiritual da Igreja, isto é, o próprio Cristo, a nossa Páscoa».",
    tags: ["eucaristia", "sacramentos", "presenca-real"]
  },
  1814: {
    id: "cat_1814",
    paragraph: 1814,
    tipo: "catecismo",
    type: "catechism",
    titulo: "Virtude da fé",
    conteudo: "A fé é a virtude teologal pela qual cremos em Deus.",
    tags: ["fe", "virtudes"]
  },
  1822: {
    id: "cat_1822",
    paragraph: 1822,
    tipo: "catecismo",
    type: "catechism",
    titulo: "A caridade",
    conteudo: "A caridade é a virtude teologal pela qual amamos a Deus sobre todas as coisas.",
    tags: ["amor", "caridade", "deus"]
  },
  1823: {
    id: "cat_1823",
    paragraph: 1823,
    tipo: "catecismo",
    type: "catechism",
    titulo: "Amor ao próximo",
    conteudo: "Jesus faz do amor ao próximo o novo mandamento.",
    tags: ["amor", "relacionamentos"]
  },
  1849: {
    id: "cat_1849",
    paragraph: 1849,
    tipo: "catecismo",
    type: "catechism",
    titulo: "O pecado",
    conteudo: "O pecado é uma falta contra a razão, a verdade e a consciência.",
    tags: ["pecado", "verdade"]
  },
  1855: {
    id: "cat_1855",
    paragraph: 1855,
    tipo: "catecismo",
    type: "catechism",
    titulo: "Pecado mortal",
    conteudo: "O pecado mortal destrói a caridade no coração do homem.",
    tags: ["pecado", "amor"]
  },
  1863: {
    id: "cat_1863",
    paragraph: 1863,
    tipo: "catecismo",
    type: "catechism",
    titulo: "Pecado venial",
    conteudo: "O pecado venial enfraquece a caridade.",
    tags: ["pecado"]
  },
  1996: {
    id: "cat_1996",
    paragraph: 1996,
    tipo: "catecismo",
    type: "catechism",
    titulo: "Graça",
    conteudo: "A graça é o favor, o auxílio gratuito que Deus nos dá.",
    tags: ["graca", "deus"]
  },
  2001: {
    id: "cat_2001",
    paragraph: 2001,
    tipo: "catecismo",
    type: "catechism",
    titulo: "Ação da graça",
    conteudo: "A preparação do homem para acolher a graça é obra de Deus.",
    tags: ["graca"]
  },
  2087: {
    id: "cat_2087",
    paragraph: 2087,
    tipo: "catecismo",
    type: "catechism",
    titulo: "Dúvida na fé",
    conteudo: "A dúvida pode levar à negligência da fé.",
    tags: ["duvida", "fe"]
  },
  2090: {
    id: "cat_2090",
    paragraph: 2090,
    tipo: "catecismo",
    type: "catechism",
    titulo: "Esperança",
    conteudo: "A esperança é a virtude teologal pela qual desejamos o Reino dos Céus.",
    tags: ["esperanca", "fe"]
  },
  2092: {
    id: "cat_2092",
    paragraph: 2092,
    tipo: "catecismo",
    type: "catechism",
    titulo: "Desespero",
    conteudo: "O desespero é a perda da esperança na salvação.",
    tags: ["desanimo", "esperanca"]
  },
  2558: {
    id: "cat_2558",
    paragraph: 2558,
    tipo: "catecismo",
    type: "catechism",
    titulo: "O que é a Oração?",
    conteudo: "«Grande é o mistério da fé». A Igreja confessa-o no Símbolo dos Apóstolos e celebra-o na liturgia sacramental, para que a vida dos fiéis seja conformada com Cristo no Espírito Santo para glória de Deus Pai. Este mistério exige, pois, que os fiéis nele creiam, o celebrem e dele vivam, numa relação viva e pessoal com o Deus vivo e verdadeiro. Esta relação é a oração.",
    tags: ["oracao", "humildade", "espiritualidade"],
    textoBase: "A humildade é o fundamento da oração."
  },
  2559: {
    id: "cat_2559",
    paragraph: 2559,
    tipo: "catecismo",
    type: "catechism",
    titulo: "A oração",
    conteudo: "«A oração é a elevação da alma a Deus ou o pedido a Deus dos bens convenientes». Donde falamos nós, ao rezar? Da altura do nosso orgulho e vontade própria, ou das «profundezas» (Sl 130, 1) dum coração humilde e contrito? Aquele que se humilha será exaltado. A humildade é o fundamento da oração.",
    tags: ["oracao", "deus"]
  },
  2565: {
    id: "cat_2565",
    paragraph: 2565,
    tipo: "catecismo",
    type: "catechism",
    titulo: "Encontro com Deus",
    conteudo: "Na oração, o homem entra em relação com Deus.",
    tags: ["oracao", "relacao_com_deus"]
  },
  2609: {
    id: "cat_2609",
    paragraph: 2609,
    tipo: "catecismo",
    type: "catechism",
    titulo: "Confiança na oração",
    conteudo: "A oração deve ser feita com confiança.",
    tags: ["oracao", "fe", "confianca"]
  }
};

export const getAllLocalCatechism = () => Object.values(CATECHISM_LOCAL_DATA);

export const CIC_SECTIONS = [
  {
    part: 'Introdução',
    title: 'Prólogo',
    sections: [
      { id: 0, title: 'Prólogo: A vida do homem é conhecer e amar a Deus', paragraphs: [1, 25] },
    ],
  },
  {
    part: 'Parte I',
    title: 'A Profissão de Fé',
    sections: [
      { id: 1, title: 'Eu Creio — Nós Cremos', paragraphs: [26, 184] },
      { id: 2, title: 'Creio em Deus Pai', paragraphs: [185, 421] },
      { id: 3, title: 'Creio em Jesus Cristo', paragraphs: [422, 682] },
      { id: 4, title: 'Creio no Espírito Santo', paragraphs: [683, 1065] },
    ],
  },
  {
    part: 'Parte II',
    title: 'A Celebração do Mistério Cristão',
    sections: [
      { id: 5, title: 'A Economia Sacramental', paragraphs: [1066, 1209] },
      { id: 6, title: 'Os Sete Sacramentos', paragraphs: [1210, 1690] },
    ],
  },
  {
    part: 'Parte III',
    title: 'A Vida em Cristo',
    sections: [
      { id: 7, title: 'A Vocação do Homem', paragraphs: [1691, 2051] },
      { id: 8, title: 'Os Dez Mandamentos', paragraphs: [2052, 2557] },
    ],
  },
  {
    part: 'Parte IV',
    title: 'A Oração Cristã',
    sections: [
      { id: 9, title: 'A Oração na Vida Cristã', paragraphs: [2558, 2758] },
      { id: 10, title: 'O Pai Nosso', paragraphs: [2759, 2865] },
    ],
  },
];

