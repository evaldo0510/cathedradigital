/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Bible from '../Bible';
import { BrowserRouter } from 'react-router-dom';
import { ReadingSettingsProvider } from '@/contexts/ReadingSettingsContext';
import { AuthContext } from '@/hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';

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
            then: vi.fn((cb) => cb({ data: [], error: null })),
          })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  },
}));

const mockAuthContext = {
  user: { id: 'test-user' },
  profile: { completed_books: [], badges: [] },
  loading: false,
  signOut: vi.fn(),
  isPremium: true,
  userLevel: 'iniciante',
  refreshProfile: vi.fn(),
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderBible = () => {
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext as any}>
            <ReadingSettingsProvider>
              <Bible />
            </ReadingSettingsProvider>
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

describe('Bible Component Regression', () => {
  it('renders without crashing even with null/empty data', () => {
    renderBible();
    expect(screen.getByText(/Sagrada Escritura/i)).toBeInTheDocument();
  });
});
