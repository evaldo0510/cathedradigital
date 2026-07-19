import { useCallback, useEffect, useRef, useState } from 'react';
import type { Step } from './constants';

export interface LectioProgress {
  passage: string;
  step: Step;
  notes: Record<string, string>;
  seconds: number;
  updatedAt: number;
}

const STORAGE_KEY = 'cathedra:lectio:progress:v1';
const INDEX_KEY = 'cathedra:lectio:index:v1';

interface ProgressStore {
  current: string | null; // passage key of last active
  byPassage: Record<string, LectioProgress>;
}

function readStore(): ProgressStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { current: null, byPassage: {} };
    const parsed = JSON.parse(raw);
    if (!parsed?.byPassage) return { current: null, byPassage: {} };
    return parsed;
  } catch {
    return { current: null, byPassage: {} };
  }
}

function writeStore(store: ProgressStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    localStorage.setItem(INDEX_KEY, String(Date.now()));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function getLectioProgress(passage: string): LectioProgress | null {
  if (!passage) return null;
  const store = readStore();
  return store.byPassage[passage] ?? null;
}

export function getLastLectio(): LectioProgress | null {
  const store = readStore();
  if (!store.current) return null;
  return store.byPassage[store.current] ?? null;
}

export function listLectioProgress(): LectioProgress[] {
  const store = readStore();
  return Object.values(store.byPassage).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function clearLectioProgress(passage: string) {
  const store = readStore();
  delete store.byPassage[passage];
  if (store.current === passage) store.current = null;
  writeStore(store);
}

interface UseLectioProgressOptions {
  passage: string;
  step: Step;
  notes: Record<string, string>;
  seconds: number;
  enabled?: boolean;
}

/**
 * Salva progresso a cada mudança (debounced) e permite hidratar via getLectioProgress.
 * Também escuta o evento 'storage' para sincronizar entre abas.
 */
export function useLectioProgress({
  passage,
  step,
  notes,
  seconds,
  enabled = true,
}: UseLectioProgressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !passage) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const store = readStore();
      store.byPassage[passage] = {
        passage,
        step,
        notes,
        seconds,
        updatedAt: Date.now(),
      };
      store.current = passage;
      writeStore(store);
    }, 400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [passage, step, notes, seconds, enabled]);
}

/** Hook auxiliar para descobrir o "último onde parei" reativamente. */
export function useLastLectio() {
  const [last, setLast] = useState<LectioProgress | null>(() => getLastLectio());
  useEffect(() => {
    const handler = () => setLast(getLastLectio());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  return last;
}

export const LECTIO_STORAGE_KEY = STORAGE_KEY;
export const useSaveLectioNotes = (passage: string) =>
  useCallback(
    (notes: Record<string, string>) => {
      if (!passage) return;
      const store = readStore();
      const prev = store.byPassage[passage];
      store.byPassage[passage] = {
        passage,
        step: prev?.step ?? 'lectio',
        seconds: prev?.seconds ?? 0,
        notes,
        updatedAt: Date.now(),
      };
      store.current = passage;
      writeStore(store);
    },
    [passage],
  );
