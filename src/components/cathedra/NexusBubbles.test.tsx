import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NexusBubbles from './NexusBubbles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fetchNexusTagContent } from '@/lib/nexusContent';
import { HelmetProvider } from 'react-helmet-async';

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
  normalizeText: vi.fn((t) => t.toLowerCase())
}));

vi.mock('@radix-ui/react-popover', () => ({
  Popover: ({ children, open, onOpenChange }: any) => {
    // Basic mock that renders children
    return <div data-testid=\"mock-popover\" data-open={open}>{children}</div>;
  },
  PopoverTrigger: ({ children, asChild }: any) => <div data-testid=\"mock-popover-trigger\">{children}</div>,
  PopoverContent: ({ children }: any) => <div data-testid=\"mock-popover-content\">{children}</div>,
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

  it('renders correctly and handles empty tag list', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    });

    renderWithProviders(<NexusBubbles />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check if categories are processed (they might not show if tags are 0)
    // The component filters tags by category. If 0 tags, categories are empty.
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

    // Wait for tags to load
    await waitFor(() => {
      expect(screen.getByText('Fé')).toBeInTheDocument();
    });

    // Type in search that won't match
    const searchInput = screen.getByPlaceholderText('Buscar tema...');
    fireEvent.change(searchInput, { target: { value: 'Inexistente' } });

    // Check for fallback message
    expect(screen.getByText('Nenhum tema encontrado.')).toBeInTheDocument();
  });

  it('never displays "Referência" as a fallback in content results', async () => {
    const mockTags = [
      { id: '1', label: 'Fé', slug: 'fe', category: 'fundamentos', emoji: '✝️' }
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockTags, error: null }))
      }))
    });

    // Mock content with missing title/reference
    (fetchNexusTagContent as any).mockResolvedValue([
      { 
        id: 'c1', 
        type: 'bible', 
        content_text: 'Versículo sem título', 
        title: 'Escritura', // Fallback from formatNexusContent
        metadata: {} 
      }
    ]);

    renderWithProviders(<NexusBubbles />);

    // Wait for tag and click it
    const tag = await screen.findByText('Fé');
    await userEvent.click(tag);

    // Check if content appears
    const contentText = await screen.findByText('Versículo sem título');
    expect(contentText).toBeInTheDocument();

    // Verify it shows "Escritura" and NOT "Referência"
    const scripture = await screen.findByText('Escritura');
    expect(scripture).toBeInTheDocument();
    expect(screen.queryByText('Referência')).not.toBeInTheDocument();
  });

  it('displays "Nexus Silencioso" fallback when content fetch returns null/empty', async () => {
    const mockTags = [
      { id: '1', label: 'Silencioso', slug: 'silencioso', category: 'fundamentos', emoji: '🤫' }
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockTags, error: null }))
      }))
    });

    // Mock content fetch to return EMPTY
    (fetchNexusTagContent as any).mockResolvedValue([]);

    renderWithProviders(<NexusBubbles />);

    // Wait for tag and click it
    const tag = await screen.findByText('Silencioso');
    await userEvent.click(tag);

    // Debug: what is on the screen now?
    // console.log(screen.debug());

    // Check for diagnostic panel which is always there when open
    const queryInfo = await screen.findByText(/Query: "Silencioso"/i, {}, { timeout: 5000 });
    expect(queryInfo).toBeInTheDocument();

    // Now check for "Nexus Silencioso"
    const fallbackTitle = await screen.findByText(/Nexus Silencioso/i);
    expect(fallbackTitle).toBeInTheDocument();
    
    expect(screen.getByText(/Ainda estamos tecendo as conexões/i)).toBeInTheDocument();
  });
});
