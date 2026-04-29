export interface CatechismParagraph {
  id: string;
  tipo: "catecismo";
  numero: number;
  titulo: string;
  conteudo: string;
  tags: string[];
}

export const catecismo: CatechismParagraph[] = [
  {
    id: "cat_142",
    tipo: "catecismo",
    numero: 142,
    titulo: "A fé",
    conteudo: "Pela fé, o homem submete completamente sua inteligência e vontade a Deus.",
    tags: ["fe", "verdade", "deus"]
  },
  {
    id: "cat_143",
    tipo: "catecismo",
    numero: 143,
    titulo: "Obediência da fé",
    conteudo: "Pela fé, o homem entrega-se livremente a Deus.",
    tags: ["fe", "obediencia", "deus"]
  },
  {
    id: "cat_150",
    tipo: "catecismo",
    numero: 150,
    titulo: "Crer é um ato humano",
    conteudo: "Crer é um ato humano, consciente e livre.",
    tags: ["fe", "liberdade"]
  },
  {
    id: "cat_1814",
    tipo: "catecismo",
    numero: 1814,
    titulo: "Virtude da fé",
    conteudo: "A fé é a virtude teologal pela qual cremos em Deus.",
    tags: ["fe", "virtudes"]
  },
  {
    id: "cat_1822",
    tipo: "catecismo",
    numero: 1822,
    titulo: "A caridade",
    conteudo: "A caridade é a virtude teologal pela qual amamos a Deus sobre todas as coisas.",
    tags: ["amor", "caridade", "deus"]
  },
  {
    id: "cat_1823",
    tipo: "catecismo",
    numero: 1823,
    titulo: "Amor ao próximo",
    conteudo: "Jesus faz do amor ao próximo o novo mandamento.",
    tags: ["amor", "relacionamentos"]
  },
  {
    id: "cat_2090",
    tipo: "catecismo",
    numero: 2090,
    titulo: "Esperança",
    conteudo: "A esperança é a virtude teologal pela qual desejamos o Reino dos Céus.",
    tags: ["esperanca", "fe"]
  },
  {
    id: "cat_2092",
    tipo: "catecismo",
    numero: 2092,
    titulo: "Desespero",
    conteudo: "O desespero é a perda da esperança na salvação.",
    tags: ["desanimo", "esperanca"]
  },
  {
    id: "cat_2087",
    tipo: "catecismo",
    numero: 2087,
    titulo: "Dúvida na fé",
    conteudo: "A dúvida pode levar à negligência da fé.",
    tags: ["duvida", "fe"]
  },
  {
    id: "cat_1849",
    tipo: "catecismo",
    numero: 1849,
    titulo: "O pecado",
    conteudo: "O pecado é uma falta contra a razão, a verdade e a consciência.",
    tags: ["pecado", "verdade"]
  },
  {
    id: "cat_1855",
    tipo: "catecismo",
    numero: 1855,
    titulo: "Pecado mortal",
    conteudo: "O pecado mortal destrói a caridade no coração do homem.",
    tags: ["pecado", "amor"]
  },
  {
    id: "cat_1863",
    tipo: "catecismo",
    numero: 1863,
    titulo: "Pecado venial",
    conteudo: "O pecado venial enfraquece a caridade.",
    tags: ["pecado"]
  },
  {
    id: "cat_1996",
    tipo: "catecismo",
    numero: 1996,
    titulo: "Graça",
    conteudo: "A graça é o favor, o auxílio gratuito que Deus nos dá.",
    tags: ["graca", "deus"]
  },
  {
    id: "cat_2001",
    tipo: "catecismo",
    numero: 2001,
    titulo: "Ação da graça",
    conteudo: "A preparação do homem para acolher a graça é obra de Deus.",
    tags: ["graca"]
  },
  {
    id: "cat_2559",
    tipo: "catecismo",
    numero: 2559,
    titulo: "A oração",
    conteudo: "A oração é a elevação da alma a Deus.",
    tags: ["oracao", "deus"]
  },
  {
    id: "cat_2565",
    tipo: "catecismo",
    numero: 2565,
    titulo: "Encontro com Deus",
    conteudo: "Na oração, o homem entra em relação com Deus.",
    tags: ["oracao", "relacao_com_deus"]
  },
  {
    id: "cat_2609",
    tipo: "catecismo",
    numero: 2609,
    titulo: "Confiança na oração",
    conteudo: "A oração deve ser feita com confiança.",
    tags: ["oracao", "fe", "confianca"]
  }
];
