import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TheologicalText from '@/components/cathedra/TheologicalText';

vi.mock('@/lib/theologicalRefParser', async () => {
  const actual = await vi.importActual<any>('@/lib/theologicalRefParser');
  return {
    ...actual,
    parseTheologicalReferences: vi.fn((t: string) => {
      if (t.includes('__BOOM__')) throw new Error('parser crash');
      return actual.parseTheologicalReferences(t);
    }),
  };
});

vi.mock('@/hooks/useCatechismParagraph', () => ({
  useCatechismParagraph: () => ({ data: null, isLoading: false, isFetched: false, error: null }),
}));

const wrap = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('TheologicalText', () => {
  it('renderiza §2053 (nunca §§) como botão de popover', () => {
    wrap(<TheologicalText text="Conforme CIC §§2053 vemos isso." />);
    // O botão do popover deve mostrar exatamente §2053
    expect(screen.getByRole('button', { name: '§2053' })).toBeInTheDocument();
    // Não deve existir nenhum nó com §§ em qualquer lugar
    expect(document.body.textContent || '').not.toMatch(/§§/);
  });

  it('cai para texto cru quando o parser lança erro (fallback seguro)', () => {
    const { container } = wrap(<TheologicalText text="conteúdo __BOOM__ qualquer" />);
    const fallback = container.querySelector('[data-fallback="parser-error"]');
    expect(fallback).not.toBeNull();
    expect(fallback?.textContent).toBe('conteúdo __BOOM__ qualquer');
  });
});
