/**
 * MysteryContinuation — testes unitários.
 *
 * Garante que:
 *  1) Cada link declarado no mistério vira um <a href> renderizado.
 *  2) O clique em um link dispara onCtaClick com o href/kind corretos.
 *  3) O ReaderContinuation recebe o contexto do mistério (themeIds + id).
 *  4) Os dados de MYSTERY_SETS apontam apenas para rotas conhecidas
 *     (/bible, /catechism, /saints, /jornadas), evitando 404 por link.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock do ReaderContinuation para isolar o componente sob teste
// (evita depender do KnowledgeGraph nas asserções).
vi.mock('@/components/shared/ReaderContinuation', () => ({
  ReaderContinuation: ({ context, onCtaClick }: any) => (
    <div
      data-testid="reader-continuation-mock"
      data-kind={context.kind}
      data-id={context.id}
      data-themes={(context.themeIds ?? []).join(',')}
      onClick={() =>
        onCtaClick?.({ label: 'mock-cta', href: '/mock', kind: 'mock' })
      }
    />
  ),
}));

import { MysteryContinuation } from '../RosarySession';
import { MYSTERY_SETS, type Mystery, type MysterySet } from '../mysteries';

function renderMystery(mystery: Mystery, setKey: MysterySet, onCtaClick = vi.fn()) {
  render(
    <MemoryRouter>
      <MysteryContinuation mystery={mystery} setKey={setKey} onCtaClick={onCtaClick} />
    </MemoryRouter>,
  );
  return onCtaClick;
}

beforeEach(() => cleanup());

describe('MysteryContinuation', () => {
  const first = MYSTERY_SETS.joyful.mysteries[0];

  it('renderiza um <a> para cada link do mistério com href correto', () => {
    renderMystery(first, 'joyful');
    for (const link of first.links) {
      const el = screen.getByRole('link', { name: new RegExp(link.label, 'i') });
      expect(el).toBeInTheDocument();
      expect(el).toHaveAttribute('href', link.href);
    }
  });

  it('mostra o eyebrow (ou kind) de cada link', () => {
    renderMystery(first, 'joyful');
    for (const link of first.links) {
      const label = (link.eyebrow ?? link.kind).toString();
      expect(screen.getAllByText(new RegExp(label, 'i')).length).toBeGreaterThan(0);
    }
  });

  it('dispara onCtaClick com href/kind ao clicar em um link', () => {
    const onCta = renderMystery(first, 'joyful');
    const link = first.links[0];
    fireEvent.click(screen.getByRole('link', { name: new RegExp(link.label, 'i') }));
    expect(onCta).toHaveBeenCalledWith({
      label: link.label,
      href: link.href,
      kind: `rosary-link:${link.kind}`,
    });
  });

  it('passa themeIds e id contextualizado ao ReaderContinuation', () => {
    renderMystery(first, 'joyful');
    const mock = screen.getByTestId('reader-continuation-mock');
    expect(mock.getAttribute('data-id')).toBe(`rosary:joyful:${first.id}`);
    expect(mock.getAttribute('data-themes')).toBe((first.themeIds ?? []).join(','));
    expect(mock.getAttribute('data-kind')).toBe('prayer');
  });

  it('encaminha cliques do ReaderContinuation com kind prefixado', () => {
    const onCta = renderMystery(first, 'joyful');
    fireEvent.click(screen.getByTestId('reader-continuation-mock'));
    expect(onCta).toHaveBeenCalledWith(
      expect.objectContaining({ kind: `reader-continuation:${first.id}` }),
    );
  });

  it('anuncia o mistério no aria-label da seção', () => {
    renderMystery(first, 'joyful');
    expect(
      screen.getByRole('region', {
        name: new RegExp(`Aprofundar o mistério ${first.title}`, 'i'),
      }),
    ).toBeInTheDocument();
  });
});

describe('MYSTERY_SETS · integridade dos links de continuação', () => {
  const ALLOWED_PREFIXES = ['/bible', '/catechism', '/saints', '/jornadas', '/glossario', '/n'];

  it('todos os links de todos os mistérios apontam para rotas conhecidas', () => {
    for (const set of Object.values(MYSTERY_SETS)) {
      for (const mystery of set.mysteries) {
        for (const link of mystery.links) {
          const ok = ALLOWED_PREFIXES.some((p) => link.href.startsWith(p));
          expect(
            ok,
            `Mistério "${mystery.id}" tem link fora do registry: ${link.href}`,
          ).toBe(true);
        }
      }
    }
  });

  it('cada mistério possui ao menos um link de continuação', () => {
    for (const set of Object.values(MYSTERY_SETS)) {
      for (const mystery of set.mysteries) {
        expect(
          mystery.links.length,
          `Mistério "${mystery.id}" está sem continuação.`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('links do tipo "catechism" apontam para /catechism?p=NNN', () => {
    for (const set of Object.values(MYSTERY_SETS)) {
      for (const mystery of set.mysteries) {
        for (const link of mystery.links.filter((l) => l.kind === 'catechism')) {
          expect(link.href).toMatch(/^\/catechism\?p=\d+/);
        }
      }
    }
  });

  it('links do tipo "bible" apontam para /bible?book=...&chapter=N', () => {
    for (const set of Object.values(MYSTERY_SETS)) {
      for (const mystery of set.mysteries) {
        for (const link of mystery.links.filter((l) => l.kind === 'bible')) {
          expect(link.href).toMatch(/^\/bible\?book=[^&]+&chapter=\d+/);
        }
      }
    }
  });
});
