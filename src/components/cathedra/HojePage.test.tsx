import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HojePage from './HojePage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import * as useSaintsHooks from '@/hooks/useSaints';
import * as useDashboardDataHooks from '@/hooks/useDashboardData';
import * as useAuthHooks from '@/hooks/useAuth';

import { LangContext } from '@/contexts/LangContext';
import { TestContexts } from '@/test/providers';

// Mock dependencies
vi.mock('@/hooks/useAuth', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useAuth')>('@/hooks/useAuth');
  return {
    ...actual,

  useAuth: vi.fn()
};
});

vi.mock('@/hooks/useSaints', () => ({
  useSaintsToday: vi.fn(),
  useOfficialSaint: vi.fn()
}));

vi.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: vi.fn()
}));

// Mock SEOHead to avoid Helmet issues
vi.mock('@/components/SEOHead', () => ({
  default: () => <div data-testid="seo-head" />
}));

// We need to mock Framer Motion
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    motion: {
      div: ({ children, whileHover, whileTap, initial, animate, transition, ...props }: any) => <div {...props}>{children}</div>,
      h1: ({ children, initial, animate, transition, ...props }: any) => <h1 {...props}>{children}</h1>,
      p: ({ children, initial, animate, transition, ...props }: any) => <p {...props}>{children}</p>,
      span: ({ children, initial, animate, transition, ...props }: any) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});


// Mock RitualDoDia to simplify testing HojePage
vi.mock('./RitualDoDia', () => ({
  default: () => <div data-testid="ritual-do-dia" />
}));

// (C0.4.b) NexusBubbles removido; HojePage não consome mais o componente.


// Mock HomeMainDoors
vi.mock('./HomeMainDoors', () => ({
  default: () => <div data-testid="home-main-doors" />
}));

// Mock SaintOfTheDayCard
vi.mock('./SaintOfTheDayCard', () => ({
  default: ({ isLoading, saint }: any) => {
    if (isLoading) return <div data-testid="saint-skeleton" />;
    return <div>Nenhum santo encontrado para hoje</div>;
  }
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
      <LangContext.Provider value={{ t: (k: string) => k, lang: 'pt', setLang: vi.fn() }}>
        <BrowserRouter>
          <TestContexts>{ui}</TestContexts>
        </BrowserRouter>
      </LangContext.Provider>
    </QueryClientProvider>
  );
};

describe('HojePage - Loading and Error States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation for auth
    (useAuthHooks.useAuth as any).mockReturnValue({
      user: { id: '123' },
      profile: { name: 'Test User', streak: 5, xp: 100 },
      userLevel: 'iniciante'
    });

    // Default mock implementations for other hooks
    (useSaintsHooks.useSaintsToday as any).mockReturnValue({ data: [], isLoading: false });
    (useSaintsHooks.useOfficialSaint as any).mockReturnValue({ data: null, isLoading: false });
    (useDashboardDataHooks.useDashboardData as any).mockReturnValue({
      spiritualProfile: null,
      nextUp: null,
      weeklyStats: { chaptersRead: 0, journeySteps: 0, catechismParagraphs: 0 },
      isLoading: false
    });
  });

  it('renders DashboardSkeleton when loading stats', () => {
    (useDashboardDataHooks.useDashboardData as any).mockReturnValue({
      isLoading: true
    });

    renderWithProviders(<HojePage />);
    
    // Check if skeleton is present (looking for the animate-pulse container)
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeTruthy();
  });

  it('renders nextUp section when data is available', () => {
    (useDashboardDataHooks.useDashboardData as any).mockReturnValue({
      nextUp: { 
        type: 'bible', 
        label: 'Gênesis 1', 
        route: '/bible?book=gn&ch=1', 
        subtitle: 'Continuar Leitura' 
      },
      isLoading: false
    });

    renderWithProviders(<HojePage />);
    
    expect(screen.getByText('Gênesis 1')).toBeInTheDocument();
    expect(screen.getByText(/Continuar Leitura/i)).toBeInTheDocument();
  });

  it('renders RitualDoDia section', () => {
    renderWithProviders(<HojePage />);
    
    expect(screen.getByTestId('ritual-do-dia')).toBeInTheDocument();
  });

  it('shows weekly stats correctly', () => {
    (useDashboardDataHooks.useDashboardData as any).mockReturnValue({
      weeklyStats: { chaptersRead: 10, journeySteps: 5, catechismParagraphs: 2 },
      isLoading: false
    });

    renderWithProviders(<HojePage />);
    
    // Check for "Frutos da Semana" header
    expect(screen.getByText('Frutos da Semana')).toBeInTheDocument();
    
    // Check for stat values
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});