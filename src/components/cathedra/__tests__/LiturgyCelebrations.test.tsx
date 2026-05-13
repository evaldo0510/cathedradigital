import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
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

const renderLiturgia = (initialPath = '/liturgia') => {
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/liturgia" element={<LiturgiaPage />} />
            <Route path="/liturgia/:date" element={<LiturgiaPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

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

    renderLiturgia();

    const searchInput = screen.getByPlaceholderText(/Buscar celebrações no mês.../i);
    fireEvent.change(searchInput, { target: { value: 'Celebration' } });

    await waitFor(() => {
      // Find buttons that represent the search result for the day
      // Our deduplication ensures one entry per day
      const resultEntries = screen.queryAllByRole('button').filter(b => 
        b.textContent?.includes('Celebration One') && b.textContent?.includes('(+1)')
      );
      expect(resultEntries.length).toBe(1);
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
      if (options.body.action === 'month') return { data: [mockDayData] };
      return { data: [] };
    });

    renderLiturgia('/liturgia/2024-05-13');

    // Wait for the buttons to appear in the selector
    const btn1 = await screen.findByText('Celebration One', { selector: 'button' });
    const btn2 = await screen.findByText('Celebration Two', { selector: 'button' });
    
    expect(btn1).toBeDefined();
    expect(btn2).toBeDefined();
  });
});
