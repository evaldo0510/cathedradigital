/**
 * Fase 2 — Aplicação gradual de identidade espacial.
 * Mapeia pathname → space (library | church | cloister | atrium).
 * Somente `library` está ativo nesta sprint; demais retornam null (sem alteração).
 */
export type CathedraSpace = 'library' | 'church' | 'cloister' | 'atrium';

const LIBRARY_PREFIXES = [
  '/bible',
  '/biblia',
  '/catechism',
  '/catecismo',
  '/magisterium',
  '/magisterio',
  '/biblioteca',
  '/glossario',
  '/glossary',
  '/jornadas',
  '/itineraria',
  '/temas',
  '/santos',
  '/saints-legacy',
  '/papas',
  '/aparicoes',
  '/dogmas',
  '/aquinas',
];

const CHURCH_PREFIXES = [
  '/oracao',
  '/oracao-legacy',
  '/prayers',
  '/rezar',
  '/rosary',
  '/rosary-legacy',
  '/viacrucis',
  '/litanies',
  '/novenas',

  '/missal',
  '/breviary',
  '/liturgia',
  '/calendar',
  '/lectio',
  '/colecoes',
];

const CLOISTER_PREFIXES = [
  '/logos',
  '/chat',
  '/diario',
  '/conta',
  '/contemplatio',
  '/contemplacao',
  '/confession',
  '/meditacoes',
  '/reflexoes',
  '/exame',
];

export function resolveSpaceForPath(pathname: string): CathedraSpace | null {
  const p = pathname.toLowerCase();
  if (LIBRARY_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + '/'))) {
    return 'library';
  }
  if (CLOISTER_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + '/'))) {
    return 'cloister';
  }
  if (CHURCH_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + '/'))) {
    return 'church';
  }
  return null;
}


