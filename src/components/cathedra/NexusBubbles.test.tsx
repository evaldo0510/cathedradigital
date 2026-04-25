import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NexusBubbles from './NexusBubbles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fetchNexusTagContent } from '@/lib/nexusContent';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';

// Mocking dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}));

vi.mock('@/lib/nexusContent', () => ({
  fetchNexusTagContent: vi.fn(),
  normalizeText: vi.fn((t) => t.toLowerCase()),
  getSearchTermsForTag: vi.fn((t) => [t.label])
}));

vi.mock('@/services/aiService', () => ({
  getSpiritualInsight: vi.fn(() => Promise.resolve({ content: 'Mocked Insight' }))
}));

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
        <BrowserRouter>
          {ui}
        </BrowserRouter>
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
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    });

    renderWithProviders(<NexusBubbles />);

    // Loader settles
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays fallback message when search returns no results', async () => {
    const mockTags = [
      { id: '1', label: 'Fé', slug: 'fe', category: 'fundamentos', emoji: '✝️' }
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockTags, error: null }))
      }))
    });

    renderWithProviders(<NexusBubbles />);

    // Wait for tags
    expect(await screen.findByText('Fé')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Buscar tema/i);
    fireEvent.change(searchInput, { target: { value: 'Inexistente' } });

    expect(await screen.findByText(/Nenhum tema encontrado/i)).toBeInTheDocument();
  });

  it('displays category fallbacks when filter returns empty results', async () => {
    const mockTags = [{ id: '1', label: 'Fé', slug: 'fe', category: 'fundamentos', emoji: '✝️' }];
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) }))
    });

    renderWithProviders(<NexusBubbles />);
    
    // Click category that doesn't match 'fundamentos'
    const buttons = await screen.findAllByRole('button');
    const mistérioBtn = buttons.find(b => b.textContent?.trim() === 'Mistério');
    expect(mistérioBtn).toBeDefined();
    await userEvent.click(mistérioBtn!);

    // Fallback message
    expect(await screen.findByText(/Nenhum tema encontrado/i)).toBeInTheDocument();
  });

  it('only shows category labels (Bíblia, Catecismo etc.) when they have content', async () => {
    const mockTags = [{ id: '1', label: 'MyTag', slug: 'mytag', category: 'fundamentos', emoji: '✝️' }];
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockTags, error: null })) }))
    });

    (fetchNexusTagContent as any).mockResolvedValue([
      { id: 'b1', type: 'bible', content_text: 'Gênesis 1:1', title: 'Gn 1,1', metadata: {} }
    ]);

    renderWithProviders(<NexusBubbles />);
    
    // Find the tag bubble button. It might be nested in other elements.
    const tag = await screen.findByText('MyTag');
    await userEvent.click(tag);

    // Should show Bible label in the content results
    expect(await screen.findByText(/Bíblia/i)).toBeInTheDocument();
    
    // Should NOT show other category labels in the results list area
    // (Filtering results list to ensure no leaks)
    const resultList = screen.queryByRole('list');
    if (resultList) {
      expect(resultList.textContent).not.toContain('Catecismo');
      expect(resultList.textContent).not.toContain('Magistério');
    }
  });
});
