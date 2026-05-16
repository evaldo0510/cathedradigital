import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import HojePage from '../HojePage';
import { LangContext } from '@/contexts/LangContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ 
    user: { id: '123', name: 'Test User' },
    profile: { name: 'Test User', streak: 5, xp: 100, _sensitive: { diagnosis_result: { spiritual_profile: 'ansioso_buscador' } } }
  })
}));

vi.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: () => ({
    spiritualProfile: 'ansioso_buscador',
    activeJourneys: [],
    saintsToday: [{ name: 'Santo Teste', feastDay: 'Hoje', image: '' }],
    nextUp: { type: 'bible', label: 'João 1', subtitle: 'Continuar Leitura', route: '/bible' },
    weeklyStats: { chaptersRead: 5, catechismParagraphs: 10, journeySteps: 2 },
    isLoading: false
  })
}));

vi.mock('@/hooks/useLang', () => ({
  useLang: () => ({ t: (key: string) => key })
}));

vi.mock('@/hooks/useSaints', () => ({
  useSaintsToday: () => ({ data: [{ name: 'Santo Teste', feastDay: 'Hoje', image: '' }], isLoading: false }),
  useOfficialSaint: () => ({ data: { name: 'Santo Teste', feastDay: 'Hoje', image: '' }, isLoading: false }),
  useSearchSaints: () => ({ data: [], isLoading: false })
}));

// Use real motion but mock its presence to avoid complex animation logic in tests
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock Radix Slot to avoid issues
vi.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockLangContext = {
  lang: 'pt' as const,
  t: (key: string) => key,
  setLang: vi.fn()
};

const renderDashboard = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LangContext.Provider value={mockLangContext}>
          <Dashboard user={{ id: '123', name: 'Test User' } as any} />
        </LangContext.Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const renderHojePage = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LangContext.Provider value={mockLangContext}>
          <HojePage />
        </LangContext.Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Responsive Layout', () => {
  it('Dashboard should have responsive padding and spacing', () => {
    renderDashboard();
    const container = screen.getByText(/Cathedra digital/i).closest('.app-container');
    expect(container?.className).toContain('py-20');
    expect(container?.className).toContain('md:py-32');
  });

  it('Dashboard title should have responsive font size', () => {
    renderDashboard();
    const title = screen.getByRole('heading', { level: 1 });
    expect(title.className).toContain('text-6xl');
    expect(title.className).toContain('md:text-8xl');
  });

  it('Dashboard grid should be responsive', () => {
    renderDashboard();
    const grid = screen.getByLabelText(/Abrir bible/i).closest('.grid');
    expect(grid?.className).toContain('grid-cols-2');
    expect(grid?.className).toContain('md:grid-cols-3');
    expect(grid?.className).toContain('lg:grid-cols-5');
  });
});

describe('HojePage Responsive Layout', () => {
  it('Hero title should have responsive font sizes', () => {
    renderHojePage();
    const title = screen.getByRole('heading', { level: 1 });
    expect(title.className).toContain('text-6xl');
    expect(title.className).toContain('md:text-8xl');
    expect(title.className).toContain('lg:text-9xl');
  });

  it('Hero section should have responsive height', () => {
    renderHojePage();
    const hero = screen.getByRole('heading', { level: 1 }).closest('section');
    expect(hero?.className).toContain('min-h-[70vh]');
  });
});
