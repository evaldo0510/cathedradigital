import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TemasPage from './TemasPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';
import { authenticatedAuthContext } from '@/test/authMock';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => authenticatedAuthContext),
}));

vi.mock('@/hooks/useFuzzySearch', () => ({
  useFuzzySearch: vi.fn(() => ({
    results: [],
    isPending: false
  }))
}));

const AuthProvider = ({ children }: any) => <>{children}</>;

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
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
    vi.mocked(supabase.from).mockImplementation(((table: string) => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation((resolve) => {
        const res = { data: [], error: null };
        if (typeof resolve === 'function') return Promise.resolve(resolve(res));
        return Promise.resolve(res);
      }),
      then: vi.fn().mockImplementation((resolve) => Promise.resolve(resolve({ data: [], error: null })))
    })) as any);

    renderWithProviders(<TemasPage />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Consultando Nexus/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText(/Nenhum tema encontrado/i)).toBeInTheDocument();
  });

  it('renders page header', async () => {
    vi.mocked(supabase.from).mockImplementation(((table: string) => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((resolve) => Promise.resolve(resolve({ data: [], error: null })))
    })) as any);

    renderWithProviders(<TemasPage />);
    expect(screen.getByText(/Nexus/i)).toBeInTheDocument();
  });
});
