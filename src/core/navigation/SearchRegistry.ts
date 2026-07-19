/**
 * SearchRegistry — busca universal tipada.
 *
 * Cada resultado carrega:
 *   - `kind` (o QUE é: Bíblia, Tema, Magistério, Padre, Santo, ...)
 *   - `action` (o VERBO: abrir leitor, abrir estudo composto, abrir documento, abrir perfil)
 *   - `targetPath` (destino resolvido via RouteRegistry)
 *
 * Componentes de busca renderizam a partir desses três campos, sem `if (kind === ...)`.
 * (Sprint 2.0.3A: fonte estática mock. Sprint 2.0.6: índice real.)
 */

import type { NavAction } from './types';
import { RouteRegistry } from './RouteRegistry';
import { ThemeRegistry } from './ThemeRegistry';

export type SearchResultKind =
  | 'bible'
  | 'theme'
  | 'magisterium'
  | 'father'
  | 'saint'
  | 'catechism'
  | 'council'
  | 'canon';

export interface SearchResult {
  id: string;
  label: string;               // texto principal ("João 3", "Esperança", ...)
  hint?: string;               // subtítulo ("Bíblia", "Tema", ...)
  kind: SearchResultKind;
  action: NavAction;
  targetPath: string;
}

const KIND_LABEL: Record<SearchResultKind, string> = {
  bible: 'Bíblia',
  theme: 'Tema',
  magisterium: 'Magistério',
  father: 'Padre da Igreja',
  saint: 'Santo',
  catechism: 'Catecismo',
  council: 'Concílio',
  canon: 'Direito Canônico',
};

/** Base mock estática. */
const CORPUS: SearchResult[] = [
  {
    id: 'b1', label: 'João 3', hint: KIND_LABEL.bible, kind: 'bible', action: 'open-reader',
    targetPath: RouteRegistry.resolve('study.bible', { book: 'joao', chapter: 3 }),
  },
  {
    id: 'b2', label: 'Romanos 8', hint: KIND_LABEL.bible, kind: 'bible', action: 'open-reader',
    targetPath: RouteRegistry.resolve('study.bible', { book: 'romanos', chapter: 8 }),
  },
  {
    id: 'm1', label: 'Rerum Novarum', hint: KIND_LABEL.magisterium, kind: 'magisterium', action: 'open-document',
    targetPath: RouteRegistry.resolve('study.magisterium', { doc: 'rerum-novarum' }),
  },
  {
    id: 'm2', label: 'Lumen Gentium', hint: KIND_LABEL.magisterium, kind: 'magisterium', action: 'open-document',
    targetPath: RouteRegistry.resolve('study.magisterium', { doc: 'lumen-gentium' }),
  },
  {
    id: 'f1', label: 'São João Crisóstomo', hint: KIND_LABEL.father, kind: 'father', action: 'open-profile',
    targetPath: RouteRegistry.resolve('study.father', { slug: 's-joao-crisostomo-0913' }),
  },
  {
    id: 'f2', label: 'Santo Agostinho', hint: KIND_LABEL.father, kind: 'father', action: 'open-profile',
    targetPath: RouteRegistry.resolve('study.father', { slug: 'agostinho' }),
  },
  {
    id: 's1', label: 'Santo Tomás de Aquino', hint: KIND_LABEL.saint, kind: 'saint', action: 'open-profile',
    targetPath: RouteRegistry.resolve('study.saint', { slug: 'thomas-aquinas' }),
  },
  {
    id: 'c1', label: 'CIC §§ 1996-2005 (Graça)', hint: KIND_LABEL.catechism, kind: 'catechism', action: 'open-document',
    targetPath: RouteRegistry.resolve('study.catechism', { paragraph: 1996 }),
  },
  {
    id: 'k1', label: 'Concílio de Trento', hint: KIND_LABEL.council, kind: 'council', action: 'open-document',
    targetPath: RouteRegistry.resolve('study.magisterium', { doc: 'concilio-trento' }),
  },
];

/** Injeta temas do ThemeRegistry como resultados de kind='theme'. */
function themeResults(): SearchResult[] {
  return ThemeRegistry.all().map((t) => ({
    id: `t.${t.slug}`,
    label: t.label,
    hint: KIND_LABEL.theme,
    kind: 'theme' as const,
    action: 'open-composed-study' as const,
    targetPath: RouteRegistry.resolve('study.composed', { slug: t.slug }),
  }));
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export const SearchRegistry = {
  KIND_LABEL,
  suggestions(limit = 5): SearchResult[] {
    // Sugestões estáticas antes da digitação: mistura temas + clássicos.
    return [...themeResults().slice(0, 3), ...CORPUS.slice(0, 2)].slice(0, limit);
  },
  search(query: string, limit = 10): SearchResult[] {
    const q = normalize(query.trim());
    if (!q) return [];
    const all = [...themeResults(), ...CORPUS];
    return all
      .filter((r) => normalize(r.label).includes(q) || normalize(r.hint ?? '').includes(q))
      .slice(0, limit);
  },
};
