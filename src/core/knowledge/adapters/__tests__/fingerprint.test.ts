/**
 * Testes de determinismo dos fingerprints usados como chave do LRU nos
 * adapters do Nexus (glossaryAutoNexus / journeyAutoNexus).
 *
 * Garantimos:
 *   • Mesmos inputs → mesma string.
 *   • Referências distintas com conteúdo idêntico → mesma string.
 *   • Alteração de qualquer campo relevante → string diferente.
 *   • Ordem dos itens dentro de arrays IMPORTA (é usada como ordem
 *     estável de projeção), mas nunca produz não-determinismo.
 *   • O `resolve*` cacheia por fingerprint (segunda chamada é hit).
 */
import { describe, it, expect, beforeEach } from 'vitest';

import {
  _fingerprintGlossary,
  resolveAutoNexus,
  clearAutoNexusCache,
  type GlossaryLike,
} from '../glossaryAutoNexus';
import {
  _fingerprintJourney,
  resolveJourneyAutoNexus,
  clearJourneyAutoNexusCache,
  type JourneyLike,
} from '../journeyAutoNexus';
import {
  getNexusMetricsSnapshot,
  resetNexusMetrics,
} from '../nexusMetrics';

const baseGlossary: GlossaryLike = {
  slug: 'graca',
  term: 'Graça',
  bible_verses: ['Ef 2,8', 'Rm 5,15'],
  catechism_references: ['1996', '2000'],
  magisterium_references: [],
  saints_refs: ['santo-tomas-de-aquino'],
  fathers_refs: [],
  liturgy_refs: [],
  prayer_refs: [],
  journey_refs: [],
  nexus_refs: [{ kind: 'catechism', target: '1997' }],
};

const baseJourney: JourneyLike = {
  id: 'jrn-1',
  title: 'Sete dias com Santo Agostinho',
  subtitle: 'Uma introdução ao pensamento agostiniano',
  category: 'espiritualidade',
  tags: ['agostinho', 'patristica'],
};

describe('fingerprint — glossary', () => {
  it('é determinístico: mesmos inputs geram a mesma chave', () => {
    const a = _fingerprintGlossary(baseGlossary);
    const b = _fingerprintGlossary(baseGlossary);
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it('objetos distintos com conteúdo idêntico geram a mesma chave', () => {
    const clone: GlossaryLike = {
      ...baseGlossary,
      bible_verses: [...(baseGlossary.bible_verses ?? [])],
      catechism_references: [...(baseGlossary.catechism_references ?? [])],
      saints_refs: [...(baseGlossary.saints_refs ?? [])],
      nexus_refs: (baseGlossary.nexus_refs ?? []).map((r) => ({ ...r })),
    };
    expect(_fingerprintGlossary(clone)).toBe(_fingerprintGlossary(baseGlossary));
  });

  it('mudar qualquer campo relevante muda a chave', () => {
    const original = _fingerprintGlossary(baseGlossary);
    expect(
      _fingerprintGlossary({ ...baseGlossary, bible_verses: ['Ef 2,8'] }),
    ).not.toBe(original);
    expect(
      _fingerprintGlossary({ ...baseGlossary, slug: 'graca-santificante' }),
    ).not.toBe(original);
    expect(
      _fingerprintGlossary({
        ...baseGlossary,
        nexus_refs: [{ kind: 'catechism', target: '9999' }],
      }),
    ).not.toBe(original);
  });

  it('trata null/undefined como vazio de forma estável', () => {
    const minimal: GlossaryLike = { slug: 'x', term: 'X' };
    const alsoMinimal: GlossaryLike = {
      slug: 'x',
      term: 'X',
      bible_verses: null,
      catechism_references: null,
      nexus_refs: null,
    };
    expect(_fingerprintGlossary(minimal)).toBe(_fingerprintGlossary(alsoMinimal));
  });
});

describe('fingerprint — journey', () => {
  it('é determinístico e sensível aos campos relevantes', () => {
    const a = _fingerprintJourney(baseJourney);
    expect(_fingerprintJourney(baseJourney)).toBe(a);
    expect(
      _fingerprintJourney({ ...baseJourney, subtitle: 'outro' }),
    ).not.toBe(a);
    expect(_fingerprintJourney({ ...baseJourney, tags: ['x'] })).not.toBe(a);
  });

  it('tags em ordens diferentes produzem chaves diferentes (ordem é significante)', () => {
    const a = _fingerprintJourney({ ...baseJourney, tags: ['a', 'b'] });
    const b = _fingerprintJourney({ ...baseJourney, tags: ['b', 'a'] });
    expect(a).not.toBe(b);
  });
});

describe('LRU cache — evita recomputação em chamadas subsequentes', () => {
  beforeEach(() => {
    clearAutoNexusCache();
    clearJourneyAutoNexusCache();
    resetNexusMetrics();
  });

  it('glossary: primeira chamada é miss, segunda é hit e devolve a mesma referência', () => {
    const r1 = resolveAutoNexus(baseGlossary);
    const r2 = resolveAutoNexus(baseGlossary);
    expect(r2).toBe(r1);
    const snap = getNexusMetricsSnapshot();
    expect(snap.glossary.misses).toBe(1);
    expect(snap.glossary.hits).toBe(1);
  });

  it('journey: primeira chamada é miss, segunda é hit e devolve a mesma referência', () => {
    const r1 = resolveJourneyAutoNexus(baseJourney);
    const r2 = resolveJourneyAutoNexus(baseJourney);
    expect(r2).toBe(r1);
    const snap = getNexusMetricsSnapshot();
    expect(snap.journey.misses).toBe(1);
    expect(snap.journey.hits).toBe(1);
  });
});
