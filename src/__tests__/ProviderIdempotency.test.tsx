import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React, { useContext, useEffect, useRef } from 'react';
import { AuthProvider, AuthContext } from '../hooks/useAuth';
import { ReadingSettingsProvider, useReadingSettings } from '../contexts/ReadingSettingsContext';
import { LangContext } from '../contexts/LangContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

// Mock Sentry
vi.mock('@sentry/react', () => ({
  ErrorBoundary: ({ children }: any) => <>{children}</>,
  init: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

describe('Provider Idempotency & StrictMode Compatibility', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('AuthProvider handles StrictMode double-mount without breaking state', async () => {
    const renderCount = vi.fn();
    
    const TestComponent = () => {
      const auth = useContext(AuthContext);
      useEffect(() => {
        renderCount();
      });
      return <div data-testid="auth-loaded">{auth?.loading ? 'loading' : 'ready'}</div>;
    };

    render(
      <React.StrictMode>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </React.StrictMode>
    );

    // In StrictMode, mount/unmount/mount happens
    // We expect it to stabilize
    await waitFor(() => {
      expect(screen.getByTestId('auth-loaded').textContent).toBe('ready');
    });
  });

  it('ReadingSettingsProvider is idempotent in StrictMode', async () => {
    const initCount = vi.fn();
    
    // We need to check if internal effects that apply themes/classes are behaving
    const TestComponent = () => {
      const { settings } = useReadingSettings();
      useEffect(() => {
        initCount();
      }, []); // Should be called twice in StrictMode but should not cause loops
      return <div data-testid="settings-theme">{settings.theme}</div>;
    };

    render(
      <React.StrictMode>
        <AuthProvider>
          <ReadingSettingsProvider>
            <TestComponent />
          </ReadingSettingsProvider>
        </AuthProvider>
      </React.StrictMode>
    );

    expect(screen.getByTestId('settings-theme')).toBeDefined();
    // StrictMode calls effects twice
    expect(initCount).toHaveBeenCalledTimes(2);
  });

  it('LangContext prevents infinite re-renders', async () => {
    const renderCount = vi.fn();
    
    const LangProviderEmulator = ({ children }: { children: React.ReactNode }) => {
      const [lang, setLang] = React.useState('pt');
      const t = React.useCallback((k: string) => k, []);
      
      return (
        <LangContext.Provider value={{ lang: lang as any, setLang: setLang as any, t }}>
          {children}
        </LangContext.Provider>
      );
    };

    const TestComponent = () => {
      const { lang } = useContext(LangContext);
      renderCount();
      return <div data-testid="lang-val">{lang}</div>;
    };

    render(
      <React.StrictMode>
        <LangProviderEmulator>
          <TestComponent />
        </LangProviderEmulator>
      </React.StrictMode>
    );

    expect(screen.getByTestId('lang-val').textContent).toBe('pt');
    // Should render a small number of times, not thousands (infinite loop)
    expect(renderCount.mock.calls.length).toBeLessThan(10);
  });

  it('Full App Provider Stack stability in StrictMode', async () => {
    const renderCount = vi.fn();

    const AppStack = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ReadingSettingsProvider>
              <LangContext.Provider value={{ lang: 'pt' as any, setLang: vi.fn() as any, t: (k) => k }}>
                {children}
              </LangContext.Provider>
            </ReadingSettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    const DeepComponent = () => {
      renderCount();
      return <div data-testid="deep-mount">Mounted</div>;
    };

    render(
      <React.StrictMode>
        <AppStack>
          <DeepComponent />
        </AppStack>
      </React.StrictMode>
    );

    await waitFor(() => {
      expect(screen.getByTestId('deep-mount')).toBeDefined();
    });

    expect(renderCount.mock.calls.length).toBeLessThan(20);
  });
});
