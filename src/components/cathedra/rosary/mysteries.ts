/**
 * CAT-12.3 — Dados dos mistérios do Rosário.
 *
 * Estrutura enriquecida (padrão Logos 2030):
 *   - scripture: passagem bíblica principal
 *   - meditation: síntese contemplativa
 *   - intention: intenção sugerida
 *   - fruit: fruto espiritual (tradição da Igreja)
 *   - themeIds: nós do KnowledgeGraph para alimentar ReaderContinuation
 *   - links: rotas diretas para Bíblia, Catecismo, Santo e Jornada
 */

import type { KnowledgeNodeId } from "@/core/knowledge";

export type MysterySet = "joyful" | "luminous" | "sorrowful" | "glorious";

export type RosaryLinkKind = "bible" | "catechism" | "saint" | "journey";

export interface RosaryContinuationLink {
  kind: RosaryLinkKind;
  label: string;
  href: string;
  eyebrow?: string;
}

export interface Mystery {
  id: string;
  title: string;
  scripture: string;
  scriptureHref: string;
  meditation: string;
  intention: string;
  fruit: string;
  themeIds?: KnowledgeNodeId[];
  links: RosaryContinuationLink[];
}

export interface MysterySetData {
  key: MysterySet;
  name: string;
  latin: string;
  day: string;
  hue: "primary" | "secondary";
  epigraph: string;
  mysteries: Mystery[];
}

