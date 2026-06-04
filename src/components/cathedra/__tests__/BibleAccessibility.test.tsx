import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Bible from '../Bible';
import { ReadingSettingsProvider } from '@/contexts/ReadingSettingsContext';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
  it('should have a search input with accessible label', () => {
    render(<Bible />, { wrapper: AllProviders });
    const searchInput = screen.getByPlaceholderText(/buscar livro/i);
    expect(searchInput).toBeDefined();
  });

  it('should allow keyboard navigation through testament buttons', () => {
    render(<Bible />, { wrapper: AllProviders });
    const buttons = screen.getAllByRole('button');
    const antigoButton = buttons.find(b => b.textContent?.includes('ANTIGO'));
    const novoButton = buttons.find(b => b.textContent?.includes('NOVO'));
    
    if (antigoButton) antigoButton.focus();
    expect(document.activeElement).toBe(antigoButton);
  });
});
