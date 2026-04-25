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
  getSearchTermsForTag: vi.fn((t) => [t.label]),
  formatNexusContent: vi.fn()
}));

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement, initialEntry = '/temas/fe') => {
  const queryClient = createQueryClient();
  return {
    user: userEvent.setup(),
    ...render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
              <Route path="/temas/:slug" element={ui} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>
    )
  };
};

describe('TemaDetailPage - Advanced Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates accessibility roles and attributes for Tabs', async () => {
    const mockTags = [{ id: '1', label: 'Acessibilidade', slug: 'acessibilidade', category: 'fundamentos', emoji: '♿' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });
    (fetchNexusTagContent as any).mockResolvedValue([]);

    renderWithProviders(<TemaDetailPage />, '/temas/acessibilidade');

    // TabList role
    expect(await screen.findByRole('tablist')).toBeInTheDocument();

    // Tab triggers roles and state
    const bibleTab = screen.getByRole('tab', { name: /Escrituras/i });
    const traditionTab = screen.getByRole('tab', { name: /Tradição/i });
    
    expect(bibleTab).toHaveAttribute('aria-selected', 'true');
    expect(traditionTab).toHaveAttribute('aria-selected', 'false');

    // aria-controls
    const biblePanelId = bibleTab.getAttribute('aria-controls');
    const panel = document.getElementById(biblePanelId!);
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute('role', 'tabpanel');
  });

  it('ensures skeleton is correctly placed within active tab content', async () => {
    const mockTags = [{ id: '1', label: 'SkelLoc', slug: 'skel-loc', category: 'fundamentos', emoji: '📍' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });
    
    // Controlled promise for fetch to keep it in loading state
    (fetchNexusTagContent as any).mockReturnValue(new Promise(() => {}));

    const { user } = renderWithProviders(<TemaDetailPage />, '/temas/skel-loc');

    await screen.findAllByText('SkelLoc');

    // Helper to find skeleton inside active panel
    const getActivePanel = () => document.querySelector('[role="tabpanel"][data-state="active"]');
    const getSkeletonInActivePanel = () => getActivePanel()?.querySelector('[data-testid="content-skeleton"]');

    // 1. Initial tab (Bible)
    expect(getSkeletonInActivePanel()).toBeInTheDocument();

    // 2. Switch to Tradition
    await user.click(screen.getByRole('tab', { name: /Tradição/i }));
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Tradição/i })).toHaveAttribute('aria-selected', 'true');
    });

    // Skeleton should now be in the new active panel
    expect(getSkeletonInActivePanel()).toBeInTheDocument();
  });

  it('verifies that category limits are maintained after retries', async () => {
    const mockTags = [{ id: '1', label: 'Limits', slug: 'limits', category: 'fundamentos', emoji: '📊' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });
    
    const bibleResults = Array.from({ length: 12 }, (_, i) => ({ 
      id: `b${i}`, type: 'bible', content_text: `Verse ${i}`, title: `Ref ${i}` 
    }));
    
    // Initial fail
    (fetchNexusTagContent as any).mockRejectedValueOnce(new Error('Fail'));

    const { user } = renderWithProviders(<TemaDetailPage />, '/temas/limits');

    // Error UI
    const retryBtn = await screen.findByTestId('retry-button');
    expect(retryBtn).toBeInTheDocument();

    // Set success for retry
    (fetchNexusTagContent as any).mockResolvedValueOnce(bibleResults);
    await user.click(retryBtn);

    // Initial 5 verses should be visible
    await waitFor(() => {
      expect(screen.getAllByText(/Verse \d/i)).toHaveLength(5);
    });

    // Click "Carregar mais"
    const loadMore = screen.getByText(/Carregar mais escrituras/i);
    await user.click(loadMore);

    expect(screen.getAllByText(/Verse \d/i)).toHaveLength(10);

    // Switch tab and back to see if limit persists
    await user.click(screen.getByRole('tab', { name: /Tradição/i }));
    await user.click(screen.getByRole('tab', { name: /Escrituras/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Verse \d/i)).toHaveLength(10);
    });
  });

  it('simulates fetch abort and ensures UI stability', async () => {
    const mockTags = [{ id: '1', label: 'Abort', slug: 'abort', category: 'fundamentos', emoji: '🛑' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });

    let abortSignalTriggered = false;
    (fetchNexusTagContent as any).mockImplementation((tag: any, signal?: AbortSignal) => {
      if (signal) {
        signal.addEventListener('abort', () => {
          abortSignalTriggered = true;
        });
      }
      return new Promise(() => {}); // Never resolves
    });

    const { user } = renderWithProviders(<TemaDetailPage />, '/temas/abort');

    await screen.findAllByText('Abort');

    // First request is for "bible" tab
    // Now switch to "tradition" to trigger abort of the first request
    await user.click(screen.getByRole('tab', { name: /Tradição/i }));

    // React Query should abort the previous query when the queryKey changes (due to debouncedTab change)
    await waitFor(() => {
      expect(abortSignalTriggered).toBe(true);
    }, { timeout: 2000 });

    expect(screen.queryByText(/Erro ao carregar conexões/i)).not.toBeInTheDocument();
  });
});
