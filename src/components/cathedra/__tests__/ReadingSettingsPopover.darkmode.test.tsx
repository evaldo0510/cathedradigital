import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReadingSettingsPopover from '../ReadingSettingsPopover';

// Cenário: tema escuro + alto contraste. Garante que rótulos e
// controles continuam presentes, com nomes acessíveis e marcações
// ARIA corretas (legibilidade independe do tema CSS).
const updateSettings = vi.fn();
vi.mock('@/contexts/ReadingSettingsContext', () => ({
  useReadingSettings: () => ({
    settings: {
      theme: 'dark',
      fontSize: 'medium',
      contrast: 'high',
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
  // Ativa classe `dark` no <html> para reproduzir o modo escuro do app.
  document.documentElement.classList.add('dark');
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

describe.each([
  { label: 'mobile (360px)', width: 360 },
  { label: 'tablet (768px)', width: 768 },
  { label: 'desktop (1024px)', width: 1024 },
])('ReadingSettingsPopover · dark + alto contraste · $label', ({ width }) => {
  it(`renderiza todas as seções acessíveis em ${width}px`, () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    window.dispatchEvent(new Event('resize'));

    render(<ReadingSettingsPopover debounceMs={0} />);
    fireEvent.click(screen.getByRole('button', { name: /Configurações de Leitura/i }));

    // Diálogo presente e nomeado.
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-labelledby')).toBe('reading-settings-title');

    // Todas as seções continuam anunciáveis (não dependem do tema).
    expect(screen.getByRole('radiogroup', { name: /Temas de leitura/i })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /Tamanho do Texto/i })).toBeInTheDocument();
    const a11yGroup = screen.getByRole('radiogroup', { name: /Acessibilidade/i });
    expect(a11yGroup).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /Espaçamento/i })).toBeInTheDocument();

    // "Alto Contraste" está marcado como selecionado.
    const high = a11yGroup.querySelector('[aria-label="Alto Contraste"]');
    expect(high?.getAttribute('aria-checked')).toBe('true');

    // O contexto `dark` aplicado ao <html> não suprime os títulos das seções.
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Snapshot estrutural — detecta regressões de rótulos/ordem em dark mode.
    expect(screen.getByTestId('reading-settings-popover').outerHTML)
      .toMatchSnapshot(`popover-dark-${width}`);
  });
});
