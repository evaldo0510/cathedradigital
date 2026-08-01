/**
 * Wrapper padrão de testes do Cathedra.
 *
 * Todo teste que renderiza componentes da aplicação deve usar
 * `renderWithProviders` (ou `TestProviders`) — ele garante a presença de
 * AuthProvider (stub, sem rede) e ReadingSettingsProvider, além de Helmet,
 * React Query, Router e idioma.
 */
import React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthContext } from '@/hooks/useAuth';
import { ReadingSettingsProvider } from '@/contexts/ReadingSettingsContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LangProvider } from '@/contexts/LangContext';

export type TestAuthValue = Record<string, unknown>;

/** Sessão anônima padrão — não toca em rede nem no backend. */
export const anonymousAuthValue: TestAuthValue = {
  user: null,
  profile: null,
  loading: false,
  signOut: async () => {},
  isPremium: false,
  userLevel: 'iniciante',
  refreshProfile: async () => {},
  authenticated: false,
};

/** Sessão autenticada padrão para testes de área logada. */
export const authenticatedAuthValue: TestAuthValue = {
  ...anonymousAuthValue,
  user: { id: 'test-user', email: 'test@cathedra.test' },
  profile: { id: 'test-user', completed_books: [], badges: [], is_premium: true },
  isPremium: true,
  authenticated: true,
};

export interface TestProvidersProps {
  children: React.ReactNode;
  /** Entradas iniciais do MemoryRouter. */
  initialEntries?: string[];
  /** Quando definido, o children é montado dentro de uma Route com esse path. */
  routePath?: string;
  /** Valor injetado no AuthContext. */
  auth?: TestAuthValue;
  queryClient?: QueryClient;
}

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });

/**
 * Apenas os contextos de domínio (Auth + ReadingSettings + Lang + Tooltip).
 * Use dentro de wrappers de teste que já possuem Router/QueryClient próprios.
 */
export const TestContexts: React.FC<{ children: React.ReactNode; auth?: TestAuthValue }> = ({
  children,
  auth = anonymousAuthValue,
}) => (
  <LangProvider>
    <AuthContext.Provider value={auth as never}>
      <ReadingSettingsProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ReadingSettingsProvider>
    </AuthContext.Provider>
  </LangProvider>
);

export const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  initialEntries = ['/'],
  routePath,
  auth = anonymousAuthValue,
  queryClient,
}) => {
  const client = React.useMemo(() => queryClient ?? createTestQueryClient(), [queryClient]);

  const routed = routePath ? (
    <Routes>
      <Route path={routePath} element={<>{children}</>} />
    </Routes>
  ) : (
    children
  );

  return (
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={initialEntries}>
          <TestContexts auth={auth}>{routed}</TestContexts>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export type RenderWithProvidersOptions = Omit<TestProvidersProps, 'children'> &
  Omit<RenderOptions, 'wrapper'>;

export function renderWithProviders(
  ui: React.ReactElement,
  { initialEntries, routePath, auth, queryClient, ...options }: RenderWithProvidersOptions = {},
): RenderResult {
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders
        initialEntries={initialEntries}
        routePath={routePath}
        auth={auth}
        queryClient={queryClient}
      >
        {children}
      </TestProviders>
    ),
    ...options,
  });
}
