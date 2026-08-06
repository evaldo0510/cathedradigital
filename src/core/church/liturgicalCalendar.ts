/**
 * liturgicalCalendar — cálculo determinístico do Calendário Litúrgico Romano.
 *
 * Camada pura (sem rede, sem React). Serve ao Church Context Engine como
 * fonte de verdade para tempo litúrgico, ciclos e datas móveis.
 */

import { toIsoDateKey } from '@/core/liturgy/LiturgyProvider';

export type LiturgicalSeason =
  | 'Advento'
  | 'Natal'
  | 'Tempo Comum'
  | 'Quaresma'
  | 'Tríduo Pascal'
  | 'Tempo Pascal';

export type CelebrationRank =
  | 'solenidade'
  | 'festa'
  | 'memoria'
  | 'memoria_facultativa'
  | 'feria';

export type YearCycle = 'A' | 'B' | 'C';
export type WeekCycle = 'I' | 'II';

export interface ChurchKeyDates {
  adventStart: Date;
  christmas: Date;
  baptismOfTheLord: Date;
  ashWednesday: Date;
  palmSunday: Date;
  holyThursday: Date;
  goodFriday: Date;
  easter: Date;
  ascension: Date;
  pentecost: Date;
  trinity: Date;
  corpusChristi: Date;
  sacredHeart: Date;
  assumption: Date;
  allSaints: Date;
  christTheKing: Date;
  immaculateConception: Date;
}

export interface LiturgicalDay {
  isoDate: string;
  season: LiturgicalSeason;
  /** Semana dentro do tempo litúrgico (1-based). */
  seasonWeek: number;
  /** Ciclo dominical de leituras (A, B, C). */
  yearCycle: YearCycle;
  /** Ciclo ferial de leituras (I ímpar, II par). */
  weekCycle: WeekCycle;
  /** Ano litúrgico ao qual o dia pertence (começa no 1º Domingo do Advento). */
  liturgicalYear: number;
  /** Grau mais provável da celebração (refinado depois pela liturgia oficial). */
  rank: CelebrationRank;
  /** Nome da solenidade/festa fixa ou móvel, quando o dia for uma delas. */
  celebration: string | null;
  isSunday: boolean;
  isHolyWeek: boolean;
  keyDates: ChurchKeyDates;
}

const DAY = 86_400_000;

function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function diffDays(a: Date, b: Date): number {
  return Math.round((atMidnight(a).getTime() - atMidnight(b).getTime()) / DAY);
}

function sameDay(a: Date, b: Date): boolean {
  return toIsoDateKey(a) === toIsoDateKey(b);
}

/** Computus — Páscoa (rito gregoriano) para um ano civil. */
export function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** 1º Domingo do Advento do ano civil informado. */
export function computeAdventStart(year: number): Date {
  const christmas = new Date(year, 11, 25);
  // 4º domingo antes do Natal
  const dow = christmas.getDay();
  const fourthSunday = addDays(christmas, -(dow === 0 ? 7 : dow) - 21);
  return fourthSunday;
}

export function computeKeyDates(liturgicalYearStart: number): ChurchKeyDates {
  // liturgicalYearStart = ano civil em que o Advento começou
  const civil = liturgicalYearStart + 1;
  const easter = computeEaster(civil);
  const christmasDate = new Date(liturgicalYearStart, 11, 25);
  const epiphany = new Date(civil, 0, 6);
  // Batismo do Senhor: domingo após 6 de janeiro
  const baptism = addDays(epiphany, (7 - epiphany.getDay()) % 7 || 7);

  return {
    adventStart: computeAdventStart(liturgicalYearStart),
    christmas: christmasDate,
    baptismOfTheLord: baptism,
    ashWednesday: addDays(easter, -46),
    palmSunday: addDays(easter, -7),
    holyThursday: addDays(easter, -3),
    goodFriday: addDays(easter, -2),
    easter,
    ascension: addDays(easter, 39),
    pentecost: addDays(easter, 49),
    trinity: addDays(easter, 56),
    corpusChristi: addDays(easter, 60),
    sacredHeart: addDays(easter, 68),
    assumption: new Date(civil, 7, 15),
    allSaints: new Date(civil, 10, 1),
    christTheKing: addDays(computeAdventStart(civil), -7),
    immaculateConception: new Date(liturgicalYearStart, 11, 8),
  };
}

const FIXED_SOLEMNITIES: Array<{ month: number; day: number; name: string }> = [
  { month: 0, day: 1, name: 'Santa Maria, Mãe de Deus' },
  { month: 0, day: 6, name: 'Epifania do Senhor' },
  { month: 2, day: 19, name: 'São José, Esposo de Maria' },
  { month: 2, day: 25, name: 'Anunciação do Senhor' },
  { month: 5, day: 24, name: 'Natividade de São João Batista' },
  { month: 5, day: 29, name: 'São Pedro e São Paulo' },
  { month: 7, day: 15, name: 'Assunção de Nossa Senhora' },
  { month: 9, day: 12, name: 'Nossa Senhora Aparecida' },
  { month: 10, day: 1, name: 'Todos os Santos' },
  { month: 10, day: 2, name: 'Fiéis Defuntos' },
  { month: 11, day: 8, name: 'Imaculada Conceição' },
  { month: 11, day: 25, name: 'Natal do Senhor' },
];

