import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import HojePage from './HojePage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LangContext } from '@/contexts/LangContext';
import { ReadingSettingsProvider } from '@/contexts/ReadingSettingsContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HelmetProvider } from 'react-helmet-async';
import { useSaintsToday } from '@/hooks/useSaints';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useEnhancedRecommendations } from '@/hooks/useEnhancedRecommendations';
import { TestContexts } from '@/test/providers';



// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

// Mock hooks
vi.mock('@/hooks/useSaints', () => ({
  useSaintsToday: vi.fn(() => ({ data: [], isLoading: false })),
  useOfficialSaint: vi.fn(() => ({ data: null, isLoading: false })),
}));

vi.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: vi.fn(() => ({ nextUp: null, isLoading: false })),
}));

vi.mock('@/hooks/useEnhancedRecommendations', () => ({
  useEnhancedRecommendations: vi.fn(() => ({ data: null, isLoading: false })),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TestContexts>
          <ReadingSettingsProvider>
            <TooltipProvider>
              <LangContext.Provider value={{ lang: 'pt', setLang: vi.fn(), t: (k) => k }}>
                {children}
              </LangContext.Provider>
            </TooltipProvider>
          </ReadingSettingsProvider>
        </TestContexts>
      </HelmetProvider>
    </QueryClientProvider>
  </BrowserRouter>
);



describe('HojePage Regression', () => {
  it('renders correctly with null data (anonymous user)', async () => {
    render(<HojePage />, { wrapper });
    
    // Check if key sections are rendered
    expect(screen.getByText(/Mosteiro/i)).toBeDefined();
    expect(screen.getByText(/Digital/i)).toBeDefined();
    expect(screen.getByText(/Ritual de Hoje/i)).toBeDefined();
  });

  it('is resilient to empty saints data', () => {
    vi.mocked(useSaintsToday).mockReturnValue({ data: [], isLoading: false } as any);
    render(<HojePage />, { wrapper });
    expect(screen.getByText(/Mosteiro/i)).toBeDefined();
  });

  it('is resilient to null dashboard data', () => {
    vi.mocked(useDashboardData).mockReturnValue({ nextUp: null, isLoading: false } as any);
    render(<HojePage />, { wrapper });
    // Should not render "Caminho de Maturidade" if data is null
    const maturityPath = screen.queryByText(/Caminho de Maturidade/i);
    expect(maturityPath).toBeNull();
  });

  it('is resilient to undefined user and profile', () => {
    // Already mocked session null in supabase mock
    render(<HojePage />, { wrapper });
    expect(screen.getByText(/Ritual de Hoje/i)).toBeDefined();
  });

  it('is resilient to corrupted dashboard data', () => {
    vi.mocked(useDashboardData).mockReturnValue({ nextUp: { corrupted: true }, isLoading: false } as any);
    render(<HojePage />, { wrapper });
  });
});
