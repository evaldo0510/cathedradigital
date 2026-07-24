/**
 * Sprint B.1 — Biblioteca Cathedra (barrel público).
 */
export * from './types';
export { LibraryCard } from './components/LibraryCard';
export { IceBadge } from './components/IceBadge';
export { LibraryFilters } from './components/LibraryFilters';
export { LIBRARY_ADAPTERS, LIBRARY_MODULES } from './adapters';

// Onda B.1.2 — Busca Unificada
export type {
  LibraryResult,
  LibrarySearchOptions,
  LibrarySearchResponse,
} from './search/types';
export { searchLibrary } from './search/searchLibrary';
export {
  LIBRARY_MODULE_META,
  LIBRARY_MODULE_ORDER,
  type LibraryModuleMeta,
} from './search/moduleMeta';
export { useLibrarySearch } from './hooks/useLibrarySearch';
