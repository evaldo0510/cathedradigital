import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import JornadasPage from './JornadasPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';

// Robust generic Supabase mock
vi.mock('@/integrations/supabase/client', () => {
  const createChain = (data: any = []) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((resolve) => resolve({ data, error: null }))
    };
    return chain;
  };

  return {
    supabase: {
      from: vi.fn((table) => createChain([])),
      rpc: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user' } }))
}));

vi.mock('@/hooks/useFuzzySearch', () => ({
  useFuzzySearch: vi.fn(() => ({ results: [], isPending: false }))
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {ui}
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

describe('JornadasPage - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays empty state message when no journeys are found', async () => {
    // Uses the default mock returning []
    renderWithProviders(<JornadasPage />);
    expect(await screen.findByText(/Nenhuma jornada disponível ainda/i, {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('displays filter mismatch message when filters return 0 results', async () => {
    const mockJourneys = [
      { id: '1', title: 'Jornada Teste', difficulty: 'iniciante', category: 'fundamentos', steps_count: 5, tags: [] }
    ];

    (supabase.from as any).mockImplementation((table: string) => {
      const data = table === 'view_journeys_with_stats' ? mockJourneys : [];
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((resolve) => resolve({ data, error: null }))
      };
    });

    renderWithProviders(<JornadasPage />);
    expect(await screen.findByText(/Jornada Teste/i)).toBeInTheDocument();

    const intermediarioBtn = await screen.findByText(/Intermediário/i);
    await userEvent.click(intermediarioBtn);

    expect(await screen.findByText(/Nenhuma jornada encontrada com esses filtros/i)).toBeInTheDocument();
  });
});
