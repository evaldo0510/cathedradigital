import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { SpiritualContinuity } from './SpiritualContinuity';
import { BrowserRouter } from 'react-router-dom';
import { ReadingSettingsProvider } from '@/contexts/ReadingSettingsContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LangContext } from '@/contexts/LangContext';
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
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));


const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <TestContexts>
      <ReadingSettingsProvider>
        <TooltipProvider>
          <LangContext.Provider value={{ lang: 'pt', setLang: vi.fn(), t: (k) => k }}>
            {children}
          </LangContext.Provider>
        </TooltipProvider>
      </ReadingSettingsProvider>
    </TestContexts>
  </BrowserRouter>
);


describe('SpiritualContinuity Regression', () => {
  it('renders nothing when data is null', () => {
    const { container } = render(<SpiritualContinuity data={null} />, { wrapper });
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly with partial data', () => {
    const mockData = {
      nextBible: { label: 'Gênesis 1', subtitle: 'Bíblia', route: '/bible/1/1', type: 'bible' },
      history: []
    };
    render(<SpiritualContinuity data={mockData} />, { wrapper });
    expect(screen.getByText(/Gênesis 1/i)).toBeDefined();
    expect(screen.getByText(/Caminho de Maturidade/i)).toBeDefined();
  });

  it('handles empty history gracefully', () => {
    const mockData = {
      nextBible: null,
      nextCatechism: null,
      history: []
    };
    const { container } = render(<SpiritualContinuity data={mockData} />, { wrapper });
    expect(container.firstChild).toBeNull();
  });

  it('handles corrupted history item gracefully', () => {
    const mockData = {
      history: [{ route: null, title: null }]
    };
    render(<SpiritualContinuity data={mockData} />, { wrapper });
    expect(screen.getByText(/Caminho de Maturidade/i)).toBeDefined();
  });

  it('is resilient to null profile (XP calculation)', () => {
    const mockData = {
      nextBible: { label: 'Gênesis 1', subtitle: 'Bíblia', route: '/bible/1/1', type: 'bible' },
      history: []
    };
    render(<SpiritualContinuity data={mockData} profile={null} />, { wrapper });
    const degrees = screen.getAllByText(/Grau/i);
    expect(degrees.length).toBeGreaterThan(0);
  });

  it('is resilient to undefined data properties', () => {
    const mockData = {
      nextBible: undefined,
      history: undefined
    };
    const { container } = render(<SpiritualContinuity data={mockData} />, { wrapper });
    expect(container.firstChild).toBeNull();
  });
});
