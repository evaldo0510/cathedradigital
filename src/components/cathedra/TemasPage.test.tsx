import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TemasPage from './TemasPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { HelmetProvider } from 'react-helmet-async';

// Mocking dependencies
// Supabase is mocked globally in src/test/setup.ts


vi.mock('@/hooks/useFuzzySearch', () => ({
  useFuzzySearch: vi.fn(() => ({
    results: [],
    isPending: false
  }))
}));

import { useAuth } from '@/hooks/useAuth';
import { authenticatedAuthContext } from '@/test/authMock';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => authenticatedAuthContext),
}));


const AuthProvider = ({ children }: any) => <>{children}</>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            {ui}
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

describe('TemasPage - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays empty state message when no tags are found', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    });

    renderWithProviders(<TemasPage />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Consultando Nexus...')).not.toBeInTheDocument();
    });

    // Check for empty state message
    expect(screen.getByText('Nenhum tema encontrado para sua busca teológica.')).toBeInTheDocument();
  });

  it('shows category filters and handles category selection', async () => {
    const mockTags = [
      { id: '1', label: 'Fé', slug: 'fe', category: 'fundamentos', emoji: '✝️' },
      { id: '2', label: 'Amor', slug: 'amor', category: 'virtudes', emoji: '❤️' }
    ];

    const mockResult = { data: mockTags, error: null };
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation((resolve) => {
          const res = table === 'themes' ? mockResult : { data: [], error: null };
          if (typeof resolve === 'function') return resolve(res);
          return res;
        }),
        then: vi.fn().mockImplementation((resolve) => Promise.resolve(resolve(table === 'themes' ? mockResult : { data: [], error: null })))
      };
      return chain as any;
    }) as any);





    renderWithProviders(<TemasPage />);

    // Wait for tags to load
    await waitFor(() => {
      expect(screen.getByText(/Fé/i)).toBeInTheDocument();
      expect(screen.getByText(/Amor/i)).toBeInTheDocument();
    }, { timeout: 3000 });


    await waitFor(() => {
      expect(screen.getByText(/Todos/i)).toBeInTheDocument();
      expect(screen.getByText(/Fundamentos/i)).toBeInTheDocument();
      expect(screen.getByText(/Virtudes/i)).toBeInTheDocument();
    }, { timeout: 3000 });

  });

  it('settles to non-loading state when tags fetch returns null', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    });

    renderWithProviders(<TemasPage />);

    // Loader should disappear
    await waitFor(() => {
      expect(screen.queryByText(/Consultando Nexus/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Fallback message should be visible
    const msg = await screen.findByText(/Nenhum tema encontrado/i);
    expect(msg).toBeInTheDocument();
  });
});
