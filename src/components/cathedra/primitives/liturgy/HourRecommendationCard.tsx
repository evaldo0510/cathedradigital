/**
 * HourRecommendationCard — destaca a Hora canônica sugerida agora.
 *
 * Sprint 3 · Onda C. Consome `useRecommendedHour` (banco → meta.window_*)
 * e leva à página individual do Breviário no Prayer Engine v2.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import type { RecommendedHour } from '@/hooks/useRecommendedHour';

interface Props {
  recommendation: RecommendedHour | null;
}

function formatUntil(minutes: number): string {
  if (minutes <= 0) return 'agora';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `em ${m} min`;
  if (m === 0) return `em ${h}h`;
  return `em ${h}h${String(m).padStart(2, '0')}`;
}

export const HourRecommendationCard: React.FC<Props> = ({ recommendation }) => {
  if (!recommendation) return null;
  const { prayer, reason, minutesUntilOpen, windowLabel } = recommendation;
  const href = `/oracao/${prayer.slug}`;
  const isNow = reason === 'in-window';

  return (
    <section
      aria-label="Hora canônica sugerida"
      className="mx-auto max-w-3xl rounded-premium border border-primary/30 bg-primary/[0.04] p-spacing-md md:p-spacing-lg"
    >
      <div className="flex items-start gap-spacing-sm">
        <div className="mt-1 hidden md:flex h-spacing-lg w-spacing-lg items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
          <Icons.Clock className="h-spacing-sm w-spacing-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-stitch-body text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            {isNow ? 'Hora recomendada · agora' : `Próxima hora · ${formatUntil(minutesUntilOpen)}`}
          </p>
          <h2 className="mt-spacing-2xs font-display font-bold text-premium-xl md:text-premium-2xl text-foreground">
            {prayer.title}
          </h2>
          {prayer.subtitle && (
            <p className="mt-spacing-2xs font-serif italic text-premium-sm text-muted-foreground">
              {prayer.subtitle}
            </p>
          )}
          <p className="mt-spacing-2xs font-stitch-body text-premium-xs uppercase tracking-widest text-muted-foreground">
            Janela · {windowLabel}
          </p>
        </div>
        <Button asChild variant={isNow ? 'default' : 'outline'} size="sm" className="rounded-full shrink-0">
          <Link to={href} aria-label={`Rezar ${prayer.title} agora`}>
            {isNow ? 'Rezar agora' : 'Abrir'}
            <Icons.ChevronRight className="ml-spacing-2xs h-spacing-sm w-spacing-sm" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default HourRecommendationCard;
