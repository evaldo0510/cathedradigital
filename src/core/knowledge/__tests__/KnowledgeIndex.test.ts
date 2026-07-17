import { describe, it, expect } from 'vitest';
import { KnowledgeIndex } from '../KnowledgeIndex';

describe('KnowledgeIndex', () => {
  it('search normaliza acentos (esperanca ≡ Esperança)', () => {
    const a = KnowledgeIndex.search('esperanca');
    const b = KnowledgeIndex.search('Esperança');
    expect(a.map((n) => n.id).sort()).toEqual(b.map((n) => n.id).sort());
    expect(a.some((n) => n.id === 'theme:esperanca')).toBe(true);
  });

  it('search vazio devolve lista vazia', () => {
    expect(KnowledgeIndex.search('   ')).toEqual([]);
  });

  it('search respeita filtro por kinds', () => {
    const only = KnowledgeIndex.search('graça', { kinds: ['theme'] });
    expect(only.every((n) => n.kind === 'theme')).toBe(true);
    expect(only.some((n) => n.id === 'theme:graca')).toBe(true);
  });

  it('search respeita limit', () => {
    const list = KnowledgeIndex.search('a', { limit: 3 });
    expect(list.length).toBeLessThanOrEqual(3);
  });
});
