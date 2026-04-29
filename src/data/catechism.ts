export interface CatechismData {
  id: string;
  paragraph: number;
  tipo: "catecismo";
  titulo: string;
  conteudo: string;
  tags: string[];
  textoBase?: string;
  explicacao?: string;
  interpretacaoProfunda?: string;
  aplicacaoPratica?: string;
  reflexaoFinal?: string;
  exercicio?: string;
}

export const CATECHISM_LOCAL_DATA: Record<number, CatechismData> = {
  1: {
    id: "cat_1",
    paragraph: 1,
    tipo: "catecismo",
    titulo: "O desígnio de Deus para o homem",
    conteudo: "Deus, infinitamente perfeito e bem-aventurado em si mesmo, num desígnio de pura bondade, criou livremente o homem para o tornar participante da sua vida bem-aventurada. É por isso que, em todo o tempo e em todo o lugar, Ele está perto do homem.",
    tags: ["criacao", "amor", "presenca-de-deus"],
    textoBase: "Deus criou o homem para o tornar participante da sua vida.",
    explicacao: "Este parágrafo estabelece o fundamento de toda a fé: fomos criados por amor e para o amor.",
    interpretacaoProfunda: "A vida cristã não é um esforço humano, mas uma resposta ao chamado divino que está sempre 'perto do homem'.",
    aplicacaoPratica: "Reconheça a presença de Deus em seu dia a dia, pois Ele nunca está longe.",
    reflexaoFinal: "Você se sente um filho adotivo de Deus?",
    exercicio: "Faça uma oração de agradecimento pela sua criação."
  },
  27: {
    id: "cat_27",
    paragraph: 27,
    tipo: "catecismo",
    titulo: "O desejo de Deus",
    conteudo: "O desejo de Deus está inscrito no coração do homem, porque o homem foi criado por Deus e para Deus; e Deus não deixa de atrair o homem para Si, e só em Deus é que o homem encontra a verdade e a felicidade que não cessa de procurar.",
    tags: ["desejo", "felicidade", "busca-de-deus"],
    textoBase: "O homem tem um desejo natural de Deus.",
    explicacao: "Nascemos com um 'vazio' que só Deus pode preencher.",
    interpretacaoProfunda: "A inquietação humana é, na verdade, uma busca pelo Infinito.",
    aplicacaoPratica: "Identifique hoje o que você busca para ser feliz e veja se isso aponta para Deus.",
    reflexaoFinal: "O que realmente satisfaz o seu coração?",
    exercicio: "Passe 5 minutos em silêncio ouvindo o desejo de Deus em sua alma."
  },
  67: {
    id: "cat_67",
    paragraph: 67,
    tipo: "catecismo",
    titulo: "Revelações Privadas",
    conteudo: "Ao longo dos séculos tem havido revelações ditas 'privadas', algumas das quais foram reconhecidas pela autoridade da Igreja. Elas não pertencem, contudo, ao depósito da fé. O seu papel não é 'aperfeiçoar' ou 'completar' a Revelação definitiva de Cristo, mas ajudar a vivê-la mais plenamente numa determinada época da história.",
    tags: ["revelacao", "fe", "aparicoes"],
    textoBase: "Revelações privadas ajudam a viver a fé, mas não a completam.",
    explicacao: "A Igreja reconhece algumas aparições, mas a base da nossa fé é a Escritura e a Tradição.",
    interpretacaoProfunda: "Nada pode ser adicionado ao que Cristo nos revelou.",
    aplicacaoPratica: "Ao ouvir sobre uma aparição, veja se ela te leva para mais perto de Jesus e da Igreja.",
    reflexaoFinal: "Sua fé está baseada em Cristo ou em fenômenos extraordinários?",
    exercicio: "Leia um trecho do Evangelho hoje para se enraizar na Revelação Pública."
  },
  1324: {
    id: "cat_1324",
    paragraph: 1324,
    tipo: "catecismo",
    titulo: "A Eucaristia, fonte e cume",
    conteudo: "A Eucaristia é «fonte e cume de toda a vida cristã». «Os restantes sacramentos, assim como todos os ministérios eclesiásticos e obras de apostolado, estão vinculados à sagrada Eucaristia e a ela se ordenam. Com efeito, a santíssima Eucaristia contém todo o tesouro espiritual da Igreja, isto é, o próprio Cristo, a nossa Páscoa».",
    tags: ["eucaristia", "sacramentos", "presenca-real"],
    textoBase: "A Eucaristia é fonte e cume de toda a vida cristã.",
    explicacao: "Toda a vida da Igreja gira em torno da presença real de Cristo no altar.",
    interpretacaoProfunda: "A Eucaristia não é apenas um símbolo, mas a posse antecipada da vida eterna.",
    aplicacaoPratica: "Participe da Missa com a consciência de que está diante do próprio Deus.",
    reflexaoFinal: "Como a Eucaristia transforma o seu cotidiano?",
    exercicio: "Planeje uma visita ao Santíssimo Sacramento hoje."
  },
  2558: {
    id: "cat_2558",
    paragraph: 2558,
    tipo: "catecismo",
    titulo: "O que é a Oração?",
    conteudo: "«A oração é a elevação da alma a Deus ou o pedido a Deus dos bens convenientes». Donde falamos nós, ao rezar? Da altura do nosso orgulho e vontade própria, ou das «profundezas» (Sl 130, 1) dum coração humilde e contrito? Aquele que se humilha será exaltado. A humildade é o fundamento da oração.",
    tags: ["oracao", "humildade", "espiritualidade"],
    textoBase: "A humildade é o fundamento da oração.",
    explicacao: "Rezar não é convencer Deus, mas elevar nossa alma a Ele com humildade.",
    interpretacaoProfunda: "A oração é o encontro da sede de Deus com a sede do homem.",
    aplicacaoPratica: "Comece sua oração hoje reconhecendo sua pequenez diante do Criador.",
    reflexaoFinal: "De onde nasce a sua oração?",
    exercicio: "Reze o Salmo 130 (De profundis) com atenção."
  }
};

export const getAllLocalCatechism = () => Object.values(CATECHISM_LOCAL_DATA);
