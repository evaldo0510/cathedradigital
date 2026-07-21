/**
 * SpiritualProgressDots — barra espiritual do Rosário.
 *
 * Substitui a barra linear por uma sequência de círculos (um por mistério
 * da seção) com filete conector. Comunicação silenciosa e ritual em vez de
 * "porcentagem completada".
 *
 *   ●━━━○━━━○━━━○━━━○     (Mistério 1 de 5)
 *
 * Não altera estado — apenas leitura.
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  total: number;
  currentIndex: number;
  completedIds?: string[];
  ids?: string[];
  label?: string;
  accentClass?: string;
}

const SpiritualProgressDots: React.FC<Props> = ({
  total,
  currentIndex,
  completedIds = [],
  ids = [],
  label,
  accentClass = 'text-stitch-secondary',
}) => {
  if (total <= 0) return null;
  const items = Array.from({ length: total });
  return (
    <div
      role="group"
      aria-label={label ?? `Mistério ${Math.max(currentIndex + 1, 1)} de ${total}`}
      className="flex flex-col items-center gap-2"
    >
      <div className="flex items-center justify-center gap-1.5">
        {items.map((_, i) => {
          const isCurrent = i === currentIndex;
          const isDone = ids[i] ? completedIds.includes(ids[i]) : i < currentIndex;
          return (
            <React.Fragment key={i}>
              <span
                aria-hidden
                className={cn(
                  'inline-block rounded-full transition-all duration-500',
                  isCurrent
                    ? cn('h-3 w-3 ring-2 ring-offset-2 ring-offset-transparent', accentClass, 'bg-current ring-current/40')
                    : isDone
                      ? cn('h-2.5 w-2.5', accentClass, 'bg-current/70')
                      : 'h-2 w-2 border border-stitch-outline-variant/70 bg-transparent',
                )}
              />
              {i < items.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    'h-px w-6 transition-colors duration-500',
                    isDone ? cn(accentClass, 'bg-current/60') : 'bg-stitch-outline-variant/50',
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {label && (
        <p className="font-stitch-body text-[10px] uppercase tracking-[0.28em] text-stitch-on-surface-variant">
          {label}
        </p>
      )}
    </div>
  );
};

export default SpiritualProgressDots;
