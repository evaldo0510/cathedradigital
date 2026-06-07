export interface BibleBook {
  name: string;
  abbr: string;
  chapters: number;
  description?: string; // Descrição literária ou teológica do livro
  category?: string;
  author?: string;
  date?: string;
  themes?: string[];
  context?: string; // Contexto histórico ou estrutural do livro
  chapterTitles?: Record<number, string>; // Títulos curtos para os capítulos
}

export interface BibleCategory {
  name: string;
  books: BibleBook[];
  description?: string; // Descrição do gênero literário (ex: Pentateuco)
}

export const BIBLE_DATA: Record<string, BibleCategory[]> = {
  'Antigo Testamento': [
    {
      name: 'Pentateuco',
      description: 'A Lei de Moisés e as origens da Aliança.',
      books: [
        { 
          name: 'Gênesis', 
          abbr: 'Gn', 
          chapters: 50, 
          category: 'Pentateuco',
          author: 'Moisés (Tradição)',
          date: 'Séc. XV-XIII a.C.',
          themes: ['Criação', 'Queda', 'Promessa', 'Aliança'],
          description: 'As Origens do Mundo e do Povo da Aliança.',
          context: 'Gênesis estabelece os fundamentos da fé: a criação por Deus, a entrada do pecado no mundo e o início do plano de redenção através de Abraão.'
        },
        { name: 'Êxodo', abbr: 'Ex', chapters: 40, category: 'Pentateuco', author: 'Moisés (Tradição)', description: 'A Libertação do Egito e a Aliança do Sinai.' },
        { name: 'Levítico', abbr: 'Lv', chapters: 27, category: 'Pentateuco', author: 'Moisés (Tradição)', description: 'As Leis do Culto e a Santidade do Povo.' },
        { name: 'Números', abbr: 'Nm', chapters: 36, category: 'Pentateuco', author: 'Moisés (Tradição)', description: 'A Caminhada no Deserto rumo à Terra Prometida.' },
        { name: 'Deuteronômio', abbr: 'Dt', chapters: 34, category: 'Pentateuco', author: 'Moisés (Tradição)', description: 'O Segundo Anúncio da Lei.' }
      ]
    },
    {
      name: 'Livros Históricos',
      books: [
        { name: 'Josué', abbr: 'Js', chapters: 24, category: 'Histórico' },
        { name: 'Juízes', abbr: 'Jz', chapters: 21, category: 'Histórico' },
        { name: 'Rute', abbr: 'Rt', chapters: 4, category: 'Histórico' },
        { name: '1 Samuel', abbr: '1Sm', chapters: 31, category: 'Histórico' },
        { name: '2 Samuel', abbr: '2Sm', chapters: 24, category: 'Histórico' },
        { name: '1 Reis', abbr: '1Rs', chapters: 22, category: 'Histórico' },
        { name: '2 Reis', abbr: '2Rs', chapters: 25, category: 'Histórico' },
        { name: '1 Crônicas', abbr: '1Cr', chapters: 29, category: 'Histórico' },
        { name: '2 Crônicas', abbr: '2Cr', chapters: 36, category: 'Histórico' },
        { name: 'Esdras', abbr: 'Esd', chapters: 10, category: 'Histórico' },
        { name: 'Neemias', abbr: 'Ne', chapters: 13, category: 'Histórico' },
        { 
          name: 'Tobias', 
          abbr: 'Tb', 
          chapters: 14, 
          category: 'Histórico / Sapiencial',
          author: 'Desconhecido',
          date: 'Séc. III-II a.C.',
          themes: ['Providência Divina', 'Fidelidade na Prova', 'Família', 'Oração'],
          description: 'A fidelidade de Deus e a intercessão angélica.',
          context: 'Tobias narra a história de uma família piedosa no exílio assírio. É um livro deuterocanônico que destaca a importância das boas obras e da confiança em Deus.'
        },
        { 
          name: 'Judite', 
          abbr: 'Jdt', 

          chapters: 16, 
          category: 'Histórico / Edificante',
          author: 'Desconhecido',
          date: 'Séc. II a.C.',
          themes: ['Coragem', 'Libertação', 'Piedade', 'Oração'],
          description: 'A heroína que salvou o povo de Israel.',
          context: 'Judite é uma viúva piedosa que, com inteligência e fé, derrota o general Holofernes, salvando a cidade de Betúlia e todo o Israel.'
        },
        { name: 'Ester', abbr: 'Est', chapters: 16, category: 'Histórico' },
        { 
          name: '1 Macabeus', 
          abbr: '1Mc', 
          chapters: 16, 
          category: 'Histórico',
          author: 'Desconhecido (Judeu Palestinense)',
          date: 'Séc. II a.C.',
          themes: ['Resistência', 'Liberdade Religiosa', 'Zelo pela Lei'],
          description: 'A luta pela liberdade religiosa contra a opressão selêucida.',
          context: 'Relata a revolta dos Macabeus contra Antíoco IV Epífanes, que tentou suprimir a religião judaica e helenizar o povo.'
        },
        { 
          name: '2 Macabeus', 
          abbr: '2Mc', 
          chapters: 15, 
          category: 'Histórico / Teológico',
          author: 'Desconhecido (Baseado em Jasão de Cirene)',
          date: 'Séc. II a.C.',
          themes: ['Martírio', 'Ressurreição dos Mortos', 'Intercessão pelos Mortos'],
          description: 'Reflexão teológica sobre o martírio e a esperança na ressurreição.',
          context: 'Não é uma continuação do primeiro livro, mas um relato paralelo focado no Templo de Jerusalém e na teologia do martírio.'
        }
      ]
    },
    {
      name: 'Livros Sapienciais',
      books: [
        { name: 'Jó', abbr: 'Jó', chapters: 42, category: 'Sapiencial' },
        { 
          name: 'Salmos', 
          abbr: 'Sl', 
          chapters: 151,
          category: 'Poético / Sapiencial',
          author: 'Davi e outros',
          description: 'Hinos e Orações do Povo de Deus.',
          context: 'O saltério é o coração da oração da Igreja, reunindo todas as emoções humanas diante de Deus.',
          chapterTitles: {
            23: "O Bom Pastor",
            51: "Miserere: Oração de arrependimento",
            91: "A proteção divina",
            103: "Bendize, ó minha alma, ao Senhor",
            119: "A excelência da Lei de Deus",
            139: "A onisciência e onipresença de Deus",
            150: "Louvai ao Senhor",
            151: "O Salmo de Davi após vencer Golias"
          }
        },
        { name: 'Provérbios', abbr: 'Pr', chapters: 31, category: 'Sapiencial' },
        { name: 'Eclesiastes', abbr: 'Ecl', chapters: 12, category: 'Sapiencial' },
        { name: 'Cântico dos Cânticos', abbr: 'Ct', chapters: 8, category: 'Poético' },
        { 
          name: 'Sabedoria', 
          abbr: 'Sb', 
          chapters: 19, 
          category: 'Sapiencial',
          author: 'Desconhecido (Judeu de Alexandria)',
          date: 'Séc. I a.C.',
          themes: ['Sabedoria Divina', 'Imortalidade da Alma', 'Justiça'],
          description: 'O caminho para a imortalidade através da Sabedoria.',
          context: 'Escrito em grego para os judeus de Alexandria, apresenta a Sabedoria como um atributo divino que guia o justo e garante a vida eterna.'
        },
        { 
          name: 'Eclesiástico', 
          abbr: 'Eclo', 
          chapters: 51, 
          category: 'Sapiencial',
          author: 'Jesus Ben Sirac',
          date: 'Séc. II a.C.',
          themes: ['Temor do Senhor', 'Educação', 'Amizade', 'Sabedoria Prática'],
          description: 'Manual de conduta e sabedoria para a vida cotidiana.',
          context: 'Também conhecido como Sirácida, é uma vasta coleção de preceitos morais e religiosos fundamentados na tradição de Israel.'
        }
      ]
    },
    {
      name: 'Profetas Maiores',
      books: [
        { name: 'Isaías', abbr: 'Is', chapters: 66, category: 'Profético' },
        { name: 'Jeremias', abbr: 'Jr', chapters: 52, category: 'Profético' },
        { name: 'Lamentações', abbr: 'Lm', chapters: 5, category: 'Profético' },
        { 
          name: 'Baruc', 
          abbr: 'Br', 
          chapters: 6, 
          category: 'Profético',
          author: 'Baruc (Secretário de Jeremias)',
          date: 'Séc. II a.C.',
          themes: ['Confissão de Pecados', 'Verdadeira Sabedoria', 'Consolação'],
          description: 'Apelo ao arrependimento e busca pela Sabedoria.',
          context: 'Baruc consola os exilados em Babilônia, exortando-os a reconhecer seus pecados e a buscar a Deus, que é a fonte da Sabedoria.'
        },
        { name: 'Ezequiel', abbr: 'Ez', chapters: 48, category: 'Profético' },
        { name: 'Daniel', abbr: 'Dn', chapters: 14, category: 'Profético' }
      ]
    },
    {
      name: 'Profetas Menores',
      books: [
        { name: 'Oseias', abbr: 'Os', chapters: 14, category: 'Profético' },
        { name: 'Joel', abbr: 'Jl', chapters: 4, category: 'Profético' },
        { name: 'Amós', abbr: 'Am', chapters: 9, category: 'Profético' },
        { 
          name: 'Abdias', 
          abbr: 'Ab', 
          chapters: 1,
          category: 'Profético',
          author: 'Abdias',
          date: 'Séc. VI a.C.',
          themes: ['Juízo Divino', 'Justiça Social', 'Restauração'],
          description: 'O Juízo contra Edom e o Reino do Senhor.',
          context: 'O menor livro do Antigo Testamento, foca na justiça divina contra os que oprimem o povo de Deus.',
          chapterTitles: {
            1: "O juízo de Edom e a restauração de Israel"
          }
        },
        { name: 'Jonas', abbr: 'Jn', chapters: 4, category: 'Profético' },
        { name: 'Miqueias', abbr: 'Mq', chapters: 7, category: 'Profético' },
        { name: 'Naum', abbr: 'Na', chapters: 3, category: 'Profético' },
        { name: 'Habacuc', abbr: 'Hab', chapters: 3, category: 'Profético' },
        { name: 'Sofonias', abbr: 'Sf', chapters: 3, category: 'Profético' },
        { name: 'Ageu', abbr: 'Ag', chapters: 2, category: 'Profético' },
        { name: 'Zacarias', abbr: 'Zc', chapters: 14, category: 'Profético' },
        { name: 'Malaquias', abbr: 'Ml', chapters: 3, category: 'Profético' }
      ]
    }
  ],
  'Novo Testamento': [
    {
      name: 'Evangelhos',
      description: 'A Boa Nova de Jesus Cristo contada por quatro testemunhas.',
      books: [
        { name: 'Mateus', abbr: 'Mt', chapters: 28, category: 'Evangelho', description: 'O Evangelho do Reino e o Cumprimento das Promessas.' },
        { name: 'Marcos', abbr: 'Mc', chapters: 16, category: 'Evangelho', description: 'O Caminho do Filho de Deus e o Segredo Messiânico.' },
        { name: 'Lucas', abbr: 'Lc', chapters: 24, category: 'Evangelho', description: 'O Evangelho da Misericórdia e a Salvação Universal.' },
        { 
          name: 'João', 
          abbr: 'Jo', 
          chapters: 21, 
          category: 'Evangelho',
          author: 'João Apóstolo',
          date: 'Séc. I (90-100 d.C.)',
          themes: ['Divindade de Cristo', 'Vida Eterna', 'Luz vs Trevas', 'O Amor'],
          description: 'A Palavra Encarnada e o Testemunho do Discípulo Amado.',
          context: 'O Evangelho de João é único entre os quatro Evangelhos. Foca na divindade de Cristo ("O Verbo") e utiliza uma linguagem altamente simbólica e teológica.',
          chapterTitles: {
            1: "O Verbo Encarnado",
            2: "As Bodas de Caná",
            3: "Jesus e Nicodemos",
            4: "Jesus e a Samaritana",
            5: "A Cura no Tanque de Betesda",
            6: "O Pão da Vida",
            7: "Jesus na Festa dos Tabernáculos",
            8: "A Mulher Adúltera e a Luz do Mundo",
            9: "O Cego de Nascença",
            10: "O Bom Pastor",
            11: "A Ressurreição de Lázaro",
            12: "A Unção em Betânia",
            13: "O Lava-pés",
            14: "O Caminho, a Verdade e a Vida",
            15: "A Videira Verdadeira",
            16: "A Obra do Espírito Santo",
            17: "A Oração Sacerdotal",
            18: "Prisão e Julgamento",
            19: "Crucifixão e Morte",
            20: "A Ressurreição",
            21: "Manifestação na Galileia"
          }
        }
      ]
    },
    {
      name: 'Histórico',
      books: [
        { name: 'Atos dos Apóstolos', abbr: 'At', chapters: 28, category: 'Histórico' }
      ]
    },
    {
      name: 'Cartas de Paulo',
      books: [
        { name: 'Romanos', abbr: 'Rm', chapters: 16, category: 'Epístola' },
        { name: '1 Coríntios', abbr: '1Cor', chapters: 16, category: 'Epístola' },
        { name: '2 Coríntios', abbr: '2Cor', chapters: 13, category: 'Epístola' },
        { name: 'Gálatas', abbr: 'Gl', chapters: 6, category: 'Epístola' },
        { name: 'Efésios', abbr: 'Ef', chapters: 6, category: 'Epístola' },
        { name: 'Filipenses', abbr: 'Fl', chapters: 4, category: 'Epístola' },
        { name: 'Colossenses', abbr: 'Cl', chapters: 4, category: 'Epístola' },
        { name: '1 Tessalonicenses', abbr: '1Ts', chapters: 5, category: 'Epístola' },
        { name: '2 Tessalonicenses', abbr: '2Ts', chapters: 3, category: 'Epístola' },
        { name: '1 Timóteo', abbr: '1Tm', chapters: 6, category: 'Epístola' },
        { name: '2 Timóteo', abbr: '2Tm', chapters: 4, category: 'Epístola' },
        { name: 'Tito', abbr: 'Tt', chapters: 3, category: 'Epístola' },
        { name: 'Filemon', abbr: 'Fm', chapters: 1, category: 'Epístola' }
      ]
    },
    {
      name: 'Outras Cartas',
      books: [
        { name: 'Hebreus', abbr: 'Hb', chapters: 13, category: 'Epístola' },
        { name: 'Tiago', abbr: 'Tg', chapters: 5, category: 'Epístola' },
        { name: '1 Pedro', abbr: '1Pd', chapters: 5, category: 'Epístola' },
        { name: '2 Pedro', abbr: '2Pd', chapters: 3, category: 'Epístola' },
        { name: '1 João', abbr: '1Jo', chapters: 5, category: 'Epístola' },
        { name: '2 João', abbr: '2Jo', chapters: 1, category: 'Epístola' },
        { name: '3 João', abbr: '3Jo', chapters: 1, category: 'Epístola' },
        { name: 'Judas', abbr: 'Jd', chapters: 1, category: 'Epístola' }
      ]
    },
    {
      name: 'Profético',
      books: [
        { name: 'Apocalipse', abbr: 'Ap', chapters: 22, category: 'Profético' }
      ]
    }
  ]
};
