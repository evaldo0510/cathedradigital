/**
 * RitualOptionSelector — seleciona entre variantes rituais de um bloco
 * (Ato Penitencial A/B/C, Oração Eucarística I-IV, Despedida, etc.).
 *
 * Puro visual. O consumidor (`MissaContinuousReader`) decide qual bloco
 * renderizar com base em `selectedKey`.
 */
import React from 'react';
import { cn } from '@/lib/utils';

export interface RitualOption {
  key: string;
  label: string;
}

interface Props {
  kicker: string;
  title: string;
  options: RitualOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
  className?: string;
}

export const RitualOptionSelector: React.FC<Props> = ({
  kicker,
  title,
  options,
  selectedKey,
  onSelect,
  className,
}) => {
  if (options.length <= 1) return null;
  return (
    <div
      role="radiogroup"
      aria-label={title}
      className={cn(
        'my-spacing-md rounded-2xl border border-primary/20 bg-primary/[0.03] p-spacing-sm md:p-spacing-md',
        className,
      )}
    >
      <p className="font-stitch-body text-[10px] font-black uppercase tracking-[0.3em] text-primary">
        {kicker}
      </p>
      <p className="mt-spacing-3xs font-stitch-body text-premium-xs uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="mt-spacing-xs flex flex-wrap gap-spacing-2xs">
        {options.map((opt) => {
          const active = opt.key === selectedKey;
          return (
            <button
              key={opt.key}
              role="radio"
              aria-checked={active}
              type="button"
              onClick={() => onSelect(opt.key)}
              className={cn(
                'rounded-full border px-spacing-sm py-spacing-3xs font-stitch-body text-[11px] font-bold uppercase tracking-widest transition-all',
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-premium-hover'
                  : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RitualOptionSelector;
