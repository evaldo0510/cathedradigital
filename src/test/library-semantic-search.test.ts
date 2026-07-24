/**
 * Sprint B.1 · Onda B.1.4 — Testes do ranking híbrido + semantic mapper.
 *
 * Cobertura mínima obrigatória (por decisão de escopo B.1.4):
 *   1. Ranking híbrido respeita a fórmula 40/25/20/15 (não deixa a semântica
 *      dominar sozinha).
 *   2. Um item doutrinariamente forte com relevância moderada ainda supera
 *      um item textualmente perfeito de módulo mais fraco quando a semântica
 *      empata — a Cathedra não é Google.
 *   3. `buildSemanticMap` deduplica por (kind:ref) e preserva o maior score.
 *   4. `pickOrphanHits` respeita `lexicalKeys` e o `limit`.
 *   5. `inferFormationLevel` mapeia catecismo por faixa de parágrafo.
 */
import { describe, expect, it } from 'vitest';

import { composeHybridScore } from '../../src/modules/biblioteca/search/ranking';
import {
  applySemanticEnrichment,
  buildSemanticMap,
  pickOrphanHits,
} from '../../src/modules/biblioteca/search/semantic/semanticMapper';
import { inferFormationLevel } from '../../src/modules/biblioteca/search/semantic/semanticRanking';
import type { SemanticHit } from '../../src/modules/biblioteca/search/semantic/semanticClient';
import type { LibraryResult } from '../../src/modules/biblioteca/search/types';
import { BookOpen } from 'lucide-react';

const baseResult = (over: Partial<LibraryResult>): LibraryResult => ({
  type: 'glossary',
  id: 'x',
  title: 'x',
  href: '/x',
  icon: BookOpen,
  score: 0,
  ...over,
});

describe('composeHybridScore (B.1.4)', () => {
  it('respeita peso 40% texto + 25% semantic + 20% doutrina + 15% nexus/ice', () => {
    const perfect = composeHybridScore({
      query: 'eucaristia',
      module: 'catechism',
      title: 'eucaristia',
      semanticScore: 1,
      editorialStatus: 'complete',
      nexusTotal: 10,
    });
    expect(perfect.score).toBeGreaterThan(85);
    expect(perfect.score).toBeLessThanOrEqual(100);
  });

  it('não deixa a semântica dominar sozinha', () => {
    const semOnly = composeHybridScore({
      query: 'inexistente',
      module: 'journeys',
      title: 'jornada',
      semanticScore: 1,
    });
    // 5 (t) * 0.4 + 100 * 0.25 + ~33 * 0.2 + 0 = ~33.6
    expect(semOnly.score).toBeLessThan(45);
  });

  it('bíblia com texto forte supera jornada com semântica alta', () => {
    const bible = composeHybridScore({
      query: 'eucaristia',
      module: 'bible',
      title: 'Eucaristia',
      semanticScore: 0.5,
    });
    const journey = composeHybridScore({
      query: 'eucaristia',
      module: 'journeys',
      title: 'Jornada semanal',
      semanticScore: 0.95,
    });
    expect(bible.score).toBeGreaterThan(journey.score);
  });
});

describe('semanticMapper (B.1.4)', () => {
  const hit = (kind: string, ref: string, score: number, reason = 'r'): SemanticHit => ({
    type: 'glossary',
    kind,
    ref,
    title: ref,
    score,
    reason,
    matchedConcepts: [ref],
  });

  it('deduplica por (kind:ref) mantendo o maior score', () => {
    const map = buildSemanticMap([
      hit('glossary', 'eucaristia', 0.6, 'baixo'),
      hit('glossary', 'eucaristia', 0.9, 'alto'),
    ]);
    expect(map.get('glossary:eucaristia')?.semanticScore).toBe(0.9);
    expect(map.get('glossary:eucaristia')?.reason).toBe('alto');
  });

  it('applySemanticEnrichment não muta quando não há enriquecimento', () => {
    const r = baseResult({});
    expect(applySemanticEnrichment(r, undefined)).toBe(r);
  });

  it('applySemanticEnrichment copia score/reason/conceitos', () => {
    const enriched = applySemanticEnrichment(baseResult({}), {
      semanticScore: 0.7,
      reason: 'porquê',
      matchedConcepts: ['eucaristia'],
    });
    expect(enriched.semanticScore).toBe(0.7);
    expect(enriched.reason).toBe('porquê');
    expect(enriched.matchedConcepts).toEqual(['eucaristia']);
  });

  it('pickOrphanHits ignora hits já presentes no lexical e respeita limit', () => {
    const orphans = pickOrphanHits(
      [
        hit('glossary', 'a', 0.9),
        hit('glossary', 'b', 0.8),
        hit('catechism', '1324', 0.7),
      ],
      new Set(['glossary:a']),
      2,
    );
    expect(orphans.map((h) => h.ref)).toEqual(['b', '1324']);
  });
});

describe('inferFormationLevel (Sprint K ready)', () => {
  it('classifica catecismo por faixa de parágrafo', () => {
    expect(inferFormationLevel(baseResult({ type: 'catechism', id: '50' }))).toBe('fundamental');
    expect(inferFormationLevel(baseResult({ type: 'catechism', id: '1324' }))).toBe('intermediate');
    expect(inferFormationLevel(baseResult({ type: 'catechism', id: '2600' }))).toBe('intermediate');
  });

  it('classifica magistério/patrística como avançado', () => {
    expect(inferFormationLevel(baseResult({ type: 'magisterium' }))).toBe('advanced');
    expect(inferFormationLevel(baseResult({ type: 'patristics' }))).toBe('advanced');
  });

  it('classifica bíblia/glossário/orações como fundamental', () => {
    expect(inferFormationLevel(baseResult({ type: 'glossary' }))).toBe('fundamental');
    expect(inferFormationLevel(baseResult({ type: 'bible' }))).toBe('fundamental');
    expect(inferFormationLevel(baseResult({ type: 'prayers' }))).toBe('fundamental');
  });
});
