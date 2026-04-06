/**
 * Bible reading badges – awarded automatically when milestones are reached.
 */

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  condition: (ctx: BadgeContext) => boolean;
}

export interface BadgeContext {
  completedBooks: Set<string>;
  chaptersRead: Record<string, Set<number>>;
  totalMinutesRead: number;
  streak: number;
  completedJourneys: number;
}

// Book abbreviation groups
const PENTATEUCO = ['Gn', 'Ex', 'Lv', 'Nm', 'Dt'];
const EVANGELHOS = ['Mt', 'Mc', 'Lc', 'Jo'];
const AT_BOOKS = [
  ...PENTATEUCO,
  'Js','Jz','Rt','1Sm','2Sm','1Rs','2Rs','1Cr','2Cr','Esd','Ne','Tb','Jt','Est','1Mc','2Mc',
  'Jó','Sl','Pr','Ecl','Ct','Sb','Eclo',
  'Is','Jr','Lm','Br','Ez','Dn','Os','Jl','Am','Ab','Jn','Mq','Na','Hab','Sf','Ag','Zc','Ml',
];
const NT_BOOKS = [
  ...EVANGELHOS, 'At',
  'Rm','1Cor','2Cor','Gl','Ef','Fl','Cl','1Ts','2Ts','1Tm','2Tm','Tt','Fm','Hb',
  'Tg','1Pd','2Pd','1Jo','2Jo','3Jo','Jd','Ap',
];

const hasAll = (set: Set<string>, arr: string[]) => arr.every(b => set.has(b));

export const BADGE_DEFINITIONS: BadgeDef[] = [
  {
    id: 'first_book',
    name: 'Primeira Leitura',
    description: 'Completou seu primeiro livro da Bíblia',
    icon: '📖',
    condition: ctx => ctx.completedBooks.size >= 1,
  },
  {
    id: 'five_books',
    name: 'Leitor Dedicado',
    description: 'Completou 5 livros da Bíblia',
    icon: '📚',
    condition: ctx => ctx.completedBooks.size >= 5,
  },
  {
    id: 'pentateuco',
    name: 'Torah Completa',
    description: 'Leu todo o Pentateuco (Gn-Dt)',
    icon: '📜',
    condition: ctx => hasAll(ctx.completedBooks, PENTATEUCO),
  },
  {
    id: 'evangelhos',
    name: 'Discípulo dos Evangelhos',
    description: 'Leu os quatro Evangelhos',
    icon: '✝️',
    condition: ctx => hasAll(ctx.completedBooks, EVANGELHOS),
  },
  {
    id: 'novo_testamento',
    name: 'Novo Testamento Completo',
    description: 'Leu todo o Novo Testamento',
    icon: '🕊️',
    condition: ctx => hasAll(ctx.completedBooks, NT_BOOKS),
  },
  {
    id: 'antigo_testamento',
    name: 'Antigo Testamento Completo',
    description: 'Leu todo o Antigo Testamento',
    icon: '⚔️',
    condition: ctx => hasAll(ctx.completedBooks, AT_BOOKS),
  },
  {
    id: 'biblia_completa',
    name: 'Bíblia Completa',
    description: 'Leu todos os 73 livros da Bíblia',
    icon: '👑',
    condition: ctx => hasAll(ctx.completedBooks, [...AT_BOOKS, ...NT_BOOKS]),
  },
  {
    id: 'ten_books',
    name: 'Estudioso',
    description: 'Completou 10 livros da Bíblia',
    icon: '🎓',
    condition: ctx => ctx.completedBooks.size >= 10,
  },
  {
    id: 'twenty_books',
    name: 'Teólogo',
    description: 'Completou 20 livros da Bíblia',
    icon: '🏛️',
    condition: ctx => ctx.completedBooks.size >= 20,
  },
];

/**
 * Returns badge IDs that should be awarded but aren't yet.
 */
export function checkNewBadges(currentBadges: string[], ctx: BadgeContext): string[] {
  const current = new Set(currentBadges);
  return BADGE_DEFINITIONS
    .filter(b => !current.has(b.id) && b.condition(ctx))
    .map(b => b.id);
}

export function getBadgeById(id: string): BadgeDef | undefined {
  return BADGE_DEFINITIONS.find(b => b.id === id);
}
