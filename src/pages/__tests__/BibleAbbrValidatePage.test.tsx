import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invokeMock(...args) } },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastDismiss = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
    dismiss: (...a: unknown[]) => toastDismiss(...a),
  },
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
    toastSuccess.mockReset();
    toastError.mockReset();
    toastDismiss.mockReset();
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

  it('404 / resolved:false: exibe badge "não reconhecido" e razão', async () => {
    invokeMock.mockResolvedValue({
      data: {
        input: 'xyz',
        normalized: 'xyz',
        canonical_abbr: null,
        book_name: null,
        bollsId: null,
        testament: null,
        deuterocanonical: null,
        resolved: false,
        reason: 'abbreviation_not_found',
      },
      error: null,
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<BibleAbbrValidatePage />);
    const input = screen.getByLabelText(/abreviação/i);
    await user.clear(input);
    await user.type(input, 'xyz');
    await flushDebounce();

    await waitFor(() =>
      expect(screen.getByText(/não reconhecido/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/abbreviation_not_found/i)).toBeInTheDocument();
  });

  it('404 propagado como error com context.json também renderiza não reconhecido', async () => {
    const notFoundBody = {
      input: 'zzz',
      normalized: 'zzz',
      canonical_abbr: null,
      book_name: null,
      bollsId: null,
      testament: null,
      deuterocanonical: null,
      resolved: false,
      reason: 'abbreviation_not_found',
    };
    const err = Object.assign(new Error('Function returned 404'), {
      context: { json: async () => notFoundBody },
    });
    invokeMock.mockResolvedValue({ data: null, error: err });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<BibleAbbrValidatePage />);
    const input = screen.getByLabelText(/abreviação/i);
    await user.clear(input);
    await user.type(input, 'zzz');
    await flushDebounce();

    await waitFor(() =>
      expect(screen.getByText(/não reconhecido/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/abbreviation_not_found/i)).toBeInTheDocument();
  });

  it('botão copiar canonical_abbr: copia valor e mostra feedback "Copiado" + toast', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    });
    invokeMock.mockResolvedValue(ok('2Cr', 14));
    render(<BibleAbbrValidatePage />);
    await flushDebounce();
    await waitFor(() => expect(screen.getByText(/resolvido/i)).toBeInTheDocument());

    const copyBtn = screen.getByRole('button', { name: /copiar canonical_abbr/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeText).toHaveBeenCalledWith('2Cr');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /copiar canonical_abbr/i })).toHaveTextContent(/copiado/i),
    );
    expect(toastSuccess).toHaveBeenCalledWith(
      'canonical_abbr copiado',
      expect.objectContaining({ description: '2Cr' }),
    );
  });

  it('botão copiar bollsId: copia número como string e mostra feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    });
    invokeMock.mockResolvedValue(ok('2Cr', 14));
    render(<BibleAbbrValidatePage />);
    await flushDebounce();
    await waitFor(() => expect(screen.getByText(/resolvido/i)).toBeInTheDocument());

    const copyBtn = screen.getByRole('button', { name: /copiar bollsid/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeText).toHaveBeenCalledWith('14');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /copiar bollsid/i })).toHaveTextContent(/copiado/i),
    );
    expect(toastSuccess).toHaveBeenCalledWith(
      'bollsId copiado',
      expect.objectContaining({ description: '14' }),
    );
  });

  it('toast de cópia é persistente (duration: Infinity) com closeButton para canonical_abbr e bollsId', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText }, configurable: true, writable: true,
    });
    invokeMock.mockResolvedValue(ok('2Cr', 14));
    render(<BibleAbbrValidatePage />);
    await flushDebounce();
    await waitFor(() => expect(screen.getByText(/resolvido/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copiar canonical_abbr/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copiar bollsid/i }));
    });

    const canonicalCall = toastSuccess.mock.calls.find((c) => c[0] === 'canonical_abbr copiado');
    const bollsCall = toastSuccess.mock.calls.find((c) => c[0] === 'bollsId copiado');
    expect(canonicalCall?.[1]).toMatchObject({
      duration: Infinity,
      closeButton: true,
      id: 'bible-abbr-copy:canonical_abbr',
    });
    expect(bollsCall?.[1]).toMatchObject({
      duration: Infinity,
      closeButton: true,
      id: 'bible-abbr-copy:bollsId',
    });
  });

  it('cliques rápidos no mesmo botão reutilizam o mesmo id de toast (sem duplicatas)', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText }, configurable: true, writable: true,
    });
    invokeMock.mockResolvedValue(ok('2Cr', 14));
    render(<BibleAbbrValidatePage />);
    await flushDebounce();
    await waitFor(() => expect(screen.getByText(/resolvido/i)).toBeInTheDocument());

    const btn = screen.getByRole('button', { name: /copiar canonical_abbr/i });
    await act(async () => { fireEvent.click(btn); });
    await act(async () => { fireEvent.click(btn); });
    await act(async () => { fireEvent.click(btn); });

    const successCalls = toastSuccess.mock.calls.filter((c) => c[0] === 'canonical_abbr copiado');
    expect(successCalls).toHaveLength(3);
    // Mesmo id em todas as chamadas garante deduplicação no sonner.
    for (const c of successCalls) {
      expect(c[1]).toMatchObject({ id: 'bible-abbr-copy:canonical_abbr' });
    }
    // dismiss(id) é chamado antes de cada novo toast.
    expect(toastDismiss).toHaveBeenCalledWith('bible-abbr-copy:canonical_abbr');
    expect(
      toastDismiss.mock.calls.filter((c) => c[0] === 'bible-abbr-copy:canonical_abbr').length,
    ).toBeGreaterThanOrEqual(3);
  });

  it('fallback de cópia funciona quando navigator.clipboard está indisponível', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined, configurable: true, writable: true,
    });
    const execSpy = (document as any).execCommand = vi.fn().mockReturnValue(true); const execSpy2 = (document as any).execCommand;
    invokeMock.mockResolvedValue(ok('2Cr', 14));
    render(<BibleAbbrValidatePage />);
    await flushDebounce();
    await waitFor(() => expect(screen.getByText(/resolvido/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copiar canonical_abbr/i }));
    });

    expect(execSpy).toHaveBeenCalledWith('copy');
    expect(toastSuccess).toHaveBeenCalledWith(
      'canonical_abbr copiado',
      expect.objectContaining({ description: '2Cr', duration: Infinity }),
    );
    delete (document as any).execCommand;
  });

  it('fallback de cópia: quando clipboard rejeita (permission denied) e execCommand sucede, copia mesmo assim', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText }, configurable: true, writable: true,
    });
    const execSpy = (document as any).execCommand = vi.fn().mockReturnValue(true); const execSpy2 = (document as any).execCommand;
    invokeMock.mockResolvedValue(ok('2Cr', 14));
    render(<BibleAbbrValidatePage />);
    await flushDebounce();
    await waitFor(() => expect(screen.getByText(/resolvido/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copiar bollsid/i }));
    });

    expect(writeText).toHaveBeenCalledWith('14');
    expect(execSpy).toHaveBeenCalledWith('copy');
    expect(toastSuccess).toHaveBeenCalledWith(
      'bollsId copiado',
      expect.objectContaining({ description: '14' }),
    );
    expect(toastError).not.toHaveBeenCalled();
    delete (document as any).execCommand;
  });

  it('quando clipboard e execCommand falham, mostra toast de erro (sem persistir sucesso)', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined, configurable: true, writable: true,
    });
    const execSpy = (document as any).execCommand = vi.fn().mockReturnValue(false); const execSpy2 = (document as any).execCommand;
    invokeMock.mockResolvedValue(ok('2Cr', 14));
    render(<BibleAbbrValidatePage />);
    await flushDebounce();
    await waitFor(() => expect(screen.getByText(/resolvido/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copiar canonical_abbr/i }));
    });

    expect(toastError).toHaveBeenCalledWith(
      'Não foi possível copiar',
      expect.objectContaining({ id: 'bible-abbr-copy:canonical_abbr' }),
    );
    expect(toastSuccess).not.toHaveBeenCalled();
    delete (document as any).execCommand;
  });

  it('estado de loading/disabled enquanto copyToClipboard executa (fluxo async)', async () => {
    let resolveWrite!: () => void;
    const writeText = vi.fn(() => new Promise<void>((r) => { resolveWrite = r; }));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText }, configurable: true, writable: true,
    });
    invokeMock.mockResolvedValue(ok('2Cr', 14));
    render(<BibleAbbrValidatePage />);
    await flushDebounce();
    await waitFor(() => expect(screen.getByText(/resolvido/i)).toBeInTheDocument());

    const btn = screen.getByRole('button', { name: /copiar canonical_abbr/i }) as HTMLButtonElement;
    await act(async () => { fireEvent.click(btn); });

    // Durante a cópia: aria-busy + texto "Copiando…" + disabled
    await waitFor(() => {
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute('aria-busy', 'true');
      expect(btn).toHaveTextContent(/copiando/i);
    });

    // Cliques adicionais durante o fluxo não disparam writeText extra
    await act(async () => { fireEvent.click(btn); fireEvent.click(btn); });
    expect(writeText).toHaveBeenCalledTimes(1);

    await act(async () => { resolveWrite(); });
    await waitFor(() => {
      expect(btn).not.toBeDisabled();
      expect(btn).toHaveTextContent(/copiado/i);
    });
  });

  it('a11y: aria-label contém o valor a ser copiado para canonical_abbr e bollsId', async () => {
    invokeMock.mockResolvedValue(ok('2Cr', 14));
    render(<BibleAbbrValidatePage />);
    await flushDebounce();
    await waitFor(() => expect(screen.getByText(/resolvido/i)).toBeInTheDocument());

    expect(screen.getByRole('button', { name: /copiar canonical_abbr \(2cr\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copiar bollsid \(14\)/i })).toBeInTheDocument();
  });

  it('a11y: região aria-live anuncia "copiado" após sucesso para ambos os campos', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText }, configurable: true, writable: true,
    });
    invokeMock.mockResolvedValue(ok('2Cr', 14));
    render(<BibleAbbrValidatePage />);
    await flushDebounce();
    await waitFor(() => expect(screen.getByText(/resolvido/i)).toBeInTheDocument());

    const liveCanonical = screen.getByTestId('copy-live-canonical_abbr');
    const liveBolls = screen.getByTestId('copy-live-bollsId');
    expect(liveCanonical).toHaveAttribute('aria-live', 'polite');
    expect(liveBolls).toHaveAttribute('aria-live', 'polite');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copiar canonical_abbr/i }));
    });
    await waitFor(() => expect(liveCanonical).toHaveTextContent(/canonical_abbr copiado: 2cr/i));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copiar bollsid/i }));
    });
    await waitFor(() => expect(liveBolls).toHaveTextContent(/bollsid copiado: 14/i));
  });

  it('feedback "Copiar"→"Copiado" alterna corretamente em ambos os botões', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText }, configurable: true, writable: true,
    });
    invokeMock.mockResolvedValue(ok('2Cr', 14));
    render(<BibleAbbrValidatePage />);
    await flushDebounce();
    await waitFor(() => expect(screen.getByText(/resolvido/i)).toBeInTheDocument());

    const canonBtn = screen.getByRole('button', { name: /copiar canonical_abbr/i });
    const bollsBtn = screen.getByRole('button', { name: /copiar bollsid/i });
    expect(canonBtn).toHaveTextContent(/copiar/i);
    expect(bollsBtn).toHaveTextContent(/copiar/i);

    await act(async () => { fireEvent.click(canonBtn); });
    await waitFor(() => expect(canonBtn).toHaveTextContent(/copiado/i));
    // O outro botão permanece em "Copiar"
    expect(bollsBtn).toHaveTextContent(/^copiar$/i);

    await act(async () => { fireEvent.click(bollsBtn); });
    await waitFor(() => expect(bollsBtn).toHaveTextContent(/copiado/i));
  });

  it('permissão negada: writeText rejeita, execCommand copia exatamente o valor esperado (canonical_abbr e bollsId)', async () => {
    const writeText = vi.fn().mockRejectedValue(
      Object.assign(new Error('Write permission denied.'), { name: 'NotAllowedError' }),
    );
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText }, configurable: true, writable: true,
    });
    const copiedValues: string[] = [];
    (document as any).execCommand = vi.fn(() => {
      // Captura o valor selecionado no textarea de fallback no momento do copy.
      const active = document.activeElement as HTMLTextAreaElement | null;
      if (active && 'value' in active) copiedValues.push(active.value);
      return true;
    });

    invokeMock.mockResolvedValue(ok('2Cr', 14));
    render(<BibleAbbrValidatePage />);
    await flushDebounce();
    await waitFor(() => expect(screen.getByText(/resolvido/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copiar canonical_abbr/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copiar bollsid/i }));
    });

    expect(writeText).toHaveBeenNthCalledWith(1, '2Cr');
    expect(writeText).toHaveBeenNthCalledWith(2, '14');
    expect(copiedValues).toEqual(['2Cr', '14']);
    expect(toastSuccess).toHaveBeenCalledWith(
      'canonical_abbr copiado',
      expect.objectContaining({ description: '2Cr' }),
    );
    expect(toastSuccess).toHaveBeenCalledWith(
      'bollsId copiado',
      expect.objectContaining({ description: '14' }),
    );
    delete (document as any).execCommand;
  });
});
