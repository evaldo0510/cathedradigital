import { describe, it, expect } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/**
 * Cobre a garantia de acessibilidade das “bolhas” do Explorer após a
 * migração de Tooltip → Popover (bolha ancorada no clique):
 *  - trigger expõe `aria-expanded` e `aria-controls`
 *  - conteúdo aberto é único no DOM (sem duplicação)
 *  - `aria-controls` aponta para o id do PopoverContent visível
 *  - nenhum `role="tooltip"` é gerado por essas bolhas
 */
function Bubble({
  label,
  kind,
  content,
}: {
  label: string;
  kind: string;
  content: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>{label}</PopoverTrigger>
      <PopoverContent
        role="status"
        data-tip-kind={kind}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}

function Fixture() {
  return (
    <>
      <Bubble label="Maria" kind="theme" content="Adicionar tema: Maria" />
      <Bubble label="Fé" kind="theme" content="Adicionar tema: Fé" />
      <Bubble
        label="Encíclica"
        kind="category"
        content="Filtrar por categoria: Encíclica"
      />
    </>
  );
}

describe('Bolhas (Popover) — acessibilidade e ausência de duplicação', () => {
  it('clique abre bolha única, aria-controls coerente e sem role=tooltip', async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    const triggers = [
      { label: 'Maria', content: 'Adicionar tema: Maria', kind: 'theme' },
      { label: 'Fé', content: 'Adicionar tema: Fé', kind: 'theme' },
      { label: 'Encíclica', content: 'Filtrar por categoria: Encíclica', kind: 'category' },
    ];

    for (const { label, content, kind } of triggers) {
      const trigger = screen.getByRole('button', { name: label });

      // Antes do clique: nenhuma bolha aberta para este trigger.
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText(content)).toBeNull();

      await user.click(trigger);

      // Exatamente 1 bolha do tipo esperado.
      const bubbles = document.querySelectorAll(`[data-tip-kind="${kind}"]`);
      const visible = Array.from(bubbles).filter((el) => el.textContent?.includes(content));
      expect(visible).toHaveLength(1);

      // aria-controls aponta para o id do PopoverContent visível.
      const controlsId = trigger.getAttribute('aria-controls');
      expect(controlsId).toBeTruthy();
      const controlled = document.getElementById(controlsId!);
      expect(controlled).not.toBeNull();
      expect(controlled).toHaveTextContent(content);

      // Nenhuma bolha de qualquer trigger renderiza role=tooltip.
      expect(document.querySelectorAll('[role="tooltip"]').length).toBe(0);

      // Fecha antes de próxima iteração para não somar bolhas abertas.
      await act(async () => {
        await user.keyboard('{Escape}');
      });
      await waitFor(() =>
        expect(trigger).toHaveAttribute('aria-expanded', 'false'),
      );
    }
  });

  it('foco sozinho (Tab) NÃO abre a bolha; somente clique/Enter/Espaço abre', async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    const trigger = screen.getByRole('button', { name: 'Maria' });

    await act(async () => {
      trigger.focus();
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Adicionar tema: Maria')).toBeNull();

    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(trigger).toHaveAttribute('aria-expanded', 'true'),
    );
    expect(screen.getByText('Adicionar tema: Maria')).toBeInTheDocument();

    // Sem role=tooltip órfão.
    expect(document.querySelectorAll('[role="tooltip"]').length).toBe(0);
  });
});
