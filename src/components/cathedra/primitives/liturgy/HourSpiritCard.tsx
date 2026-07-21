/**
 * HourSpiritCard — Nota editorial sobre o *espírito* de uma Hora canônica.
 *
 * Conteúdo estático (Padres, origem histórica, chave contemplativa) que
 * complementa o Próprio gerado dinamicamente. Renderiza compacto, respeitando
 * o design system do Breviário (tokens `spacing`, `premium`, `serif`).
 */
import React from 'react';
import { Icons } from '../../../../constants';
import { getHourEditorial } from '@/data/liturgyHoursEditorial';
import type { HourSlug } from '@/hooks/useLiturgyHoursOffice';

interface Props {
  hourSlug: HourSlug;
  hourTitle: string;
  className?: string;
}

export const HourSpiritCard: React.FC<Props> = ({ hourSlug, hourTitle, className = '' }) => {
  const editorial = getHourEditorial(hourSlug);
  if (!editorial) return null;

  return (
    <section
      aria-label={`Espírito da Hora: ${hourTitle}`}
      className={`mx-auto max-w-3xl rounded-premium border border-border/60 bg-card/60 backdrop-blur-sm p-spacing-md md:p-spacing-lg space-y-spacing-sm ${className}`}
    >
      <header className="flex items-center gap-spacing-xs">
        <Icons.Sparkles className="w-spacing-sm h-spacing-sm text-primary" aria-hidden="true" />
        <p className="text-premium-xs font-black uppercase tracking-[0.25em] text-primary">
          Espírito da Hora
        </p>
        <span className="text-premium-xs font-serif italic text-muted-foreground ml-auto">
          {editorial.latin}
        </span>
      </header>

      <p className="text-premium-base font-display font-medium text-foreground leading-snug">
        {editorial.essence}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-sm text-premium-sm text-muted-foreground leading-relaxed">
        <div className="space-y-spacing-2xs">
          <p className="text-premium-xs font-black uppercase tracking-widest text-foreground/70">
            Origem
          </p>
          <p className="font-serif">{editorial.origin}</p>
        </div>
        <div className="space-y-spacing-2xs">
          <p className="text-premium-xs font-black uppercase tracking-widest text-foreground/70">
            Como rezar
          </p>
          <p className="font-serif">{editorial.meditation}</p>
        </div>
      </div>

      {editorial.reference && (
        <blockquote className="border-l-2 border-primary/40 pl-spacing-sm mt-spacing-xs">
          <p className="font-serif italic text-premium-sm text-foreground/90">
            {editorial.reference.text}
          </p>
          <cite className="not-italic text-premium-xs font-black uppercase tracking-widest text-muted-foreground">
            — {editorial.reference.source}
          </cite>
        </blockquote>
      )}
    </section>
  );
};

export default HourSpiritCard;
