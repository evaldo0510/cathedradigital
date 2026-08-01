/**
 * catechismStructure — mapa canônico do Catecismo da Igreja Católica.
 *
 * Sprint 3 · Catecismo (sobre o Reader V2 CERTIFIED).
 *
 * Responsabilidade única: dado um §, resolver sua localização editorial
 * completa — Parte, Seção, Capítulo, Artigo e Tema principal.
 *
 * Este módulo é dado puro. NÃO importa React, NÃO importa rotas,
 * NÃO faz fetch. Consumido pelo `CatechesisContext` (HeaderContext do
 * Reader V2) e pelo motor editorial.
 *
 * Fonte: estrutura oficial do CIC (Constituição Apostólica Fidei Depositum,
 * 1992; editio typica 1997).
 */

export interface CatechismArticle {
  /** Rótulo do artigo (ex.: "Artigo 3 — A Sagrada Escritura"). */
  article: string;
  /** Tema principal, em uma linha editorial. */
  theme: string;
  /** Faixa inclusiva de parágrafos. */
  range: readonly [number, number];
}

export interface CatechismChapter {
  /** Rótulo do capítulo. */
  chapter: string;
  range: readonly [number, number];
  /** Chave editorial usada por `catechismEditorial`. */
  editorialKey: string;
  articles: readonly CatechismArticle[];
}

export interface CatechismSectionNode {
  section: string;
  range: readonly [number, number];
  chapters: readonly CatechismChapter[];
}

export interface CatechismPartNode {
  /** Ex.: "Parte I". */
  part: string;
  /** Ex.: "A Profissão da Fé". */
  partTitle: string;
  range: readonly [number, number];
  sections: readonly CatechismSectionNode[];
}

/** Localização editorial resolvida de um parágrafo. */
export interface CatechismLocation {
  paragraph: number;
  part: string;
  partTitle: string;
  section: string;
  chapter: string;
  article: string;
  theme: string;
  editorialKey: string;
  /** Faixa do artigo — usada para navegação contínua. */
  articleRange: readonly [number, number];
  chapterRange: readonly [number, number];
}

const A = (
  article: string,
  theme: string,
  from: number,
  to: number,
): CatechismArticle => ({ article, theme, range: [from, to] });

