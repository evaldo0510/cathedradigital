import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import LiturgiaPage from '../LiturgiaPage';
import { supabase } from '@/integrations/supabase/client';

// Mock hooks and supabase
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: null })
}));

vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({ toggleFavorite: vi.fn(), isFavorite: () => false })
}));

vi.mock('@/hooks/useSaints', () => ({
  useSaintsToday: () => ({ data: [] })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

describe('LiturgiaPage Celebrations', () => {
  it('displays multiple celebrations once in search results', async () => {
    const mockMonthData = [
      {
        date: '2024-05-13',
        celebrations: [
          { title: 'Celebration One' },
          { title: 'Celebration Two' }
        ]
      }
    ];

    (supabase.functions.invoke as any).mockResolvedValue({ data: mockMonthData });

    render(<LiturgiaPage />, { wrapper });

    const searchInput = screen.getByPlaceholderText(/Buscar celebrações no mês.../i);
    fireEvent.change(searchInput, { target: { value: 'Celebration' } });

    await waitFor(() => {
      const results = screen.getAllByRole('button').filter(b => 
        b.textContent?.includes('Celebration One')
      );
      // Should show only one result for the day, even if it has multiple matches
      expect(results.length).toBe(1);
    });
  });

  it('shows a selector when there are multiple celebrations on the same day', async () => {
    const mockDayData = {
      date: '2024-05-13',
      celebrations: [
        { title: 'Celebration One' },
        { title: 'Celebration Two' }
      ]
    };

    const mockReadings = {
      data: '2024-05-13',
      liturgia: 'Celebration One',
      primeiraLeitura: { texto: 'Text' }
    };

    (supabase.functions.invoke as any).mockImplementation(async (name, options) => {
      if (options.body.action === 'date') return { data: mockDayData };
      if (options.body.action === 'readings') return { data: mockReadings };
      return { data: [] };
    });

    render(<LiturgiaPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Celebration One')).toBeDefined();
      expect(screen.getByText('Celebration Two')).toBeDefined();
    });

    const selectorButtons = screen.getAllByRole('button').filter(b => 
      b.textContent === 'Celebration One' || b.textContent === 'Celebration Two'
    );
    expect(selectorButtons.length).toBe(2);
  });
});
