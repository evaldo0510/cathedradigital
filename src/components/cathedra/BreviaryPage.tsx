/**
 * BreviaryPage — Liturgia das Horas migrada ao Prayer Engine v2.
 *
 * - Ordinário: `usePrayerHierarchy('liturgia-das-horas')` (banco).
 * - Próprio: `useLiturgyHoursOffice` (edge function idempotente + IDB).
 * - Persistência, favoritos, marcadores, retomada, ReaderContinuation e
 *   Nexus automático são delegados ao `PrayerEngineReader`.
 * - Deep links: `?h=<slug>&d=YYYY-MM-DD` restauram exatamente hora + data.
 * - JSON-LD (Schema.org): `LiturgicalService`/`Article` por hora.
 * - Prefetch offline: quando as leituras do dia carregam, dispara as 7 horas
 *   idempotentemente para IDB.
 */
import React, { useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQueryClient } from '@tanstack/react-query';
import { usePrayerHierarchy } from '@/prayer-engine/usePrayerHierarchy';
import { usePrayers } from '@/hooks/usePrayers';
import { useDailyLiturgy } from '@/hooks/useDailyLiturgy';
import {
  useLiturgyHoursOffice,
  prefetchAllHoursForDay,
  ALL_HOUR_SLUGS,
  type HourSlug,
  type LiturgyHoursOfficeRow,
} from '@/hooks/useLiturgyHoursOffice';
import { toIsoDateKey } from '@/core/liturgy/LiturgyProvider';
import { PrayerEngineReader } from './PrayerEngineReader';
import { BreviaryContinuousReader, type BreviaryHourBundle } from './BreviaryContinuousReader';
import { LiturgyHoursOfficeCards } from './primitives/liturgy/LiturgyHoursOfficeCards';
import { LiturgyDateNav } from './primitives/liturgy/LiturgyDateNav';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Icons } from '../../constants';
import { flattenSectionToBlocks } from '@/prayer-engine/loadPrayerHierarchy';
import SEOHead from '@/components/SEOHead';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useReaderTypography } from '@/hooks/useReaderTypography';
import { preloadBreviaryOfflineAssets } from '@/lib/breviaryOfflinePreload';
import { BreviaryShareButtons } from './primitives/liturgy/BreviaryShareButtons';
import { ReaderTypographyControl } from './primitives/liturgy/ReaderTypographyControl';
import { HourRecommendationCard } from './primitives/liturgy/HourRecommendationCard';
import { useRecommendedHour } from '@/hooks/useRecommendedHour';
import { useQueries } from '@tanstack/react-query';
import PrayerPortalStandalone from '@/components/prayer/PrayerPortalStandalone';
import { HourSpiritCard } from './primitives/liturgy/HourSpiritCard';
import { Sunrise, Sun, Sunset, MoonStar, type LucideIcon } from 'lucide-react';

const CANONICAL_BASE = 'https://www.cathedradigital.com.br';

const HOUR_ICON: Record<HourSlug, React.ReactNode> = {
  oficio:    <Icons.BookOpen className="w-spacing-md h-spacing-md" />,
  laudes:    <Icons.Sun className="w-spacing-md h-spacing-md" />,
  tercia:    <Icons.Clock className="w-spacing-md h-spacing-md" />,
  sexta:     <Icons.Sun className="w-spacing-md h-spacing-md" />,
  noa:       <Icons.Clock className="w-spacing-md h-spacing-md" />,
  vesperas:  <Icons.Sun className="w-spacing-md h-spacing-md" />,
  completas: <Icons.Moon className="w-spacing-md h-spacing-md" />,
};

function suggestedHourFor(now: Date): HourSlug {
  const h = now.getHours();
  if (h < 6) return 'oficio';
  if (h < 9) return 'laudes';
  if (h < 11) return 'tercia';
  if (h < 14) return 'sexta';
  if (h < 17) return 'noa';
  if (h < 20) return 'vesperas';
  return 'completas';
}

