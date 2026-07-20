/**
 * Testes RTL cobrindo o SanctorumDateNav integrado ao PopesPage:
 *  - Hoje / dia anterior / dia seguinte
 *  - Popover do Calendário
 *  - Estado vazio acessível ao buscar termo inexistente
 *  - Persistência da data na URL (?date=YYYY-MM-DD)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PopesPage from './PopesPage';

// Card usa useReadingSettings → substituímos por wrappers simples.
vi.mock('@/components/ui/card', async () => {
  const React = await import('react');
  const make = (tag: string) =>
    React.forwardRef(({ children, ...props }: any, ref: any) =>
      React.createElement('div', { ref, ...props, 'data-mock': tag }, children),
    );
  return {
    Card: make('card'),
    CardContent: make('card-content'),
    CardHeader: make('card-header'),
    CardTitle: make('card-title'),
    CardDescription: make('card-description'),
    CardFooter: make('card-footer'),
  };
});

// Silencia framer-motion em testes.
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const passthrough = (tag: keyof JSX.IntrinsicElements) =>
    React.forwardRef(({ children, ...props }: any, ref: any) =>
      React.createElement(tag, { ref, ...props }, children),
    );
  return {
    motion: new Proxy({}, { get: (_t, key: string) => passthrough(key as any) }),
    AnimatePresence: ({ children }: any) => children,
  };
});

// SacredImage → <img> simples para evitar loaders em jsdom.
vi.mock('./SacredImage', () => ({
  default: ({ src, alt, className }: any) => <img src={src} alt={alt} className={className} />,
}));

function LocationSpy({ onLocation }: { onLocation: (search: string) => void }) {
  const loc = useLocation();
  onLocation(loc.search);
  return null;
}

function renderPage(initialEntry = '/papas') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const locations: string[] = [];
  const utils = render(
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route
              path="/papas"
              element={
                <>
                  <LocationSpy onLocation={(s) => locations.push(s)} />
                  <PopesPage />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
  return { ...utils, locations };
}

describe('PopesPage — SanctorumDateNav', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renderiza a data atual e desabilita "Hoje"', () => {
    renderPage();
    const hoje = screen.getByLabelText('Ir para hoje');
    expect(hoje).toBeDisabled();
    expect(hoje).toHaveAttribute('aria-current', 'date');
  });

  it('avança e retrocede o dia via botões anterior/próximo', async () => {
    renderPage('/papas?date=2024-03-15');
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/15 de mar/i);

    fireEvent.click(screen.getByLabelText('Próximo dia'));
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/16 de mar/i),
    );

    fireEvent.click(screen.getByLabelText('Dia anterior'));
    fireEvent.click(screen.getByLabelText('Dia anterior'));
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/14 de mar/i),
    );
  });

  it('"Hoje" restaura a data atual e sincroniza com a URL', async () => {
    const { locations } = renderPage('/papas?date=2010-01-01');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/01 de jan/i);

    fireEvent.click(screen.getByLabelText('Ir para hoje'));

    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate(),
    ).padStart(2, '0')}`;

    await waitFor(() => {
      const last = locations[locations.length - 1] ?? '';
      expect(last).toContain(`date=${iso}`);
    });
    expect(screen.getByLabelText('Ir para hoje')).toBeDisabled();
  });

  it('abre o Popover do calendário e destaca "hoje"', async () => {
    renderPage('/papas?date=2024-03-15');
    fireEvent.click(screen.getByLabelText('Escolher data no calendário'));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // O react-day-picker anota o dia atual com o modifier `today`, que virá com
    // a classe ring-primary aplicada via modifiersClassNames.
    const buttons = within(dialog).getAllByRole('button');
    const todayBtn = buttons.find((b) => b.className.includes('ring-primary'));
    expect(todayBtn).toBeTruthy();
  });

  it('estado vazio é acessível quando a busca não retorna papas', async () => {
    renderPage();
    const input = screen.getByPlaceholderText('Buscar Papa...');
    fireEvent.change(input, { target: { value: 'zzzzzzzz-inexistente' } });

    const empty = await screen.findByTestId('popes-empty');
    expect(empty).toHaveAttribute('role', 'status');
    expect(empty).toHaveTextContent(/nenhum papa encontrado/i);
  });

  it('persiste a data selecionada como query param', async () => {
    const { locations } = renderPage('/papas?date=2020-06-10');
    fireEvent.click(screen.getByLabelText('Próximo dia'));
    await waitFor(() => {
      const last = locations[locations.length - 1] ?? '';
      expect(last).toContain('date=2020-06-11');
    });
  });
});
