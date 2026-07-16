/**
 * useBibleNavigation — Onda 7 (R1.2.2 Fase 2)
 *
 * URL como fonte única de verdade para navegação bíblica.
 * Preserva a API de setters usada em Bible.tsx para minimizar churn de callsites,
 * mas cada setter escreve na URL — nunca em useState.
 *
 * Retrocompat garantida:
 *   /bible                     → home
 *   /bible?book=Jo             → chapters
 *   /bible?book=Jo&ch=6        → reading
 *   /bible?book=Jo&ch=6&v=35   → reading + verso destacado
 *   /bible?view=notes|search|monthly_recap → view especial (novo deep-link opt-in)
 *
 * Sincronização unidirecional: URL → derivados. Setters escrevem URL, React
 * re-renderiza. Não há useEffect state ↔ URL (evita loops).
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BIBLE_DATA, BibleBook } from '@/data/bible-books';

export type BibleViewMode =
  | 'home'
  | 'chapters'
  | 'reading'
  | 'search'
  | 'notes'
  | 'monthly_recap';

const SPECIAL_VIEWS: ReadonlySet<BibleViewMode> = new Set([
  'search',
  'notes',
  'monthly_recap',
]);

const ALL_BOOKS: BibleBook[] = Object.values(BIBLE_DATA)
  .flat()
  .flatMap((cat) => cat.books);

function findBook(rawAbbr: string | null): BibleBook | null {
  if (!rawAbbr) return null;
  const decoded = decodeURIComponent(rawAbbr);
  return (
    ALL_BOOKS.find((b) => b.abbr === decoded || b.name === decoded) ?? null
  );
}

export interface UseBibleNavigation {
  viewMode: BibleViewMode;
  selectedBook: BibleBook | null;
  selectedChapter: number;
  searchQuery: string;
  setViewMode: (mode: BibleViewMode) => void;
  setSelectedBook: (book: BibleBook | null) => void;
  setSelectedChapter: (chapter: number) => void;
  setSearchQuery: (q: string) => void;
  /** Seleciona um livro. Alias semântico de setSelectedBook. */
  selectBook: (book: BibleBook) => void;
  /** Seleciona um capítulo e rola a janela para o topo. */
  selectChapter: (chapter: number) => void;
  /** Avança para o próximo capítulo do livro atual (no-op no último). */
  nextChapter: () => void;
  /** Volta ao capítulo anterior (no-op no primeiro). */
  prevChapter: () => void;
}

export function useBibleNavigation(): UseBibleNavigation {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawView = searchParams.get('view') as BibleViewMode | null;
  const bookParam = searchParams.get('book');
  const chapterParam = searchParams.get('ch');
  const searchQuery = searchParams.get('q') ?? '';

  const selectedBook = useMemo(() => findBook(bookParam), [bookParam]);

  const selectedChapter = useMemo(() => {
    if (!chapterParam) return 1;
    const n = parseInt(chapterParam, 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [chapterParam]);

  const viewMode: BibleViewMode = useMemo(() => {
    if (rawView && SPECIAL_VIEWS.has(rawView)) return rawView;
    if (selectedBook && chapterParam) return 'reading';
    if (selectedBook) return 'chapters';
    return 'home';
  }, [rawView, selectedBook, chapterParam]);

  // Helper to mutate params without stomping siblings.
  const mutate = useCallback(
    (fn: (p: URLSearchParams) => void) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          fn(next);
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const setSelectedBook = useCallback(
    (book: BibleBook | null) => {
      mutate((p) => {
        if (book) {
          p.set('book', encodeURIComponent(book.abbr));
          // Trocar de livro reseta o capítulo (comportamento atual).
          p.delete('ch');
          p.delete('v');
          p.delete('view');
        } else {
          p.delete('book');
          p.delete('ch');
          p.delete('v');
        }
      });
    },
    [mutate],
  );

  const setSelectedChapter = useCallback(
    (chapter: number) => {
      mutate((p) => {
        p.set('ch', String(chapter));
        p.delete('v');
        p.delete('view');
      });
    },
    [mutate],
  );

  const setViewMode = useCallback(
    (mode: BibleViewMode) => {
      mutate((p) => {
        if (mode === 'home') {
          p.delete('view');
          p.delete('book');
          p.delete('ch');
          p.delete('v');
          p.delete('q');
        } else if (mode === 'chapters') {
          // Requer book já presente na URL (callsites atuais garantem isso).
          p.delete('view');
          p.delete('ch');
          p.delete('v');
        } else if (mode === 'reading') {
          // Requer book+ch já presentes na URL.
          p.delete('view');
        } else {
          // search | notes | monthly_recap
          p.set('view', mode);
        }
      });
    },
    [mutate],
  );

  const setSearchQuery = useCallback(
    (q: string) => {
      mutate((p) => {
        if (q) p.set('q', q);
        else p.delete('q');
      });
    },
    [mutate],
  );

  const selectBook = useCallback(
    (book: BibleBook) => setSelectedBook(book),
    [setSelectedBook],
  );

  const selectChapter = useCallback(
    (chapter: number) => {
      setSelectedChapter(chapter);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    },
    [setSelectedChapter],
  );

  const nextChapter = useCallback(() => {
    if (!selectedBook) return;
    if (selectedChapter < selectedBook.chapters) {
      selectChapter(selectedChapter + 1);
    }
  }, [selectedBook, selectedChapter, selectChapter]);

  const prevChapter = useCallback(() => {
    if (selectedChapter > 1) {
      selectChapter(selectedChapter - 1);
    }
  }, [selectedChapter, selectChapter]);

  return {
    viewMode,
    selectedBook,
    selectedChapter,
    searchQuery,
    setViewMode,
    setSelectedBook,
    setSelectedChapter,
    setSearchQuery,
    selectBook,
    selectChapter,
    nextChapter,
    prevChapter,
  };
}
