import { describe, it, expect } from 'vitest';
import { ContinuationEngine } from '../ContinuationEngine';
import { resolveContext } from '../resolveContext';
import { scoreCandidates } from '../scoreCandidates';
import { chooseSuggestions } from '../chooseSuggestions';
import type { ContinuationCandidate } from '../types';

describe('ContinuationEngine — Fase 0', () => {
  it('resolveContext normaliza input com themeIds e meta', () => {
    const ctx = resolveContext({
      kind: 'bible',
      id: 'gen-1',
      themeIds: ['theme:criacao'],
      meta: { bookAbbr: 'Gn', chapter: 1, totalChapters: 50 },
    });
    expect(ctx.kind).toBe('bible');
    expect(ctx.graphKind).toBe('bible');
    expect(ctx.themeIds).toEqual(['theme:criacao']);
    expect(ctx.meta.chapter).toBe(1);
    expect(ctx.resolvedAt).toBeInstanceOf(Date);
  });

  it('scoreCandidates converte rawWeight 0..1 em score 0..100 e confidence', () => {
    const cands: ContinuationCandidate[] = [
      {
        node: { node: { id: 'a', kind: 'bible', label: 'A' }, url: '/a' },
        intent: 'study',
        rawWeight: 0.9,
        reasons: ['mesmo tema'],
      },
      {
        node: { node: { id: 'b', kind: 'catechism', label: 'B' }, url: '/b' },
        intent: 'deepen',
        rawWeight: 0.5,
        reasons: [],
      },
      {
        node: { node: { id: 'c', kind: 'saint', label: 'C' }, url: '/c' },
        intent: 'meet',
        rawWeight: 0.1,
        reasons: [],
      },
    ];
    const scored = scoreCandidates(cands);
    expect(scored[0].score).toBe(90);
    expect(scored[0].confidence).toBe('high');
    expect(scored[1].confidence).toBe('medium');
    expect(scored[2].confidence).toBe('low');
  });

  it('chooseSuggestions descarta confidence=low e diversifica por intent', () => {
    const scored = scoreCandidates([
      { node: { node: { id: 'a', kind: 'bible', label: 'A' }, url: '/a' }, intent: 'study', rawWeight: 0.9, reasons: [] },
      { node: { node: { id: 'b', kind: 'bible', label: 'B' }, url: '/b' }, intent: 'study', rawWeight: 0.8, reasons: [] },
      { node: { node: { id: 'c', kind: 'catechism', label: 'C' }, url: '/c' }, intent: 'deepen', rawWeight: 0.7, reasons: [] },
      { node: { node: { id: 'd', kind: 'saint', label: 'D' }, url: '/d' }, intent: 'meet', rawWeight: 0.1, reasons: [] },
    ]);
    const picked = chooseSuggestions(scored);
    // 1ª passada: 1 por intent (a=study, c=deepen). d é low → descartado.
    // 2ª passada: preenche vaga remanescente com b (ignora restrição de intent).
    expect(picked).toHaveLength(3);
    expect(picked.every((p) => p.confidence !== 'low')).toBe(true);
    // Diversidade: pelo menos 2 intents distintos no topo.
    expect(new Set(picked.slice(0, 2).map((p) => p.intent)).size).toBe(2);
  });

  it('Engine cai no fallback quando o grafo devolve vazio', () => {
    const result = ContinuationEngine.run({
      kind: 'bible',
      meta: { bookAbbr: 'Gn', chapter: 1, totalChapters: 50, paragraph: 289 },
    });
    expect(result.source).toBe('fallback');
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0].source).toBe('fallback');
    expect(result.suggestions.some((s) => s.href.includes('/catechism?p=289'))).toBe(true);
  });

  it('Fallback nunca deixa vazio (kind desconhecido de meta)', () => {
    const result = ContinuationEngine.run({ kind: 'magisterium' });
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.source).toBe('fallback');
  });
});
