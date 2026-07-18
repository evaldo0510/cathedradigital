/**
 * Testes unitários do Journey Core.
 *
 * Cobrem: adapter (id + content), roteamento legacy vs real, envelope
 * `{ data, error }` e bloqueio de escrita em conteúdo legado.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do cliente do backend antes de importar o service.
const mock = {
  chain: {} as any,
  lastTable: '' as string,
};

function makeChain(result: any) {
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    or: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    overlaps: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (fn: any) => Promise.resolve(result).then(fn),
  };
  return chain;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      mock.lastTable = table;
      return mock.chain;
    }),
  },
}));

import { JourneyService } from '../JourneyService';
import { JourneyAdapter, LEGACY_ID_PREFIX } from '../JourneyAdapter';

describe('JourneyAdapter', () => {
  it('prefixa e desprefixa ids legados', () => {
    const id = JourneyAdapter.toLegacyId('abc');
    expect(id).toBe(`${LEGACY_ID_PREFIX}abc`);
    expect(JourneyAdapter.isLegacyId(id)).toBe(true);
    expect(JourneyAdapter.fromLegacyId(id)).toBe('abc');
    expect(JourneyAdapter.isLegacyId('abc')).toBe(false);
  });

  it('normaliza content.html ↔ content.interpretation', () => {
    expect(JourneyAdapter.normalizeContent({ html: '<p>x</p>' }).interpretation).toBe('<p>x</p>');
    expect(JourneyAdapter.normalizeContent({ interpretation: 'y' }).html).toBe('y');
    expect(JourneyAdapter.normalizeContent(null)).toEqual({});
  });

  it('converte itineraria em Journey com is_legacy=true', () => {
    const j = JourneyAdapter.fromItineraria({
      id: 'raw-1',
      title: 'T',
      is_premium: false,
      is_active: true,
      sort_order: 3,
      created_at: 'x',
      updated_at: 'x',
    });
    expect(j.id).toBe('itin:raw-1');
    expect(j.is_legacy).toBe(true);
    expect(j.title).toBe('T');
  });
});

describe('JourneyService — envelope e roteamento', () => {
  beforeEach(() => {
    mock.chain = makeChain({ data: null, error: null });
  });

  it('list retorna array via envelope ok', async () => {
    mock.chain = makeChain({ data: [], error: null });
    const res = await JourneyService.list();
    expect(res.error).toBeNull();
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('bloqueia escrita em id legado', async () => {
    const legacyId = JourneyAdapter.toLegacyId('xyz');
    const r1 = await JourneyService.updateJourney(legacyId, { title: 'x' } as any);
    const r2 = await JourneyService.deleteJourney(legacyId);
    const r3 = await JourneyService.startJourney('u', legacyId);
    const r4 = await JourneyService.completeStep('u', legacyId, 1);
    const r5 = await JourneyService.resetProgress('u', legacyId);
    for (const r of [r1, r2, r3, r4, r5]) {
      expect(r.data).toBeNull();
      expect(r.error).toBeTruthy();
      expect(String(r.error?.message)).toMatch(/legado|itineraria/i);
    }
  });

  it('getById roteia para itineraria quando id é legado', async () => {
    mock.chain = makeChain({
      data: {
        id: 'raw-2',
        title: 'Legado',
        is_active: true,
        is_premium: false,
        sort_order: 0,
        created_at: 'x',
        updated_at: 'x',
      },
      error: null,
    });
    const res = await JourneyService.getById(JourneyAdapter.toLegacyId('raw-2'));
    expect(res.error).toBeNull();
    expect(res.data?.is_legacy).toBe(true);
    expect(mock.lastTable).toBe('itineraria');
  });

  it('getById roteia para journeys quando id é UUID normal', async () => {
    mock.chain = makeChain({
      data: {
        id: 'uuid-1',
        title: 'Real',
        is_active: true,
        is_premium: false,
        sort_order: 0,
        created_at: 'x',
        updated_at: 'x',
      },
      error: null,
    });
    const res = await JourneyService.getById('uuid-1');
    expect(res.error).toBeNull();
    expect(res.data?.is_legacy).toBe(false);
    expect(mock.lastTable).toBe('journeys');
  });

  it('propaga erro do backend no envelope', async () => {
    mock.chain = makeChain({ data: null, error: new Error('boom') });
    const res = await JourneyService.getById('uuid-err');
    expect(res.data).toBeNull();
    expect(res.error?.message).toBe('boom');
  });
});
