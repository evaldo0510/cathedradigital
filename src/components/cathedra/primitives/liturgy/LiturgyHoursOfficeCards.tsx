/**
 * LiturgyHoursOfficeCards — Próprio de uma Hora Canônica (Prayer Engine v2).
 *
 * Renderiza salmodia, leitura breve, responsório, cântico evangélico,
 * preces e oração conclusiva vindas de `useLiturgyHoursOffice`.
 */
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { LiturgyHoursOfficeRow } from '@/hooks/useLiturgyHoursOffice';

interface Props {
  office: LiturgyHoursOfficeRow | null;
  isLoading: boolean;
  hourTitle: string;
  hourLatin: string;
}

interface CardProps {
  kicker: string;
  title?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ kicker, title, children }) => (
  <section className="rounded-2xl border border-stitch-outline-variant/30 bg-stitch-surface-container-lowest/40 p-5 md:p-6">
    <p className="font-stitch-body text-[10px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
      {kicker}
    </p>
    {title && (
      <h3 className="mt-2 font-stitch-display text-lg md:text-xl leading-tight text-stitch-on-surface">
        {title}
      </h3>
    )}
    <div className="mt-3 font-stitch-body text-base leading-relaxed text-stitch-on-surface space-y-2">
      {children}
    </div>
  </section>
);

export const LiturgyHoursOfficeSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-stitch-outline-variant/30 bg-stitch-surface-container-lowest/40 p-5 md:p-6"
      >
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-2 h-5 w-56" />
        <Skeleton className="mt-3 h-24 w-full" />
      </div>
    ))}
  </div>
);

export const LiturgyHoursOfficeCards: React.FC<Props> = ({ office, isLoading, hourTitle, hourLatin }) => {
  if (isLoading && !office) return <LiturgyHoursOfficeSkeleton />;
  if (!office) return null;

  return (
    <div className="space-y-4">
      <header className="text-center">
        <p className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
          Próprio da Hora · {new Date(office.iso_date + 'T00:00:00').toLocaleDateString('pt-BR', {
            weekday: 'long', day: 'numeric', month: 'long',
          })}
        </p>
        <h2 className="mt-2 font-stitch-display text-2xl md:text-3xl text-stitch-on-surface">
          {hourTitle}
        </h2>
        <p className="mt-1 font-stitch-body text-xs italic text-stitch-on-surface-variant">
          {hourLatin}{office.season_note ? ` · ${office.season_note}` : ''}
        </p>
      </header>

      {office.antiphon_opening && (
        <Card kicker="Antiphona ad initium" title="Antífona de Abertura">
          <p className="whitespace-pre-line">{office.antiphon_opening}</p>
        </Card>
      )}

      {office.psalmody.length > 0 && (
        <Card kicker="Psalmodia" title="Salmodia">
          <div className="space-y-4">
            {office.psalmody.map((p, idx) => (
              <div key={`${p.reference}-${idx}`} className="rounded-xl bg-stitch-surface-container-lowest/60 p-4">
                <p className="font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-secondary">
                  Antífona
                </p>
                <p className="mt-1 italic">{p.antiphon}</p>
                <p className="mt-3 font-stitch-body text-xs font-semibold uppercase tracking-widest text-stitch-on-surface-variant">
                  {p.reference}
                </p>
                <p className="mt-1 whitespace-pre-line">{p.text}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {office.brief_reading_text && (
        <Card
          kicker="Lectio brevis"
          title={office.brief_reading_ref ? `Leitura Breve · ${office.brief_reading_ref}` : 'Leitura Breve'}
        >
          <p className="whitespace-pre-line">{office.brief_reading_text}</p>
        </Card>
      )}

      {office.responsory && (
        <Card kicker="Responsorium" title="Responsório">
          <p className="whitespace-pre-line">{office.responsory}</p>
        </Card>
      )}

      {office.gospel_canticle && (
        <Card
          kicker="Canticum Evangelicum"
          title={`Cântico Evangélico · ${office.gospel_canticle.reference}`}
        >
          <p className="font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-secondary">
            Antífona
          </p>
          <p className="mt-1 italic">{office.gospel_canticle.antiphon}</p>
          <p className="mt-3 whitespace-pre-line">{office.gospel_canticle.text}</p>
        </Card>
      )}

      {office.intercessions.length > 0 && (
        <Card kicker="Preces" title="Preces e Intercessões">
          <ul className="list-decimal space-y-2 pl-5 marker:text-stitch-secondary">
            {office.intercessions.map((it, i) => (
              <li key={i} className="pl-1">{it}</li>
            ))}
          </ul>
          <p className="mt-2 font-stitch-body text-xs italic text-stitch-on-surface-variant">
            Refrão: Escutai-nos, Senhor.
          </p>
        </Card>
      )}

      <Card kicker="Oratio conclusiva" title="Oração conclusiva">
        <p className="whitespace-pre-line">{office.concluding_prayer}</p>
      </Card>

      {office.model && (
        <p className="text-center font-stitch-body text-[10px] uppercase tracking-widest text-stitch-on-surface-variant/70">
          Próprio editorial · {office.provider}/{office.model} · v{office.version}
        </p>
      )}
    </div>
  );
};

export default LiturgyHoursOfficeCards;
