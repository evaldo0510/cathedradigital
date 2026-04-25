import { render, screen, waitFor, act } from '@testing-library/react';
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

describe('TemaDetailPage - Keyboard Navigation Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates between tabs using Arrow keys and validates content updates', async () => {
    const mockTags = [{ id: '1', label: 'Teologia', slug: 'teologia', category: 'fundamentos', emoji: '📚' }];
    (supabase.from as any).mockReturnValue({ 
      select: vi.fn(() => ({ 
        order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) 
      })) 
    });

    // Mock responses for each category
    (fetchNexusTagContent as any).mockImplementation((tag) => {
      if (tag.label === 'Teologia') {
        // We can differentiate by some internal state if needed, 
        // but the component calls this based on debouncedTab.
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    renderWithProviders(<TemaDetailPage />, '/temas/teologia');

    // 1. Initial State (Escrituras active)
    expect(await screen.findByText('Escrituras')).toHaveAttribute('data-state', 'active');
    // Use waitFor to handle the async load
    await waitFor(() => {
      expect(screen.getByText(/Nenhum versículo catalogado para este tema/i)).toBeInTheDocument();
    });

    // 2. Focus the tab trigger directly to avoid multiple tabs
    const bibleTab = screen.getByRole('tab', { name: /Escrituras/i });
    bibleTab.focus();
    expect(bibleTab).toHaveFocus();

    // 3. Arrow Right to "Tradição"
    // In Radix Tabs, ArrowRight moves focus and selects the next tab (by default)
    await user.keyboard('{ArrowRight}');
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Tradição/i })).toHaveAttribute('data-state', 'active');
      expect(screen.getByText(/Conteúdo da Tradição em aprofundamento/i)).toBeInTheDocument();
    });

    // 4. Arrow Right to "Magistério"
    await user.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Magistério/i })).toHaveAttribute('data-state', 'active');
      expect(screen.getByText(/Documentos do Magistério em aprofundamento/i)).toBeInTheDocument();
    });

    // 5. Arrow Right to "Jornadas"
    await user.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Jornadas/i })).toHaveAttribute('data-state', 'active');
      expect(screen.getByText(/Nenhuma jornada específica vinculada a este tema/i)).toBeInTheDocument();
    });

  });

  it('handles error state and retry button via keyboard', async () => {
    const mockTags = [{ id: '1', label: 'ErroNav', slug: 'erro-nav', category: 'fundamentos', emoji: '❌' }];
    (supabase.from as any).mockReturnValue({ 
      select: vi.fn(() => ({ 
        order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) 
      })) 
    });

    // Initial fail
    (fetchNexusTagContent as any).mockRejectedValueOnce(new Error('Network Fail'));

    renderWithProviders(<TemaDetailPage />, '/temas/erro-nav');

    // Wait for error UI
    expect(await screen.findByText(/Erro ao carregar conexões .* no Nexus/i)).toBeInTheDocument();

    // Tab to Retry button
    // It's after the tabs triggers usually, or we can just tab multiple times
    // Let's find it first to be sure
    const retryButton = screen.getByTestId('retry-button');
    
    // We might need to tab several times to reach the retry button
    // 1. Home link
    // 2. Temas link
    // 3. Category link
    // 4. Insight button
    // 5. Tab "Escrituras"
    // 6. Retry button
    
    // Using a more direct focus if tabbing is too fragile in test environment
    retryButton.focus();
    expect(retryButton).toHaveFocus();

    // Press Enter to retry
    (fetchNexusTagContent as any).mockResolvedValueOnce([]);
    await user.keyboard('{Enter}');

    // Verify loading and success
    expect(await screen.findByText(/Nenhum versículo catalogado/i)).toBeInTheDocument();
    expect(screen.queryByText(/Erro ao carregar conexões/i)).not.toBeInTheDocument();
  });

  it('shows skeletons during keyboard-triggered navigation', async () => {
    const mockTags = [{ id: '1', label: 'KeySkel', slug: 'key-skel', category: 'fundamentos', emoji: '🦴' }];
    (supabase.from as any).mockReturnValue({ 
      select: vi.fn(() => ({ 
        order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) 
      })) 
    });

    let resolveFetch: any;
    const delayedPromise = new Promise(r => resolveFetch = r);
    (fetchNexusTagContent as any).mockReturnValue(delayedPromise);

    renderWithProviders(<TemaDetailPage />, '/temas/key-skel');

    // Initial skeleton
    expect(await screen.findByTestId('content-skeleton')).toBeInTheDocument();

    // Move to next tab
    await user.tab(); // Focus trigger
    await user.keyboard('{ArrowRight}'); // Move to Tradição

    // Should still see skeleton in the new active tab
    expect(screen.getByTestId('content-skeleton')).toBeInTheDocument();

    // Resolve
    await act(async () => {
      resolveFetch([]);
    });

    expect(await screen.findByText(/Conteúdo da Tradição em aprofundamento/i)).toBeInTheDocument();
    expect(screen.queryByTestId('content-skeleton')).not.toBeInTheDocument();
  });
});
