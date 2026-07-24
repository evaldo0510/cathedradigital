/**
 * Sprint B.1 · Onda B.1.3 — Histórico local da Biblioteca.
 *
 * Guarda em `localStorage`:
 *   - `library:recent-searches`  → últimas buscas (max 8)
 *   - `library:recent-opens`     → últimos itens abertos (max 12)
 *
 * Sem tabela nova por design (princípio de simplicidade). Migração para
 * Supabase acontece na Sprint B.1.5 (recomendações personalizadas).
 */
import { useCallback, useEffect, useState } from 'react';
import type { LibraryModule } from '../types';

const KEY_SEARCHES = 'library:recent-searches';
const KEY_OPENS = 'library:recent-opens';
const MAX_SEARCHES = 8;
const MAX_OPENS = 12;

export interface RecentOpen {
  type: LibraryModule;
  title: string;
  href: string;
  openedAt: string;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode → ignorar */
  }
}

export function useSearchHistory() {
  const [searches, setSearches] = useState<string[]>([]);
  const [opens, setOpens] = useState<RecentOpen[]>([]);

  useEffect(() => {
    setSearches(readJSON<string[]>(KEY_SEARCHES, []));
    setOpens(readJSON<RecentOpen[]>(KEY_OPENS, []));
  }, []);

  const rememberSearch = useCallback((raw: string) => {
    const q = raw.trim();
    if (q.length < 2) return;
    setSearches((prev) => {
      const next = [q, ...prev.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, MAX_SEARCHES);
      writeJSON(KEY_SEARCHES, next);
      return next;
    });
  }, []);

  const rememberOpen = useCallback((entry: Omit<RecentOpen, 'openedAt'>) => {
    setOpens((prev) => {
      const next = [
        { ...entry, openedAt: new Date().toISOString() },
        ...prev.filter((o) => o.href !== entry.href),
      ].slice(0, MAX_OPENS);
      writeJSON(KEY_OPENS, next);
      return next;
    });
  }, []);

  const clearSearches = useCallback(() => {
    setSearches([]);
    writeJSON(KEY_SEARCHES, []);
  }, []);

  return { searches, opens, rememberSearch, rememberOpen, clearSearches };
}
