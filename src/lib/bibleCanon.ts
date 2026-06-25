/**
 * Cânon bíblico — fonte única de verdade.
 *
 * Cobre os 66 livros protocanônicos + 7 deuterocanônicos católicos.
 * Cada entrada amarra: nome PT completo, abreviação usada na app
 * (rotas /bible?book=…), ID do livro em bolls.life (NAA) e testamento.
 *
 * Mantenha esta lista sincronizada entre frontend e edge functions:
 * - frontend: import { BIBLE_CANON, ... } from '@/lib/bibleCanon'
 * - edge:     import { BIBLE_CANON, ... } from '../_shared/bibleCanon.ts'
 */

export type Testament = 'OT' | 'NT';

export interface BibleBook {
  /** Abreviação curta usada nas rotas e popovers (ex.: 'Mt'). */
  abbr: string;
  /** Nome completo em português (ex.: 'Mateus'). */
  name: string;
  /** ID do livro na API bolls.life para a versão NAA. */
  bollsId: number;
  testament: Testament;
  /** Marca deuterocanônicos (cânon católico). */
  deuterocanonical?: boolean;
}

export const BIBLE_CANON: readonly BibleBook[] = [
  // Antigo Testamento — protocanônicos
  { abbr: 'Gn', name: 'Gênesis', bollsId: 1, testament: 'OT' },
  { abbr: 'Ex', name: 'Êxodo', bollsId: 2, testament: 'OT' },
  { abbr: 'Lv', name: 'Levítico', bollsId: 3, testament: 'OT' },
  { abbr: 'Nm', name: 'Números', bollsId: 4, testament: 'OT' },
  { abbr: 'Dt', name: 'Deuteronômio', bollsId: 5, testament: 'OT' },
  { abbr: 'Js', name: 'Josué', bollsId: 6, testament: 'OT' },
  { abbr: 'Jz', name: 'Juízes', bollsId: 7, testament: 'OT' },
  { abbr: 'Rt', name: 'Rute', bollsId: 8, testament: 'OT' },
  { abbr: '1Sm', name: '1 Samuel', bollsId: 9, testament: 'OT' },
  { abbr: '2Sm', name: '2 Samuel', bollsId: 10, testament: 'OT' },
  { abbr: '1Rs', name: '1 Reis', bollsId: 11, testament: 'OT' },
  { abbr: '2Rs', name: '2 Reis', bollsId: 12, testament: 'OT' },
  { abbr: '1Cr', name: '1 Crônicas', bollsId: 13, testament: 'OT' },
  { abbr: '2Cr', name: '2 Crônicas', bollsId: 14, testament: 'OT' },
  { abbr: 'Ed', name: 'Esdras', bollsId: 15, testament: 'OT' },
  { abbr: 'Ne', name: 'Neemias', bollsId: 16, testament: 'OT' },
  { abbr: 'Et', name: 'Ester', bollsId: 17, testament: 'OT' },
  { abbr: 'Jó', name: 'Jó', bollsId: 18, testament: 'OT' },
  { abbr: 'Sl', name: 'Salmos', bollsId: 19, testament: 'OT' },
  { abbr: 'Pv', name: 'Provérbios', bollsId: 20, testament: 'OT' },
  { abbr: 'Ec', name: 'Eclesiastes', bollsId: 21, testament: 'OT' },
  { abbr: 'Ct', name: 'Cânticos', bollsId: 22, testament: 'OT' },
  { abbr: 'Is', name: 'Isaías', bollsId: 23, testament: 'OT' },
  { abbr: 'Jr', name: 'Jeremias', bollsId: 24, testament: 'OT' },
  { abbr: 'Lm', name: 'Lamentações', bollsId: 25, testament: 'OT' },
  { abbr: 'Ez', name: 'Ezequiel', bollsId: 26, testament: 'OT' },
  { abbr: 'Dn', name: 'Daniel', bollsId: 27, testament: 'OT' },
  { abbr: 'Os', name: 'Oseias', bollsId: 28, testament: 'OT' },
  { abbr: 'Jl', name: 'Joel', bollsId: 29, testament: 'OT' },
  { abbr: 'Am', name: 'Amós', bollsId: 30, testament: 'OT' },
  { abbr: 'Ab', name: 'Abdias', bollsId: 31, testament: 'OT' },
  { abbr: 'Jn', name: 'Jonas', bollsId: 32, testament: 'OT' },
  { abbr: 'Mq', name: 'Miqueias', bollsId: 33, testament: 'OT' },
  { abbr: 'Na', name: 'Naum', bollsId: 34, testament: 'OT' },
  { abbr: 'Hc', name: 'Habacuque', bollsId: 35, testament: 'OT' },
  { abbr: 'Sf', name: 'Sofonias', bollsId: 36, testament: 'OT' },
  { abbr: 'Ag', name: 'Ageu', bollsId: 37, testament: 'OT' },
  { abbr: 'Zc', name: 'Zacarias', bollsId: 38, testament: 'OT' },
  { abbr: 'Ml', name: 'Malaquias', bollsId: 39, testament: 'OT' },

  // Novo Testamento
  { abbr: 'Mt', name: 'Mateus', bollsId: 40, testament: 'NT' },
  { abbr: 'Mc', name: 'Marcos', bollsId: 41, testament: 'NT' },
  { abbr: 'Lc', name: 'Lucas', bollsId: 42, testament: 'NT' },
  { abbr: 'Jo', name: 'João', bollsId: 43, testament: 'NT' },
  { abbr: 'At', name: 'Atos dos Apóstolos', bollsId: 44, testament: 'NT' },
  { abbr: 'Rm', name: 'Romanos', bollsId: 45, testament: 'NT' },
  { abbr: '1Co', name: '1 Coríntios', bollsId: 46, testament: 'NT' },
  { abbr: '2Co', name: '2 Coríntios', bollsId: 47, testament: 'NT' },
  { abbr: 'Gl', name: 'Gálatas', bollsId: 48, testament: 'NT' },
  { abbr: 'Ef', name: 'Efésios', bollsId: 49, testament: 'NT' },
  { abbr: 'Fp', name: 'Filipenses', bollsId: 50, testament: 'NT' },
  { abbr: 'Cl', name: 'Colossenses', bollsId: 51, testament: 'NT' },
  { abbr: '1Ts', name: '1 Tessalonicenses', bollsId: 52, testament: 'NT' },
  { abbr: '2Ts', name: '2 Tessalonicenses', bollsId: 53, testament: 'NT' },
  { abbr: '1Tm', name: '1 Timóteo', bollsId: 54, testament: 'NT' },
  { abbr: '2Tm', name: '2 Timóteo', bollsId: 55, testament: 'NT' },
  { abbr: 'Tt', name: 'Tito', bollsId: 56, testament: 'NT' },
  { abbr: 'Fm', name: 'Filemom', bollsId: 57, testament: 'NT' },
  { abbr: 'Hb', name: 'Hebreus', bollsId: 58, testament: 'NT' },
  { abbr: 'Tg', name: 'Tiago', bollsId: 59, testament: 'NT' },
  { abbr: '1Pe', name: '1 Pedro', bollsId: 60, testament: 'NT' },
  { abbr: '2Pe', name: '2 Pedro', bollsId: 61, testament: 'NT' },
  { abbr: '1Jo', name: '1 João', bollsId: 62, testament: 'NT' },
  { abbr: '2Jo', name: '2 João', bollsId: 63, testament: 'NT' },
  { abbr: '3Jo', name: '3 João', bollsId: 64, testament: 'NT' },
  { abbr: 'Jd', name: 'Judas', bollsId: 65, testament: 'NT' },
  { abbr: 'Ap', name: 'Apocalipse', bollsId: 66, testament: 'NT' },

  // Deuterocanônicos (cânon católico) — Bolls expõe esses IDs na NAA católica
  { abbr: 'Tb', name: 'Tobias', bollsId: 67, testament: 'OT', deuterocanonical: true },
  { abbr: 'Jdt', name: 'Judite', bollsId: 68, testament: 'OT', deuterocanonical: true },
  { abbr: 'Sb', name: 'Sabedoria', bollsId: 69, testament: 'OT', deuterocanonical: true },
  { abbr: 'Eclo', name: 'Eclesiástico', bollsId: 70, testament: 'OT', deuterocanonical: true },
  { abbr: 'Br', name: 'Baruc', bollsId: 71, testament: 'OT', deuterocanonical: true },
  { abbr: '1Mc', name: '1 Macabeus', bollsId: 72, testament: 'OT', deuterocanonical: true },
  { abbr: '2Mc', name: '2 Macabeus', bollsId: 73, testament: 'OT', deuterocanonical: true },
];

