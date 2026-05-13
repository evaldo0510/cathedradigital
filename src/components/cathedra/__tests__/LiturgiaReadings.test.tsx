import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import LiturgiaPage from '../LiturgiaPage';
import { supabase } from '@/integrations/supabase/client';

// Mock hooks and supabase
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { id: '123', estado: 'SP' } })
}));

vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({ toggleFavorite: vi.fn(), isFavorite: () => false })
}));

vi.mock('@/hooks/useSaints', () => ({
  useSaintsToday: () => []
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

const renderLiturgia = (initialPath = '/liturgia/2026-05-13') => {
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

describe('LiturgiaPage Readings and Prayers', () => {
  it('renders Oferendas, Antífona da Comunhão and Oração depois da Comunhão when content exists', async () => {
    const mockReadings = {
      data: '2026-05-13',
      liturgia: 'Test Liturgy',
      cor: 'Branco',
      oferendas: 'Test Oferendas Text',
      antifonas: {
        comunhao: 'Test Antífona Comunhão Text'
      },
      comunhao: 'Test Oração Pós-Comunhão Text',
      primeiraLeitura: { referencia: 'At 1', texto: 'Text' },
      salmo: { referencia: 'Sl 1', refrao: 'Ref', texto: 'Text' },
      evangelho: { referencia: 'Jo 1', texto: 'Text' }
    };

    (supabase.functions.invoke as any).mockResolvedValue({ data: mockReadings });

    renderLiturgia();

    await waitFor(() => {
      expect(screen.getByText('Oração sobre as Oferendas')).toBeDefined();
      expect(screen.getByText('Test Oferendas Text')).toBeDefined();
      
      expect(screen.getByText('Antífona da Comunhão')).toBeDefined();
      expect(screen.getByText('Test Antífona Comunhão Text')).toBeDefined();
      
      expect(screen.getByText('Oração depois da Comunhão')).toBeDefined();
      expect(screen.getByText('Test Oração Pós-Comunhão Text')).toBeDefined();
    });
  });

  it('does not render cards when content is missing', async () => {
    const mockReadings = {
      data: '2026-05-13',
      liturgia: 'Test Liturgy',
      cor: 'Branco',
      primeiraLeitura: { referencia: 'At 1', texto: 'Text' },
      salmo: { referencia: 'Sl 1', refrao: 'Ref', texto: 'Text' },
      evangelho: { referencia: 'Jo 1', texto: 'Text' }
      // Missing oferendas, antifonas.comunhao, comunhao
    };

    (supabase.functions.invoke as any).mockResolvedValue({ data: mockReadings });

    renderLiturgia();

    await waitFor(() => {
      expect(screen.queryByText('Oração sobre as Oferendas')).toBeNull();
      expect(screen.queryByText('Antífona da Comunhão')).toBeNull();
      expect(screen.queryByText('Oração depois da Comunhão')).toBeNull();
    });
  });
});
