/**
 * StationClosingCard — encerramento ritual de uma estação da Via Sacra.
 *
 * Espelha o padrão de MysteryClosingCard do Rosário:
 *   • Fruto espiritual
 *   • Oração final
 *   • Ação concreta para o dia
 */
import React from 'react';
import { Leaf, HandHeart, Sunrise } from 'lucide-react';
import type { ViaSacraStation } from '@/data/viaSacraStations';

interface Props {
  station: ViaSacraStation;
}

const StationClosingCard: React.FC<Props> = ({ station }) => {
  return (
    <section
      aria-labelledby={`station-${station.num}-closing`}
      data-testid={`via-sacra-closing-${station.num}`}
      className="mt-spacing-xl rounded-3xl border border-primary/15 bg-card/40 p-spacing-lg md:p-spacing-xl"
    >
      <p className="font-serif text-premium-xs font-black uppercase tracking-[0.32em] text-primary">
        Estação concluída
      </p>
      <h3
        id={`station-${station.num}-closing`}
        className="mt-spacing-2xs font-serif text-premium-2xl leading-tight text-foreground md:text-premium-3xl"
      >
        {station.title}
      </h3>

      <div className="mt-spacing-lg grid gap-spacing-md md:grid-cols-3">
        <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-spacing-md">
          <div className="inline-flex items-center gap-spacing-2xs text-primary">
            <Leaf aria-hidden className="h-3.5 w-3.5" />
            <p className="font-serif text-premium-xs font-black uppercase tracking-[0.24em]">
              Fruto
            </p>
          </div>
          <p className="mt-spacing-2xs font-serif italic text-premium-base text-foreground/90">
            {station.fruit}
          </p>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-spacing-md">
          <div className="inline-flex items-center gap-spacing-2xs text-primary">
            <HandHeart aria-hidden className="h-3.5 w-3.5" />
            <p className="font-serif text-premium-xs font-black uppercase tracking-[0.24em]">
              Oração
            </p>
          </div>
          <p className="mt-spacing-2xs font-serif text-premium-sm leading-relaxed text-foreground/85">
            {station.prayer}
          </p>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-spacing-md">
          <div className="inline-flex items-center gap-spacing-2xs text-primary">
            <Sunrise aria-hidden className="h-3.5 w-3.5" />
            <p className="font-serif text-premium-xs font-black uppercase tracking-[0.24em]">
              Ação para o dia
            </p>
          </div>
          <p className="mt-spacing-2xs font-serif text-premium-sm leading-relaxed text-foreground/85">
            {station.action}
          </p>
        </div>
      </div>
    </section>
  );
};

export default StationClosingCard;
