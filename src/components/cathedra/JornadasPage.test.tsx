import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import JornadasPage from './JornadasPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';

// Mocking dependencies
vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: vi.fn()
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
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      }))
    });

    renderWithProviders(<JornadasPage />);
    
    // Check for empty state message
    expect(await screen.findByText('Nenhuma jornada disponível ainda.')).toBeInTheDocument();
  });

  it('displays filter mismatch message when filters return 0 results', async () => {
    const mockJourneys = [
      { id: '1', title: 'Jornada 1', difficulty: 'iniciante', category: 'fundamentos', steps_count: 5 }
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: mockJourneys, error: null }),
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      }))
    });

    renderWithProviders(<JornadasPage />);

    // Wait for content
    expect(await screen.findByText('Jornada 1')).toBeInTheDocument();

    // Click a filter that doesn't match
    const diffFilter = screen.getByText('Intermediário');
    await userEvent.click(diffFilter);

    // Check for fallback message
    expect(await screen.findByText('Nenhuma jornada encontrada com esses filtros.')).toBeInTheDocument();
  });
});
