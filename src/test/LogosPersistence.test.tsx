import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import LogosAI from '@/components/cathedra/LogosAI';
import React from 'react';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';

// Mock scrollIntoView for JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock context and supabase
vi.mock('@/contexts/ReadingSettingsContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/ReadingSettingsContext')>('@/contexts/ReadingSettingsContext');
  return {
    ...actual,

  useReadingSettings: vi.fn(),
};
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('@/constants', () => ({
  Icons: {
    Sparkles: () => null,
    Download: () => null,
    RotateCcw: () => null,
    X: () => null,
    ArrowRight: () => null,
  },
}));

describe('LogosAI Persistence and Silence', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should load history from localStorage based on context', () => {
    const context = 'section-1';
    const history = [{ role: 'user', content: 'hello' }];
    localStorage.setItem(`logos_history_${context}`, JSON.stringify(history));

    (useReadingSettings as any).mockReturnValue({
      settings: { totalSilence: false, reduceAnimations: false },
    });

    render(
      <LogosAI 
        isOpen={true} 
        onClose={mockOnClose} 
        context={context} 
        variant="integrated"
      />
    );

    expect(screen.getByText('hello')).toBeDefined();
  });

  it('should clear history and abort requests when totalSilence is activated', () => {
    const context = 'section-1';
    const history = [{ role: 'user', content: 'hello' }];
    localStorage.setItem(`logos_history_${context}`, JSON.stringify(history));

    const { rerender } = render(
      <LogosAI 
        isOpen={true} 
        onClose={mockOnClose} 
        context={context} 
        variant="integrated"
      />
    );

    // Initial state
    expect(screen.queryByText('hello')).toBeDefined();

    // Activate silence
    (useReadingSettings as any).mockReturnValue({
      settings: { totalSilence: true, reduceAnimations: false },
    });

    rerender(
      <LogosAI 
        isOpen={true} 
        onClose={mockOnClose} 
        context={context} 
        variant="integrated"
      />
    );

    // Should show "Modo Silêncio Ativo" and history should be empty in state
    expect(screen.getByText('Modo Silêncio Ativo')).toBeDefined();
    expect(screen.queryByText('hello')).toBeNull();
  });

  it('should switch history when context changes', async () => {
    const context1 = 'section-1';
    const context2 = 'section-2';
    const history1 = [{ role: 'user', content: 'msg 1' }];
    const history2 = [{ role: 'user', content: 'msg 2' }];
    
    localStorage.setItem(`logos_history_${context1}`, JSON.stringify(history1));
    localStorage.setItem(`logos_history_${context2}`, JSON.stringify(history2));

    (useReadingSettings as any).mockReturnValue({
      settings: { totalSilence: false, reduceAnimations: false },
    });

    const { rerender } = render(
      <LogosAI 
        isOpen={true} 
        onClose={mockOnClose} 
        context={context1} 
        variant="integrated"
      />
    );

    expect(screen.getByText('msg 1')).toBeDefined();

    rerender(
      <LogosAI 
        isOpen={true} 
        onClose={mockOnClose} 
        context={context2} 
        variant="integrated"
      />
    );

    expect(await screen.findByText('msg 2')).toBeDefined();
    expect(screen.queryByText('msg 1')).toBeNull();
  });
});
