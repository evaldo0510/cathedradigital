/**
 * usePrayerAutoAdvance — timer opcional que dispara `onAdvance` a cada
 * `intervalMs`. Usado pelo Modo Automático dos leitores de oração
 * (Rosário, Via Sacra, Liturgia das Horas, Ladainhas, Missal, Orações).
 *
 * Não altera conteúdo: é puramente experiência. O timer reinicia quando
 * `key` muda (ex.: novo bloco) para garantir contagem correta.
 */
import { useEffect, useRef } from 'react';

interface Options {
  enabled: boolean;
  intervalMs: number;
  onAdvance: () => void;
  /** Muda para reiniciar o timer (ex.: índice do bloco atual). */
  key: string | number;
}

export function usePrayerAutoAdvance({ enabled, intervalMs, onAdvance, key }: Options) {
  const cbRef = useRef(onAdvance);
  cbRef.current = onAdvance;

  useEffect(() => {
    if (!enabled) return;
    const safe = Math.max(2000, intervalMs | 0);
    const id = window.setInterval(() => cbRef.current(), safe);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs, key]);
}
