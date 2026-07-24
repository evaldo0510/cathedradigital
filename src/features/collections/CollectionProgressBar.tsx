/**
 * CollectionProgressBar — barra de progresso agregada de uma coleção.
 * Sprint Coleções Temáticas · Onda 1.
 *
 * Puramente apresentacional. Recebe totais já computados pelo consumidor
 * (que sabe qual `useCollectionProgress` usar). Zero dependência de dados.
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  completed: number;
  total: number;
  className?: string;
  /** Compacto: só a barra + fração, sem headline. */
  compact?: boolean;
}

export const CollectionProgressBar: React.FC<Props> = ({
  completed,
  total,
  className,
  compact = false,
}) => {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn('w-full space-y-spacing-2xs', className)}>
      {!compact && (
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">
            Progresso da coleção
          </span>
          <span className="text-premium-xs font-serif text-muted-foreground tabular-nums">
            {completed} de {total} · {pct}%
          </span>
        </div>
      )}
      <div
        className="h-2 w-full rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${completed} de ${total} itens concluídos`}
      >
        <div
          className="h-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {compact && (
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
          {completed}/{total} · {pct}%
        </span>
      )}
    </div>
  );
};

export default CollectionProgressBar;
