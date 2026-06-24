import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invokeMock(...args) } },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) },
}));

vi.mock('@/contexts/ReadingSettingsContext', () => ({
  useReadingSettings: () => ({ settings: { fontSize: 16, lineHeight: 1.5, fontFamily: 'sans' } }),
}));

import BibleAbbrValidatePage from '../BibleAbbrValidatePage';

const ok = (canonical = '2Cr', bollsId = 14) => ({
  data: {
    input: '2 Cr',
    normalized: canonical,
    canonical_abbr: canonical,
    book_name: '2 Crônicas',
    bollsId,
    testament: 'OT',
    deuterocanonical: false,
    resolved: true,
  },
  error: null,
});

describe('BibleAbbrValidatePage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    invokeMock.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function flushDebounce() {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
  }

  it('validação local: campo vazio mostra erro e não chama a edge function', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    invokeMock.mockResolvedValue(ok());
    render(<BibleAbbrValidatePage />);

    const input = screen.getByLabelText(/abreviação/i) as HTMLInputElement;
    await user.clear(input);
    await flushDebounce();

    expect(screen.getByText(/digite uma abreviação para validar/i)).toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('validação local: >64 chars bloqueia chamada', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    invokeMock.mockResolvedValue(ok());
    render(<BibleAbbrValidatePage />);

    const input = screen.getByLabelText(/abreviação/i);
    await user.clear(input);
    await user.type(input, 'a'.repeat(65));
    await flushDebounce();

    expect(screen.getByText(/excede 64 caracteres/i)).toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('validação local: apenas pontuação bloqueia chamada', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    invokeMock.mockResolvedValue(ok());
    render(<BibleAbbrValidatePage />);

    const input = screen.getByLabelText(/abreviação/i);
    await user.clear(input);
    await user.type(input, '...---');
    await flushDebounce();

    expect(screen.getByText(/apenas pontuação/i)).toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('mostra estado de loading enquanto a edge function responde', async () => {
    let resolveInvoke!: (v: ReturnType<typeof ok>) => void;
    invokeMock.mockReturnValue(new Promise((r) => { resolveInvoke = r; }));
    render(<BibleAbbrValidatePage />);
    await flushDebounce();

    expect(screen.getByLabelText(/validando/i)).toBeInTheDocument();
    expect(screen.getByText(/consultando edge function/i)).toBeInTheDocument();

    await act(async () => {
      resolveInvoke(ok());
    });
    await waitFor(() => expect(screen.getByText(/resolvido/i)).toBeInTheDocument());
    expect(screen.queryByLabelText(/validando/i)).not.toBeInTheDocument();
  });

  it('timeout: aborta após 8s e exibe mensagem de tempo esgotado', async () => {
    invokeMock.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          // Reage ao AbortController disparado pela página.
          setTimeout(() => reject(err), 8000);
        }),
    );
    render(<BibleAbbrValidatePage />);
    await flushDebounce();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8500);
    });

    await waitFor(() =>
      expect(screen.getByText(/tempo esgotado.*8s/i)).toBeInTheDocument(),
    );
    expect(invokeMock).toHaveBeenCalledTimes(1);
  });

  it('histórico: registra consulta bem-sucedida e re-executa ao clicar', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    invokeMock.mockResolvedValue(ok());
    render(<BibleAbbrValidatePage />);
    await flushDebounce();

    await waitFor(() =>
      expect(screen.getByText(/resolvido/i)).toBeInTheDocument(),
    );

    // Botão "2 Cr" deve aparecer no histórico (aria-label="Revalidar...").
    const historyBtn = await screen.findByRole('button', { name: /revalidar "2 cr"/i });
    expect(historyBtn).toBeInTheDocument();

    // Persistência em localStorage
    const raw = localStorage.getItem('bibleAbbrValidateHistory:v1');
    expect(raw && JSON.parse(raw)).toEqual(['2 Cr']);

    // Mudar input e re-executar via histórico
    const input = screen.getByLabelText(/abreviação/i) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'Mt');
    invokeMock.mockResolvedValue({
      data: { ...ok().data, input: 'Mt', normalized: 'Mt', canonical_abbr: 'Mt', bollsId: 40, book_name: 'Mateus' },
      error: null,
    });
    await flushDebounce();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /revalidar "mt"/i })).toBeInTheDocument(),
    );

    invokeMock.mockClear();
    invokeMock.mockResolvedValue(ok());
    await user.click(screen.getByRole('button', { name: /revalidar "2 cr"/i }));
    await flushDebounce();

    expect(input.value).toBe('2 Cr');
    expect(invokeMock).toHaveBeenCalledWith(
      'bible-abbr-validate',
      expect.objectContaining({ body: { abbrev: '2 Cr' } }),
    );
  });
});
