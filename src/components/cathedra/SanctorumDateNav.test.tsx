import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SanctorumDateNav } from './SanctorumDateNav';

describe('SanctorumDateNav', () => {
  it('renderiza data corrente por extenso', () => {
    const date = new Date(2026, 0, 28); // 28 jan
    render(<SanctorumDateNav value={date} onChange={() => {}} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/28 de janeiro/);
  });

  it('"Dia anterior" chama onChange com -1 dia', () => {
    const onChange = vi.fn();
    const date = new Date(2026, 0, 10);
    render(<SanctorumDateNav value={date} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Dia anterior'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0][0] as Date).getDate()).toBe(9);
  });

  it('"Semana anterior" chama onChange com -7 dias', () => {
    const onChange = vi.fn();
    const date = new Date(2026, 0, 15);
    render(<SanctorumDateNav value={date} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Semana anterior'));
    expect((onChange.mock.calls[0][0] as Date).getDate()).toBe(8);
  });

  it('"Próxima semana" chama onChange com +7 dias', () => {
    const onChange = vi.fn();
    const date = new Date(2026, 0, 15);
    render(<SanctorumDateNav value={date} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Próxima semana'));
    expect((onChange.mock.calls[0][0] as Date).getDate()).toBe(22);
  });

  it('"Ir para hoje" fica desabilitado quando já é hoje', () => {
    render(<SanctorumDateNav value={new Date()} onChange={() => {}} />);
    const btn = screen.getByLabelText('Ir para hoje');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-current', 'date');
  });

  it('tira horizontal renderiza N dias (default 7) e marca o selecionado', () => {
    const date = new Date(2026, 0, 15);
    render(<SanctorumDateNav value={date} onChange={() => {}} />);
    const pressed = screen.getByRole('button', { pressed: true });
    expect(pressed).toHaveTextContent('15');
  });

  it('respeita stripDays customizado', () => {
    const date = new Date(2026, 0, 15);
    const { container } = render(
      <SanctorumDateNav value={date} onChange={() => {}} stripDays={5} />,
    );
    const strip = container.querySelector('.overflow-x-auto')!;
    expect(strip.querySelectorAll('button').length).toBe(5);
  });
});
