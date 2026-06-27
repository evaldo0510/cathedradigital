import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ReadingSettingsPopover from '../ReadingSettingsPopover';

// Mock do contexto para evitar Supabase/Auth durante o teste.
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

// Stub do ResizeObserver/PointerEvent exigidos pelo Radix em jsdom.
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

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
}

describe('ReadingSettingsPopover · responsividade mobile', () => {
  it('abre o popover ao clicar no botão T sem desconfigurar o cabeçalho', () => {
    setViewport(360);
    render(<ReadingSettingsPopover />);

    const trigger = screen.getByRole('button', { name: /Configurações de Leitura/i });
    fireEvent.click(trigger);

    const popover = screen.getByTestId('reading-settings-popover');
    expect(popover).toBeInTheDocument();

    // Largura responsiva configurada para não estourar o viewport.
    expect(popover.className).toMatch(/w-\[min\(20rem,calc\(100vw-1\.5rem\)\)\]/);

    // Cabeçalho mantém título, "Modo Imersivo" e botão fechar sem quebrar.
    const header = screen.getByTestId('reading-settings-header');
    expect(header.className).toMatch(/flex-wrap/);
    expect(within(header).getByText(/Aparência/i)).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: /Modo Imersivo/i })).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: /Fechar configurações/i })).toBeInTheDocument();
  });

  it('fecha o popover ao clicar no botão de fechar (X)', () => {
    setViewport(360);
    render(<ReadingSettingsPopover />);

    fireEvent.click(screen.getByRole('button', { name: /Configurações de Leitura/i }));
    expect(screen.getByTestId('reading-settings-popover')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Fechar configurações/i }));
    expect(screen.queryByTestId('reading-settings-popover')).not.toBeInTheDocument();
  });

  it('renderiza as ferramentas internas (temas, tamanho, acessibilidade, espaçamento) no mobile', () => {
    setViewport(360);
    render(<ReadingSettingsPopover />);
    fireEvent.click(screen.getByRole('button', { name: /Configurações de Leitura/i }));

    expect(screen.getByText(/Tamanho do Texto/i)).toBeInTheDocument();
    expect(screen.getByText(/Acessibilidade/i)).toBeInTheDocument();
    expect(screen.getByText(/Espaçamento/i)).toBeInTheDocument();
    expect(screen.getByText(/Tipografia/i)).toBeInTheDocument();
    // Os quatro temas devem estar presentes.
    ['Claro', 'Pergaminho', 'Escuro', 'Noite'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
