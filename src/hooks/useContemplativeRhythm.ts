/**
 * useContemplativeRhythm — preferências de ritmo do usuário no modo de oração.
 *
 * Persiste em `localStorage` sob a chave `cathedra.prayer.rhythm` e expõe
 * uma API reativa (mudanças em uma aba refletem em outras via `storage`
 * event). Todos os valores são globais ao módulo Oração.
 *
 * Campos:
 *   - `pauseMs`    — delay perceptivo antes do próximo bloco aparecer.
 *   - `silenceSec` — duração padrão do timer de silêncio (Contemple).
 *   - `fadeMs`     — velocidade da transição fade entre blocos.
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';

export interface ContemplativeRhythm {
  pauseMs: number;
  silenceSec: number;
  fadeMs: number;
}

export const DEFAULT_RHYTHM: ContemplativeRhythm = {
  pauseMs: 500,
  silenceSec: 15,
  fadeMs: 500,
};

export const RHYTHM_BOUNDS = {
  pauseMs: { min: 0, max: 5000, step: 100 },
  silenceSec: { min: 0, max: 60, step: 5 },
  fadeMs: { min: 150, max: 1000, step: 50 },
} as const;

const STORAGE_KEY = 'cathedra.prayer.rhythm';
const CHANGE_EVENT = 'cathedra:rhythm-change';

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function sanitize(raw: Partial<ContemplativeRhythm> | null | undefined): ContemplativeRhythm {
  const src = raw ?? {};
  return {
    pauseMs: clamp(
      Number.isFinite(src.pauseMs) ? Number(src.pauseMs) : DEFAULT_RHYTHM.pauseMs,
      RHYTHM_BOUNDS.pauseMs.min,
      RHYTHM_BOUNDS.pauseMs.max,
    ),
    silenceSec: clamp(
      Number.isFinite(src.silenceSec) ? Number(src.silenceSec) : DEFAULT_RHYTHM.silenceSec,
      RHYTHM_BOUNDS.silenceSec.min,
      RHYTHM_BOUNDS.silenceSec.max,
    ),
    fadeMs: clamp(
      Number.isFinite(src.fadeMs) ? Number(src.fadeMs) : DEFAULT_RHYTHM.fadeMs,
      RHYTHM_BOUNDS.fadeMs.min,
      RHYTHM_BOUNDS.fadeMs.max,
    ),
  };
}

function read(): ContemplativeRhythm {
  if (typeof window === 'undefined') return DEFAULT_RHYTHM;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RHYTHM;
    return sanitize(JSON.parse(raw));
  } catch {
    return DEFAULT_RHYTHM;
  }
}

function subscribe(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, cb as EventListener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE_EVENT, cb as EventListener);
  };
}

let cachedSnapshot: ContemplativeRhythm | null = null;
function getSnapshot(): ContemplativeRhythm {
  if (!cachedSnapshot) cachedSnapshot = read();
  return cachedSnapshot;
}
function invalidate() {
  cachedSnapshot = read();
}

export interface UseContemplativeRhythm {
  rhythm: ContemplativeRhythm;
  setRhythm: (patch: Partial<ContemplativeRhythm>) => void;
  reset: () => void;
}

export function useContemplativeRhythm(): UseContemplativeRhythm {
  // Reactivity via useSyncExternalStore para partilhar estado entre todos os
  // componentes que consomem o ritmo (Dialog, Reader, Contemplation, Timer).
  useEffect(() => {
    // garante snapshot inicial sincronizado após mount (evita SSR mismatch)
    invalidate();
  }, []);

  const rhythm = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_RHYTHM);

  const setRhythm = useCallback((patch: Partial<ContemplativeRhythm>) => {
    if (typeof window === 'undefined') return;
    const next = sanitize({ ...read(), ...patch });
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* silent */
    }
    invalidate();
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const reset = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RHYTHM));
    } catch {
      /* silent */
    }
    invalidate();
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { rhythm, setRhythm, reset };
}
