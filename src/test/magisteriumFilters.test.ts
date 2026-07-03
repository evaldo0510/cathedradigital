import { describe, it, expect } from 'vitest';
import {
  filterAndSortDocuments,
  highlightSegments,
  matchesSearch,
  mergeFilterParams,
  searchParamsToState,
  stateToSearchParams,
  DEFAULT_FILTER_STATE,
  type MagisteriumFilterState,
} from '@/lib/magisteriumFilters';
import {
  MAGISTERIUM_CATEGORIES,
  MAGISTERIUM_DOCUMENTS,
  type MagisteriumDocument,
} from '@/data/magisterium-urls';

const CATEGORY_ORDER: Record<string, number> = MAGISTERIUM_CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.name]: c.order }),
  {} as Record<string, number>,
);

const state = (patch: Partial<MagisteriumFilterState> = {}): MagisteriumFilterState => ({
  ...DEFAULT_FILTER_STATE,
  ...patch,
});

describe('magisteriumFilters — filtragem', () => {
  it('retorna todos os documentos quando não há filtros', () => {
    const result = filterAndSortDocuments(MAGISTERIUM_DOCUMENTS, state(), CATEGORY_ORDER);
    expect(result).toHaveLength(MAGISTERIUM_DOCUMENTS.length);
  });

  it('filtra por categoria', () => {
    const result = filterAndSortDocuments(
      MAGISTERIUM_DOCUMENTS,
      state({ category: 'Encíclicas' }),
      CATEGORY_ORDER,
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(d => d.category === 'Encíclicas')).toBe(true);
  });

  it('multi-tag aplica AND (interseção) entre temas', () => {
    const result = filterAndSortDocuments(
      MAGISTERIUM_DOCUMENTS,
      state({ themes: ['Maria', 'Rosário'] }),
      CATEGORY_ORDER,
    );
    expect(result.every(d => d.themes.includes('Maria') && d.themes.includes('Rosário'))).toBe(true);
    expect(result.some(d => d.id === 'rvm')).toBe(true);
  });

  it('busca cobre título, autor, sigla, tema e resumo', () => {
    expect(matchesSearch(MAGISTERIUM_DOCUMENTS.find(d => d.id === 'lg')!, 'LG')).toBe(true);
    expect(matchesSearch(MAGISTERIUM_DOCUMENTS.find(d => d.id === 'ls')!, 'casa comum')).toBe(true);
    expect(matchesSearch(MAGISTERIUM_DOCUMENTS.find(d => d.id === 'rn')!, 'Leão XIII')).toBe(true);
  });
});

describe('magisteriumFilters — ordenação', () => {
  it('canônica: Concílios (order=1) antes de Encíclicas (order=3)', () => {
    const result = filterAndSortDocuments(MAGISTERIUM_DOCUMENTS, state(), CATEGORY_ORDER);
    const firstConcilio = result.findIndex(d => d.category === 'Concílios Ecumênicos');
    const firstEnc = result.findIndex(d => d.category === 'Encíclicas');
    expect(firstConcilio).toBeLessThan(firstEnc);
  });

  it('canônica: dentro da mesma categoria, ordena por data ascendente', () => {
    const result = filterAndSortDocuments(
      MAGISTERIUM_DOCUMENTS,
      state({ category: 'Encíclicas' }),
      CATEGORY_ORDER,
    );
    const dates = result.map(d => d.date ?? `${d.year}`);
    expect(dates).toEqual([...dates].sort());
  });

  it('cronológica-asc: mais antigo primeiro', () => {
    const result = filterAndSortDocuments(
      MAGISTERIUM_DOCUMENTS,
      state({ sort: 'chronological-asc' }),
      CATEGORY_ORDER,
    );
    expect(result[0].year).toBeLessThanOrEqual(result[result.length - 1].year);
  });

  it('cronológica-desc: mais recente primeiro', () => {
    const result = filterAndSortDocuments(
      MAGISTERIUM_DOCUMENTS,
      state({ sort: 'chronological-desc' }),
      CATEGORY_ORDER,
    );
    expect(result[0].year).toBeGreaterThanOrEqual(result[result.length - 1].year);
  });
});

describe('magisteriumFilters — persistência em URL', () => {
  it('roundtrip: state → params → state', () => {
    const s = state({ search: 'maria', category: 'Encíclicas', themes: ['Fé', 'Razão'], sort: 'chronological-desc' });
    const params = stateToSearchParams(s);
    expect(searchParamsToState(params)).toEqual(s);
  });

  it('omite defaults (canonical sort) da URL', () => {
    const params = stateToSearchParams(state({ search: 'x' }));
    expect(params.has('sort')).toBe(false);
    expect(params.get('q')).toBe('x');
  });

  it('sort inválido cai em canonical', () => {
    const parsed = searchParamsToState(new URLSearchParams('sort=bogus'));
    expect(parsed.sort).toBe('canonical');
  });

  it('mergeFilterParams preserva params externos como topic e doc', () => {
    const current = new URLSearchParams('topic=medo&doc=lg&q=old');
    const merged = mergeFilterParams(current, state({ search: 'novo', themes: ['Fé'] }));
    expect(merged.get('topic')).toBe('medo');
    expect(merged.get('doc')).toBe('lg');
    expect(merged.get('q')).toBe('novo');
    expect(merged.getAll('theme')).toEqual(['Fé']);
  });
});

describe('magisteriumFilters — highlight', () => {
  it('sem query retorna segmento único não destacado', () => {
    expect(highlightSegments('Lumen Gentium', '')).toEqual([{ text: 'Lumen Gentium', match: false }]);
  });

  it('destaca ocorrências case-insensitive', () => {
    const segs = highlightSegments('Lumen Gentium', 'lumen');
    expect(segs.filter(s => s.match).map(s => s.text)).toEqual(['Lumen']);
  });

  it('escapa metacaracteres de regex na query', () => {
    const segs = highlightSegments('Amor (verdadeiro)', '(verdadeiro)');
    expect(segs.some(s => s.match && s.text === '(verdadeiro)')).toBe(true);
  });
});

describe('MagisteriumDocument — schema', () => {
  it('todo documento tem themes como array plural (nunca theme singular)', () => {
    for (const d of MAGISTERIUM_DOCUMENTS) {
      expect(Array.isArray(d.themes)).toBe(true);
      expect((d as unknown as { theme?: unknown }).theme).toBeUndefined();
    }
  });

  it('todo documento tem url resolvível', () => {
    const orphan = MAGISTERIUM_DOCUMENTS.find((d: MagisteriumDocument) => !d.url);
    expect(orphan).toBeUndefined();
  });
});
