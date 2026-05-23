import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NexusBubbles from './NexusBubbles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { fetchNexusTagContent } from '@/lib/nexusContent';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';

// Supabase is mocked globally in src/test/setup.ts
import { supabase } from '@/integrations/supabase/client';


vi.mock('@/lib/nexusContent', () => ({
  fetchNexusTagContent: vi.fn(),
  normalizeText: vi.fn((t) => t.toLowerCase()),
  getSearchTermsForTag: vi.fn((t) => [t.label])
}));

vi.mock('@/services/aiService', () => ({
  getSpiritualInsight: vi.fn(() => Promise.resolve({ content: 'Mocked Insight' }))
}));

import { useAuth } from '@/hooks/useAuth';
import { authenticatedAuthContext } from '@/test/authMock';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => authenticatedAuthContext),
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

describe('NexusBubbles - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('settles to non-loading state when search returns null', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(() => ({
        then: (resolve: any) => resolve({ data: null, error: null })
      }))
    });

    renderWithProviders(<NexusBubbles />);
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays fallback message when search returns no results', async () => {
    const mockTags = [{ id: '1', label: 'Fé', slug: 'fe', category: 'fundamentos', emoji: '✝️' }];
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(function(this: any, resolve: any) {
        if (typeof resolve === 'function') return resolve({ data: mockTags, error: null });
        return { then: (r: any) => r({ data: mockTags, error: null }) };
      })
    } as any);

    renderWithProviders(<NexusBubbles />);

    expect(await screen.findByText(/Fé/i)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Buscar tema/i);
    fireEvent.change(searchInput, { target: { value: 'Inexistente' } });

    expect(await screen.findByText(/Nenhum tema encontrado/i)).toBeInTheDocument();
  });

  it('only shows category labels (Bíblia, Catecismo etc.) when they have content', async () => {
    const mockTags = [{ id: '1', label: 'UniqueLabel', slug: 'unique', category: 'fundamentos', emoji: '✝️' }];
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(() => ({
        then: (resolve: any) => resolve({ data: mockTags, error: null })
      }))
    });

    (fetchNexusTagContent as any).mockResolvedValue([
      { id: 'b1', type: 'bible', content_text: 'Test content', title: 'Test Title', metadata: {} }
    ]);

    renderWithProviders(<NexusBubbles />);
    
    // Find the tag bubble button
    const tagBtn = await screen.findByText(/UniqueLabel/i);
    await userEvent.click(tagBtn);

    // Should show Bible label
    expect(await screen.findByText(/Bíblia/i)).toBeInTheDocument();
    
    // Should NOT show Catecismo label in results
    expect(screen.queryByText(/Catecismo/i)).not.toBeInTheDocument();
  });
});
