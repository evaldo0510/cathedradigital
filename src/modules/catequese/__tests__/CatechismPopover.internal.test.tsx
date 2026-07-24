import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CatechismPopover from './CatechismPopover';

vi.mock('@/hooks/useCatechismParagraph', () => ({
  useCatechismParagraph: () => ({
    data: { content: '', status: 'empty' },
    isLoading: false,
    isFetched: true,
    error: null,
  }),
}));

function renderPopover(paragraph: number) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <CatechismPopover paragraph={paragraph} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CatechismPopover — fallback interno', () => {
  it('link fallback aponta para /catechism?p=N (rota interna do Cathedra)', async () => {
    renderPopover(123);
    // Popover renderiza trigger; abrimos pelo click.
    const trigger = screen.getByRole('button', { name: /§123/ });
    trigger.click();
    const link = await screen.findByTestId('catechism-open-internal');
    expect(link.getAttribute('href')).toBe('/catechism?p=123');
    expect(link.getAttribute('target')).not.toBe('_blank');
  });

  it('nunca renderiza link com target="_blank" nem href absoluto', async () => {
    renderPopover(999);
    screen.getByRole('button', { name: /§999/ }).click();
    const link = await screen.findByTestId('catechism-open-internal');
    expect(link.getAttribute('href') || '').not.toMatch(/^https?:/);
    // Nenhum elemento no popover deve escapar do app.
    const externalAnchors = document.querySelectorAll('a[target="_blank"]');
    expect(externalAnchors.length).toBe(0);
  });
});
