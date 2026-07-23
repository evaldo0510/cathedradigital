/**
 * Regressão C0.3 · Fase 2 — mysteryAutoNexus.
 *
 * Garante que o adapter substitui integralmente o legado
 * `MysteryNexusPanel`, projetando um `ReaderAutoNexusOutput`
 * consumível pelo `NexusPanel` canônico.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveMysteryAutoNexus,
  clearMysteryAutoNexusCache,
  _fingerprintMystery,
} from '../mysteryAutoNexus';
import type { DBMystery } from '@/prayer-engine/loadPrayerHierarchy';

const baseMystery = {
  id: 'myst-joyful-1',
  section_id: 'sec-joyful',
  slug: 'anunciacao',
  title: 'A Anunciação do Anjo',
  order_index: 1,
  gospel_ref: 'Lc 1,26-38',
  meta: {
    primary_passage: { ref: 'Lc 1,26-38' },
    complementary_passages: ['Is 7,14'],
    catechism_refs: [{ paragraph: 484, quote: 'A Anunciação a Maria…' }],
    related_saints: [
      { name: 'São Luís de Montfort', slug: 'sao-luis-de-montfort' },
    ],
    church_fathers: [{ author: 'Santo Agostinho', quote: 'Fecit potentiam' }],
    magisterium_refs: [
      { document: 'Marialis Cultus', author: 'Paulo VI', quote: '…' },
    ],
  },
} as unknown as DBMystery;

describe('mysteryAutoNexus', () => {
  beforeEach(() => clearMysteryAutoNexusCache());

  it('projeta buckets bible/catechism/saint/father/magisterium', () => {
    const out = resolveMysteryAutoNexus(baseMystery);
    expect(Object.keys(out.byBucket).length).toBeGreaterThan(0);
    // O adapter é agnóstico ao Registry vazio — pode não resolver URLs
    // em ambiente de teste, mas deve manter shape consistente.
    expect(out).toHaveProperty('byBucket');
    expect(out).toHaveProperty('labels');
    expect(out.suggestions).toEqual([]);
    expect(out.selfId).toBeNull();
  });

  it('cacheia por fingerprint', () => {
    const a = resolveMysteryAutoNexus(baseMystery);
    const b = resolveMysteryAutoNexus(baseMystery);
    expect(a).toBe(b);
  });

  it('fingerprint muda com id', () => {
    const other = { ...baseMystery, id: 'other' } as DBMystery;
    expect(_fingerprintMystery(baseMystery)).not.toEqual(_fingerprintMystery(other));
  });
});
