import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TemaDetailPage from './TemaDetailPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { fetchNexusTagContent } from '@/lib/nexusContent';
import React from 'react';

// Mocking dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: { insight: 'Mocked Insight' }, error: null }))
    }
  }
}));

vi.mock('@/lib/nexusContent', () => ({
  fetchNexusTagContent: vi.fn(),
  getSearchTermsForTag: vi.fn((t) => [t.label])
}));

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement, initialEntry = '/temas/fe') => {
  const queryClient = createQueryClient();
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/temas/:slug" element={ui} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

describe('TemaDetailPage - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays error message with "Try Again" button when fetch fails', async () => {
    const mockTags = [{ id: '1', label: 'Fé', slug: 'fe', category: 'fundamentos', emoji: '✝️' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });
    (fetchNexusTagContent as any).mockRejectedValue(new Error('Timeout'));

    renderWithProviders(<TemaDetailPage />);

    expect(await screen.findByText(/Erro ao carregar conexões do Nexus/i)).toBeInTheDocument();
    const retryButton = screen.getByText(/Tentar Novamente/i);
    
    (fetchNexusTagContent as any).mockResolvedValueOnce([]);
    await userEvent.click(retryButton);
    
    expect(await screen.findByText(/Nenhum versículo catalogado/i)).toBeInTheDocument();
  });

  it('renders empty states for all categories', async () => {
    const mockTags = [{ id: '1', label: 'Vazio', slug: 'vazio', category: 'fundamentos', emoji: '🕳️' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });
    (fetchNexusTagContent as any).mockResolvedValue([]);

    renderWithProviders(<TemaDetailPage />, '/temas/vazio');

    // Bible
    expect(await screen.findByText(/Nenhum versículo catalogado/i)).toBeInTheDocument();

    // Tradition
    await userEvent.click(screen.getByText('Tradição'));
    expect(await screen.findByText(/Conteúdo da Tradição em aprofundamento/i)).toBeInTheDocument();

    // Magisterium
    await userEvent.click(screen.getByText('Magistério'));
    expect(await screen.findByText(/Documentos do Magistério em aprofundamento/i)).toBeInTheDocument();

    // Journeys
    await userEvent.click(screen.getByText('Jornadas'));
    expect(await screen.findByText(/Nenhuma jornada específica vinculada/i)).toBeInTheDocument();
  });

  it('completes loading state even when fetch returns undefined', async () => {
    const mockTags = [{ id: '2', label: 'UndefTag', slug: 'undef-tag', category: 'fundamentos', emoji: '❓' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });
    (fetchNexusTagContent as any).mockResolvedValue(undefined);

    renderWithProviders(<TemaDetailPage />, '/temas/undef-tag');

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    expect(screen.getByText(/Nenhum versículo catalogado/i)).toBeInTheDocument();
  });

  it('renders robust fallbacks for partially filled objects', async () => {
    const mockTags = [{ id: '4', label: 'Partial', slug: 'partial', category: 'fundamentos', emoji: '🧩' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });
    (fetchNexusTagContent as any).mockResolvedValue([{ id: 'c1', type: 'bible', content_text: 'Text only', title: '', metadata: {} }]);

    renderWithProviders(<TemaDetailPage />, '/temas/partial');

    // In TemaDetailPage, ThemeContentCard uses 'reference' which we mapped to 'title' in the queryFn.
    // If title is empty, it should have the fallback from formatNexusContent ('Escritura')
    expect(await screen.findByText('Escritura')).toBeInTheDocument();
  });
});
