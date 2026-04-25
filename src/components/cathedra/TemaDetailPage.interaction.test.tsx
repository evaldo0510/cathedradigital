import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TemaDetailPage from './TemaDetailPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fetchNexusTagContent } from '@/lib/nexusContent';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';

// Mocking related data
const MOCK_THEMES = [
  { id: 't-culpa', name: 'Culpa', slug: 'culpa', emoji: '😔', category: 'dores' },
  { id: 't-perdao', name: 'Perdão', slug: 'perdao', emoji: '🕊️', category: 'dores' },
];

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123' },
    profile: { name: 'Teste' },
    loading: false,
  })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { 
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(() => ({
        then: (resolve: any) => resolve({ data: MOCK_THEMES, error: null }),
      })),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { insight: 'Insight mockado' }, error: null }),
    }
  },
}));

vi.mock('@/lib/nexusContent', () => ({
  fetchNexusTagContent: vi.fn(() => Promise.resolve([
    { id: 'c1', type: 'bible', content_text: 'O Senhor perdoa.', title: 'Sl 103', metadata: {} }
  ])),
}));

const renderWithProviders = (slug: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/temas/:slug" element={<TemaDetailPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

describe('TemaDetailPage - Bubble interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/temas/culpa');
  });

  it('renders related themes as TagBubbles and opens popover on click', async () => {
    renderWithProviders('culpa');

    // Wait for themes to load and "Temas Relacionados" to appear
    const relatedTheme = await screen.findByRole('button', { name: /Tema: Perdão/i });
    expect(relatedTheme).toBeInTheDocument();

    // Click the related bubble
    fireEvent.click(relatedTheme);

    // Popover should open and show content
    expect(await screen.findByText(/O Senhor perdoa\./i)).toBeInTheDocument();
    expect(screen.getByText(/Navegação Completa/i)).toBeInTheDocument();
  });
});