function isHour(s: string | null): s is HourSlug {
  return !!s && (ALL_HOUR_SLUGS as string[]).includes(s);
}

function parseDateParam(raw: string | null): Date {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date();
  const [y, m, d] = raw.split('-').map(Number);
  const nd = new Date(y, m - 1, d);
  return Number.isNaN(nd.getTime()) ? new Date() : nd;
}

/** JSON-LD por Hora — Schema.org LiturgicalService + Article para rich results. */
function buildOfficeJsonLd(params: {
  hourTitle: string;
  hourLatin: string | null;
  hourSlug: HourSlug;
  isoDate: string;
  office: LiturgyHoursOfficeRow | null;
  seasonNote: string | null;
}) {
  const { hourTitle, hourLatin, hourSlug, isoDate, office, seasonNote } = params;
  const canonical = `${CANONICAL_BASE}/breviary?h=${hourSlug}&d=${isoDate}`;
  const description = office?.concluding_prayer
    ? `${hourTitle} da Liturgia das Horas — ${office.concluding_prayer.slice(0, 220)}…`
    : `${hourTitle} da Liturgia das Horas segundo o rito romano.`;

  const event = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${hourTitle} — Liturgia das Horas`,
    alternateName: hourLatin ?? undefined,
    startDate: isoDate,
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    description,
    inLanguage: 'pt-BR',
    isAccessibleForFree: true,
    url: canonical,
    location: {
      '@type': 'VirtualLocation',
      url: canonical,
    },
    organizer: {
      '@type': 'Organization',
      name: 'Cathedra Digital',
      url: CANONICAL_BASE,
    },
    about: seasonNote ?? 'Officium Divinum',
  };

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${hourTitle} · Liturgia das Horas`,
    articleSection: 'Liturgia das Horas',
    inLanguage: 'pt-BR',
    datePublished: office?.generated_at ?? new Date(isoDate + 'T06:00:00').toISOString(),
    dateModified: office?.generated_at ?? new Date().toISOString(),
    author: { '@type': 'Organization', name: 'Cathedra Digital' },
    publisher: { '@type': 'Organization', name: 'Cathedra Digital', url: CANONICAL_BASE },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    description,
  };

  return [event, article];
}

const BreviaryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();

  const selectedDate = useMemo(
    () => parseDateParam(searchParams.get('d')),
    [searchParams],
  );
  const isoDate = toIsoDateKey(selectedDate);
  const todayIso = toIsoDateKey(new Date());
  const isToday = isoDate === todayIso;

  const hourParam = searchParams.get('h');
  const selectedHour: HourSlug | null = isHour(hourParam) ? hourParam : null;
  const dayMode = searchParams.get('mode') === 'day';

  const suggested = useMemo(() => suggestedHourFor(new Date()), []);

  const setSelectedHour = useCallback(
    (h: HourSlug | null) => {
      const next = new URLSearchParams(searchParams);
      if (h) next.set('h', h);
      else next.delete('h');
      next.delete('mode');
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  const setDayMode = useCallback(
    (on: boolean) => {
      const next = new URLSearchParams(searchParams);
      if (on) {
        next.set('mode', 'day');
        next.delete('h');
      } else {
        next.delete('mode');
      }
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  const setSelectedDate = useCallback(
    (d: Date) => {
      const next = new URLSearchParams(searchParams);
      const iso = toIsoDateKey(d);
      if (iso === todayIso) next.delete('d');
      else next.set('d', iso);
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams, todayIso],
  );

  const { hierarchy, activeSection, loading } = usePrayerHierarchy(
    'liturgia-das-horas',
    selectedHour ?? undefined,
  );
  const { prayers } = usePrayers();
  const prayer = useMemo(
    () => prayers.find((p) => p.slug === 'liturgia-das-horas') ?? null,
    [prayers],
  );

  const { liturgy, isLoading: liturgyLoading, isError: liturgyError, isOfflineData, refresh: refreshLiturgy } = useDailyLiturgy(selectedDate);
  const { office, isLoading: officeLoading, fromCache } = useLiturgyHoursOffice(
    isoDate,
    selectedHour,
    liturgy,
  );
  const online = useOnlineStatus();
  const showOfflineBanner = !online && !!office && fromCache;

  const liturgyStatus: 'loading' | 'ready' | 'unavailable' | 'offline' = liturgyLoading
    ? 'loading'
    : liturgyError || !liturgy
      ? (online ? 'unavailable' : 'offline')
      : (isOfflineData && !online ? 'offline' : 'ready');

  // Prefetch das 7 horas (offline-first, idempotente) quando o dia carrega.
  useEffect(() => {
    if (!liturgy) return;
    void prefetchAllHoursForDay(qc, isoDate, liturgy);
  }, [qc, isoDate, liturgy]);

  // Pré-carregamento offline de assets estáticos (ícones/fonts/imagens brand)
  // usados pelas telas do Breviário. Idempotente e silencioso.
  useEffect(() => {
    void preloadBreviaryOfflineAssets();
  }, []);

  // Sprint 3 · Onda C — recomendação pela data selecionada + TZ local.
  const recommendation = useRecommendedHour(selectedDate);


  // Deep link `?b=<blockId>` — restaura posição exata do trecho.
  const initialBlockId = searchParams.get('b');

  // Preferências de tipografia (persistidas cross-session, funciona offline).
  const { wrapperStyle: typographyStyle } = useReaderTypography();

  // ── Dia inteiro contínuo (7 horas em fluxo único) ──
  // Coleta as 7 horas via useQueries (reativo, offline-first via IDB).
  const allHourQueries = useQueries({
    queries: (dayMode && hierarchy && prayer)
      ? ALL_HOUR_SLUGS.map((h) => ({
          queryKey: ['liturgy-hours-office', isoDate, h] as const,
          queryFn: async () => null, // resolvido pelo prefetch/useLiturgyHoursOffice
          enabled: false, // apenas lê o cache do QueryClient (populado pelo prefetch)
          staleTime: Infinity,
        }))
      : [],
  });

  if (dayMode && prayer && hierarchy) {
    const orderedSections = ALL_HOUR_SLUGS
      .map((slug) => hierarchy.sections.find((s) => s.slug === slug))
      .filter((s): s is NonNullable<typeof s> => !!s);

    const bundles: BreviaryHourBundle[] = orderedSections.map((section, idx) => {
      const slug = section.slug as HourSlug;
      const cached = qc.getQueryData<{ office: LiturgyHoursOfficeRow | null }>([
        'liturgy-hours-office', isoDate, slug,
      ]);
      return {
        hourSlug: slug,
        title: section.title,
        subtitle: section.subtitle ?? null,
        ordinaryBlocks: flattenSectionToBlocks(hierarchy, section),
        office: cached?.office ?? null,
        officeLoading: !cached && !!allHourQueries[idx],
      };
    });

    const canonical = `${CANONICAL_BASE}/breviary?mode=day&d=${isoDate}`;
    const pageTitle = `Liturgia das Horas · ${isoDate}`;
    const pageDescription = `As sete horas canônicas do Ofício Divino em fluxo contínuo — ${isoDate}.`;

    return (
      <>
        <SEOHead title={pageTitle} description={pageDescription} path={`/breviary?mode=day${isToday ? '' : `&d=${isoDate}`}`} />
        <Helmet>
          <link rel="canonical" href={canonical} />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={pageDescription} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={canonical} />
          <meta property="og:locale" content="pt_BR" />
          <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
        {showOfflineBanner && (
          <div role="status" aria-live="polite" className="mb-spacing-sm mx-auto max-w-3xl flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs rounded-premium border border-border bg-muted/40 text-premium-xs text-muted-foreground">
            <Icons.WifiOff className="w-spacing-sm h-spacing-sm text-primary" />
            <span className="font-serif italic">Exibindo a Liturgia a partir do cache offline.</span>
          </div>
        )}
        <div className="mx-auto max-w-3xl mb-spacing-sm flex flex-wrap items-center justify-between gap-spacing-2xs px-spacing-sm">
          <Button variant="outline" size="sm" onClick={() => setDayMode(false)} className="rounded-full text-premium-xs font-black uppercase tracking-widest">
            <Icons.ChevronLeft className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> Voltar às horas
          </Button>
          <ReaderTypographyControl />
        </div>
        <BreviaryContinuousReader
          prayer={prayer}
          hierarchy={hierarchy}
          hours={bundles}
          isoDate={isoDate}
          contextKey={`breviary:day:${isoDate}`}
          initialBlockId={initialBlockId}
          liturgy={liturgy ?? null}
          contentStyle={typographyStyle}
        />
      </>
    );
  }

  // ── Hora única contínua (Próprio injetado inline) ──
  if (selectedHour && prayer && hierarchy && activeSection) {
    const section =
      hierarchy.sections.find((s) => s.slug === selectedHour) ?? activeSection;
    const hourBlocks = flattenSectionToBlocks(hierarchy, section);
    const canonical = `${CANONICAL_BASE}/breviary?h=${selectedHour}&d=${isoDate}`;
    const jsonLd = buildOfficeJsonLd({
      hourTitle: section.title,
      hourLatin: section.subtitle ?? null,
      hourSlug: selectedHour,
      isoDate,
      office,
      seasonNote: office?.season_note ?? null,
    });

    const pageTitle = `${section.title} · Liturgia das Horas`;
    const pageDescription = `Reze ${section.title}${section.subtitle ? ` (${section.subtitle})` : ''} da Liturgia das Horas — ${isoDate} — com Ordinário e Próprio do dia em fluxo contínuo.`;

    const bundles: BreviaryHourBundle[] = [{
      hourSlug: selectedHour,
      title: section.title,
      subtitle: section.subtitle ?? null,
      ordinaryBlocks: hourBlocks,
      office,
      officeLoading,
    }];

    return (
      <>
        <SEOHead title={pageTitle} description={pageDescription} path={`/breviary?h=${selectedHour}${isToday ? '' : `&d=${isoDate}`}`} />
        <Helmet>
          <link rel="canonical" href={canonical} />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={pageDescription} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={canonical} />
          <meta property="og:locale" content="pt_BR" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={pageTitle} />
          <meta name="twitter:description" content={pageDescription} />
          <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        </Helmet>
        {showOfflineBanner && (
          <div role="status" aria-live="polite" className="mb-spacing-sm mx-auto max-w-3xl flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs rounded-premium border border-border bg-muted/40 text-premium-xs text-muted-foreground">
            <Icons.WifiOff className="w-spacing-sm h-spacing-sm text-primary" />
            <span className="font-serif italic">Exibindo a Liturgia a partir do cache offline. Reconectando…</span>
          </div>
        )}
        <div className="mx-auto max-w-3xl mb-spacing-sm flex flex-wrap items-center justify-between gap-spacing-2xs px-spacing-sm">
          <div className="flex items-center gap-spacing-2xs">
            <Button variant="outline" size="sm" onClick={() => setSelectedHour(null)} className="rounded-full text-premium-xs font-black uppercase tracking-widest">
              <Icons.ChevronLeft className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> Horas
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDayMode(true)} className="rounded-full text-premium-xs font-black uppercase tracking-widest">
              <Icons.BookOpen className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> Dia inteiro
            </Button>
          </div>
          <div className="flex items-center gap-spacing-2xs">
            <ReaderTypographyControl />
            <BreviaryShareButtons
              hourSlug={selectedHour}
              isoDate={isoDate}
              isToday={isToday}
              shareTitle={pageTitle}
              bookmarkKey={`prayer-cursor:breviary:hour:${selectedHour}:${isoDate}`}
            />
          </div>
        </div>
        <HourSpiritCard
          hourSlug={selectedHour}
          hourTitle={section.title}
          className="mb-spacing-md"
        />
        <BreviaryContinuousReader
          prayer={prayer}
          hierarchy={hierarchy}
          hours={bundles}
          isoDate={isoDate}
          contextKey={`breviary:hour:${selectedHour}:${isoDate}`}
          initialBlockId={initialBlockId}
          liturgy={liturgy ?? null}
          contentStyle={typographyStyle}
        />
      </>
    );
  }

  // ── Seletor ──
  const sections = hierarchy?.sections ?? [];
  const orderedSections = ALL_HOUR_SLUGS
    .map((slug) => sections.find((s) => s.slug === slug))
    .filter((s): s is NonNullable<typeof s> => !!s);

  // B.2.5.b — Portal de Oração (limiar contemplativo antes do seletor).
  const enterRequested = searchParams.get('enter') === '1';
  if (!enterRequested && prayer) {
    const suggestedSection = orderedSections.find((s) => s.slug === suggested);
    const suggestedTime = (suggestedSection?.meta as { time?: string } | null)?.time;

    // Tema derivado da hora canônica sugerida.
    const HOUR_THEME: Record<string, { theme: 'dawn' | 'noon' | 'sunset' | 'night'; Icon: LucideIcon; quote: { text: string; ref: string } }> = {
      'oficio-das-leituras': { theme: 'night', Icon: MoonStar, quote: { text: 'À meia-noite eu me levantava para vos louvar.', ref: 'Sl 118,62' } },
      'invitatorio': { theme: 'night', Icon: MoonStar, quote: { text: 'Vinde, exultemos ao Senhor.', ref: 'Sl 94,1' } },
      'laudes': { theme: 'dawn', Icon: Sunrise, quote: { text: 'De madrugada eu vos busco, ó Deus.', ref: 'Sl 62,2' } },
      'tercia': { theme: 'noon', Icon: Sun, quote: { text: 'Sete vezes por dia eu vos louvo.', ref: 'Sl 118,164' } },
      'sexta': { theme: 'noon', Icon: Sun, quote: { text: 'Sete vezes por dia eu vos louvo.', ref: 'Sl 118,164' } },
      'noa': { theme: 'noon', Icon: Sun, quote: { text: 'Sete vezes por dia eu vos louvo.', ref: 'Sl 118,164' } },
      'hora-media': { theme: 'noon', Icon: Sun, quote: { text: 'Sete vezes por dia eu vos louvo.', ref: 'Sl 118,164' } },
      'vesperas': { theme: 'sunset', Icon: Sunset, quote: { text: 'Suba como incenso a minha oração diante de vós.', ref: 'Sl 140,2' } },
      'completas': { theme: 'night', Icon: MoonStar, quote: { text: 'Em paz me deito e adormeço, ó Senhor.', ref: 'Sl 4,9' } },
    };
    const hourTheme = HOUR_THEME[suggested ?? ''] ?? HOUR_THEME['laudes'];

    return (
      <PrayerPortalStandalone
        slug="liturgia-das-horas"
        title="Liturgia das Horas"
        estimatedSeconds={20 * 60}
        kicker="Cathedra · Officium Divinum"
        backHref="/oracao"
        showRhythm={false}
        theme={hourTheme.theme}
        accentIcon={hourTheme.Icon}
        quote={hourTheme.quote}
        highlight={{
          eyebrow: 'Hora recomendada',
          title: suggestedSection?.title ?? 'Hora canônica',
          subtitle: suggestedSection?.subtitle ?? undefined,
          meta: [
            ...(suggestedTime ? [{ label: 'Horário sugerido', value: suggestedTime, icon: 'clock' as const }] : []),
            ...(liturgy?.season ? [{ label: 'Tempo litúrgico', value: liturgy.season, icon: 'sparkles' as const }] : []),
            { label: 'Sete horas', value: 'Ofício · Laudes · Tércia · Sexta · Noa · Vésperas · Completas', icon: 'church' as const },
          ],
        }}
        onEnter={() => {
          const next = new URLSearchParams(searchParams);
          next.set('enter', '1');
          setSearchParams(next, { replace: true });
        }}
      />
    );
  }



  return (
    <>
      <SEOHead
        title="Breviário · Liturgia das Horas"
        description="Reze o Ofício Divino: sete horas canônicas com Ordinário do rito romano e Próprio do dia atualizado pelas leituras da liturgia."
        path="/breviary"
      />
      <div className="w-full space-y-spacing-xl">
        <div className="text-center space-y-spacing-sm">
          <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 rounded-premium">
            <Icons.History className="w-spacing-sm h-spacing-sm text-primary" />
            <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">
              Liturgia Horarum
            </span>
          </div>
          <h1 className="text-premium-3xl md:text-premium-5xl font-display font-bold text-foreground">
            Breviário
          </h1>
          <p className="text-muted-foreground font-serif italic leading-relaxed">
            A Liturgia das Horas santifica cada momento do dia pela oração da Igreja.
          </p>
        </div>

        <LiturgyDateNav date={selectedDate} onChange={setSelectedDate} isToday={isToday} />

        {/* Sprint 3 · Onda C — hora recomendada + Próprio do Dia via ?d= */}
        <HourRecommendationCard
          recommendation={recommendation}
          liturgy={liturgy ?? null}
          liturgyStatus={liturgyStatus}
          onRetryLiturgy={() => { void refreshLiturgy(); }}
        />



        <div className="text-center space-y-spacing-sm">
          <p className="text-premium-xs font-black uppercase tracking-[0.25em] text-muted-foreground">
            Hora sugerida agora
          </p>
          <div className="flex flex-wrap justify-center gap-spacing-sm">
            <Button
              onClick={() => setSelectedHour(suggested)}
              disabled={!prayer || loading}
              className="px-spacing-lg py-spacing-sm bg-foreground text-background rounded-premium-full font-black uppercase text-premium-xs tracking-widest shadow-premium hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-spacing-xs"
            >
              {HOUR_ICON[suggested]}
              Rezar {orderedSections.find((s) => s.slug === suggested)?.title ?? 'agora'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDayMode(true)}
              disabled={!prayer || loading}
              className="px-spacing-lg py-spacing-sm rounded-premium-full font-black uppercase text-premium-xs tracking-widest flex items-center gap-spacing-xs"
            >
              <Icons.BookOpen className="w-spacing-md h-spacing-md" />
              Dia inteiro
            </Button>
          </div>
        </div>

        <HourSpiritCard
          hourSlug={suggested}
          hourTitle={orderedSections.find((s) => s.slug === suggested)?.title ?? 'Hora canônica'}
        />



        {loading || !prayer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-sm">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-premium-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-sm">
            {orderedSections.map((s) => {
              const isSuggested = s.slug === suggested;
              const time = (s.meta as { time?: string } | null)?.time;
              return (
                <Button
                  key={s.id}
                  onClick={() => setSelectedHour(s.slug as HourSlug)}
                  className={`text-left p-spacing-md rounded-premium-full border transition-all group space-y-spacing-2xs ${
                    isSuggested
                      ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                      : 'bg-card border-border hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="opacity-80">{HOUR_ICON[s.slug as HourSlug]}</span>
                    {time && (
                      <span className="text-premium-xs font-black text-primary tracking-widest">
                        {time}
                      </span>
                    )}
                  </div>
                  <h3 className="text-premium-base font-display font-bold text-foreground group-hover:text-primary transition-colors">
                    {s.title}
                  </h3>
                  {s.subtitle && (
                    <p className="text-premium-xs font-serif italic text-muted-foreground">
                      {s.subtitle}
                    </p>
                  )}
                  {isSuggested && (
                    <span className="inline-block font-serif px-spacing-xs py-spacing-3xs rounded text-premium-xs font-black uppercase tracking-wider bg-primary/10 text-primary">
                      Hora atual
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default BreviaryPage;
