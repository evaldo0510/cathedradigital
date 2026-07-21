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

export function resolveSpaceForPath(pathname: string): CathedraSpace | null {
  const p = pathname.toLowerCase();
  if (LIBRARY_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + '/'))) {
    return 'library';
  }
  return null;
}
