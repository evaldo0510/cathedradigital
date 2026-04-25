import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

    // Mock tags fetch with immediate resolution
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockTags, error: null }))
      }))
    });

    // Mock content fetch to return EMPTY
    (fetchNexusTagContent as any).mockResolvedValue([]);

    renderWithProviders(<TemaDetailPage />, '/temas/vazio');

    // Wait for the tag to be loaded (the H1 should show the label)
    const header = await screen.findByRole('heading', { name: 'Vazio', level: 1 });
    expect(header).toBeInTheDocument();

    // Check for various empty states in tabs
    expect(screen.getByText('Nenhum versículo catalogado para este tema.')).toBeInTheDocument();

    // Switch to tradition tab
    const traditionTab = screen.getByText('Tradição');
    await userEvent.click(traditionTab);
    
    // Wait for empty state in this tab
    const traditionEmpty = await screen.findByText(/Conteúdo da Tradição em aprofundamento/i);
    expect(traditionEmpty).toBeInTheDocument();

    // Switch to magisterium tab
    const magisteriumTab = screen.getByText('Magistério');
    await userEvent.click(magisteriumTab);
    
    const magisteriumEmpty = await screen.findByText(/Documentos do Magistério em aprofundamento/i);
    expect(magisteriumEmpty).toBeInTheDocument();
  });
});
