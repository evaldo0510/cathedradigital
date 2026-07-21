/**
 * BreviaryHourInline — leitor de uma Hora canônica individual (Prayer Engine v2).
 *
 * Sprint 3 · Onda B. Renderiza qualquer oração `breviario-<hora>` como
 * Prayer Engine v2 + Próprio do dia injetado inline. Usa a mesma engine
 * (`BreviaryContinuousReader`) da BreviaryPage, agora ancorada em orações
 * autônomas com favorito próprio e persistência por Hora+data.
 */
import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { Prayer } from '@/hooks/usePrayers';
import { usePrayerHierarchy } from '@/prayer-engine/usePrayerHierarchy';
import { useDailyLiturgy } from '@/hooks/useDailyLiturgy';
import { useLiturgyHoursOffice, type HourSlug } from '@/hooks/useLiturgyHoursOffice';
import { toIsoDateKey } from '@/core/liturgy/LiturgyProvider';
import { flattenSectionToBlocks } from '@/prayer-engine/loadPrayerHierarchy';
import { BreviaryContinuousReader, type BreviaryHourBundle } from './BreviaryContinuousReader';
import { LiturgyRichHeader } from './primitives/liturgy/LiturgyRichHeader';
import { LiturgyDateNav } from './primitives/liturgy/LiturgyDateNav';
import { BreviaryShareButtons } from './primitives/liturgy/BreviaryShareButtons';
import { ReaderTypographyControl } from './primitives/liturgy/ReaderTypographyControl';
import { useReaderTypography } from '@/hooks/useReaderTypography';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';

const CANONICAL_BASE = 'https://www.cathedradigital.com.br';

// Mapeia hour_slug do banco → HourSlug usada pelo Próprio.
// `hora-media` reutiliza `sexta` (Próprio atual cobre um Meio-dia canônico).
const HOUR_SLUG_MAP: Record<string, HourSlug> = {
  oficio: 'oficio',
  laudes: 'laudes',
  'hora-media': 'sexta',
  vesperas: 'vesperas',
  completas: 'completas',
};

interface Props {
  prayer: Prayer;
}

function parseDateParam(raw: string | null): Date {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date();
  const [y, m, d] = raw.split('-').map(Number);
  const nd = new Date(y, m - 1, d);
  return Number.isNaN(nd.getTime()) ? new Date() : nd;
}

export const BreviaryHourInline: React.FC<Props> = ({ prayer }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const meta = (prayer as unknown as { meta?: { hour_slug?: string } }).meta ?? {};
  const hourSlug = meta.hour_slug ?? prayer.slug.replace(/^breviario-/, '');
  const officeHour = HOUR_SLUG_MAP[hourSlug] ?? null;

  const selectedDate = useMemo(() => parseDateParam(searchParams.get('d')), [searchParams]);
  const isoDate = toIsoDateKey(selectedDate);
  const todayIso = toIsoDateKey(new Date());
  const isToday = isoDate === todayIso;

  const { hierarchy, activeSection, loading } = usePrayerHierarchy(prayer.slug, 'ordinario');
  const { liturgy } = useDailyLiturgy(selectedDate);
  const { office, isLoading: officeLoading } = useLiturgyHoursOffice(isoDate, officeHour, liturgy);

  const { wrapperStyle: typographyStyle } = useReaderTypography();
  const initialBlockId = searchParams.get('b');

  const setSelectedDate = (d: Date) => {
    const next = new URLSearchParams(searchParams);
    const iso = toIsoDateKey(d);
    if (iso === todayIso) next.delete('d');
    else next.set('d', iso);
    setSearchParams(next, { replace: false });
  };

  if (loading || !hierarchy || !activeSection) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-stitch-body text-sm">Preparando {prayer.title}…</span>
      </div>
    );
  }

  const ordinaryBlocks = flattenSectionToBlocks(hierarchy, activeSection);
  const canonical = `${CANONICAL_BASE}/oracao/${prayer.slug}${isToday ? '' : `?d=${isoDate}`}`;

  const pageTitle = `${prayer.title} · Liturgia das Horas`;
  const pageDescription = `Reze ${prayer.title} da Liturgia das Horas — ${isoDate} — com Ordinário e Próprio do dia.`;

  const bundles: BreviaryHourBundle[] = [{
    hourSlug: (officeHour ?? 'laudes') as HourSlug,
    title: prayer.title,
    subtitle: prayer.subtitle ?? activeSection.subtitle ?? null,
    ordinaryBlocks,
    office,
    officeLoading,
  }];

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        path={`/oracao/${prayer.slug}${isToday ? '' : `?d=${isoDate}`}`}
      />
      <Helmet>
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Hero editorial */}
      <header className="mx-auto max-w-3xl text-center mb-spacing-lg px-spacing-sm">
        <p className="font-stitch-body text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          Cathedra · Liturgia das Horas
        </p>
        <h1 className="mt-spacing-2xs font-display font-bold text-premium-3xl md:text-premium-5xl text-foreground">
          {prayer.title}
        </h1>
        {prayer.subtitle && (
          <p className="mx-auto mt-spacing-2xs max-w-[52ch] font-serif italic text-premium-sm md:text-premium-base text-muted-foreground">
            {prayer.subtitle}
          </p>
        )}
        <LiturgyRichHeader liturgy={liturgy ?? null} proper={null} saintOfDay={null} isoDate={isoDate} />
      </header>

      <div className="mx-auto max-w-3xl mb-spacing-sm px-spacing-sm">
        <LiturgyDateNav date={selectedDate} onChange={setSelectedDate} isToday={isToday} />
      </div>

      <div className="mx-auto max-w-3xl mb-spacing-sm flex flex-wrap items-center justify-between gap-spacing-2xs px-spacing-sm">
        <Button asChild variant="outline" size="sm" className="rounded-full text-premium-xs font-black uppercase tracking-widest">
          <Link to="/breviary">
            <Icons.ChevronLeft className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> Todas as horas
          </Link>
        </Button>
        <div className="flex items-center gap-spacing-2xs">
          <ReaderTypographyControl />
          {officeHour && (
            <BreviaryShareButtons
              hourSlug={officeHour}
              isoDate={isoDate}
              isToday={isToday}
              shareTitle={pageTitle}
              bookmarkKey={`prayer-cursor:breviary:hour:${hourSlug}:${isoDate}`}
            />
          )}
        </div>
      </div>

      <BreviaryContinuousReader
        prayer={prayer}
        hierarchy={hierarchy}
        hours={bundles}
        isoDate={isoDate}
        contextKey={`breviary:hour:${hourSlug}:${isoDate}`}
        initialBlockId={initialBlockId}
        liturgy={liturgy ?? null}
        contentStyle={typographyStyle}
      />
    </>
  );
};

export default BreviaryHourInline;
