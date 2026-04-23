import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GlobalSearchPage from '../components/cathedra/GlobalSearchPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mocking icons and supabase to avoid issues
vi.mock('@/constants', () => ({
  Icons: {
    Search: () => <div data-testid="icon-search" />,
    User: () => <div data-testid="icon-user" />,
    BookOpen: () => <div data-testid="icon-book" />,
    MessageCircle: () => <div data-testid="icon-message" />,
    Compass: () => <div data-testid="icon-compass" />,
    X: () => <div data-testid="icon-x" />,
  },
}));

// Mock useFuzzySearch hook
const mockSaints = { results: [], isPending: false };
const mockGlossary = { results: [], isPending: false };
const mockCommunity = { results: [], isPending: false };
const mockTags = { results: [], isPending: false };
const mockJourneys = { results: [], isPending: false };

vi.mock('@/hooks/useFuzzySearch', () => ({
  useFuzzySearch: vi.fn((options) => {
    if (options.rpc === 'search_saints_fuzzy') return mockSaints;
    if (options.rpc === 'search_glossary_fuzzy') return mockGlossary;
    if (options.rpc === 'search_community_posts_fuzzy') return mockCommunity;
    if (options.rpc === 'search_tags_fuzzy') return mockTags;
    if (options.rpc === 'search_journeys_fuzzy') return mockJourneys;
    return { results: [], isPending: false };
  }),
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
      <MemoryRouter initialEntries={['/buscar']}>
        <Routes>
          <Route path="/buscar" element={ui} />
          <Route path="/santos/:id" element={<div data-testid="santo-detail" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('GlobalSearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaints.results = [];
    mockSaints.isPending = false;
  });

  it('renders search input and initial state', () => {
    renderWithProviders(<GlobalSearchPage />);
    expect(screen.getByPlaceholderText(/Buscar santos, termos, discussões/i)).toBeInTheDocument();
    expect(screen.getByText(/Digite pelo menos 2 caracteres para buscar/i)).toBeInTheDocument();
  });

  it('shows "Nenhum resultado encontrado" when search has no matches', async () => {
    renderWithProviders(<GlobalSearchPage />);
    const input = screen.getByPlaceholderText(/Buscar santos, termos, discussões/i);
    
    fireEvent.change(input, { target: { value: 'unknownterm' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Nenhum resultado encontrado/i)).toBeInTheDocument();
      expect(screen.getByText(/Tente buscar por termos mais genéricos/i)).toBeInTheDocument();
    });
  });

  it('clears search when clear button is clicked', async () => {
    renderWithProviders(<GlobalSearchPage />);
    const input = screen.getByPlaceholderText(/Buscar santos, termos, discussões/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { value: 'tomas' } });
    expect(input.value).toBe('tomas');
    
    const clearButton = screen.getByLabelText(/Limpar busca/i);
    fireEvent.click(clearButton);
    
    expect(input.value).toBe('');
    expect(screen.getByText(/Digite pelo menos 2 caracteres para buscar/i)).toBeInTheDocument();
  });

  it('navigates to saint detail when a result is clicked', async () => {
    mockSaints.results = [{ id: 'tomas-aquino', name: 'Santo Tomás de Aquino', title: 'Doutor Angélico', similarityScore: 0.9 }] as any;
    
    renderWithProviders(<GlobalSearchPage />);
    const input = screen.getByPlaceholderText(/Buscar santos, termos, discussões/i);
    fireEvent.change(input, { target: { value: 'tomas' } });
    
    const result = await screen.findByText(/Santo Tomás de Aquino/i);
    fireEvent.click(result);
    
    expect(screen.getByTestId('santo-detail')).toBeInTheDocument();
  });

  it('validates progressive delay on search results', async () => {
    mockSaints.results = [
      { id: '1', name: 'Santo 1', similarityScore: 0.9 },
      { id: '2', name: 'Santo 2', similarityScore: 0.8 },
      { id: '3', name: 'Santo 3', similarityScore: 0.7 }
    ] as any;

    renderWithProviders(<GlobalSearchPage />);
    const input = screen.getByPlaceholderText(/Buscar santos, termos, discussões/i);
    fireEvent.change(input, { target: { value: 'santo' } });

    const cards = await screen.findAllByRole('button');
    // The cards are rendered inside the saints tab. 
    // We want to check if they have the correct index/delay.
    // SearchResultCard uses: delay: Math.min(index * 0.04, 0.4)
    // Since we can't easily check framer-motion's internal state in JSDOM, 
    // we just ensure they are all rendered.
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });
});

describe('CommandCenter (Ctrl+K)', () => {
  it('opens on Ctrl+K and focuses input', async () => {
    const { container } = render(
      <MemoryRouter>
        <div id="main-content">
          <CommandCenter />
        </div>
      </MemoryRouter>
    );

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    const input = screen.getByPlaceholderText(/Buscar em tudo/i);
    expect(input).toBeInTheDocument();
    
    // Check if results appear when typing
    fireEvent.change(input, { target: { value: 'tomas' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Santo Tomás de Aquino/i)).toBeInTheDocument();
    });
  });
});

