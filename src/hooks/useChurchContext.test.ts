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
            maybeSingle: vi.fn(() => Promise.resolve({ data: { title: 'Francisco', status: 'current' }, error: null }))
          }))
        }))
      }))
    }))
  }
}));

// Mock dos hooks de dependência
vi.mock('@/hooks/useDailyLiturgy', () => ({
  useDailyLiturgy: vi.fn(() => ({ liturgy: { liturgia: 'Teste' }, isLoading: false }))
}));

vi.mock('@/hooks/useSaintOfDay', () => ({
  useSaintOfDay: vi.fn(() => ({ data: { name: 'Santo Teste' }, isLoading: false }))
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('useChurchContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar o contexto eclesial completo', async () => {
    const { result } = renderHook(() => useChurchContext(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.currentPope).toBeDefined();
    expect(result.current.todaySaint).toBeDefined();
    expect(result.current.liturgy).toBeDefined();
    expect(result.current.isoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
