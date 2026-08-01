import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SanctorumDateNav } from '../SanctorumDateNav';
import { renderWithProviders } from '@/test/providers';

/**
 * Snapshots do SanctorumDateNav em LTR e RTL para blindar:
 *  - classes de layout dos pills (min-w/max-w/shrink-0/whitespace-nowrap/truncate max-w-[3ch]),
 *  - overflow-x-auto e ausência de flex-wrap na tira,
 *  - snap-x snap-mandatory no container e snap-start nas pills.
 * Se qualquer regressão visual alterar essas classes, o teste falha
 * e obriga revisão consciente.
 */

const FIXED = new Date(2026, 6, 20); // 20/07/2026, determinístico

function stripMarkup(html: string) {
  // Remove IDs dinâmicos gerados pelo Radix e pelo useId para snapshot estável.
  return html
    .replace(/\sid="[^"]*"/g, '')
    .replace(/\saria-controls="[^"]*"/g, '')
    .replace(/\saria-labelledby="[^"]*"/g, '')
    .replace(/\saria-describedby="[^"]*"/g, '');
}

describe('SanctorumDateNav — snapshots LTR e RTL', () => {
  it('LTR: tira e pills preservam classes de layout', () => {
    const { container } = renderWithProviders(
      <div dir="ltr">
        <SanctorumDateNav value={FIXED} onChange={() => {}} />
      </div>,
    );
    const strip = container.querySelector('[data-testid="sanctorum-date-strip"]')!;
    expect(strip.className).toMatch(/overflow-x-auto/);
    expect(strip.className).not.toMatch(/flex-wrap/);
    expect(strip.className).toMatch(/snap-x/);
    expect(strip.className).toMatch(/snap-mandatory/);
    expect(stripMarkup(strip.outerHTML)).toMatchSnapshot();
  });

  it('RTL: tira e pills preservam classes de layout', () => {
    const { container } = renderWithProviders(
      <div dir="rtl">
        <SanctorumDateNav value={FIXED} onChange={() => {}} />
      </div>,
    );
    const strip = container.querySelector('[data-testid="sanctorum-date-strip"]')!;
    expect(strip.className).toMatch(/overflow-x-auto/);
    expect(strip.className).not.toMatch(/flex-wrap/);
    expect(strip.className).toMatch(/snap-x/);

    // Todas as pills mantêm o mesmo layout independente da direção do texto.
    const pills = strip.querySelectorAll('button');
    expect(pills.length).toBe(7);
    pills.forEach((p) => {
      expect(p.className).toMatch(/shrink-0/);
      expect(p.className).toMatch(/whitespace-nowrap/);
      expect(p.className).toMatch(/min-w-\[56px\]/);
      expect(p.className).toMatch(/max-w-\[64px\]/);
      expect(p.className).toMatch(/snap-start/);
      const sigla = p.querySelector('span');
      expect(sigla?.className).toMatch(/truncate/);
      expect(sigla?.className).toMatch(/max-w-\[3ch\]/);
    });

    expect(stripMarkup(strip.outerHTML)).toMatchSnapshot();
  });
});
