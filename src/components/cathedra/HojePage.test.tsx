import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HojePage from './HojePage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import * as useSaintsHooks from '@/hooks/useSaints';
import * as useDashboardDataHooks from '@/hooks/useDashboardData';
import * as useAuthHooks from '@/hooks/useAuth';

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/hooks/useSaints', () => ({
  useSaintsToday: vi.fn(),
  useOfficialSaint: vi.fn()
}));

vi.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: vi.fn()
}));

vi.mock('@/contexts/LangContext', () => ({
  LangContext: {
    Consumer: ({ children }: any) => children({ t: (k: string) => k, lang: 'pt' })
  }
}));

// We need to mock Framer Motion to avoid issues in test environment
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
      p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
      span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

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
    expect(screen.getByText('CONTINUAR LEITURA')).toBeInTheDocument();
  });

  it('handles empty saints today gracefully', () => {
    (useSaintsHooks.useSaintsToday as any).mockReturnValue({ data: [], isLoading: false });
    (useSaintsHooks.useOfficialSaint as any).mockReturnValue({ data: null, isLoading: false });

    renderWithProviders(<HojePage />);
    
    expect(screen.getByText('Nenhum santo encontrado para hoje')).toBeInTheDocument();
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