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

  it('renders specific empty states for each category and ensures no leaking labels', async () => {
    const mockTags = [{ id: '1', label: 'Vazio', slug: 'vazio', category: 'fundamentos', emoji: '🕳️' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });
    (fetchNexusTagContent as any).mockResolvedValue([]);

    renderWithProviders(<TemaDetailPage />, '/temas/vazio');

    // 1. Bible (Default Tab)
    expect(await screen.findByText(/Nenhum versículo catalogado para este tema/i)).toBeInTheDocument();
    // Ensure labels for other categories are NOT visible in the active content area
    expect(screen.queryByText(/Conteúdo da Tradição em aprofundamento/i)).not.toBeInTheDocument();

    // 2. Tradition
    await userEvent.click(screen.getByText('Tradição'));
    expect(await screen.findByText(/Conteúdo da Tradição em aprofundamento/i)).toBeInTheDocument();
    expect(screen.queryByText(/Nenhum versículo catalogado/i)).not.toBeInTheDocument();

    // 3. Magisterium
    await userEvent.click(screen.getByText('Magistério'));
    expect(await screen.findByText(/Documentos do Magistério em aprofundamento/i)).toBeInTheDocument();
    expect(screen.queryByText(/Conteúdo da Tradição em aprofundamento/i)).not.toBeInTheDocument();

    // 4. Journeys
    await userEvent.click(screen.getByText('Jornadas'));
    expect(await screen.findByText(/Nenhuma jornada específica vinculada a este tema/i)).toBeInTheDocument();
    expect(screen.queryByText(/Documentos do Magistério em aprofundamento/i)).not.toBeInTheDocument();
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
  
  it('handles rapid tab switching without leaking content or fallbacks', async () => {
    const mockTags = [
      { id: '1', label: 'Rapid', slug: 'rapid', category: 'fundamentos', emoji: '⚡' },
      { id: '2', label: 'Rapid Content', slug: 'rapid-content', category: 'fundamentos', emoji: '⚡' }
    ];
    (supabase.from as any).mockReturnValue({ 
      select: vi.fn(() => ({ 
        order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) 
      })) 
    });
    
    // 1. Test Fallbacks Isolation
    (fetchNexusTagContent as any).mockResolvedValue([]);
    const { unmount } = renderWithProviders(<TemaDetailPage />, '/temas/rapid');

    expect(await screen.findByText(/Nenhum versículo catalogado/i)).toBeInTheDocument();

    const tabs = [
      { name: 'Tradição', fallback: /Conteúdo da Tradição em aprofundamento/i },
      { name: 'Magistério', fallback: /Documentos do Magistério em aprofundamento/i },
      { name: 'Jornadas', fallback: /Nenhuma jornada específica vinculada a este tema/i },
      { name: 'Escrituras', fallback: /Nenhum versículo catalogado/i }
    ];

    for (const tab of tabs) {
      await userEvent.click(screen.getByText(tab.name));
      expect(await screen.findByText(tab.fallback)).toBeInTheDocument();
      tabs.filter(t => t.name !== tab.name).forEach(t => {
        expect(screen.queryByText(t.fallback)).not.toBeInTheDocument();
      });
    }

    unmount();

    // 2. Test Content Isolation
    (fetchNexusTagContent as any).mockResolvedValue([
      { id: 'c1', type: 'bible', content_text: 'Unique Bible Content', title: 'Ref 1' },
      { id: 'c2', type: 'catechism', content_text: 'Unique Tradition Content', title: 'Ref 2' }
    ]);

    renderWithProviders(<TemaDetailPage />, '/temas/rapid-content');

    // Bible content should be visible initially
    expect(await screen.findByText(/Unique Bible Content/i)).toBeInTheDocument();
    expect(screen.queryByText(/Unique Tradition Content/i)).not.toBeInTheDocument();

    // Switch to Tradition
    await userEvent.click(screen.getByText('Tradição'));
    expect(await screen.findByText(/Unique Tradition Content/i)).toBeInTheDocument();
    expect(screen.queryByText(/Unique Bible Content/i)).not.toBeInTheDocument();
  });

  it('handles fetch returning null or undefined for all categories', async () => {
    const mockTags = [{ id: '1', label: 'NullUndef', slug: 'null-undef', category: 'fundamentos', emoji: '👻' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });

    const testValues = [null, undefined];
    const categories = [
      { name: 'Escrituras', fallback: /Nenhum versículo catalogado/i },
      { name: 'Tradição', fallback: /Conteúdo da Tradição em aprofundamento/i },
      { name: 'Magistério', fallback: /Documentos do Magistério em aprofundamento/i },
      { name: 'Jornadas', fallback: /Nenhuma jornada específica vinculada a este tema/i }
    ];

    for (const value of testValues) {
      (fetchNexusTagContent as any).mockResolvedValue(value);
      const { unmount } = renderWithProviders(<TemaDetailPage />, '/temas/null-undef');

      // Check all tabs for this value
      for (const cat of categories) {
        await userEvent.click(screen.getByText(cat.name));
        
        // Wait for loading to finish
        await waitFor(() => {
          expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });

        // Specific fallback should be visible
        expect(await screen.findByText(cat.fallback)).toBeInTheDocument();

        // No other fallbacks should be visible
        categories.filter(c => c.name !== cat.name).forEach(c => {
          expect(screen.queryByText(c.fallback)).not.toBeInTheDocument();
        });
      }
      unmount();
      vi.clearAllMocks();
      // Re-mock supabase for the next iteration if needed (it's in beforeEach but we are in a loop)
      (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });
    }
  });

  it('shows loading skeleton only in the active tab content area', async () => {
    const mockTags = [{ id: '1', label: 'Skeleton', slug: 'skeleton', category: 'fundamentos', emoji: '💀' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });

    let resolveFetch: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    (fetchNexusTagContent as any).mockReturnValue(fetchPromise);

    renderWithProviders(<TemaDetailPage />, '/temas/skeleton');

    await screen.findAllByText('Skeleton');

    // Helper to find skeletons inside a specific tab content
    const getSkeletonsInTab = (tabValue: string) => {
      // Radix TabsContent has data-state="active" when active
      const content = document.querySelector(`[data-state="active"][role="tabpanel"]`);
      return content ? content.querySelectorAll('.animate-pulse') : [];
    };

    const getInactiveSkeletons = () => {
      const inactiveContents = document.querySelectorAll(`[data-state="inactive"][role="tabpanel"]`);
      let count = 0;
      inactiveContents.forEach(c => {
        count += c.querySelectorAll('.animate-pulse').length;
      });
      return count;
    };

    // 1. Bible (Default) active
    await waitFor(() => {
      expect(getSkeletonsInTab('bible').length).toBeGreaterThan(0);
    });
    expect(getInactiveSkeletons()).toBe(0);

    // 2. Switch to Tradition
    await userEvent.click(screen.getByText('Tradição'));
    await waitFor(() => {
      expect(getSkeletonsInTab('tradition').length).toBeGreaterThan(0);
    });
    expect(getInactiveSkeletons()).toBe(0);

    // 3. Resolve
    await act(async () => {
      resolveFetch([]);
    });

    await waitFor(() => {
      expect(document.querySelectorAll('.animate-pulse').length).toBe(0);
    });
  });

  it('verifies retry flow: error -> retry -> success', async () => {
    const mockTags = [{ id: '1', label: 'RetryTag', slug: 'retry-tag', category: 'fundamentos', emoji: '🔄' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });

    // 1. First attempt fails
    (fetchNexusTagContent as any).mockRejectedValueOnce(new Error('Network Error'));

    renderWithProviders(<TemaDetailPage />, '/temas/retry-tag');

    // Error UI should appear
    expect(await screen.findByText(/Erro ao carregar conexões do Nexus/i)).toBeInTheDocument();

    // 2. Prepare successful response and click retry
    const mockContent = [{ id: 'c1', type: 'bible', content_text: 'Recovered Content', title: 'Ref 1' }];
    (fetchNexusTagContent as any).mockResolvedValueOnce(mockContent);

    const retryButton = screen.getByText(/Tentar Novamente/i);
    await userEvent.click(retryButton);

    // Should show skeleton while retrying (briefly)
    // Then show content
    expect(await screen.findByText(/Recovered Content/i)).toBeInTheDocument();
    expect(screen.queryByText(/Erro ao carregar conexões do Nexus/i)).not.toBeInTheDocument();
  });

  it('handles fetch exception by showing global error UI across all tabs', async () => {
    const mockTags = [{ id: '1', label: 'ErrorTag', slug: 'error-tag', category: 'fundamentos', emoji: '❌' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });
    (fetchNexusTagContent as any).mockRejectedValue(new Error('Fetch failed'));

    renderWithProviders(<TemaDetailPage />, '/temas/error-tag');

    // Should show error message
    expect(await screen.findByText(/Erro ao carregar conexões do Nexus/i)).toBeInTheDocument();

    // Switch tabs and ensure error UI persists
    const tabs = ['Tradição', 'Magistério', 'Jornadas', 'Escrituras'];
    for (const tabName of tabs) {
      await userEvent.click(screen.getByText(tabName));
      expect(screen.getByText(/Erro ao carregar conexões do Nexus/i)).toBeInTheDocument();
    }
  });

  it('ensures no content leakage when switching between content and empty categories', async () => {
    const mockTags = [{ id: '1', label: 'LeakTest', slug: 'leak-test', category: 'fundamentos', emoji: '🚰' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });
    
    // Bible has content, Tradition is empty
    (fetchNexusTagContent as any).mockResolvedValue([
      { id: 'b1', type: 'bible', content_text: 'Bible Content', title: 'Bible Ref' }
    ]);

    renderWithProviders(<TemaDetailPage />, '/temas/leak-test');

    // Bible content visible
    expect(await screen.findByText(/Bible Content/i)).toBeInTheDocument();

    // Switch to Tradition (which is empty)
    await userEvent.click(screen.getByText('Tradição'));
    
    // Bible content should NOT be visible
    expect(screen.queryByText(/Bible Content/i)).not.toBeInTheDocument();
    // Tradition fallback should be visible
    expect(screen.getByText(/Conteúdo da Tradição em aprofundamento/i)).toBeInTheDocument();

    // Switch back to Bible
    await userEvent.click(screen.getByText('Escrituras'));
    expect(screen.getByText(/Bible Content/i)).toBeInTheDocument();
    expect(screen.queryByText(/Conteúdo da Tradição em aprofundamento/i)).not.toBeInTheDocument();
  });
});
