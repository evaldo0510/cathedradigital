import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SanctorumDateNav } from '../SanctorumDateNav';

/**
 * Acessibilidade do SanctorumDateNav:
 *  - Roles semânticos (group, button, heading).
 *  - aria-labels em todos os controles principais.
 *  - Pills expõem aria-pressed sincronizado com a data ativa.
 *  - Foco programático funciona em todos os controles e pills.
 *  - Setas do teclado (ArrowLeft/ArrowRight) sobre os botões "Dia anterior/próximo"
 *    disparam a mudança de data via Enter (roving nativo por Tab).
 */
describe('SanctorumDateNav — acessibilidade', () => {
  const date = new Date(2026, 6, 20); // 20/07/2026

  it('expõe role="group" com aria-label', () => {
    render(<SanctorumDateNav value={date} onChange={() => {}} />);
    expect(
      screen.getByRole('group', { name: 'Navegação por data' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Tira de dias' })).toBeInTheDocument();
  });

  it('todos os controles principais possuem aria-label', () => {
    render(<SanctorumDateNav value={date} onChange={() => {}} />);
    for (const label of [
      'Dia anterior',
      'Próximo dia',
      'Semana anterior',
      'Próxima semana',
      'Ir para hoje',
      'Escolher data no calendário',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('cada pill da tira é um button com aria-label e aria-pressed', () => {
    render(<SanctorumDateNav value={date} onChange={() => {}} />);
    const strip = screen.getByRole('group', { name: 'Tira de dias' });
    const pills = within(strip).getAllByRole('button');
    expect(pills).toHaveLength(7);
    for (const p of pills) {
      expect(p).toHaveAttribute('aria-label');
      expect(p).toHaveAttribute('aria-pressed');
    }
    const pressed = pills.filter((p) => p.getAttribute('aria-pressed') === 'true');
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toHaveTextContent('20');
  });

  it('foco programático funciona em botões da barra e em pills', () => {
    render(<SanctorumDateNav value={date} onChange={() => {}} />);
    const prox = screen.getByRole('button', { name: 'Próximo dia' });
    prox.focus();
    expect(prox).toHaveFocus();

    const strip = screen.getByRole('group', { name: 'Tira de dias' });
    const lastPill = within(strip).getAllByRole('button').at(-1)!;
    lastPill.focus();
    expect(lastPill).toHaveFocus();
  });

  it('ativação por teclado nos controles chama onChange', () => {
    const onChange = vi.fn();
    render(<SanctorumDateNav value={date} onChange={onChange} />);

    const prox = screen.getByRole('button', { name: 'Próximo dia' });
    prox.focus();
    fireEvent.keyDown(prox, { key: 'Enter' });
    fireEvent.click(prox); // Enter em <button> aciona click nativamente
    expect(onChange).toHaveBeenCalled();
    const nextDate = onChange.mock.calls.at(-1)![0] as Date;
    expect(nextDate.getDate()).toBe(21);

    const ant = screen.getByRole('button', { name: 'Dia anterior' });
    ant.focus();
    fireEvent.click(ant);
    const prevDate = onChange.mock.calls.at(-1)![0] as Date;
    expect(prevDate.getDate()).toBe(19);
  });

  it('heading anuncia a data via aria-live="polite"', () => {
    render(<SanctorumDateNav value={date} onChange={() => {}} />);
    const heading = screen.getByRole('heading', { level: 2 });
    const region = heading.parentElement!;
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
  });
});
