import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import Index from '../pages/Index';
import HojePage from '../components/cathedra/HojePage';
import BibliotecaPage from '../components/cathedra/BibliotecaPage';

expect.extend(matchers);

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

describe('Accessibility Tests', () => {
  it('Index page should have no accessibility violations', async () => {
    const { container } = render(
      <AllProviders>
        <Index />
      </AllProviders>
    );
    const results = await axe(container);
    // @ts-ignore
    expect(results).toHaveNoViolations();
  });

  it('Hoje page should have no accessibility violations', async () => {
    const { container } = render(
      <AllProviders>
        <HojePage />
      </AllProviders>
    );
    const results = await axe(container);
    // @ts-ignore
    expect(results).toHaveNoViolations();
  });

  it('Biblioteca page should have no accessibility violations', async () => {
    const { container } = render(
      <AllProviders>
        <BibliotecaPage />
      </AllProviders>
    );
    const results = await axe(container);
    // @ts-ignore
    expect(results).toHaveNoViolations();
  });
});
