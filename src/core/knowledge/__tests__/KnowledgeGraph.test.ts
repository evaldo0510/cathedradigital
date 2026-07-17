import { describe, it, expect } from 'vitest';
import { KnowledgeGraph } from '../KnowledgeGraph';

describe('KnowledgeGraph (fachada pública)', () => {
  it('expõe operações de nós, navegação, estudo, busca, resolução e coleções', () => {
    expect(KnowledgeGraph.findNode('theme:esperanca')?.label).toBe('Esperança');
    expect(KnowledgeGraph.hasNode('theme:esperanca')).toBe(true);
    expect(KnowledgeGraph.nodesByKind('theme').length).toBeGreaterThanOrEqual(3);

    const study = KnowledgeGraph.study('theme:esperanca');
    expect(study.length).toBeGreaterThan(0);

    const path = KnowledgeGraph.pathBetween('theme:eucaristia', 'theme:graca');
    expect(path).not.toBeNull();

    const found = KnowledgeGraph.search('esperanca');
    expect(found.some((n) => n.id === 'theme:esperanca')).toBe(true);

    const r = KnowledgeGraph.resolve('bible:romanos:8');
    expect(r?.url).toBeTruthy();

    const cols = KnowledgeGraph.collections();
    expect(cols.length).toBeGreaterThan(0);
  });
});