export function resolveLiturgicalDay(date: Date): LiturgicalDay {
  const d = atMidnight(date);
  const year = d.getFullYear();

  // Determina o ano litúrgico (inicia no 1º Domingo do Advento)
  const adventThisYear = computeAdventStart(year);
  const liturgicalYearStart = d >= adventThisYear ? year : year - 1;
  const keyDates = computeKeyDates(liturgicalYearStart);

  const { adventStart, christmas, baptismOfTheLord, ashWednesday, holyThursday, easter, pentecost, palmSunday } =
    keyDates;

  let season: LiturgicalSeason;
  let seasonWeek = 1;

  if (d >= adventStart && d < christmas) {
    season = 'Advento';
    seasonWeek = Math.floor(diffDays(d, adventStart) / 7) + 1;
  } else if (d >= christmas && d <= baptismOfTheLord) {
    season = 'Natal';
    seasonWeek = Math.floor(diffDays(d, christmas) / 7) + 1;
  } else if (d >= ashWednesday && d < holyThursday) {
    season = 'Quaresma';
    seasonWeek = Math.floor(diffDays(d, ashWednesday) / 7) + 1;
  } else if (d >= holyThursday && d < easter) {
    season = 'Tríduo Pascal';
    seasonWeek = 1;
  } else if (d >= easter && d <= pentecost) {
    season = 'Tempo Pascal';
    seasonWeek = Math.floor(diffDays(d, easter) / 7) + 1;
  } else {
    season = 'Tempo Comum';
    if (d > baptismOfTheLord && d < ashWednesday) {
      seasonWeek = Math.floor(diffDays(d, baptismOfTheLord) / 7) + 1;
    } else {
      // Retomada do Tempo Comum após Pentecostes: contagem regressiva até o Advento
      const weeksToAdvent = Math.ceil(diffDays(adventStart, d) / 7);
      seasonWeek = Math.max(1, 34 - weeksToAdvent + 1);
    }
  }

  // Ciclos de leitura
  const cycleIndex = (liturgicalYearStart + 1) % 3; // 2026 (ano lit. iniciado 2025) → C
  const yearCycle: YearCycle = cycleIndex === 0 ? 'C' : cycleIndex === 1 ? 'A' : 'B';
  const weekCycle: WeekCycle = (liturgicalYearStart + 1) % 2 === 1 ? 'I' : 'II';

  // Celebração / grau
  let celebration: string | null = null;
  let rank: CelebrationRank = 'feria';

  const movable: Array<[Date, string]> = [
    [easter, 'Domingo da Ressurreição'],
    [keyDates.pentecost, 'Pentecostes'],
    [keyDates.trinity, 'Santíssima Trindade'],
    [keyDates.corpusChristi, 'Corpus Christi'],
    [keyDates.sacredHeart, 'Sagrado Coração de Jesus'],
    [keyDates.ascension, 'Ascensão do Senhor'],
    [keyDates.christTheKing, 'Cristo Rei do Universo'],
    [palmSunday, 'Domingo de Ramos'],
    [keyDates.goodFriday, 'Sexta-feira da Paixão'],
    [keyDates.holyThursday, 'Quinta-feira Santa'],
    [keyDates.ashWednesday, 'Quarta-feira de Cinzas'],
    [baptismOfTheLord, 'Batismo do Senhor'],
  ];

  for (const [when, name] of movable) {
    if (sameDay(d, when)) {
      celebration = name;
      rank = name === 'Quarta-feira de Cinzas' ? 'feria' : 'solenidade';
      break;
    }
  }

  if (!celebration) {
    const fixed = FIXED_SOLEMNITIES.find((f) => f.month === d.getMonth() && f.day === d.getDate());
    if (fixed) {
      celebration = fixed.name;
      rank = 'solenidade';
    }
  }

  const isSunday = d.getDay() === 0;
  if (!celebration && isSunday) rank = 'festa';

  const isHolyWeek = d >= palmSunday && d < easter;

  return {
    isoDate: toIsoDateKey(d),
    season,
    seasonWeek,
    yearCycle,
    weekCycle,
    liturgicalYear: liturgicalYearStart + 1,
    rank,
    celebration,
    isSunday,
    isHolyWeek,
    keyDates,
  };
}

/** Milissegundos até a próxima meia-noite local (timezone do dispositivo). */
export function msUntilNextMidnight(from: Date = new Date()): number {
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1, 0, 0, 5, 0);
  return Math.max(1000, next.getTime() - from.getTime());
}
