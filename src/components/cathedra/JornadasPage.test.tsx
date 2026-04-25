import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import JornadasPage from './JornadasPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';

// Simplified Supabase mock that returns promises directly
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null }))
  }
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user' }
  }))
}));

vi.mock('@/hooks/useFuzzySearch', () => ({
  useFuzzySearch: vi.fn(() => ({
    results: [],
    isPending: false
  }))
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
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
    (supabase.from as any).mockImplementation((table: string) => {
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      };
    });

    renderWithProviders(<JornadasPage />);
    
    // The component has a loading state initially
    const emptyMsg = await screen.findByText(/Nenhuma jornada disponível ainda/i, {}, { timeout: 5000 });
    expect(emptyMsg).toBeInTheDocument();
  });

  it('displays filter mismatch message when filters return 0 results', async () => {
    const mockJourneys = [
      { id: '1', title: 'Jornada Teste', difficulty: 'iniciante', category: 'fundamentos', steps_count: 5, tags: [] }
    ];

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'view_journeys_with_stats') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockJourneys, error: null })
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      };
    });

    renderWithProviders(<JornadasPage />);

    // Wait for initial load
    expect(await screen.findByText('Jornada Teste')).toBeInTheDocument();

    // Click 'Intermediário' filter
    const diffFilter = await screen.findByText(/Intermediário/i);
    await userEvent.click(diffFilter);

    // Wait for filtered list to update to empty
    const mismatchMsg = await screen.findByText(/Nenhuma jornada encontrada com esses filtros/i);
    expect(mismatchMsg).toBeInTheDocument();
  });
});
