/**
 * DevotionalReaderContext — permite que uma página devocional publique,
 * dinamicamente, um índice de seções e um alvo favoritável na TopBar mobile.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { FavoriteInput } from "@/hooks/useDevotionalFavorites";

export interface DevotionalIndexItem {
  id: string;
  label: string;
  hint?: string;
  active?: boolean;
  onSelect: () => void;
}

interface Ctx {
  indexTitle: string | null;
  indexItems: DevotionalIndexItem[];
  favorite: FavoriteInput | null;
  setIndex: (title: string, items: DevotionalIndexItem[]) => void;
  setFavorite: (input: FavoriteInput | null) => void;
}

const DevotionalReaderCtx = createContext<Ctx | null>(null);

export function DevotionalReaderProvider({ children }: { children: ReactNode }) {
  const [indexTitle, setIndexTitle] = useState<string | null>(null);
  const [indexItems, setIndexItems] = useState<DevotionalIndexItem[]>([]);
  const [favorite, setFavorite] = useState<FavoriteInput | null>(null);

  const value = useMemo<Ctx>(
    () => ({
      indexTitle,
      indexItems,
      favorite,
      setIndex: (title, items) => {
        setIndexTitle(title);
        setIndexItems(items);
      },
      setFavorite,
    }),
    [indexTitle, indexItems, favorite],
  );

  return <DevotionalReaderCtx.Provider value={value}>{children}</DevotionalReaderCtx.Provider>;
}

export function useDevotionalReader() {
  const ctx = useContext(DevotionalReaderCtx);
  if (!ctx) {
    // Contexto opcional: se a página está fora do shell, retorna no-ops.
    return {
      indexTitle: null,
      indexItems: [] as DevotionalIndexItem[],
      favorite: null,
      setIndex: () => {},
      setFavorite: () => {},
    } satisfies Ctx;
  }
  return ctx;
}
