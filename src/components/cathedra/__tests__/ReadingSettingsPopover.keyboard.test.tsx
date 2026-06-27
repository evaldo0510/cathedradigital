import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingSettingsPopover from '../ReadingSettingsPopover';

const updateSettings = vi.fn();
vi.mock('@/contexts/ReadingSettingsContext', () => ({
  useReadingSettings: () => ({
    settings: {
      theme: 'paper',
      fontSize: 'medium',
      contrast: 'normal',
      lineSpacing: 'normal',
      fontFamily: 'serif',
      immersiveMode: false,
      showStudyMarginalia: false,
    },
    updateSettings,
  }),
}));

beforeEach(() => {
  updateSettings.mockClear();
  // @ts-ignore
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  // @ts-ignore
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  // @ts-ignore
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  // @ts-ignore
  if (!('ResizeObserver' in window)) {
    // @ts-ignore
    window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
  }
});

async function waitFor(predicate: () => boolean, timeout = 500) {
  const start = Date.now();
  while (!predicate() && Date.now() - start < timeout) {
    await new Promise((r) => setTimeout(r, 10));
  }
  if (!predicate()) throw new Error('waitFor: condição não cumprida');
}

describe('ReadingSettingsPopover · navegação por teclado', () => {
  it('Tab entra no diálogo e Shift+Tab navega de volta entre controles', async () => {
    const user = userEvent.setup();
    render(<ReadingSettingsPopover debounceMs={0} />);

    const trigger = screen.getByRole('button', { name: /Configurações de Leitura/i });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    // Abre via teclado (Enter no gatilho).
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Tab move o foco para dentro do diálogo (primeiro controle focável).
    await user.tab();
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);

    // Avança alguns Tabs e depois Shift+Tab volta — foco continua no diálogo.
    await user.tab();
    const afterForward = document.activeElement;
    await user.tab({ shift: true });
    expect(document.activeElement).not.toBe(afterForward);
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('Esc fecha o diálogo e devolve o foco ao botão da letra T', async () => {
    const user = userEvent.setup();
    render(<ReadingSettingsPopover debounceMs={0} />);

    const trigger = screen.getByRole('button', { name: /Configurações de Leitura/i });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await act(async () => { await waitFor(() => !screen.queryByTestId('reading-settings-popover')); });
    expect(document.activeElement).toBe(trigger);
  });

  it('mantém o foco preso dentro do diálogo após múltiplos Tabs e devolve ao gatilho ao fechar', async () => {
    const user = userEvent.setup();
    render(<ReadingSettingsPopover debounceMs={0} />);

    const trigger = screen.getByRole('button', { name: /Configurações de Leitura/i });
    trigger.focus();
    await user.keyboard('{Enter}');

    const dialog = screen.getByRole('dialog');
    // Pressiona Tab muitas vezes — o foco nunca deve escapar do diálogo
    // (focus trap garantido pelo Radix Popover em modo dialog).
    for (let i = 0; i < 25; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
      // Foco nunca deve voltar ao gatilho enquanto o diálogo está aberto.
      expect(document.activeElement).not.toBe(trigger);
    }

    // Shift+Tab idem — segue preso ao diálogo.
    for (let i = 0; i < 10; i++) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    // Esc fecha e devolve foco ao botão da letra T.
    await user.keyboard('{Escape}');
    await act(async () => { await waitFor(() => !screen.queryByTestId('reading-settings-popover')); });
    expect(document.activeElement).toBe(trigger);
  });
});

describe('ReadingSettingsPopover · ARIA / screen reader', () => {
  it('aplica aria-labelledby e aria-describedby no diálogo', () => {
    render(<ReadingSettingsPopover debounceMs={0} />);
    fireEvent.click(screen.getByRole('button', { name: /Configurações de Leitura/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-labelledby')).toBe('reading-settings-title');
    expect(dialog.getAttribute('aria-describedby')).toBe('reading-settings-desc');

    // O título referenciado existe e tem texto "Aparência".
    const title = document.getElementById('reading-settings-title');
    expect(title?.textContent).toMatch(/Aparência/);

    // A descrição sr-only referenciada existe.
    const desc = document.getElementById('reading-settings-desc');
    expect(desc).not.toBeNull();
    expect(desc?.className).toMatch(/sr-only/);
    expect(desc?.textContent).toMatch(/Preferências de leitura/i);
  });

  it('cada seção é anunciada com seu próprio título (aria-labelledby)', () => {
    render(<ReadingSettingsPopover debounceMs={0} />);
    fireEvent.click(screen.getByRole('button', { name: /Configurações de Leitura/i }));

    // Radiogroups nomeados por suas seções respectivas.
    expect(screen.getByRole('radiogroup', { name: /Temas de leitura/i })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /Tamanho do Texto/i })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /Acessibilidade/i })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /Espaçamento/i })).toBeInTheDocument();

    // O item selecionado em "Tamanho do Texto" tem aria-checked=true.
    const sizeGroup = screen.getByRole('radiogroup', { name: /Tamanho do Texto/i });
    const checked = sizeGroup.querySelector('[aria-checked="true"]');
    expect(checked).not.toBeNull();
  });
});
