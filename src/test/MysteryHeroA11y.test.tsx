/**
 * A11y — MysteryHero: seção rotulada, título como heading nível 1,
 * botão iniciar acessível por teclado, imagem decorativa marcada
 * como aria-hidden (não anunciada).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MysteryHero from '@/components/prayer/rosary/MysteryHero';
import type { DBMystery } from '@/prayer-engine/loadPrayerHierarchy';

// IntersectionObserver polyfill mínimo — dispara isIntersecting=true.
beforeEach(() => {
  (globalThis as any).IntersectionObserver = class {
    cb: any;
    constructor(cb: any) { this.cb = cb; }
    observe(el: Element) { this.cb([{ isIntersecting: true, target: el }], this); }
    disconnect() {}
    unobserve() {}
  };
});

const baseMystery: DBMystery = {
  id: 'm1',
  prayer_id: 'p1',
  section_id: 's1',
  slug: 'anunciacao',
  order_index: 1,
  title: 'A Anunciação',
  subtitle: 'O Verbo se faz carne',
  gospel_ref: 'Lc 1,26-38',
  meta: null,
} as any;

describe('MysteryHero a11y', () => {
  it('rotula a seção e expõe heading', () => {
    render(<MysteryHero mystery={baseMystery} onStart={() => {}} />);
    const region = screen.getByRole('region', { name: /introdução contemplativa/i });
    expect(region).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/anunciação/i);
  });

  it('botão iniciar é acessível por teclado (Enter aciona onStart)', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<MysteryHero mystery={baseMystery} onStart={onStart} />);
    const btn = screen.getByRole('button', { name: /iniciar contemplação/i });
    btn.focus();
    expect(btn).toHaveFocus();
    await user.keyboard('{Enter}');
    // O componente aplica fade e chama onStart após 220ms.
    await vi.waitFor(() => expect(onStart).toHaveBeenCalled());
  });

  it('imagem decorativa não é anunciada (aria-hidden + alt vazio)', () => {
    const withImg = { ...baseMystery, meta: { hero_image_path: 'anunciacao.jpg' } } as any;
    render(<MysteryHero mystery={withImg} onStart={() => {}} />);
    // Sem role="img" acessível — screen readers pulam.
    expect(screen.queryByRole('img')).toBeNull();
  });
});
