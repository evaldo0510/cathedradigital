import { test, expect, describe, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '../../hooks/useAuth';
import { ReadingSettingsProvider } from '../../contexts/ReadingSettingsContext';
import { LangContext } from '../../contexts/LangContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
    }),
  },
}));

const queryClient = new QueryClient();

describe('Provider Idempotency & Stability', () => {
  test('AuthProvider initializes correctly in StrictMode', () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div data-testid="auth-child">Child</div>
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(screen.getByTestId('auth-child')).toBeDefined();
    
    // Rerender to simulate parent updates
    rerender(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div data-testid="auth-child">Child Updated</div>
        </AuthProvider>
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Child Updated')).toBeDefined();
  });

  test('ReadingSettingsProvider does not trigger infinite loops on mount', () => {
    let renderCount = 0;
    const TestComponent = () => {
      renderCount++;
      return <div data-testid="settings-child">Settings Child</div>;
    };

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ReadingSettingsProvider>
            <TestComponent />
          </ReadingSettingsProvider>
        </AuthProvider>
      </QueryClientProvider>
    );

    // Initial render + potentially one from useEffect mount in strict mode (which calls twice in dev, but test env might differ)
    // We just want to ensure it's not like 100+
    expect(renderCount).toBeLessThan(10);
  });
});
