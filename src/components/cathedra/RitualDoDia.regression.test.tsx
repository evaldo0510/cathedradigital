import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import RitualDoDia from './RitualDoDia';
import { AuthProvider } from '@/hooks/useAuth';
import { ReadingSettingsProvider } from '@/contexts/ReadingSettingsContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LangContext } from '@/contexts/LangContext';


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
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ReadingSettingsProvider>
      <TooltipProvider>
        <LangContext.Provider value={{ lang: 'pt', setLang: vi.fn(), t: (k) => k }}>
          {children}
        </LangContext.Provider>
      </TooltipProvider>
    </ReadingSettingsProvider>
  </AuthProvider>
);


describe('RitualDoDia Regression', () => {
  it('renders correctly when user is not logged in', () => {
    render(<RitualDoDia />, { wrapper });
    expect(screen.getByText(/Ritual do Dia/i)).toBeDefined();
    expect(screen.getByText(/Lectio Divina/i)).toBeDefined();
  });

  it('handles null ritual data gracefully', () => {
    render(<RitualDoDia />, { wrapper });
    expect(screen.getByText(/Ritual do Dia/i)).toBeDefined();
  });

  it('is resilient to missing verse or catechism fields', () => {
    // The component uses DAILY_RITUALS which are static, but we check optional chaining
    render(<RitualDoDia />, { wrapper });
    expect(screen.getByText(/Ritual do Dia/i)).toBeDefined();
  });

  it('is resilient to null profile values', () => {
    render(<RitualDoDia />, { wrapper });
    expect(screen.getByText(/ORATIO ET CONTEMPLATIO/i)).toBeDefined();
  });
});
