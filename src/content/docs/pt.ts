import type { DocsBundle } from './types';

export const docsPt: DocsBundle = {
  categories: {
    inicio: 'Começar',
    leitura: 'Leitura',
    oracao: 'Oração',
    estudo: 'Estudo',
  },
  ui: {
    portalTitle: 'Documentação',
    portalSubtitle: 'Guias breves para usar a Cathedra com proveito espiritual.',
    searchLabel: 'Buscar na documentação',
    searchPlaceholder: 'Buscar guia, tema ou palavra…',
    empty: 'Nenhum guia corresponde à busca.',
    resultsCount: (n) => (n === 1 ? '1 guia encontrado' : `${n} guias encontrados`),
    back: 'Voltar à documentação',
    onThisPage: 'Nesta página',
  },
  guides: [
    {
      slug: 'primeiros-passos',
      category: 'inicio',
      title: 'Primeiros passos',
      summary: 'Como a Cathedra se organiza e por onde começar no primeiro dia.',
      keywords: ['início', 'conta', 'perfil', 'navegação', 'átrio'],
      sections: [
        {
          heading: 'O que é a Cathedra',
          body: [
            'A Cathedra reúne Escritura, liturgia, oração e patrística em um só lugar, com referências cruzadas entre tudo o que você lê.',
            'A proposta não é acumular informação, mas sustentar uma vida interior constante.',
          ],
        },
        {
          heading: 'Por onde começar',
          body: [
            'Comece pelo Átrio: ele apresenta a liturgia do dia, a leitura contínua e o que você deixou em andamento.',
            'Crie uma conta para guardar progresso de leitura, marcações e reflexões entre dispositivos.',
          ],
        },
        {
          heading: 'Ritmo sugerido',
          body: [
            'Um capítulo de Escritura, uma oração e um verbete por dia bastam para formar hábito.',
            'A constância vale mais do que a quantidade.',
          ],
        },
      ],
    },
    {
      slug: 'biblia-e-leitura-continua',
      category: 'leitura',
      title: 'Bíblia e leitura contínua',
      summary: 'Leitura de capítulos, marcações, retomada e busca no texto sagrado.',
      keywords: ['bíblia', 'escritura', 'capítulo', 'versículo', 'marcador'],
      sections: [
        {
          heading: 'Leitura por capítulo',
          body: [
            'A Bíblia é lida em capítulos completos, sem cortes, para preservar o contexto.',
            'A tradução ativa é indicada no cabeçalho do leitor.',
          ],
        },
        {
          heading: 'Retomar de onde parou',
          body: [
            'Cada capítulo lido é registrado e aparece em "Continue lendo".',
            'Marcações e reflexões ficam vinculadas ao versículo, não à sessão.',
          ],
        },
        {
          heading: 'Referências cruzadas',
          body: [
            'Referências no texto abrem em um cartão flutuante, sem tirar você da leitura.',
          ],
        },
      ],
    },
    {
      slug: 'liturgia-e-missal',
      category: 'leitura',
      title: 'Liturgia e Missal',
      summary: 'Calendário litúrgico, leituras do dia e Liturgia das Horas.',
      keywords: ['missa', 'missal', 'breviário', 'horas', 'calendário', 'tempo litúrgico'],
      sections: [
        {
          heading: 'Liturgia do dia',
          body: [
            'O calendário calcula o tempo litúrgico, a cor e a memória do dia automaticamente.',
            'As leituras próprias aparecem em leitura contínua, prontas para a oração.',
          ],
        },
        {
          heading: 'Liturgia das Horas',
          body: [
            'Laudes, Hora Média, Vésperas e Completas seguem a estrutura do breviário.',
            'Os textos são apresentados em sequência, sem saltos entre páginas.',
          ],
        },
      ],
    },
    {
      slug: 'oracao-e-rosario',
      category: 'oracao',
      title: 'Oração e Rosário',
      summary: 'Modo contemplação, mistérios do Rosário e Via Sacra.',
      keywords: ['rosário', 'via sacra', 'mistérios', 'contemplação', 'terço'],
      sections: [
        {
          heading: 'Modo contemplação',
          body: [
            'O modo contemplação reduz a interface ao essencial: texto, ritmo e imagem.',
            'O avanço entre mistérios é manual, respeitando o seu tempo.',
          ],
        },
        {
          heading: 'Rosário e Via Sacra',
          body: [
            'Cada mistério traz meditação própria, Escritura e imagem sacra.',
            'A Via Sacra segue as catorze estações na ordem tradicional.',
          ],
        },
      ],
    },
    {
      slug: 'glossario-e-nexus',
      category: 'estudo',
      title: 'Glossário e Nexus',
      summary: 'Verbetes teológicos e o grafo de referências que liga o acervo.',
      keywords: ['glossário', 'verbete', 'nexus', 'referências', 'grafo'],
      sections: [
        {
          heading: 'Verbetes',
          body: [
            'Cada verbete traz definição, etimologia, Escritura, Magistério, Tradição e aplicação.',
            'Somente verbetes publicados são visíveis ao público.',
          ],
        },
        {
          heading: 'Nexus Theologicus',
          body: [
            'O Nexus liga verbetes, santos, orações e passagens bíblicas entre si.',
            'As sugestões aparecem ao fim da leitura, como continuidade e não como distração.',
          ],
        },
      ],
    },
  ],
};