export const MYSTERY_SETS: Record<MysterySet, MysterySetData> = {
  joyful: {
    key: "joyful",
    name: "Mistérios Gozosos",
    latin: "Mysteria Gaudiosa",
    day: "Segunda e Sábado",
    hue: "secondary",
    epigraph: "“Alegra-te, cheia de graça, o Senhor é contigo.” — Lc 1,28",
    mysteries: [
      {
        id: "joyful-1",
        title: "A Anunciação do Anjo a Maria",
        scripture: "Lc 1,26-38",
        scriptureHref: "/bible?book=lc&chapter=1",
        meditation:
          "O Verbo se faz carne no silêncio de Nazaré. Maria diz Sim e a eternidade entra no tempo.",
        intention: "Pelas vocações e pela escuta obediente à vontade de Deus.",
        fruit: "Humildade.",
        themeIds: ["theme.encarnacao", "theme.maria"],
        links: [
          { kind: "bible", label: "Ler Lc 1,26-38", href: "/bible?book=lc&chapter=1", eyebrow: "Evangelho" },
          { kind: "catechism", label: "Catecismo §484-489", href: "/catechism?p=484", eyebrow: "A Encarnação" },
        ],
      },
      {
        id: "joyful-2",
        title: "A Visitação de Maria a Isabel",
        scripture: "Lc 1,39-56",
        scriptureHref: "/bible?book=lc&chapter=1",
        meditation:
          "Quem carrega Cristo vai ao encontro do outro. Maria serve e canta o Magnificat.",
        intention: "Pela caridade concreta com os que sofrem.",
        fruit: "Caridade fraterna.",
        themeIds: ["theme.maria", "theme.caridade"],
        links: [
          { kind: "bible", label: "Magnificat — Lc 1,46-55", href: "/bible?book=lc&chapter=1", eyebrow: "Cântico" },
          { kind: "catechism", label: "Catecismo §2619", href: "/catechism?p=2619", eyebrow: "Oração de Maria" },
        ],
      },
      {
        id: "joyful-3",
        title: "O Nascimento de Jesus",
        scripture: "Lc 2,1-20",
        scriptureHref: "/bible?book=lc&chapter=2",
        meditation:
          "Deus nasce na pobreza de Belém. A grandeza de Deus se manifesta em uma manjedoura.",
        intention: "Pelas famílias e pelas crianças que nasceram sem abrigo.",
        fruit: "Pobreza de espírito.",
        themeIds: ["theme.encarnacao", "theme.natal"],
        links: [
          { kind: "bible", label: "Ler Lc 2,1-20", href: "/bible?book=lc&chapter=2", eyebrow: "Evangelho" },
          { kind: "catechism", label: "Catecismo §525-526", href: "/catechism?p=525", eyebrow: "O Natal" },
        ],
      },
      {
        id: "joyful-4",
        title: "A Apresentação de Jesus no Templo",
        scripture: "Lc 2,22-38",
        scriptureHref: "/bible?book=lc&chapter=2",
        meditation:
          "“Luz para iluminar as nações.” Simeão anuncia a espada que atravessará o coração de Maria.",
        intention: "Pela fidelidade das famílias à vida de fé.",
        fruit: "Obediência a Deus.",
        themeIds: ["theme.maria", "theme.templo"],
        links: [
          { kind: "bible", label: "Ler Lc 2,22-38", href: "/bible?book=lc&chapter=2", eyebrow: "Evangelho" },
        ],
      },
      {
        id: "joyful-5",
        title: "A Perda e o Encontro de Jesus no Templo",
        scripture: "Lc 2,41-52",
        scriptureHref: "/bible?book=lc&chapter=2",
        meditation:
          "“Não sabíeis que devo ocupar-me das coisas de meu Pai?” O primeiro anúncio da missão.",
        intention: "Pela juventude que busca sentido para a vida.",
        fruit: "Fidelidade a Deus em primeiro lugar.",
        themeIds: ["theme.jesus", "theme.templo"],
        links: [
          { kind: "bible", label: "Ler Lc 2,41-52", href: "/bible?book=lc&chapter=2", eyebrow: "Evangelho" },
        ],
      },
    ],
  },

  luminous: {
    key: "luminous",
    name: "Mistérios Luminosos",
    latin: "Mysteria Luminosa",
    day: "Quinta",
    hue: "secondary",
    epigraph: "“Este é o meu Filho amado; ouvi-O.” — Mt 17,5",
    mysteries: [
      {
        id: "luminous-1",
        title: "O Batismo de Jesus no Jordão",
        scripture: "Mt 3,13-17",
        scriptureHref: "/bible?book=mt&chapter=3",
        meditation:
          "O Filho desce às águas para elevar toda a humanidade. A Trindade se manifesta.",
        intention: "Pela graça do Batismo em nossa vida.",
        fruit: "Fidelidade à graça batismal.",
        themeIds: ["theme.batismo", "theme.trindade"],
        links: [
          { kind: "bible", label: "Ler Mt 3,13-17", href: "/bible?book=mt&chapter=3", eyebrow: "Evangelho" },
          { kind: "catechism", label: "Catecismo §1213-1216", href: "/catechism?p=1213", eyebrow: "Batismo" },
        ],
      },
      {
        id: "luminous-2",
        title: "As Bodas de Caná",
        scripture: "Jo 2,1-11",
        scriptureHref: "/bible?book=jo&chapter=2",
        meditation:
          "“Fazei tudo o que Ele vos disser.” Maria intercede; Jesus revela sua glória.",
        intention: "Pela santidade dos esposos e pelas famílias em dificuldade.",
        fruit: "Confiança em Maria.",
        themeIds: ["theme.maria", "theme.matrimonio"],
        links: [
          { kind: "bible", label: "Ler Jo 2,1-11", href: "/bible?book=jo&chapter=2", eyebrow: "Evangelho" },
          { kind: "catechism", label: "Catecismo §1613", href: "/catechism?p=1613", eyebrow: "Matrimônio" },
        ],
      },
      {
        id: "luminous-3",
        title: "O Anúncio do Reino de Deus",
        scripture: "Mc 1,14-15",
        scriptureHref: "/bible?book=mc&chapter=1",
        meditation:
          "“Convertei-vos e crede no Evangelho.” Cristo chama à conversão e à misericórdia.",
        intention: "Pela conversão do coração e pelo anúncio do Evangelho.",
        fruit: "Conversão contínua.",
        themeIds: ["theme.reino", "theme.conversao"],
        links: [
          { kind: "bible", label: "Ler Mc 1,14-15", href: "/bible?book=mc&chapter=1", eyebrow: "Evangelho" },
          { kind: "catechism", label: "Catecismo §1427-1429", href: "/catechism?p=1427", eyebrow: "Conversão" },
        ],
      },
      {
        id: "luminous-4",
        title: "A Transfiguração de Jesus",
        scripture: "Mt 17,1-8",
        scriptureHref: "/bible?book=mt&chapter=17",
        meditation:
          "No Tabor, a divindade transparece na humanidade. Vislumbre da glória futura.",
        intention: "Pela esperança dos que atravessam o Getsêmani da vida.",
        fruit: "Desejo da santidade.",
        themeIds: ["theme.glorificacao"],
        links: [
          { kind: "bible", label: "Ler Mt 17,1-8", href: "/bible?book=mt&chapter=17", eyebrow: "Evangelho" },
        ],
      },
      {
        id: "luminous-5",
        title: "A Instituição da Eucaristia",
        scripture: "Lc 22,19-20",
        scriptureHref: "/bible?book=lc&chapter=22",
        meditation:
          "“Isto é o meu Corpo, isto é o meu Sangue.” Cristo se dá em alimento até o fim dos tempos.",
        intention: "Pelo amor à Eucaristia e pelas vocações sacerdotais.",
        fruit: "Amor à Eucaristia.",
        themeIds: ["theme.eucaristia"],
        links: [
          { kind: "bible", label: "Ler Lc 22,14-20", href: "/bible?book=lc&chapter=22", eyebrow: "Evangelho" },
          { kind: "catechism", label: "Catecismo §1322-1327", href: "/catechism?p=1322", eyebrow: "Eucaristia" },
        ],
      },
    ],
  },

  sorrowful: {
    key: "sorrowful",
    name: "Mistérios Dolorosos",
    latin: "Mysteria Dolorosa",
    day: "Terça e Sexta",
    hue: "primary",
    epigraph: "“Por suas chagas fomos curados.” — Is 53,5",
    mysteries: [
      {
        id: "sorrowful-1",
        title: "A Agonia de Jesus no Horto",
        scripture: "Lc 22,39-46",
        scriptureHref: "/bible?book=lc&chapter=22",
        meditation:
          "“Não a minha vontade, mas a Tua.” Cristo aceita o cálice por nós.",
        intention: "Pelos que sofrem angústia e tentação.",
        fruit: "Arrependimento dos pecados.",
        themeIds: ["theme.paixao"],
        links: [
          { kind: "bible", label: "Ler Lc 22,39-46", href: "/bible?book=lc&chapter=22", eyebrow: "Evangelho" },
        ],
      },
      {
        id: "sorrowful-2",
        title: "A Flagelação de Jesus",
        scripture: "Jo 19,1",
        scriptureHref: "/bible?book=jo&chapter=19",
        meditation:
          "Cada chaga na carne de Cristo é um pecado nosso curado por seu amor.",
        intention: "Pela pureza de corpo e alma.",
        fruit: "Mortificação dos sentidos.",
        themeIds: ["theme.paixao", "theme.pureza"],
        links: [
          { kind: "bible", label: "Ler Jo 19,1-5", href: "/bible?book=jo&chapter=19", eyebrow: "Evangelho" },
        ],
      },
      {
        id: "sorrowful-3",
        title: "A Coroação de Espinhos",
        scripture: "Mt 27,27-31",
        scriptureHref: "/bible?book=mt&chapter=27",
        meditation:
          "O Rei do Universo é escarnecido. A verdadeira realeza se revela na humilhação.",
        intention: "Pelos governantes e pelo fim da soberba do mundo.",
        fruit: "Humildade do coração.",
        themeIds: ["theme.paixao"],
        links: [
          { kind: "bible", label: "Ler Mt 27,27-31", href: "/bible?book=mt&chapter=27", eyebrow: "Evangelho" },
        ],
      },
      {
        id: "sorrowful-4",
        title: "Jesus Carrega a Cruz",
        scripture: "Jo 19,17",
        scriptureHref: "/bible?book=jo&chapter=19",
        meditation:
          "Cristo toma sobre Si o peso de todos os pecados. Cada passo é ato de amor redentor.",
        intention: "Pelos que carregam cruzes pesadas na vida.",
        fruit: "Paciência nas provações.",
        themeIds: ["theme.paixao"],
        links: [
          { kind: "bible", label: "Ler Jo 19,17-24", href: "/bible?book=jo&chapter=19", eyebrow: "Evangelho" },
        ],
      },
      {
        id: "sorrowful-5",
        title: "A Crucifixão e Morte de Jesus",
        scripture: "Lc 23,33-46",
        scriptureHref: "/bible?book=lc&chapter=23",
        meditation:
          "“Pai, perdoai-lhes.” “Está consumado.” O sacrifício perfeito é oferecido.",
        intention: "Pela salvação dos pecadores e pelos moribundos.",
        fruit: "Perdão às ofensas.",
        themeIds: ["theme.paixao", "theme.redencao"],
        links: [
          { kind: "bible", label: "Ler Lc 23,33-46", href: "/bible?book=lc&chapter=23", eyebrow: "Evangelho" },
          { kind: "catechism", label: "Catecismo §613-618", href: "/catechism?p=613", eyebrow: "Redenção" },
        ],
      },
    ],
  },

  glorious: {
    key: "glorious",
    name: "Mistérios Gloriosos",
    latin: "Mysteria Gloriosa",
    day: "Quarta e Domingo",
    hue: "secondary",
    epigraph: "“Ele ressuscitou, não está aqui.” — Mc 16,6",
    mysteries: [
      {
        id: "glorious-1",
        title: "A Ressurreição de Jesus",
        scripture: "Mc 16,1-7",
        scriptureHref: "/bible?book=mc&chapter=16",
        meditation:
          "A morte foi vencida. Cristo vive e nos chama à vida nova.",
        intention: "Pela fé viva na Ressurreição.",
        fruit: "Fé firme.",
        themeIds: ["theme.pascoa", "theme.ressurreicao"],
        links: [
          { kind: "bible", label: "Ler Mc 16,1-7", href: "/bible?book=mc&chapter=16", eyebrow: "Evangelho" },
          { kind: "catechism", label: "Catecismo §638-655", href: "/catechism?p=638", eyebrow: "Ressurreição" },
        ],
      },
      {
        id: "glorious-2",
        title: "A Ascensão de Jesus ao Céu",
        scripture: "At 1,9-11",
        scriptureHref: "/bible?book=at&chapter=1",
        meditation:
          "Cristo sobe ao Pai. Preparai-vos: Ele vai preparar um lugar para nós.",
        intention: "Pelo desejo santo do Céu.",
        fruit: "Esperança do Céu.",
        themeIds: ["theme.pascoa"],
        links: [
          { kind: "bible", label: "Ler At 1,9-11", href: "/bible?book=at&chapter=1", eyebrow: "Escritura" },
        ],
      },
      {
        id: "glorious-3",
        title: "A Vinda do Espírito Santo",
        scripture: "At 2,1-4",
        scriptureHref: "/bible?book=at&chapter=2",
        meditation:
          "Línguas de fogo. Homens tímidos tornam-se apóstolos intrépidos.",
        intention: "Pelos dons do Espírito Santo em nossa vida.",
        fruit: "Ardor apostólico.",
        themeIds: ["theme.espirito-santo", "theme.pentecostes"],
        links: [
          { kind: "bible", label: "Ler At 2,1-13", href: "/bible?book=at&chapter=2", eyebrow: "Escritura" },
          { kind: "catechism", label: "Catecismo §731-741", href: "/catechism?p=731", eyebrow: "Pentecostes" },
        ],
      },
      {
        id: "glorious-4",
        title: "A Assunção de Maria ao Céu",
        scripture: "Ap 12,1",
        scriptureHref: "/bible?book=ap&chapter=12",
        meditation:
          "A primeira redimida é elevada em corpo e alma. Sinal de nossa esperança.",
        intention: "Por uma morte cristã.",
        fruit: "Devoção filial a Maria.",
        themeIds: ["theme.maria"],
        links: [
          { kind: "catechism", label: "Catecismo §966", href: "/catechism?p=966", eyebrow: "Assunção" },
        ],
      },
      {
        id: "glorious-5",
        title: "A Coroação de Maria como Rainha",
        scripture: "Ap 12,1; Sl 45,10",
        scriptureHref: "/bible?book=ap&chapter=12",
        meditation:
          "Rainha do Céu e da Terra, intercede por nós junto ao trono do Filho.",
        intention: "Pela intercessão de Maria em nossa vida.",
        fruit: "Perseverança final.",
        themeIds: ["theme.maria"],
        links: [
          { kind: "catechism", label: "Catecismo §969", href: "/catechism?p=969", eyebrow: "Maternidade espiritual" },
        ],
      },
    ],
  },
};

export const MYSTERY_ORDER: MysterySet[] = ["joyful", "luminous", "sorrowful", "glorious"];

/** Sugere o conjunto do dia (heurística por dia da semana). */
export function suggestSetForToday(day: number = new Date().getDay()): MysterySet {
  // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  switch (day) {
    case 1:
    case 6:
      return "joyful";
    case 4:
      return "luminous";
    case 2:
    case 5:
      return "sorrowful";
    case 0:
    case 3:
    default:
      return "glorious";
  }
}
