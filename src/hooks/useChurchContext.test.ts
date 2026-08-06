import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useChurchContext } from './useChurchContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: { title: 'Leão XIV', status: 'current' }, error: null }))
          }))
        }))
      }))
    }))
  }
}));

vi.mock('@/hooks/useDailyLiturgy', () => ({
  useDailyLiturgy: vi.fn(() => ({
    liturgy: {
      liturgia: 'Teste',
      colorToken: 'liturgical-white',
      evangelho: { referencia: 'Mt 5,1-12', titulo: 'Bem-aventuranças', texto: '...' },
      salmo: { referencia: 'Sl 1', refrao: '...', texto: '...' },
    },
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useSaintOfDay', () => ({
  useSaintOfDay: vi.fn(() => ({ data: { name: 'Santo Teste', source: 'official' }, isLoading: false }))
}));

vi.mock('@/services/saintsService', () => ({
  getSaintsByDate: vi.fn(() => Promise.resolve([
    { name: 'Santo Teste', title: 'Mártir' },
    { name: 'Beato Secundário', title: 'Bem-aventurado' },
  ])),
}));

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children,
  );

describe('useChurchContext (Church Context Engine)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('expõe o Contexto Eclesial Global completo', async () => {
    const { result } = renderHook(() => useChurchContext(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 });

    // Igreja
    expect(result.current.currentPope?.name).toBeTruthy();
    expect(result.current.jubilee).toBeDefined();

    // Santos
    expect(result.current.todaySaint?.name).toBe('Santo Teste');
    expect(result.current.saints.secondary.length).toBeGreaterThanOrEqual(1);
    expect(result.current.saints.martyrs.length).toBeGreaterThanOrEqual(1);

    // Calendário
    expect(result.current.liturgicalSeason).toBeTruthy();
    expect(['A', 'B', 'C']).toContain(result.current.yearCycle);
    expect(['I', 'II']).toContain(result.current.weekCycle);
    expect(result.current.liturgicalColor).toBe('liturgical-white');

    // Liturgia
    expect(result.current.gospel?.referencia).toBe('Mt 5,1-12');
    expect(result.current.psalm?.referencia).toBe('Sl 1');
    expect(result.current.readings.first).toBeNull();

    // Meta
    expect(result.current.isoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.current.isToday).toBe(true);
    expect(typeof result.current.dayTick).toBe('number');
  });
});
