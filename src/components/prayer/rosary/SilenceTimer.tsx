/**
 * SilenceTimer — temporizador opcional de silêncio guiado.
 * Duração persiste em localStorage. Animação minimalista (respiração).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const OPTIONS: Array<{ value: 0 | 10 | 20 | 30; label: string }> = [
  { value: 0, label: 'Sem silêncio' },
  { value: 10, label: '10 s' },
  { value: 20, label: '20 s' },
  { value: 30, label: '30 s' },
];

const STORAGE_KEY = 'cathedra:rosary:silence-duration';

function readStoredDuration(fallback: 0 | 10 | 20 | 30): 0 | 10 | 20 | 30 {
  try {
    const v = Number(localStorage.getItem(STORAGE_KEY));
    if ([0, 10, 20, 30].includes(v)) return v as 0 | 10 | 20 | 30;
  } catch { /* silent */ }
  return fallback;
}

interface Props {
  suggestedSeconds?: 0 | 10 | 20 | 30;
  /**
   * Sobrescreve completamente a duração (ignora presets e localStorage local).
   * Usado quando o ritmo contemplativo global controla o valor.
   */
  forcedSeconds?: number;
}

const SilenceTimer: React.FC<Props> = ({ suggestedSeconds = 20, forcedSeconds }) => {
  const isForced = typeof forcedSeconds === 'number';
  const [stored, setStored] = useState<0 | 10 | 20 | 30>(() =>
    readStoredDuration(suggestedSeconds),
  );
  const duration = isForced ? Math.max(0, Math.round(forcedSeconds!)) : stored;
  const setDuration = (v: 0 | 10 | 20 | 30) => setStored(v);
  const [remaining, setRemaining] = useState<number>(duration);
  const [running, setRunning] = useState(false);
  const rafRef = useRef<number | null>(null);
  const endAtRef = useRef<number>(0);

  useEffect(() => {
    if (!isForced) {
      try { localStorage.setItem(STORAGE_KEY, String(stored)); } catch { /* silent */ }
    }
    setRemaining(duration);
    setRunning(false);
  }, [duration, stored, isForced]);

  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      const rem = Math.max(0, Math.ceil((endAtRef.current - performance.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) {
        setRunning(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  if (duration === 0) {
    if (isForced) {
      return (
        <p className="my-6 text-center font-stitch-body text-[10px] font-bold uppercase tracking-[0.24em] text-stitch-on-surface-variant/70">
          Silêncio guiado desativado no ritmo contemplativo
        </p>
      );
    }
    return (
      <div className="my-6 flex flex-wrap items-center justify-center gap-2">
        <span className="font-stitch-body text-[10px] font-bold uppercase tracking-[0.24em] text-stitch-on-surface-variant">
          Silêncio guiado
        </span>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDuration(opt.value)}
            className={cn(
              'rounded-full border px-3 py-1 font-stitch-body text-xs transition',
              opt.value === duration
                ? 'border-stitch-secondary bg-stitch-secondary/10 text-stitch-on-surface'
                : 'border-stitch-outline-variant/50 text-stitch-on-surface-variant hover:border-stitch-secondary/60',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  const progress = duration > 0 ? 1 - remaining / duration : 0;

  const start = () => {
    endAtRef.current = performance.now() + remaining * 1000;
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setRemaining(duration);
  };

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`Silêncio guiado de ${duration} segundos`}
      className="my-6 flex flex-col items-center gap-4 rounded-2xl border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest/30 px-6 py-6"
    >
      {!isForced && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDuration(opt.value)}
              className={cn(
                'rounded-full border px-2.5 py-1 font-stitch-body text-[11px] transition',
                opt.value === duration
                  ? 'border-stitch-secondary bg-stitch-secondary/10 text-stitch-on-surface'
                  : 'border-stitch-outline-variant/50 text-stitch-on-surface-variant hover:border-stitch-secondary/60',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div
        className={cn(
          'relative flex h-24 w-24 items-center justify-center rounded-full border border-stitch-outline-variant/50 transition-transform duration-1000',
          running ? 'scale-105' : 'scale-100',
        )}
        style={{
          background: `conic-gradient(hsl(var(--stitch-secondary) / 0.4) ${progress * 360}deg, transparent 0deg)`,
        }}
      >
        <span className="font-stitch-display text-2xl text-stitch-on-surface tabular-nums">
          {remaining}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {!running ? (
          <button
            type="button"
            onClick={start}
            disabled={remaining <= 0}
            aria-label="Iniciar silêncio"
            className="inline-flex items-center gap-1.5 rounded-full border border-stitch-secondary/60 px-3 py-1 font-stitch-body text-xs text-stitch-on-surface hover:bg-stitch-secondary/10 disabled:opacity-40"
          >
            <Play aria-hidden className="h-3.5 w-3.5" />
            {remaining < duration ? 'Retomar' : 'Iniciar'}
          </button>
        ) : (
          <button
            type="button"
            onClick={pause}
            aria-label="Pausar silêncio"
            className="inline-flex items-center gap-1.5 rounded-full border border-stitch-outline-variant/50 px-3 py-1 font-stitch-body text-xs text-stitch-on-surface hover:border-stitch-secondary/60"
          >
            <Pause aria-hidden className="h-3.5 w-3.5" />
            Pausar
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          aria-label="Reiniciar silêncio"
          className="inline-flex items-center gap-1.5 rounded-full border border-stitch-outline-variant/50 px-3 py-1 font-stitch-body text-xs text-stitch-on-surface hover:border-stitch-secondary/60"
        >
          <RotateCcw aria-hidden className="h-3.5 w-3.5" />
          Reiniciar
        </button>
      </div>
    </div>
  );
};

export default SilenceTimer;
