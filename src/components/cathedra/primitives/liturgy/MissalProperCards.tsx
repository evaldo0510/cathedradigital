/**
 * MissalProperCards — Próprio da Missa (Prayer Engine v2, Onda B).
 *
 * Renderiza os blocos editoriais do dia (Antífona de Entrada, Coleta,
 * Oração sobre as Oferendas, Prefácio, Antífona de Comunhão, Oração
 * após a Comunhão) gerados por IA e cacheados por data.
 */
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { MissalProperRow } from '@/hooks/useMissalProper';

interface Props {
  proper: MissalProperRow | null;
  isLoading: boolean;
}

interface CardProps {
  kicker: string;
  title: string;
  text: string;
  note?: string | null;
}

const ProperCard: React.FC<CardProps> = ({ kicker, title, text, note }) => (
  <section className="rounded-2xl border border-stitch-outline-variant/30 bg-stitch-surface-container-lowest/40 p-5 md:p-6">
    <p className="font-stitch-body text-[10px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
      {kicker}
    </p>
    <h3 className="mt-2 font-stitch-display text-lg md:text-xl leading-tight text-stitch-on-surface">
      {title}
    </h3>
    <p className="mt-3 whitespace-pre-line font-stitch-body text-base leading-relaxed text-stitch-on-surface">
      {text}
    </p>
    {note && (
      <p className="mt-2 font-stitch-body text-xs italic text-stitch-on-surface-variant">
        {note}
      </p>
    )}
  </section>
);

export const MissalProperSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-stitch-outline-variant/30 bg-stitch-surface-container-lowest/40 p-5 md:p-6"
      >
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2 h-5 w-64" />
        <Skeleton className="mt-3 h-16 w-full" />
      </div>
    ))}
  </div>
);

export const MissalProperCards: React.FC<Props> = ({ proper, isLoading }) => {
  if (isLoading && !proper) return <MissalProperSkeleton />;
  if (!proper) return null;

  return (
    <div className="space-y-4">
      <header className="text-center">
        <p className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
          Próprio da Missa · {new Date(proper.iso_date + 'T00:00:00').toLocaleDateString('pt-BR', {
            weekday: 'long', day: 'numeric', month: 'long',
          })}
        </p>
        <h2 className="mt-2 font-stitch-display text-2xl md:text-3xl text-stitch-on-surface">
          {proper.celebration_title}
        </h2>
        {(proper.liturgical_color || proper.season_note) && (
          <p className="mt-2 font-stitch-body text-sm italic text-stitch-on-surface-variant">
            {[proper.liturgical_color && `Cor litúrgica: ${proper.liturgical_color}`, proper.season_note]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </header>

      {proper.entrance_antiphon && (
        <ProperCard kicker="Antiphona ad introitum" title="Antífona de Entrada" text={proper.entrance_antiphon} />
      )}
      <ProperCard kicker="Collecta" title="Oração Coleta" text={proper.collect} />
      <ProperCard kicker="Super oblata" title="Oração sobre as Oferendas" text={proper.offertory_prayer} />
      {proper.preface_suggestion && (
        <ProperCard kicker="Praefatio" title="Prefácio sugerido" text={proper.preface_suggestion} />
      )}
      {proper.communion_antiphon && (
        <ProperCard kicker="Antiphona ad communionem" title="Antífona de Comunhão" text={proper.communion_antiphon} />
      )}
      <ProperCard kicker="Post communionem" title="Oração após a Comunhão" text={proper.prayer_after_communion} />

      {proper.model && (
        <p className="text-center font-stitch-body text-[10px] uppercase tracking-widest text-stitch-on-surface-variant/70">
          Próprio editorial · {proper.provider}/{proper.model} · v{proper.version}
        </p>
      )}
    </div>
  );
};

export default MissalProperCards;
