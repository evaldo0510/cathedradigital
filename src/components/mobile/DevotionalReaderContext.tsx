/**
 * DevotionalReaderContext — permite que uma página devocional publique,
 * dinamicamente, um índice de seções e um alvo favoritável na TopBar mobile.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
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
  const [favorite, setFavoriteState] = useState<FavoriteInput | null>(null);

  // Setters estáveis: identidade fixa entre renders para não invalidar
  // useEffect de consumidores (causava loop infinito na Via Sacra ao
  // re-disparar effects cujas deps incluíam setIndex/setFavorite).
  const setIndex = useCallback((title: string, items: DevotionalIndexItem[]) => {
    setIndexTitle(title);
    setIndexItems(items);
  }, []);
  const setFavorite = useCallback((input: FavoriteInput | null) => {
    setFavoriteState(input);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ indexTitle, indexItems, favorite, setIndex, setFavorite }),
    [indexTitle, indexItems, favorite, setIndex, setFavorite],
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
