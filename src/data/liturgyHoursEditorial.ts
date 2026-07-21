/**
 * Notas editoriais das Horas Canônicas da Liturgia das Horas.
 *
 * Cada Hora recebe um breve resumo do seu *espírito* — sentido teológico,
 * origem histórica e chave contemplativa. Conteúdo estático (não gerado
 * por IA) para preservar consistência editorial e funcionar offline.
 *
 * Chave = slug da `prayer_sections` do prayer `liturgia-das-horas`.
 */

import type { HourSlug } from '@/hooks/useLiturgyHoursOffice';

export interface HourEditorial {
  /** Latim clássico da Hora. */
  latin: string;
  /** Uma linha — o núcleo espiritual da Hora. */
  essence: string;
  /** Origem histórica (Padres, monaquismo, tradição). */
  origin: string;
  /** Chave contemplativa — como rezar esta Hora com fruto. */
  meditation: string;
  /** Referência magisterial ou patrística curta. */
  reference?: { text: string; source: string };
}

export const LITURGY_HOURS_EDITORIAL: Record<HourSlug, HourEditorial> = {
  oficio: {
    latin: 'Officium Lectionis',
    essence: 'A vigília noturna dos monges — escuta longa da Palavra e dos Padres antes que o mundo desperte.',
    origin: 'Herdeiro das Vigiliae monásticas do século IV, formalizadas por São Bento. Inclui a Segunda Leitura patrística preservada desde Cassiano.',
    meditation: 'Reze devagar. Deixe o Salmo repousar antes de virar para a Leitura Patrística. É a única Hora que privilegia lectio sobre laus.',
    reference: {
      text: '"Sete vezes ao dia proclamo o teu louvor, e no meio da noite me levanto para louvar-te."',
      source: 'Sl 118,62.164',
    },
  },
  laudes: {
    latin: 'Laudes matutinae',
    essence: 'A oração da aurora — Cristo Ressuscitado é o sol que vence a noite. Louvor cósmico.',
    origin: 'Já mencionada por Tertuliano (séc. III) como prece obrigatória dos cristãos ao raiar do dia. Consagra o dia ao Pai.',
    meditation: 'Cante o Benedictus (Cântico de Zacarias) de pé, voltado para o oriente se possível. É o coração da Hora.',
    reference: {
      text: '"De madrugada eu vos busco, Senhor; a minha alma tem sede de vós."',
      source: 'Sl 62,2',
    },
  },
  tercia: {
    latin: 'Hora tertia',
    essence: 'Terceira hora do dia (≈ 9h) — memória da descida do Espírito Santo em Pentecostes.',
    origin: 'Hora romana de trabalho; os Apóstolos rezavam esta Hora quando o Espírito desceu (At 2,15). Sinal do dom da fortaleza para a jornada.',
    meditation: 'Peça a graça do Espírito Santo sobre o trabalho que começa. Breve por vocação — não a alongue.',
  },
  sexta: {
    latin: 'Hora sexta',
    essence: 'Meio-dia — hora em que Cristo foi elevado na Cruz. Perseverança contra o tédio espiritual (acedia).',
    origin: 'Pedro rezava a sexta hora quando teve a visão em Jope (At 10,9). Os Padres do Deserto a associaram ao combate contra o "demônio meridiano".',
    meditation: 'Faça uma pausa real. É a Hora que quebra a inércia do meio do dia e reordena a intenção.',
  },
  noa: {
    latin: 'Hora nona',
    essence: 'Nona hora (≈ 15h) — hora exata da morte de Cristo na Cruz. Kenosis e entrega.',
    origin: 'Cornélio rezava esta Hora quando o anjo lhe apareceu (At 10,3). Momento de recolher o dia diante do Crucificado.',
    meditation: 'Detenha-se sobre "Consummatum est" (Jo 19,30). Ofereça o cansaço acumulado do dia.',
  },
  vesperas: {
    latin: 'Vesperae',
    essence: 'A oração do lucernário — no ocaso, acende-se a luz de Cristo. Ação de graças pelo dia.',
    origin: 'Uma das duas Horas mais antigas (com Laudes). Herda o rito judaico do incenso vespertino. Contém o Magnificat de Maria.',
    meditation: 'Cante o Magnificat como a Virgem: em pé, com incenso ou vela acesa se possível. É a Hora mariana por excelência.',
    reference: {
      text: '"Suba como incenso a minha oração, e minhas mãos erguidas como oferenda da tarde."',
      source: 'Sl 140,2',
    },
  },
  completas: {
    latin: 'Completorium',
    essence: 'A última Hora — entrega da noite nas mãos do Pai. Preparação para o sono como imagem da morte.',
    origin: 'Instituída por São Bento no séc. VI para "completar" o dia monástico. Termina sempre com antífona mariana (Salve Regina, Alma Redemptoris).',
    meditation: 'Faça o exame do dia antes de começar. Termine com o Nunc dimittis (Cântico de Simeão) — durma em paz.',
    reference: {
      text: '"Em paz me deito e adormeço, pois só vós, Senhor, me fazeis repousar seguro."',
      source: 'Sl 4,9',
    },
  },
};

export function getHourEditorial(slug: HourSlug): HourEditorial | null {
  return LITURGY_HOURS_EDITORIAL[slug] ?? null;
}