export const CIC_STRUCTURE: readonly CatechismPartNode[] = [
  {
    part: 'Prólogo',
    partTitle: 'A vida do homem — conhecer e amar a Deus',
    range: [1, 25],
    sections: [
      {
        section: 'Prólogo',
        range: [1, 25],
        chapters: [
          {
            chapter: 'Prólogo',
            range: [1, 25],
            editorialKey: 'prologo',
            articles: [
              A('Prólogo', 'O desígnio de Deus e a transmissão da fé', 1, 25),
            ],
          },
        ],
      },
    ],
  },

  {
    part: 'Parte I',
    partTitle: 'A Profissão da Fé',
    range: [26, 1065],
    sections: [
      {
        section: 'Primeira Seção — Creio, Cremos',
        range: [26, 184],
        chapters: [
          {
            chapter: 'Capítulo 1 — O homem é capaz de Deus',
            range: [26, 49],
            editorialKey: 'capax-dei',
            articles: [
              A('Capítulo 1', 'O desejo de Deus inscrito no coração humano', 26, 49),
            ],
          },
          {
            chapter: 'Capítulo 2 — Deus vem ao encontro do homem',
            range: [50, 141],
            editorialKey: 'revelacao',
            articles: [
              A('Artigo 1 — A Revelação de Deus', 'Deus se revela por etapas até Cristo', 50, 73),
              A('Artigo 2 — A transmissão da Revelação', 'Tradição, Escritura e Magistério', 74, 100),
              A('Artigo 3 — A Sagrada Escritura', 'Deus fala na linguagem dos homens', 101, 141),
            ],
          },
          {
            chapter: 'Capítulo 3 — A resposta do homem a Deus',
            range: [142, 184],
            editorialKey: 'resposta-da-fe',
            articles: [
              A('Artigo 1 — Creio', 'A obediência da fé como ato pessoal', 142, 165),
              A('Artigo 2 — Cremos', 'A fé recebida e professada na Igreja', 166, 184),
            ],
          },
        ],
      },
      {
        section: 'Segunda Seção — A profissão da fé cristã',
        range: [185, 1065],
        chapters: [
          {
            chapter: 'Capítulo 1 — Creio em Deus Pai',
            range: [185, 421],
            editorialKey: 'creio-em-deus-pai',
            articles: [
              A('Os Símbolos da fé', 'Por que a Igreja resume a fé em fórmulas', 185, 197),
              A('Artigo 1 — Creio em Deus Pai todo-poderoso', 'O Deus único que se revela como Pai', 198, 278),
              A('Artigo 1 §4 — O Criador', 'A criação como primeira obra do amor', 279, 324),
              A('Artigo 1 §5 — O céu e a terra', 'Anjos, mundo visível e providência', 325, 354),
              A('Artigo 1 §6 — O homem', 'Imagem de Deus, corpo e alma, homem e mulher', 355, 384),
              A('Artigo 1 §7 — A queda', 'Pecado original e promessa de redenção', 385, 421),
            ],
          },
          {
            chapter: 'Capítulo 2 — Creio em Jesus Cristo, seu Filho único',
            range: [422, 682],
            editorialKey: 'creio-em-jesus-cristo',
            articles: [
              A('Artigo 2 — Jesus Cristo, Filho único de Deus', 'O Nome, o Cristo, o Filho, o Senhor', 422, 455),
              A('Artigo 3 — Concebido pelo poder do Espírito Santo', 'A Encarnação e os mistérios da vida de Cristo', 456, 570),
              A('Artigo 4 — Padeceu sob Pôncio Pilatos', 'Paixão, cruz e sepultura por nossa salvação', 571, 630),
              A('Artigo 5 — Desceu à mansão dos mortos, ressuscitou', 'A Ressurreição como fundamento da fé', 631, 658),
              A('Artigo 6 — Subiu aos céus', 'A Ascensão e a intercessão do Senhor', 659, 667),
              A('Artigo 7 — Donde há de vir julgar', 'A esperança do juízo e do Reino', 668, 682),
            ],
          },
          {
            chapter: 'Capítulo 3 — Creio no Espírito Santo',
            range: [683, 1065],
            editorialKey: 'creio-no-espirito-santo',
            articles: [
              A('Artigo 8 — Creio no Espírito Santo', 'O Espírito que vivifica e conduz a Igreja', 683, 747),
              A('Artigo 9 — Creio na santa Igreja católica', 'Mistério, comunhão e missão da Igreja', 748, 975),
              A('Artigo 10 — Creio na remissão dos pecados', 'O perdão confiado à Igreja', 976, 987),
              A('Artigo 11 — Creio na ressurreição da carne', 'O destino do corpo e a morte cristã', 988, 1019),
              A('Artigo 12 — Creio na vida eterna', 'Juízo, céu, purificação, inferno e Amém', 1020, 1065),
            ],
          },
        ],
      },
    ],
  },

  {
    part: 'Parte II',
    partTitle: 'A Celebração do Mistério Cristão',
    range: [1066, 1690],
    sections: [
      {
        section: 'Primeira Seção — A economia sacramental',
        range: [1066, 1209],
        chapters: [
          {
            chapter: 'Capítulo 1 — O mistério pascal no tempo da Igreja',
            range: [1066, 1134],
            editorialKey: 'economia-sacramental',
            articles: [
              A('Artigo 1 — A liturgia, obra da Santíssima Trindade', 'O Pai fonte, o Filho sacramento, o Espírito artífice', 1066, 1112),
              A('Artigo 2 — O mistério pascal nos sacramentos', 'Os sacramentos de Cristo e da Igreja', 1113, 1134),
            ],
          },
          {
            chapter: 'Capítulo 2 — A celebração sacramental do mistério pascal',
            range: [1135, 1209],
            editorialKey: 'celebracao-sacramental',
            articles: [
              A('Artigo 1 — Celebrar a liturgia da Igreja', 'Quem, como, quando e onde se celebra', 1135, 1199),
              A('Artigo 2 — Diversidade litúrgica e unidade do mistério', 'Ritos diversos, único mistério pascal', 1200, 1209),
            ],
          },
        ],
      },
      {
        section: 'Segunda Seção — Os sete sacramentos da Igreja',
        range: [1210, 1690],
        chapters: [
          {
            chapter: 'Capítulo 1 — Os sacramentos da iniciação cristã',
            range: [1210, 1419],
            editorialKey: 'iniciacao-crista',
            articles: [
              A('Artigo 1 — O sacramento do Batismo', 'Nascer da água e do Espírito', 1210, 1284),
              A('Artigo 2 — O sacramento da Confirmação', 'O selo do dom do Espírito Santo', 1285, 1321),
              A('Artigo 3 — O sacramento da Eucaristia', 'Fonte e ápice de toda a vida cristã', 1322, 1419),
            ],
          },
          {
            chapter: 'Capítulo 2 — Os sacramentos de cura',
            range: [1420, 1532],
            editorialKey: 'sacramentos-de-cura',
            articles: [
              A('Artigo 4 — O sacramento da Penitência e da Reconciliação', 'A conversão do batizado e o perdão', 1420, 1498),
              A('Artigo 5 — A Unção dos enfermos', 'A graça na doença e na passagem', 1499, 1532),
            ],
          },
          {
            chapter: 'Capítulo 3 — Os sacramentos ao serviço da comunhão',
            range: [1533, 1666],
            editorialKey: 'sacramentos-comunhao',
            articles: [
              A('Artigo 6 — O sacramento da Ordem', 'Episcopado, presbiterado e diaconato', 1533, 1600),
              A('Artigo 7 — O sacramento do Matrimônio', 'A aliança conjugal elevada a sacramento', 1601, 1666),
            ],
          },
          {
            chapter: 'Capítulo 4 — Outras celebrações litúrgicas',
            range: [1667, 1690],
            editorialKey: 'sacramentais',
            articles: [
              A('Artigo 1 — Os sacramentais', 'Bênçãos que preparam a graça', 1667, 1679),
              A('Artigo 2 — As exéquias cristãs', 'A Páscoa do cristão diante da morte', 1680, 1690),
            ],
          },
        ],
      },
    ],
  },

  {
    part: 'Parte III',
    partTitle: 'A Vida em Cristo',
    range: [1691, 2557],
    sections: [
      {
        section: 'Primeira Seção — A vocação do homem: a vida no Espírito',
        range: [1691, 2051],
        chapters: [
          {
            chapter: 'Capítulo 1 — A dignidade da pessoa humana',
            range: [1691, 1876],
            editorialKey: 'dignidade-humana',
            articles: [
              A('Artigo 1 — O homem, imagem de Deus', 'A raiz da dignidade humana', 1691, 1715),
              A('Artigo 2 — A nossa vocação à bem-aventurança', 'As bem-aventuranças e o desejo de felicidade', 1716, 1729),
              A('Artigo 3 — A liberdade do homem', 'Liberdade, responsabilidade e graça', 1730, 1748),
              A('Artigo 4 — A moralidade dos atos humanos', 'Objeto, intenção e circunstâncias', 1749, 1761),
              A('Artigo 5 — A moralidade das paixões', 'Afetos ordenados ao bem', 1762, 1775),
              A('Artigo 6 — A consciência moral', 'O santuário interior do juízo', 1776, 1802),
              A('Artigo 7 — As virtudes', 'Virtudes cardeais, teologais e dons', 1803, 1845),
              A('Artigo 8 — O pecado', 'Misericórdia, pecado mortal e venial', 1846, 1876),
            ],
          },
          {
            chapter: 'Capítulo 2 — A comunidade humana',
            range: [1877, 1948],
            editorialKey: 'comunidade-humana',
            articles: [
              A('Artigo 1 — A pessoa e a sociedade', 'Vocação comunitária e conversão social', 1877, 1896),
              A('Artigo 2 — A participação na vida social', 'Autoridade, bem comum e responsabilidade', 1897, 1927),
              A('Artigo 3 — A justiça social', 'Igualdade, solidariedade e respeito à pessoa', 1928, 1948),
            ],
          },
          {
            chapter: 'Capítulo 3 — A salvação de Deus: a lei e a graça',
            range: [1949, 2051],
            editorialKey: 'lei-e-graca',
            articles: [
              A('Artigo 1 — A lei moral', 'Lei natural, antiga e nova', 1949, 1986),
              A('Artigo 2 — Graça e justificação', 'Ser feito justo pela graça de Cristo', 1987, 2029),
              A('Artigo 3 — A Igreja, mãe e educadora', 'Preceitos da Igreja e vida moral', 2030, 2051),
            ],
          },
        ],
      },
      {
        section: 'Segunda Seção — Os Dez Mandamentos',
        range: [2052, 2557],
        chapters: [
          {
            chapter: 'Capítulo 1 — Amarás o Senhor teu Deus',
            range: [2052, 2195],
            editorialKey: 'primeira-tabua',
            articles: [
              A('Os Dez Mandamentos', 'O Decálogo como caminho de vida', 2052, 2082),
              A('Artigo 1 — Primeiro mandamento', 'Adorar a Deus e a Ele somente servir', 2083, 2141),
              A('Artigo 2 — Segundo mandamento', 'O respeito ao Nome de Deus', 2142, 2167),
              A('Artigo 3 — Terceiro mandamento', 'O dia do Senhor e o descanso', 2168, 2195),
            ],
          },
          {
            chapter: 'Capítulo 2 — Amarás o teu próximo como a ti mesmo',
            range: [2196, 2557],
            editorialKey: 'segunda-tabua',
            articles: [
              A('Artigo 4 — Quarto mandamento', 'Família, autoridade e gratidão', 2196, 2257),
              A('Artigo 5 — Quinto mandamento', 'O respeito absoluto à vida humana', 2258, 2330),
              A('Artigo 6 — Sexto mandamento', 'Castidade, vocação e amor conjugal', 2331, 2400),
              A('Artigo 7 — Sétimo mandamento', 'Bens, trabalho e destino universal', 2401, 2463),
              A('Artigo 8 — Oitavo mandamento', 'Verdade, testemunho e reputação', 2464, 2513),
              A('Artigo 9 — Nono mandamento', 'Pureza do coração e do olhar', 2514, 2533),
              A('Artigo 10 — Décimo mandamento', 'Desprendimento e pobreza de espírito', 2534, 2557),
            ],
          },
        ],
      },
    ],
  },

  {
    part: 'Parte IV',
    partTitle: 'A Oração Cristã',
    range: [2558, 2865],
    sections: [
      {
        section: 'Primeira Seção — A oração na vida cristã',
        range: [2558, 2758],
        chapters: [
          {
            chapter: 'Capítulo 1 — A revelação da oração',
            range: [2558, 2649],
            editorialKey: 'revelacao-da-oracao',
            articles: [
              A('Artigo 1 — Na Antiga Aliança', 'Abraão, Moisés, Davi e os Salmos', 2558, 2597),
              A('Artigo 2 — Na plenitude dos tempos', 'Jesus ora, ensina a orar e escuta', 2598, 2622),
              A('Artigo 3 — No tempo da Igreja', 'Bênção, adoração, súplica, ação de graças', 2623, 2649),
            ],
          },
          {
            chapter: 'Capítulo 2 — A tradição da oração',
            range: [2650, 2696],
            editorialKey: 'tradicao-da-oracao',
            articles: [
              A('Artigo 1 — Nas fontes da oração', 'Palavra, liturgia, virtudes e o hoje', 2650, 2662),
              A('Artigo 2 — O caminho da oração', 'Orar ao Pai, por Cristo, no Espírito', 2663, 2682),
              A('Artigo 3 — Guias para a oração', 'Santos, ministros e comunidade orante', 2683, 2696),
            ],
          },
          {
            chapter: 'Capítulo 3 — A vida de oração',
            range: [2697, 2758],
            editorialKey: 'vida-de-oracao',
            articles: [
              A('Artigo 1 — As expressões da oração', 'Vocal, meditação e oração contemplativa', 2697, 2724),
              A('Artigo 2 — O combate da oração', 'Distração, secura, perseverança e confiança', 2725, 2758),
            ],
          },
        ],
      },
      {
        section: 'Segunda Seção — A oração do Senhor: Pai Nosso',
        range: [2759, 2865],
        chapters: [
          {
            chapter: 'A oração do Senhor',
            range: [2759, 2865],
            editorialKey: 'pai-nosso',
            articles: [
              A('Artigo 1 — O resumo de todo o Evangelho', 'O Pai Nosso no coração das Escrituras', 2759, 2776),
              A('Artigo 2 — Pai nosso que estais nos céus', 'Ousar aproximar-se e chamar Pai', 2777, 2802),
              A('Artigo 3 — As sete petições', 'Do Nome santificado à libertação do mal', 2803, 2854),
              A('Doxologia final', 'O Amém que sela a oração da Igreja', 2855, 2865),
            ],
          },
        ],
      },
    ],
  },
];

