/**
 * StationContemplation — bloco contemplativo de uma estação da Via Sacra.
 *
 * Reúne:
 *   • Convite ao silêncio (3 frases + SilenceTimer com ritmo global).
 *   • Meditação Logos (expandida).
 *   • Padres da Igreja.
 *   • Referência ao Catecismo.
 *
 * O layout é editorial (cards discretos, tema `passion`), sem depender de props
 * externas além da estação.
 */
import React from 'react';
import { Sparkles, Feather, BookMarked } from 'lucide-react';
import type { ViaSacraStation } from '@/data/viaSacraStations';
import SilenceTimer from '@/components/prayer/rosary/SilenceTimer';
import { useContemplativeRhythm } from '@/hooks/useContemplativeRhythm';

interface Props {
  station: ViaSacraStation;
  /** Modo contemplativo colapsa o card e reduz ruído visual. */
  contemplative?: boolean;
}

const StationContemplation: React.FC<Props> = ({ station, contemplative = false }) => {
  const { rhythm } = useContemplativeRhythm();

  return (
    <section
      aria-labelledby={`station-${station.num}-contemplation`}
      data-testid={`via-sacra-contemplation-${station.num}`}
      className="mt-spacing-xl space-y-spacing-lg"
    >
      {/* Convite à contemplação + silêncio guiado */}
      <aside
        aria-label="Convite à contemplação"
        className="rounded-2xl border border-primary/15 bg-primary/[0.03] px-spacing-lg py-spacing-lg text-center"
      >
        <div className="mx-auto inline-flex items-center gap-spacing-xs text-primary">
          <Sparkles aria-hidden className="h-3.5 w-3.5" />
          <p className="font-serif text-premium-xs font-black uppercase tracking-[0.32em]">
            Contemple
          </p>
        </div>
        <ol className="mx-auto mt-spacing-md max-w-[54ch] space-y-spacing-sm">
          {station.contemplationInvitation.map((phrase, i) => (
            <li
              key={i}
              className="font-serif text-premium-lg italic leading-relaxed text-foreground/90"
            >
              {phrase}
            </li>
          ))}
        </ol>
        <div className="mt-spacing-md">
          <SilenceTimer forcedSeconds={rhythm.silenceSec} />
        </div>
      </aside>

      {!contemplative && (
        <>
          <h3
            id={`station-${station.num}-contemplation`}
            className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary/60 text-center"
          >
            Meditação Logos
          </h3>
          <p className="max-w-[62ch] mx-auto font-serif text-premium-lg leading-relaxed text-foreground/90">
            {station.logosMeditation}
          </p>

          {/* Padres da Igreja */}
          {station.fathers.length > 0 && (
            <div
              data-testid={`via-sacra-fathers-${station.num}`}
              className="max-w-[62ch] mx-auto space-y-spacing-md pt-spacing-md"
            >
              <div className="inline-flex items-center gap-spacing-xs text-primary/70">
                <Feather aria-hidden className="h-3.5 w-3.5" />
                <p className="font-serif text-premium-xs font-black uppercase tracking-[0.2em]">
                  Padres da Igreja
                </p>
              </div>
              <div className="space-y-spacing-md">
                {station.fathers.map((f, i) => (
                  <figure
                    key={i}
                    className="border-l-2 border-primary/30 pl-spacing-md"
                  >
                    <blockquote className="font-serif italic text-premium-base leading-relaxed text-foreground/85">
                      "{f.quote}"
                    </blockquote>
                    <figcaption className="mt-spacing-2xs text-premium-xs uppercase tracking-widest text-muted-foreground">
                      <span className="font-black text-primary/80">{f.author}</span>
                      {f.source && <span className="ml-spacing-xs">· {f.source}</span>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          {/* Catecismo */}
          <div
            data-testid={`via-sacra-catechism-${station.num}`}
            className="max-w-[62ch] mx-auto rounded-2xl border border-primary/10 bg-card/40 px-spacing-md py-spacing-sm mt-spacing-md"
          >
            <div className="inline-flex items-center gap-spacing-xs text-primary/70">
              <BookMarked aria-hidden className="h-3.5 w-3.5" />
              <p className="font-serif text-premium-xs font-black uppercase tracking-[0.2em]">
                Catecismo
              </p>
            </div>
            <p className="mt-spacing-2xs text-premium-sm text-foreground/80">
              <span className="font-black text-primary/80">{station.catechism.ref}</span>
              <span className="mx-spacing-xs text-muted-foreground">—</span>
              <span className="italic">{station.catechism.theme}</span>
            </p>
          </div>
        </>
      )}
    </section>
  );
};

export default StationContemplation;
