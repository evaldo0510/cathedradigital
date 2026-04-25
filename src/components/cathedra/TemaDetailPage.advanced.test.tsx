import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
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
    expect(screen.getByRole('tablist')).toBeInTheDocument();

    // Tab triggers roles and state
    const bibleTab = screen.getByRole('tab', { name: /Escrituras/i });
    const traditionTab = screen.getByRole('tab', { name: /Tradição/i });
    
    expect(bibleTab).toHaveAttribute('aria-selected', 'true');
    expect(traditionTab).toHaveAttribute('aria-selected', 'false');

    // aria-controls
    const biblePanelId = bibleTab.getAttribute('aria-controls');
    expect(document.getElementById(biblePanelId!)).toBeInTheDocument();
    expect(document.getElementById(biblePanelId!)).toHaveAttribute('role', 'tabpanel');
  });

  it('ensures skeleton is correctly placed within active tab content', async () => {
    const mockTags = [{ id: '1', label: 'SkelLoc', slug: 'skel-loc', category: 'fundamentos', emoji: '📍' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });
    
    // Controlled promise for fetch
    let resolveFetch: any;
    const fetchPromise = new Promise(resolve => resolveFetch = resolve);
    (fetchNexusTagContent as any).mockReturnValue(fetchPromise);

    renderWithProviders(<TemaDetailPage />, '/temas/skel-loc');

    await screen.findAllByText('SkelLoc');

    // Helper to find skeleton inside active panel
    const findSkeletonInActivePanel = () => {
      const activePanel = document.querySelector('[role="tabpanel"][data-state="active"]');
      return activePanel?.querySelector('[data-testid="content-skeleton"]');
    };

    // 1. Initial tab (Bible)
    expect(findSkeletonInActivePanel()).toBeInTheDocument();

    // 2. Switch to Tradition
    fireEvent.click(screen.getByText('Tradição'));
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Tradição/i })).toHaveAttribute('aria-selected', 'true');
    });

    // Skeleton should now be in the new active panel
    expect(findSkeletonInActivePanel()).toBeInTheDocument();
    
    // And NOT in the bible panel anymore (it's unmounted or inactive)
    const biblePanel = document.querySelector('[role="tabpanel"][value="bible"]');
    expect(biblePanel).not.toBeInTheDocument(); // Radix usually unmounts inactive TabsContent by default if not forced
  });

  it('verifies that category limits are maintained after retries', async () => {
    const mockTags = [{ id: '1', label: 'Limits', slug: 'limits', category: 'fundamentos', emoji: '📊' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });
    
    const bibleResults = Array.from({ length: 12 }, (_, i) => ({ 
      id: `b${i}`, type: 'bible', content_text: `Verse ${i}`, title: `Ref ${i}` 
    }));
    
    // Initial fail
    (fetchNexusTagContent as any).mockRejectedValueOnce(new Error('Fail'));

    renderWithProviders(<TemaDetailPage />, '/temas/limits');

    // Error UI
    expect(await screen.findByText(/Erro ao carregar conexões/i)).toBeInTheDocument();
    
    (fetchNexusTagContent as any).mockResolvedValueOnce(bibleResults);
    
    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);

    // Initial 5 verses should be visible
    await waitFor(() => {
      expect(screen.getAllByText(/Verse \d/i)).toHaveLength(5);
    });

    // Click "Carregar mais"
    const loadMore = screen.getByText(/Carregar mais escrituras/i);
    fireEvent.click(loadMore);

    expect(screen.getAllByText(/Verse \d/i)).toHaveLength(10);

    // Trigger another "retry" or refresh (not easily done via UI without error, but we can simulate tab back and forth)
    fireEvent.click(screen.getByText('Tradição'));
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });
    fireEvent.click(screen.getByText('Escrituras'));

    // The limit (bibleLimit) is a component state, it should persist during the same session of the component
    // BUT TemaDetailPage resets state if slug changes. If slug stays same, state persists.
    expect(screen.getAllByText(/Verse \d/i)).toHaveLength(10);
  });

  it('simulates fetch abort and ensures UI stability', async () => {
    const mockTags = [{ id: '1', label: 'Abort', slug: 'abort', category: 'fundamentos', emoji: '🛑' }];
    (supabase.from as any).mockReturnValue({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) })) });

    let abortCalled = false;
    (fetchNexusTagContent as any).mockImplementation((tag: any, signal?: AbortSignal) => {
      return new Promise((resolve, reject) => {
        if (signal) {
          signal.addEventListener('abort', () => {
            abortCalled = true;
            reject(new Error('Aborted'));
          });
        }
        // Don't resolve immediately
      });
    });

    renderWithProviders(<TemaDetailPage />, '/temas/abort');

    await screen.findAllByText('Abort');

    // Trigger switch to abort first request
    fireEvent.click(screen.getByText('Tradição'));

    // In react-query, switching tab (which changes the query key) will cancel the previous query if it's still in flight
    await waitFor(() => {
      expect(abortCalled).toBe(true);
    });

    // Ensure no error UI from the aborted request is visible if the new one is loading
    expect(screen.queryByText(/Erro ao carregar conexões/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('content-skeleton')).toBeInTheDocument();
  });
});
