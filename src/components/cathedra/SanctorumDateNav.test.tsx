import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

  describe('pills cabem no mobile (largura fixa 56px)', () => {
    it('abreviação do dia da semana tem no máximo 3 caracteres (sem estourar 56px)', () => {
      const date = new Date(2026, 0, 15); // qui — cobre dom..sáb na tira de 7
      const { container } = render(
        <SanctorumDateNav value={date} onChange={() => {}} />,
      );
      const strip = container.querySelector('.overflow-x-auto')!;
      const pills = strip.querySelectorAll('button');
      const nomesCompletos = /segunda|terça|quarta|quinta|sexta|sábado|domingo/i;

      pills.forEach((pill) => {
        const abbr = pill.querySelector('span')!.textContent!.trim();
        expect(abbr.length).toBeLessThanOrEqual(3);
        expect(abbr).not.toMatch(nomesCompletos);
      });
    });

    it('cada pill mantém min-width de 56px e layout em coluna (abreviação + dia)', () => {
      const date = new Date(2026, 0, 15);
      const { container } = render(
        <SanctorumDateNav value={date} onChange={() => {}} />,
      );
      const strip = container.querySelector('.overflow-x-auto')!;
      const pills = strip.querySelectorAll('button');

      expect(pills.length).toBe(7);
      pills.forEach((pill) => {
        expect(pill.className).toContain('min-w-[56px]');
        expect(pill.className).toContain('flex-col');
        const spans = pill.querySelectorAll('span');
        expect(spans.length).toBe(2);
        expect(spans[1].textContent).toMatch(/^\d{2}$/);
      });
    });

    it('tira permite scroll horizontal e não quebra em várias linhas no mobile', () => {
      const date = new Date(2026, 0, 15);
      const { container } = render(
        <SanctorumDateNav value={date} onChange={() => {}} />,
      );
      const strip = container.querySelector('.overflow-x-auto')!;
      expect(strip.className).toContain('overflow-x-auto');
      expect(strip.className).toContain('max-w-full');
      expect(strip.className).not.toContain('flex-wrap');
    });

    it('pills usam shrink-0 + whitespace-nowrap + max-w-[64px] como fallback de layout', () => {
      const date = new Date(2026, 0, 15);
      const { container } = render(
        <SanctorumDateNav value={date} onChange={() => {}} />,
      );
      const pills = container.querySelector('.overflow-x-auto')!.querySelectorAll('button');
      pills.forEach((pill) => {
        expect(pill.className).toContain('shrink-0');
        expect(pill.className).toContain('whitespace-nowrap');
        expect(pill.className).toContain('max-w-[64px]');
        const abbr = pill.querySelector('span')!;
        expect(abbr.className).toContain('truncate');
        expect(abbr.className).toContain('max-w-[3ch]');
      });
    });
  });

  describe('format pt-BR retorna siglas curtas de dia da semana', () => {
    const casos: Array<[Date, string]> = [
      [new Date(2026, 0, 18), 'dom'], // domingo
      [new Date(2026, 0, 19), 'seg'], // segunda
      [new Date(2026, 0, 20), 'ter'], // terça
      [new Date(2026, 0, 21), 'qua'], // quarta
      [new Date(2026, 0, 22), 'qui'], // quinta
      [new Date(2026, 0, 23), 'sex'], // sexta
      [new Date(2026, 0, 24), 'sab'], // sábado (date-fns retorna sem acento)
    ];

    casos.forEach(([date, esperado]) => {
      it(`format(${date.toDateString()}, 'EEEEEE') → "${esperado}"`, () => {
        const abbr = format(date, 'EEEEEE', { locale: ptBR }).replace('.', '').toLowerCase();
        expect(abbr).toBe(esperado);
        expect(abbr.length).toBeLessThanOrEqual(3);
      });
    });

    it('EEEEEE nunca retorna o nome completo do dia', () => {
      const nomesCompletos = /^(segunda|terça|quarta|quinta|sexta|sábado|domingo)/i;
      const base = new Date(2026, 0, 18);
      for (let i = 0; i < 7; i++) {
        const abbr = format(addDays(base, i), 'EEEEEE', { locale: ptBR });
        expect(abbr).not.toMatch(nomesCompletos);
      }
    });

    it('componente renderiza as 7 siglas curtas na tira', () => {
      const { container } = render(
        <SanctorumDateNav value={new Date(2026, 0, 21)} onChange={() => {}} />,
      );
      const strip = container.querySelector('.overflow-x-auto')!;
      const abbrs = Array.from(strip.querySelectorAll('button > span:first-child')).map((s) =>
        s.textContent!.trim().toLowerCase(),
      );
      const validas = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'sáb'];
      abbrs.forEach((a) => expect(validas).toContain(a));
    });
  });

  describe('rolagem e ordenação dos pills', () => {
    it('pills permanecem na ordem cronológica após simular scroll horizontal', () => {
      const date = new Date(2026, 0, 15); // qui
      const { container } = render(
        <SanctorumDateNav value={date} onChange={() => {}} />,
      );
      const strip = container.querySelector('.overflow-x-auto') as HTMLElement;
      const pills = Array.from(strip.querySelectorAll('button'));

      const diasAntes = pills.map((p) => Number(p.querySelectorAll('span')[1].textContent));
      // stripDays=7, half=3 → 12,13,14,15,16,17,18
      expect(diasAntes).toEqual([12, 13, 14, 15, 16, 17, 18]);

      // simula scroll horizontal manual
      strip.scrollLeft = 200;
      strip.dispatchEvent(new Event('scroll'));

      const diasDepois = Array.from(strip.querySelectorAll('button')).map((p) =>
        Number(p.querySelectorAll('span')[1].textContent),
      );
      expect(diasDepois).toEqual(diasAntes); // ordem preservada
      expect(strip.className).not.toContain('flex-wrap');
    });
  });

  describe('modo RTL', () => {
    it('mantém overflow-x-auto e min-w dos pills quando dir="rtl"', () => {
      const date = new Date(2026, 0, 15);
      const { container } = render(
        <div dir="rtl">
          <SanctorumDateNav value={date} onChange={() => {}} />
        </div>,
      );
      const strip = container.querySelector('.overflow-x-auto') as HTMLElement;
      expect(strip.className).toContain('overflow-x-auto');
      expect(strip.className).not.toContain('flex-wrap');

      // dir herdado deve ser rtl
      expect(strip.closest('[dir="rtl"]')).not.toBeNull();

      const pills = strip.querySelectorAll('button');
      expect(pills.length).toBe(7);
      pills.forEach((pill) => {
        expect(pill.className).toContain('min-w-[56px]');
        expect(pill.className).toContain('max-w-[64px]');
        expect(pill.className).toContain('shrink-0');
      });
    });
  });

  describe('zoom / Dynamic Type', () => {
    const zooms = [1.25, 1.5, 2.0];

    zooms.forEach((zoom) => {
      it(`pills mantêm max-w-[64px] e truncate com zoom ${zoom}x`, () => {
        const date = new Date(2026, 0, 15);
        const { container } = render(
          <div style={{ fontSize: `${16 * zoom}px` }}>
            <SanctorumDateNav value={date} onChange={() => {}} />
          </div>,
        );
        const strip = container.querySelector('.overflow-x-auto') as HTMLElement;
        const pills = strip.querySelectorAll('button');

        pills.forEach((pill) => {
          // limites de largura sobrevivem ao zoom
          expect(pill.className).toContain('max-w-[64px]');
          expect(pill.className).toContain('shrink-0');
          const abbr = pill.querySelector('span')!;
          expect(abbr.className).toContain('truncate');
          expect(abbr.className).toContain('max-w-[3ch]');
        });

        // container ainda permite scroll horizontal (não vira flex-wrap)
        expect(strip.className).toContain('overflow-x-auto');
        expect(strip.className).not.toContain('flex-wrap');
      });
    });
  });
});
