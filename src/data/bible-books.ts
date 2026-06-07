export interface BibleBook {
  name: string;
  abbr: string;
  chapters: number;
  description?: string; // Descrição literária ou teológica do livro
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
        { name: 'Gênesis', abbr: 'Gn', chapters: 50, description: 'As Origens do Mundo e do Povo da Aliança.' },
        { name: 'Êxodo', abbr: 'Ex', chapters: 40, description: 'A Libertação do Egito e a Aliança do Sinai.' },
        { name: 'Levítico', abbr: 'Lv', chapters: 27, description: 'As Leis do Culto e a Santidade do Povo.' },
        { name: 'Números', abbr: 'Nm', chapters: 36, description: 'A Caminhada no Deserto rumo à Terra Prometida.' },
        { name: 'Deuteronômio', abbr: 'Dt', chapters: 34, description: 'O Segundo Anúncio da Lei.' }
      ]
    },

    {
      name: 'Livros Históricos',
      books: [
        { name: 'Josué', abbr: 'Js', chapters: 24 },
        { name: 'Juízes', abbr: 'Jz', chapters: 21 },
        { name: 'Rute', abbr: 'Rt', chapters: 4 },
        { name: '1 Samuel', abbr: '1Sm', chapters: 31 },
        { name: '2 Samuel', abbr: '2Sm', chapters: 24 },
        { name: '1 Reis', abbr: '1Rs', chapters: 22 },
        { name: '2 Reis', abbr: '2Rs', chapters: 25 },
        { name: '1 Crônicas', abbr: '1Cr', chapters: 29 },
        { name: '2 Crônicas', abbr: '2Cr', chapters: 36 },
        { name: 'Esdras', abbr: 'Esd', chapters: 10 },
        { name: 'Neemias', abbr: 'Ne', chapters: 13 },
        { name: 'Tobias', abbr: 'Tb', chapters: 14 },
        { name: 'Judite', abbr: 'Jt', chapters: 16 },
        { name: 'Ester', abbr: 'Est', chapters: 16 },
        { name: '1 Macabeus', abbr: '1Mc', chapters: 16 },
        { name: '2 Macabeus', abbr: '2Mc', chapters: 15 }
      ]
    },
    {
      name: 'Livros Sapienciais',
      books: [
        { name: 'Jó', abbr: 'Jó', chapters: 42 },
        { name: 'Salmos', abbr: 'Sl', chapters: 150 },
        { name: 'Provérbios', abbr: 'Pr', chapters: 31 },
        { name: 'Eclesiastes', abbr: 'Ecl', chapters: 12 },
        { name: 'Cântico dos Cânticos', abbr: 'Ct', chapters: 8 },
        { name: 'Sabedoria', abbr: 'Sb', chapters: 19 },
        { name: 'Eclesiástico', abbr: 'Eclo', chapters: 51 }
      ]
    },
    {
      name: 'Profetas Maiores',
      books: [
        { name: 'Isaías', abbr: 'Is', chapters: 66 },
        { name: 'Jeremias', abbr: 'Jr', chapters: 52 },
        { name: 'Lamentações', abbr: 'Lm', chapters: 5 },
        { name: 'Baruc', abbr: 'Br', chapters: 6 },
        { name: 'Ezequiel', abbr: 'Ez', chapters: 48 },
        { name: 'Daniel', abbr: 'Dn', chapters: 14 }
      ]
    },
    {
      name: 'Profetas Menores',
      books: [
        { name: 'Oseias', abbr: 'Os', chapters: 14 },
        { name: 'Joel', abbr: 'Jl', chapters: 4 },
        { name: 'Amós', abbr: 'Am', chapters: 9 },
        { name: 'Abdias', abbr: 'Ab', chapters: 1 },
        { name: 'Jonas', abbr: 'Jn', chapters: 4 },
        { name: 'Miqueias', abbr: 'Mq', chapters: 7 },
        { name: 'Naum', abbr: 'Na', chapters: 3 },
        { name: 'Habacuc', abbr: 'Hab', chapters: 3 },
        { name: 'Sofonias', abbr: 'Sf', chapters: 3 },
        { name: 'Ageu', abbr: 'Ag', chapters: 2 },
        { name: 'Zacarias', abbr: 'Zc', chapters: 14 },
        { name: 'Malaquias', abbr: 'Ml', chapters: 3 }
      ]
    }
  ],
  'Novo Testamento': [
    {
      name: 'Evangelhos',
      description: 'A Boa Nova de Jesus Cristo contada por quatro testemunhas.',
      books: [
        { name: 'Mateus', abbr: 'Mt', chapters: 28, description: 'O Evangelho do Reino e o Cumprimento das Promessas.' },
        { name: 'Marcos', abbr: 'Mc', chapters: 16, description: 'O Caminho do Filho de Deus e o Segredo Messiânico.' },
        { name: 'Lucas', abbr: 'Lc', chapters: 24, description: 'O Evangelho da Misericórdia e a Salvação Universal.' },
        { 
          name: 'João', 
          abbr: 'Jo', 
          chapters: 21, 
          description: 'A Palavra Encarnada e o Testemunho do Discípulo Amado.',
          context: 'O Evangelho de João é único entre os quatro Evangelhos. Foca na divindade de Cristo ("O Verbo") e utiliza uma linguagem altamente simbólica e teológica.',
          chapterTitles: {
            1: "O Verbo se fez carne",
            2: "As bodas de Caná",
            3: "Jesus e Nicodemos",
            4: "Jesus e a Samaritana",
            5: "A cura do filho do oficial",
            6: "O pão da vida",
            7: "A festa dos Tabernáculos",
            8: "A mulher adúltera",
            9: "O bom pastor",
            10: "A ressurreição de Lázaro",
            11: "A unção em Betânia",
            12: "A entrada triunfal em Jerusalém",
            13: "O lava-pés",
            14: "O caminho, a verdade e a vida",
            15: "A videira verdadeira",
            16: "A promessa do Paráclito",
            17: "A oração sacerdotal",
            18: "A prisão e o julgamento",
            19: "A paixão e morte",
            20: "A ressurreição",
            21: "A aparição na Galileia"
          }
        }

      ]
    },

    {
      name: 'Histórico',
      books: [
        { name: 'Atos dos Apóstolos', abbr: 'At', chapters: 28 }
      ]
    },
    {
      name: 'Cartas de Paulo',
      books: [
        { name: 'Romanos', abbr: 'Rm', chapters: 16 },
        { name: '1 Coríntios', abbr: '1Cor', chapters: 16 },
        { name: '2 Coríntios', abbr: '2Cor', chapters: 13 },
        { name: 'Gálatas', abbr: 'Gl', chapters: 6 },
        { name: 'Efésios', abbr: 'Ef', chapters: 6 },
        { name: 'Filipenses', abbr: 'Fl', chapters: 4 },
        { name: 'Colossenses', abbr: 'Cl', chapters: 4 },
        { name: '1 Tessalonicenses', abbr: '1Ts', chapters: 5 },
        { name: '2 Tessalonicenses', abbr: '2Ts', chapters: 3 },
        { name: '1 Timóteo', abbr: '1Tm', chapters: 6 },
        { name: '2 Timóteo', abbr: '2Tm', chapters: 4 },
        { name: 'Tito', abbr: 'Tt', chapters: 3 },
        { name: 'Filemon', abbr: 'Fm', chapters: 1 }
      ]
    },
    {
      name: 'Outras Cartas',
      books: [
        { name: 'Hebreus', abbr: 'Hb', chapters: 13 },
        { name: 'Tiago', abbr: 'Tg', chapters: 5 },
        { name: '1 Pedro', abbr: '1Pd', chapters: 5 },
        { name: '2 Pedro', abbr: '2Pd', chapters: 3 },
        { name: '1 João', abbr: '1Jo', chapters: 5 },
        { name: '2 João', abbr: '2Jo', chapters: 1 },
        { name: '3 João', abbr: '3Jo', chapters: 1 },
        { name: 'Judas', abbr: 'Jd', chapters: 1 }
      ]
    },
    {
      name: 'Profético',
      books: [
        { name: 'Apocalipse', abbr: 'Ap', chapters: 22 }
      ]
    }
  ]
};