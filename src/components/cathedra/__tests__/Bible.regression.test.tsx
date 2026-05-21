/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';

import { render, screen } from '@testing-library/react';
import Bible from '../Bible';
import { BrowserRouter } from 'react-router-dom';
import { ReadingSettingsProvider } from '@/contexts/ReadingSettingsContext';
import { AuthContext } from '@/hooks/useAuth';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
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
};

const renderBible = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext as any}>
        <ReadingSettingsProvider>
          <Bible />
        </ReadingSettingsProvider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Bible Component Regression', () => {
  it('renders without crashing even with null/empty data', () => {
    renderBible();
    expect(screen.getByText(/Sagrada Escritura/i)).toBeInTheDocument();
  });
});
