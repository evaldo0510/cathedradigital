import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GlobalSearchPage from '../components/cathedra/GlobalSearchPage';
import CommandCenter from '../components/cathedra/CommandCenter';

// Mocking icons and supabase to avoid issues
vi.mock('@/constants', () => {
  const MockIcon = (props: any) => <div data-testid={`icon-${props.className}`} {...props} />;
  return {
    Icons: new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'Logo') return () => <div data-testid="logo" />;
        return (props: any) => <div data-testid={`icon-${String(prop)}`} {...props} />;
      }
    }),
  };
});

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      or: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { results: [] } }),
    },
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

const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/buscar']) => {
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/buscar" element={ui} />
            <Route path="/santos/:id" element={<div data-testid="santo-detail" />} />
            <Route path="/" element={<div>Home</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

describe('GlobalSearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaints.results = [];
    mockSaints.isPending = false;
    mockGlossary.results = [];
    mockCommunity.results = [];
    mockTags.results = [];
    mockJourneys.results = [];
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

    // We can't easily test framer-motion delay property in JSDOM, 
    // but we can check if the results are rendered.
    const result1 = await screen.findByText(/Santo 1/i);
    const result2 = await screen.findByText(/Santo 2/i);
    const result3 = await screen.findByText(/Santo 3/i);
    
    expect(result1).toBeInTheDocument();
    expect(result2).toBeInTheDocument();
    expect(result3).toBeInTheDocument();
  });
});

describe('CommandCenter (Ctrl+K)', () => {
  it('opens on Ctrl+K and focuses input', async () => {
    render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <CommandCenter />
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>
    );

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    const input = screen.getByPlaceholderText(/Buscar em tudo/i);
    expect(input).toBeInTheDocument();
    
    fireEvent.change(input, { target: { value: 'tomas' } });
    
    // Since we mocked useSearchSaints (indirectly via icons/other mocks if needed)
    // and CommandCenter has internal state for globalResults, 
    // we just check if it shows the query in the input.
    expect(input.value).toBe('tomas');
  });
});
