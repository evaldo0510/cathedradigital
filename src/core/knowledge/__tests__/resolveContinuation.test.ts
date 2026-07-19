import { describe, it, expect } from 'vitest';
import { resolveContinuation } from '../continuation';

describe('resolveContinuation', () => {
  it('devolve [] quando não há âncora resolvível no grafo', () => {
    const r = resolveContinuation({ currentKind: 'bible' });
    expect(r).toEqual([]);
  });

  it('devolve [] quando o currentId não existe no grafo', () => {
    const r = resolveContinuation({
      currentKind: 'bible',
      currentId: 'bible:inexistente:99',
    });
    expect(r).toEqual([]);
  });

  it('gera sugestões diversificadas por intent a partir de um tema', () => {
    const r = resolveContinuation({
      currentKind: 'bible',
      themeIds: ['theme:esperanca'],
    });
    expect(r.length).toBeGreaterThan(0);
    expect(r.length).toBeLessThanOrEqual(4);
    const intents = new Set(r.map((s) => s.intent));
    // Esperança tem develops (study/deepen), commented-by (meet),
    // applies-to (apply) e prayed-as (pray) no seed.
    expect(intents.size).toBeGreaterThanOrEqual(3);
  });

  it('inclui URL resolvida para cada sugestão', () => {
    const r = resolveContinuation({
      currentKind: 'catechism',
      themeIds: ['theme:eucaristia'],
    });
    expect(r.every((s) => typeof s.target.url === 'string' && s.target.url.length > 0)).toBe(true);
  });

  it('ordena por peso decrescente na seleção final', () => {
    const r = resolveContinuation({
      currentKind: 'magisterium',
      themeIds: ['theme:graca'],
    });
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].weight).toBeGreaterThanOrEqual(r[i].weight);
    }
  });

  it('funciona quando currentId é o próprio nó âncora', () => {
    const r = resolveContinuation({
      currentKind: 'bible',
      currentId: 'bible:joao:6',
    });
    // Jo 6 não tem arestas de saída no seed → devolve [].
    // Já valida que a função não quebra com nó válido sem vizinhos.
    expect(Array.isArray(r)).toBe(true);
  });

  it('cada sugestão contém uma URL absoluta iniciando com "/"', () => {
    const r = resolveContinuation({
      currentKind: 'bible',
      themeIds: ['theme:esperanca'],
    });
    expect(r.length).toBeGreaterThan(0);
    for (const s of r) {
      expect(s.target.url).toMatch(/^\//);
    }
  });

  it('mapeia a intent "meet" para nós saint/father (regra por kind)', () => {
    const r = resolveContinuation({
      currentKind: 'bible',
      themeIds: ['theme:esperanca'],
    });
    for (const s of r.filter((x) => x.intent === 'meet')) {
      expect(['saint', 'father']).toContain(s.target.node.kind);
    }
  });

  it('mapeia a intent "pray" apenas para nós prayer', () => {
    const r = resolveContinuation({
      currentKind: 'bible',
      themeIds: ['theme:esperanca'],
    });
    for (const s of r.filter((x) => x.intent === 'pray')) {
      expect(s.target.node.kind).toBe('prayer');
    }
  });

  it('respeita o teto de 4 sugestões mesmo em temas com muitas arestas', () => {
    const r = resolveContinuation({
      currentKind: 'bible',
      themeIds: ['theme:esperanca'],
    });
    expect(r.length).toBeLessThanOrEqual(4);
  });

  it('exclui a própria âncora dos resultados', () => {
    const r = resolveContinuation({
      currentKind: 'bible',
      themeIds: ['theme:esperanca'],
    });
    expect(r.some((s) => s.target.node.id === 'theme:esperanca')).toBe(false);
  });

  it('combina themeIds + currentId sem duplicar sugestões', () => {
    const r = resolveContinuation({
      currentKind: 'bible',
      currentId: 'bible:joao:6',
      themeIds: ['theme:esperanca'],
    });
    const ids = r.map((s) => s.target.node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

