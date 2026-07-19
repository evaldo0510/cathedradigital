import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CatechismPendingPanel from './CatechismPendingPanel';
import { CatechismPendingProvider, useCatechismPending } from '@/contexts/CatechismPendingContext';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCatechismParagraph', () => ({
  fetchCatechismParagraph: vi.fn(),
  CatechismFetchError: class extends Error {
    code: string;
    status?: number;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

const Seeder: React.FC<{ paragraphs: number[]; children: React.ReactNode }> = ({
  paragraphs,
  children,
}) => {
  const { markPending } = useCatechismPending();
  React.useEffect(() => {
    paragraphs.forEach((p) => markPending(p));
  }, [paragraphs, markPending]);
  return <>{children}</>;
};

const renderPanel = (paragraphs: number[], range: [number, number] = [1, 100]) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CatechismPendingProvider>
        <Seeder paragraphs={paragraphs}>
          <CatechismPendingPanel startPara={range[0]} endPara={range[1]} />
        </Seeder>
      </CatechismPendingProvider>
    </QueryClientProvider>,
  );
};

describe('CatechismPendingPanel — regressão de hooks', () => {
  beforeEach(() => {
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('não quebra as Regras de Hooks ao alternar entre estados vazio e ativo', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Estado 1: vazio → early-return null.
    const { unmount } = renderPanel([], [1, 100]);
    expect(screen.queryByTestId('catechism-pending-panel')).not.toBeInTheDocument();
    unmount();

    // Estado 2: com pendências → renderiza painel.
    const { unmount: unmount2 } = renderPanel([5, 10, 20], [1, 100]);
    expect(screen.getByTestId('catechism-pending-panel')).toBeInTheDocument();
    unmount2();

    // Estado 3: pendências fora do range → vazio novamente.
    renderPanel([500], [1, 100]);
    expect(screen.queryByTestId('catechism-pending-panel')).not.toBeInTheDocument();

    const hooksError = errorSpy.mock.calls.find((call) =>
      String(call[0]).includes('Rendered more hooks') ||
      String(call[0]).includes('Rules of Hooks'),
    );
    expect(hooksError).toBeUndefined();
    errorSpy.mockRestore();
  });

  it('mantém a ordem dos hooks ao re-renderizar do estado vazio para o ativo no mesmo mount', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const Harness: React.FC<{ paragraphs: number[] }> = ({ paragraphs }) => (
      <QueryClientProvider client={qc}>
        <CatechismPendingProvider>
          <Seeder paragraphs={paragraphs}>
            <CatechismPendingPanel startPara={1} endPara={100} />
          </Seeder>
        </CatechismPendingProvider>
      </QueryClientProvider>
    );

    const { rerender } = render(<Harness paragraphs={[]} />);
    expect(screen.queryByTestId('catechism-pending-panel')).not.toBeInTheDocument();

    rerender(<Harness paragraphs={[7, 8]} />);
    expect(screen.getByTestId('catechism-pending-panel')).toBeInTheDocument();

    rerender(<Harness paragraphs={[7, 8, 9, 10]} />);
    expect(screen.getByTestId('catechism-pending-panel')).toBeInTheDocument();

    const hooksError = errorSpy.mock.calls.find((call) =>
      String(call[0]).includes('Rendered more hooks') ||
      String(call[0]).includes('Rules of Hooks'),
    );
    expect(hooksError).toBeUndefined();
    errorSpy.mockRestore();
  });
});
