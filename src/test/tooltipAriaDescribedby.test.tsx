import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Cobre a garantia de acessibilidade das “bolhas” do Explorer:
 * cada trigger, ao focar, precisa expor `aria-describedby` apontando
 * para um elemento com `role="tooltip"` único no DOM.
 */
function Fixture() {
  return (
    <TooltipProvider delayDuration={0} disableHoverableContent>
      <Tooltip>
        <TooltipTrigger>Maria</TooltipTrigger>
        <TooltipContent>Adicionar tema: Maria</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>Fé</TooltipTrigger>
        <TooltipContent>Adicionar tema: Fé</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>Encíclica</TooltipTrigger>
        <TooltipContent>Filtrar por categoria: Encíclica</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

describe('Tooltip acessibilidade — aria-describedby / role=tooltip', () => {
  it('cada trigger focado gera role=tooltip único e aria-describedby coerente', async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    const triggers = [
      { label: 'Maria', tip: 'Adicionar tema: Maria' },
      { label: 'Fé', tip: 'Adicionar tema: Fé' },
      { label: 'Encíclica', tip: 'Filtrar por categoria: Encíclica' },
    ];

    for (const { label, tip } of triggers) {
      const trigger = screen.getByRole('button', { name: label });
      await act(async () => {
        trigger.focus();
      });

      // Exatamente 1 role=tooltip no DOM enquanto um trigger está focado.
      const tips = await screen.findAllByRole('tooltip');
      expect(tips).toHaveLength(1);
      expect(tips[0]).toHaveTextContent(tip);

      // aria-describedby aponta para o id do tooltip visível.
      const describedBy = trigger.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(tips[0].id).toBe(describedBy);

      // Move foco para fora — o tooltip anterior é removido.
      await act(async () => {
        trigger.blur();
      });
      await user.keyboard('{Tab}');
    }
  });

  it('não deixa role=tooltip órfão após blur', async () => {
    render(<Fixture />);
    const trigger = screen.getByRole('button', { name: 'Maria' });

    await act(async () => {
      trigger.focus();
    });
    expect(await screen.findAllByRole('tooltip')).toHaveLength(1);

    await act(async () => {
      trigger.blur();
    });
    // Aguarda o Radix limpar o portal.
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryAllByRole('tooltip')).toHaveLength(0);
  });
});
