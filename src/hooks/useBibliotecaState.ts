import { useCallback, useEffect, useState } from 'react';

/**
 * Estado persistido da Biblioteca — busca, filtro axial e aba.
 * Nunca reflete na URL: mantém a Biblioteca como ambiente único
 * (o usuário volta e encontra tudo como deixou).
 */

export type BibliotecaTab =
  | 'pesquisar'
  | 'temas'
  | 'escritos'
  | 'autores'
  | 'colecoes'
  | 'favoritos'
  | 'recentes';

export type AxisFilter = 'tema' | 'pessoa' | 'documento' | 'periodo' | 'fonte' | null;

const STATE_KEY = 'cathedra:biblioteca:state:v1';
const RECENTS_KEY = 'cathedra:biblioteca:recents:v1';
const RECENTS_MAX = 12;

export interface RecentEntry {
  id: string;
  title: string;
  subtitle?: string;
  path: string;
  visitedAt: string;
}

interface PersistedState {
  query: string;
  axis: AxisFilter;
  tab: BibliotecaTab;
}

const defaultState: PersistedState = {
  query: '',
  axis: null,
  tab: 'escritos',
};

function readState(): PersistedState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
}

function writeState(state: PersistedState) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    /* storage cheio ou desativado — silencioso */
  }
}

export function useBibliotecaState() {
  const [state, setState] = useState<PersistedState>(readState);

  useEffect(() => {
    writeState(state);
  }, [state]);

  const setQuery = useCallback(
    (query: string) => setState((s) => ({ ...s, query })),
    [],
  );
  const setAxis = useCallback(
    (axis: AxisFilter) => setState((s) => ({ ...s, axis: s.axis === axis ? null : axis })),
    [],
  );
  const setTab = useCallback(
    (tab: BibliotecaTab) => setState((s) => ({ ...s, tab })),
    [],
  );
  const reset = useCallback(() => setState(defaultState), []);

  return { ...state, setQuery, setAxis, setTab, reset };
}

/* -------------------- Recentes -------------------- */

function readRecents(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeRecents(list: RecentEntry[]) {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list));
  } catch {
    /* silencioso */
  }
}

export function useBibliotecaRecents() {
  const [recents, setRecents] = useState<RecentEntry[]>(readRecents);

  const pushRecent = useCallback((entry: Omit<RecentEntry, 'visitedAt'>) => {
    setRecents((prev) => {
      const filtered = prev.filter((r) => r.id !== entry.id);
      const next: RecentEntry[] = [
        { ...entry, visitedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, RECENTS_MAX);
      writeRecents(next);
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    writeRecents([]);
    setRecents([]);
  }, []);

  const removeRecent = useCallback((id: string) => {
    setRecents((prev) => {
      const next = prev.filter((r) => r.id !== id);
      writeRecents(next);
      return next;
    });
  }, []);

  return { recents, pushRecent, clearRecents, removeRecent };
}
