import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

describe('ReadingSettingsPopover · acessibilidade e tap', () => {
  it('expõe role=dialog com aria-modal e nome acessível', () => {
    render(<ReadingSettingsPopover />);
    fireEvent.click(screen.getByRole('button', { name: /Configurações de Leitura/i }));

    const dialog = screen.getByRole('dialog', { name: /Aparência/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-describedby', 'reading-settings-desc');
  });

  it('fecha com Esc e devolve o foco ao gatilho (letra T)', async () => {
    render(<ReadingSettingsPopover />);
    const trigger = screen.getByRole('button', { name: /Configurações de Leitura/i });
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });

    expect(screen.queryByTestId('reading-settings-popover')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it('ignora alternâncias muito rápidas (debounce anti tap-duplo)', async () => {
    // Debounce padrão (280ms) — dois clicks no mesmo tick devem ser fundidos.
    render(<ReadingSettingsPopover />);
    const trigger = screen.getByRole('button', { name: /Configurações de Leitura/i });

    fireEvent.click(trigger); // abre
    expect(screen.getByTestId('reading-settings-popover')).toBeInTheDocument();

    // Segundo tap "fantasma" dentro da janela de debounce: deve ser ignorado.
    fireEvent.click(trigger);
    expect(screen.getByTestId('reading-settings-popover')).toBeInTheDocument();
  });
});