export const CIC_FIRST_PARAGRAPH = 1;
export const CIC_LAST_PARAGRAPH = 2865;

function inRange(p: number, range: readonly [number, number]): boolean {
  return p >= range[0] && p <= range[1];
}

/** Fallback sóbrio para § fora do mapa (nunca deve ocorrer, mas não quebra a leitura). */
const FALLBACK: Omit<CatechismLocation, 'paragraph'> = {
  part: 'Catecismo da Igreja Católica',
  partTitle: 'Depositum Fidei',
  section: 'Texto integral',
  chapter: 'Texto integral',
  article: 'Parágrafo',
  theme: 'Doutrina da Igreja',
  editorialKey: 'geral',
  articleRange: [CIC_FIRST_PARAGRAPH, CIC_LAST_PARAGRAPH],
  chapterRange: [CIC_FIRST_PARAGRAPH, CIC_LAST_PARAGRAPH],
};

/**
 * Resolve Parte / Seção / Capítulo / Artigo / Tema de um parágrafo do CIC.
 * Puro e síncrono — seguro para uso em render memoizado.
 */
export function resolveCatechismLocation(paragraph: number): CatechismLocation {
  const p = Math.trunc(paragraph);
  for (const part of CIC_STRUCTURE) {
    if (!inRange(p, part.range)) continue;
    for (const section of part.sections) {
      if (!inRange(p, section.range)) continue;
      for (const chapter of section.chapters) {
        if (!inRange(p, chapter.range)) continue;
        const article =
          chapter.articles.find((a) => inRange(p, a.range)) ?? chapter.articles[0];
        return {
          paragraph: p,
          part: part.part,
          partTitle: part.partTitle,
          section: section.section,
          chapter: chapter.chapter,
          article: article?.article ?? chapter.chapter,
          theme: article?.theme ?? part.partTitle,
          editorialKey: chapter.editorialKey,
          articleRange: article?.range ?? chapter.range,
          chapterRange: chapter.range,
        };
      }
    }
  }
  return { paragraph: p, ...FALLBACK };
}
