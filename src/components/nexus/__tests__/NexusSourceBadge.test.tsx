/**
 * NexusSourceBadge — acessibilidade do tooltip.
 *
 * Cobre o contrato do componente:
 *   1. Foco por teclado (Tab) abre o tooltip.
 *   2. Enter/Espaço mantêm o tooltip aberto no gatilho.
 *   3. Esc fecha o tooltip.
 *   4. aria-label descreve tipo (kind) e id.
 */
import * as React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NexusSourceBadge } from '../NexusSourceBadge';
import { TooltipProvider } from '@/components/ui/tooltip';

const node = {
  id: 'catechism:1997',
  kind: 'catechism' as const,
  slug: '1997',
  title: 'A graça é uma participação na vida de Deus',
};

function renderBadge(props?: { sectionLabel?: string }) {
  return render(
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <NexusSourceBadge node={node as never} sectionLabel={props?.sectionLabel} />
    </TooltipProvider>,
  );
}

describe('NexusSourceBadge — a11y do tooltip', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('aria-label inclui kind e id', () => {
    renderBadge();
    const trigger = screen.getByRole('button');
    expect(trigger).toHaveAttribute(
      'aria-label',
      expect.stringContaining('tipo catechism'),
    );
    expect(trigger.getAttribute('aria-label')).toContain('id catechism:1997');
  });

  it('abre o tooltip ao receber foco pelo teclado (Tab)', async () => {
    const user = userEvent.setup();
    renderBadge();
    const trigger = screen.getByRole('button');

    await user.tab();
    expect(trigger).toHaveFocus();

    await waitFor(() => {
      expect(trigger.getAttribute('data-state')).toMatch(/open/);
    });
  });

  it('mantém o tooltip aberto após Enter e Espaço no gatilho', async () => {
    const user = userEvent.setup();
    renderBadge();
    const trigger = screen.getByRole('button');
    await user.tab();
    await waitFor(() => expect(trigger.getAttribute('data-state')).toMatch(/open/));

    await user.keyboard('{Enter}');
    expect(trigger.getAttribute('data-state')).toMatch(/open/);

    await user.keyboard(' ');
    expect(trigger.getAttribute('data-state')).toMatch(/open/);
  });

  it('fecha o tooltip ao pressionar Esc', async () => {
    const user = userEvent.setup();
    renderBadge();
    const trigger = screen.getByRole('button');
    await user.tab();
    await waitFor(() => expect(trigger.getAttribute('data-state')).toMatch(/open/));

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(trigger.getAttribute('data-state')).toBe('closed');
    });
  });
});
