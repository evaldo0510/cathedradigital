import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TemaDetailPage from './TemaDetailPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { fetchNexusTagContent } from '@/lib/nexusContent';

// Mocking dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
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

  it('displays error message with "Try Again" button when fetch fails (simulating timeout)', async () => {
    const mockTags = [
      { id: '1', label: 'Fé', slug: 'fe', category: 'fundamentos', emoji: '✝️' }
    ];

    // Mock tags fetch
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockTags, error: null }))
      }))
    });

    // Mock content fetch to FAIL
    (fetchNexusTagContent as any).mockRejectedValue(new Error('Database Timeout'));

    renderWithProviders(<TemaDetailPage />);

    // Wait for the tag to be identified and error to occur
    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar conexões do Nexus')).toBeInTheDocument();
    });

    expect(screen.getByText(/Não foi possível estabelecer uma conexão estável/i)).toBeInTheDocument();
    
    const retryButton = screen.getByText('Tentar Novamente');
    expect(retryButton).toBeInTheDocument();

    // Simulate clicking "Try Again"
    fireEvent.click(retryButton);
    
    // fetchNexusTagContent should have been called again (initial + retry)
    expect(fetchNexusTagContent).toHaveBeenCalledTimes(2);
  });

  it('renders "Nenhum versículo" and other empty states when fetch returns empty array', async () => {
    const mockTags = [
      { id: '1', label: 'Vazio', slug: 'vazio', category: 'fundamentos', emoji: '🕳️' }
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockTags, error: null }))
      }))
    });

    (fetchNexusTagContent as any).mockResolvedValue([]);

    renderWithProviders(<TemaDetailPage />, '/temas/vazio');

    const header = await screen.findByRole('heading', { name: /Vazio/i, level: 1 });
    expect(header).toBeInTheDocument();

    // 1. Escrituras (Default Tab)
    expect(await screen.findByText(/Nenhum versículo catalogado para este tema/i)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    // 2. Tradição
    const traditionTab = screen.getByText('Tradição');
    await userEvent.click(traditionTab);
    expect(await screen.findByText(/Conteúdo da Tradição em aprofundamento/i)).toBeInTheDocument();

    // 3. Magistério
    const magisteriumTab = screen.getByText('Magistério');
    await userEvent.click(magisteriumTab);
    expect(await screen.findByText(/Documentos do Magistério em aprofundamento/i)).toBeInTheDocument();

    // 4. Jornadas
    const journeysTab = screen.getByText('Jornadas');
    await userEvent.click(journeysTab);
    expect(await screen.findByText(/Nenhuma jornada específica vinculada a este tema/i)).toBeInTheDocument();
  });

  it('completes loading state even when Supabase returns undefined data', async () => {
    const mockTags = [
      { id: '2', label: 'UndefTag', slug: 'undef-tag', category: 'fundamentos', emoji: '❓' }
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockTags, error: null }))
      }))
    });

    (fetchNexusTagContent as any).mockResolvedValue(undefined);

    renderWithProviders(<TemaDetailPage />, '/temas/undef-tag');

    // Wait for the label to appear (header)
    const header = await screen.findByRole('heading', { level: 1 });
    expect(header.textContent).toContain('UndefTag');

    // Loader should be gone
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Should show fallback in the active tab (Bible)
    expect(screen.getByText(/Nenhum versículo catalogado/i)).toBeInTheDocument();
  });

  it('handles retry after error and shows fallback if results are still empty', async () => {
    const mockTags = [{ id: '3', label: 'Retry', slug: 'retry', category: 'fundamentos', emoji: '🔄' }];
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) }))
    });

    // 1. First call fails
    (fetchNexusTagContent as any).mockRejectedValueOnce(new Error('Timeout'));
    
    renderWithProviders(<TemaDetailPage />, '/temas/retry');

    const retryBtn = await screen.findByText('Tentar Novamente');
    
    // 2. Second call returns empty list
    (fetchNexusTagContent as any).mockResolvedValueOnce([]);
    
    await userEvent.click(retryBtn);

    // Should show fallback, not error, not loader
    expect(await screen.findByText(/Nenhum versículo catalogado/i)).toBeInTheDocument();
    expect(screen.queryByText(/Erro ao carregar/i)).not.toBeInTheDocument();
  });

  it('does not render empty titles when Supabase returns partially filled objects', async () => {
    const mockTags = [{ id: '4', label: 'Partial', slug: 'partial', category: 'fundamentos', emoji: '🧩' }];
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) }))
    });

    (fetchNexusTagContent as any).mockResolvedValue([
      { id: 'c1', type: 'bible', content_text: 'Text only', title: '', metadata: {} }
    ]);

    renderWithProviders(<TemaDetailPage />, '/temas/partial');

    // Title fallback should work (Escritura)
    expect(await screen.findByText('Escritura')).toBeInTheDocument();
    expect(screen.getByText('Text only')).toBeInTheDocument();
  });
});
