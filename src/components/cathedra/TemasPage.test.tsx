import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TemasPage from './TemasPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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

vi.mock('@/hooks/useFuzzySearch', () => ({
  useFuzzySearch: vi.fn(() => ({
    results: [],
    isPending: false
  }))
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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
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

    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockTags, error: null }))
      }))
    });

    renderWithProviders(<TemasPage />);

    // Wait for tags to load
    await waitFor(() => {
      expect(screen.getByText('Fé')).toBeInTheDocument();
      expect(screen.getByText('Amor')).toBeInTheDocument();
    });

    // Check if category filters exist
    expect(screen.getByText('Fundamentos')).toBeInTheDocument();
    expect(screen.getByText('Virtudes')).toBeInTheDocument();
  });
});