/** Aliases comuns aceitos em URLs/imports antigos. */
const ABBR_ALIASES: Record<string, string> = {
  Job: 'Jó',
  Abd: 'Ab',
  Jon: 'Jn',
  Mi: 'Mq',
  Hab: 'Hc',
  Sof: 'Sf',
  Ageu: 'Ag',
  Zac: 'Zc',
  Mal: 'Ml',
  // Aliases UI ↔ canon — `bible-books.ts` usa formas curtas/longas diferentes.
  // Resolvem 9 livros que estavam 404 no audit (compact-lowercase do input
  // bate em uma destas chaves via BY_ABBR_LOWER).
  Esd: 'Ed',
  Est: 'Et',
  Pr: 'Pv',
  Ecl: 'Ec',
  '1Cor': '1Co',
  '2Cor': '2Co',
  Fl: 'Fp',
  '1Pd': '1Pe',
  '2Pd': '2Pe',
};

const BY_ABBR: Record<string, BibleBook> = (() => {
  const map: Record<string, BibleBook> = {};
  for (const b of BIBLE_CANON) map[b.abbr] = b;
  for (const [alias, canonical] of Object.entries(ABBR_ALIASES)) {
    if (map[canonical]) map[alias] = map[canonical];
  }
  return map;
})();

export function findBookByAbbr(abbr: string): BibleBook | undefined {
  if (!abbr) return undefined;
  const trimmed = abbr.trim();
  if (BY_ABBR[trimmed]) return BY_ABBR[trimmed];
  const cap = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  if (BY_ABBR[cap]) return BY_ABBR[cap];
  // Tolerate spaces/punctuation (e.g. "2 Cr", "2.Cr", "2-cr") with case-insensitive fallback.
  const compact = trimmed.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  for (const [k, v] of Object.entries(BY_ABBR)) {
    if (k.toLowerCase() === compact) return v;
  }
  return undefined;
}

/** Normaliza para a forma canônica do BIBLE_CANON (ex.: "2 Cr" → "2Cr"). */
export function normalizeAbbr(input: string): string {
  if (!input) return input;
  return findBookByAbbr(input)?.abbr ?? input.trim();
}

export function bookNameFromAbbr(abbr: string): string {
  return findBookByAbbr(abbr)?.name ?? abbr;
}

/** Mapa abrev → bollsId (compatível com o uso anterior). */
export const BOLLS_MAP: Record<string, number> = Object.fromEntries(
  Object.entries(BY_ABBR).map(([k, v]) => [k, v.bollsId])
);

/** Mapa abrev → nome PT (compatível com o uso anterior). */
export const BOOK_NAME_BY_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(BY_ABBR).map(([k, v]) => [k, v.name])
);
