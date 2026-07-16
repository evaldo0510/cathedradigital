/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { BIBLE_DATA, BibleBook } from '@/data/bible-books';
import { useBibleNavigation } from '../useBibleNavigation';

const ALL_BOOKS: BibleBook[] = Object.values(BIBLE_DATA)
  .flat()
  .flatMap((cat) => cat.books);

const genesis = ALL_BOOKS.find((b) => b.abbr === 'Gn')!;
const exodus = ALL_BOOKS.find((b) => b.abbr === 'Ex')!;

/** Wrapper que também expõe a location atual para asserções sobre a URL. */
function makeWrapper(initial = '/bible') {
  let currentLocation: ReturnType<typeof useLocation> | null = null;

  const LocationSpy: React.FC = () => {
    currentLocation = useLocation();
    return null;
  };

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MemoryRouter initialEntries={[initial]}>
      <LocationSpy />
      {children}
    </MemoryRouter>
  );

  return {
    Wrapper,
    getSearch: () => currentLocation?.search ?? '',
    getPathname: () => currentLocation?.pathname ?? '',
  };
}

describe('useBibleNavigation', () => {
  beforeEach(() => {
    // MemoryRouter isola histórico entre testes; nada a limpar.
  });

  it('estado inicial derivado da URL vazia = home', () => {
    const { Wrapper } = makeWrapper('/bible');
    const { result } = renderHook(() => useBibleNavigation(), { wrapper: Wrapper });

    expect(result.current.viewMode).toBe('home');
    expect(result.current.selectedBook).toBeNull();
    expect(result.current.selectedChapter).toBe(1);
    expect(result.current.searchQuery).toBe('');
  });

  it('selectBook grava o livro na URL e transiciona para "chapters"', () => {
    const { Wrapper, getSearch } = makeWrapper('/bible');
    const { result } = renderHook(() => useBibleNavigation(), { wrapper: Wrapper });

    act(() => result.current.selectBook(genesis));

    expect(getSearch()).toContain(`book=${encodeURIComponent('Gn')}`);
    expect(result.current.selectedBook?.abbr).toBe('Gn');
    expect(result.current.viewMode).toBe('chapters');
    expect(result.current.selectedChapter).toBe(1);
  });

  it('selectChapter grava ch= na URL e move para "reading"', () => {
    const { Wrapper, getSearch } = makeWrapper(`/bible?book=${encodeURIComponent('Gn')}`);
    const { result } = renderHook(() => useBibleNavigation(), { wrapper: Wrapper });

    act(() => result.current.selectChapter(5));

    expect(getSearch()).toContain('ch=5');
    expect(result.current.selectedChapter).toBe(5);
    expect(result.current.viewMode).toBe('reading');
  });

  it('nextChapter avança o capítulo respeitando o limite superior', () => {
    const { Wrapper } = makeWrapper(`/bible?book=${encodeURIComponent('Gn')}&ch=49`);
    const { result } = renderHook(() => useBibleNavigation(), { wrapper: Wrapper });

    expect(result.current.selectedChapter).toBe(49);

    act(() => result.current.nextChapter());
    expect(result.current.selectedChapter).toBe(genesis.chapters); // 50

    // No-op no último capítulo.
    act(() => result.current.nextChapter());
    expect(result.current.selectedChapter).toBe(genesis.chapters);
  });

  it('prevChapter volta o capítulo respeitando o limite inferior (1)', () => {
    const { Wrapper } = makeWrapper(`/bible?book=${encodeURIComponent('Gn')}&ch=2`);
    const { result } = renderHook(() => useBibleNavigation(), { wrapper: Wrapper });

    expect(result.current.selectedChapter).toBe(2);

    act(() => result.current.prevChapter());
    expect(result.current.selectedChapter).toBe(1);

    // No-op no primeiro capítulo.
    act(() => result.current.prevChapter());
    expect(result.current.selectedChapter).toBe(1);
  });

  it('nextChapter é no-op quando não há livro selecionado', () => {
    const { Wrapper, getSearch } = makeWrapper('/bible');
    const { result } = renderHook(() => useBibleNavigation(), { wrapper: Wrapper });

    act(() => result.current.nextChapter());

    expect(result.current.selectedChapter).toBe(1);
    expect(getSearch()).toBe('');
  });

  it('trocar de livro via selectBook reseta capítulo (ch/v removidos)', () => {
    const { Wrapper, getSearch } = makeWrapper(
      `/bible?book=${encodeURIComponent('Gn')}&ch=10&v=3`,
    );
    const { result } = renderHook(() => useBibleNavigation(), { wrapper: Wrapper });

    act(() => result.current.selectBook(exodus));

    const search = getSearch();
    expect(search).toContain(`book=${encodeURIComponent('Ex')}`);
    expect(search).not.toContain('ch=');
    expect(search).not.toContain('v=');
    expect(result.current.viewMode).toBe('chapters');
    expect(result.current.selectedChapter).toBe(1);
  });

  it('botão Voltar do navegador restaura o estado anterior (URL como fonte de verdade)', () => {
    const { Wrapper, getSearch } = makeWrapper('/bible');
    const { result } = renderHook(() => useBibleNavigation(), { wrapper: Wrapper });

    // Home → chapters (Gn) → reading (Gn 3) → reading (Gn 4)
    act(() => result.current.selectBook(genesis));
    act(() => result.current.selectChapter(3));
    act(() => result.current.nextChapter());

    expect(result.current.selectedChapter).toBe(4);
    expect(result.current.viewMode).toBe('reading');

    // Back: volta para Gn 3
    act(() => {
      window.history.back();
    });
    expect(result.current.selectedChapter).toBe(3);
    expect(getSearch()).toContain('ch=3');
    expect(result.current.viewMode).toBe('reading');

    // Back: volta para chapters (sem ch)
    act(() => {
      window.history.back();
    });
    expect(result.current.viewMode).toBe('chapters');
    expect(result.current.selectedBook?.abbr).toBe('Gn');
    expect(getSearch()).not.toContain('ch=');

    // Back: volta para home
    act(() => {
      window.history.back();
    });
    expect(result.current.viewMode).toBe('home');
    expect(result.current.selectedBook).toBeNull();
  });
});
