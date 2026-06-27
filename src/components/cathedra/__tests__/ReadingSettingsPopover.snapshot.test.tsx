import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

function setViewport(width: number, height = 800) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
  window.dispatchEvent(new Event('resize'));
}

// Cobre mobile (360/414), tablet (768) e desktop (1024) — garante
// que cabeçalho e ferramentas internas continuem íntegros em todas as larguras.
describe.each([
  { label: 'iPhone SE (360px)', width: 360 },
  { label: 'iPhone Plus (414px)', width: 414 },
  { label: 'Tablet (768px)', width: 768 },
  { label: 'Desktop (1024px)', width: 1024 },
])('ReadingSettingsPopover snapshot · $label', ({ width }) => {
  it(`mantém cabeçalho e ferramentas íntegros em ${width}px`, () => {
    setViewport(width);
    // debounceMs=0 elimina dependência de tempo nos snapshots.
    render(<ReadingSettingsPopover debounceMs={0} />);
    fireEvent.click(screen.getByRole('button', { name: /Configurações de Leitura/i }));

    const popover = screen.getByTestId('reading-settings-popover');
    const header = screen.getByTestId('reading-settings-header');

    // Largura responsiva determinística — independente do viewport simulado.
    expect(popover.className).toMatch(/w-\[min\(20rem,calc\(100vw-1\.5rem\)\)\]/);
    expect(popover.className).toMatch(/max-w-sm/);
    // Cabeçalho usa flex-wrap para nunca quebrar layout.
    expect(header.className).toMatch(/flex-wrap/);

    // Snapshot estrutural (HTML) do popover e do cabeçalho.
    expect(popover.outerHTML).toMatchSnapshot(`popover-${width}`);
    expect(header.outerHTML).toMatchSnapshot(`header-${width}`);
  });
});
