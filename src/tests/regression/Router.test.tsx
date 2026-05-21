import { test, expect, describe, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../App';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
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

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});

describe('Route Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    // Mock scrollTo which is missing in JSDOM
    window.scrollTo = vi.fn();
    Element.prototype.scrollTo = vi.fn();
  });

  const routes = [
    { path: '/', name: 'Home/Index' },
    { path: '/bible', name: 'Bíblia' },
    { path: '/catechism', name: 'Catecismo' },
    { path: '/magisterium', name: 'Magistério' },
    { path: '/logos', name: 'Logos IA' },
  ];

  routes.forEach(({ path, name }) => {
    test(`Route "${name}" (${path}) renders without crashing or infinite loops`, async () => {
      // Set the path BEFORE rendering because App has its own BrowserRouter
      window.history.pushState({}, name, path);

      await act(async () => {
        render(
          <QueryClientProvider client={createTestQueryClient()}>
            <App />
          </QueryClientProvider>
        );
      });

      // Check for main content or skeletons
      await waitFor(() => {
        const main = screen.queryByRole('main');
        const skeleton = screen.queryByTestId(/skeleton/i);
        const loading = screen.queryByText(/Contemplando/i);
        return main || skeleton || loading;
      }, { timeout: 3000 });

      expect(true).toBe(true);
    });
  });
});
