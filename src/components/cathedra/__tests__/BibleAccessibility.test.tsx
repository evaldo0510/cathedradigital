import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Bible from '../Bible';
import { ReadingSettingsProvider } from '@/contexts/ReadingSettingsContext';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);

// Mock SpeechSynthesis
vi.stubGlobal('speechSynthesis', {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  speaking: false,
  paused: false,
});

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { verses: [] }, error: null }),
    },
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
  },
}));

const queryClient = new QueryClient();

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ReadingSettingsProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ReadingSettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

describe('Bible Component Accessibility', () => {
  it('should have a search input with accessible label or placeholder', () => {
    render(<Bible />, { wrapper: AllProviders });
    const searchInput = screen.getByPlaceholderText(/buscar livro/i);
    expect(searchInput).toBeDefined();
  });

  it('should render testament filter buttons', () => {
    render(<Bible />, { wrapper: AllProviders });
    const buttons = screen.getAllByRole('button');
    const hasAntigo = buttons.some(b => b.textContent?.toUpperCase().includes('ANTIGO'));
    const hasNovo = buttons.some(b => b.textContent?.toUpperCase().includes('NOVO'));
    expect(hasAntigo).toBe(true);
    expect(hasNovo).toBe(true);
  });
});
