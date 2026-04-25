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
  const createMockChain = (data: any = [], error: any = null) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      overlaps: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      // Use .then to make it awaitable like a promise
      then: vi.fn().mockImplementation((resolve) => resolve({ data, error })),
    };
    return chain;
  };

  return {
    supabase: {
      from: vi.fn((table) => createMockChain([])),
      rpc: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }
  };
});

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
    // Already mocked to return empty data in vi.mock
    renderWithProviders(<JornadasPage />);
    
    // Check for empty state message
    const emptyMsg = await screen.findByText(/Nenhuma jornada disponível ainda/i);
    expect(emptyMsg).toBeInTheDocument();
  });

  it('displays filter mismatch message when filters return 0 results', async () => {
    const mockJourneys = [
      { id: '1', title: 'Jornada 1', difficulty: 'iniciante', category: 'fundamentos', steps_count: 5 }
    ];

    // Override mock for this test
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'view_journeys_with_stats') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockImplementation((col, opt) => ({
            then: (res: any) => res({ data: mockJourneys, error: null })
          }))
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((col, val) => ({
          then: (res: any) => res({ data: [], error: null })
        }))
      };
    });

    renderWithProviders(<JornadasPage />);

    // Wait for content
    expect(await screen.findByText('Jornada 1')).toBeInTheDocument();

    // Click a filter that doesn't match
    const diffFilter = screen.getByText('Intermediário');
    await userEvent.click(diffFilter);

    // Check for fallback message
    expect(await screen.findByText(/Nenhuma jornada encontrada com esses filtros/i)).toBeInTheDocument();
  });
});
