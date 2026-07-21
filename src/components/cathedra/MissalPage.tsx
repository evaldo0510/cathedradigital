/**
 * MissalPage — Sprint 2 · Onda A (Refatoração editorial Logos 2030).
 *
 * - Hero editorial (kicker · title · subtítulo) alinhado ao Breviário.
 * - Ordinário divido por etapas: usuário escolhe a etapa e lê no
 *   `PrayerEngineReader` (progress bar, modo foco, persistência, tipografia,
 *   ReaderContinuation e Nexus automático herdados).
 * - Próprio do dia (leituras, coleta, oferendas, comunhão) via
 *   `MissalProperCards`, exibido como preface do reader quando uma etapa
 *   está aberta e como vista independente no seletor.
 * - Deep links:
 *     ?view=proprio|ordinario   (default: proprio)
 *     ?stage=<slug>             (etapa aberta do Ordinário)
 *     ?d=YYYY-MM-DD             (data do Próprio; default: hoje)
 */
import React, { useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import { usePrayerHierarchy } from '@/prayer-engine/usePrayerHierarchy';
import { usePrayers } from '@/hooks/usePrayers';
import { flattenSectionToBlocks } from '@/prayer-engine/loadPrayerHierarchy';
import { useDailyLiturgy } from '@/hooks/useDailyLiturgy';
import { useMissalProper } from '@/hooks/useMissalProper';
import { toIsoDateKey } from '@/core/liturgy/LiturgyProvider';
import { useReaderTypography } from '@/hooks/useReaderTypography';

import { PrayerEngineReader } from './PrayerEngineReader';
import { MissaContinuousReader } from './MissaContinuousReader';
import { MissalProperCards } from './primitives/liturgy/MissalProperCards';
import { LiturgyDateNav } from './primitives/liturgy/LiturgyDateNav';
import { ReaderTypographyControl } from './primitives/liturgy/ReaderTypographyControl';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '../../constants';
import SEOHead from '@/components/SEOHead';
import { useWakeLock } from '@/hooks/useWakeLock';
import { EditorialHero, EditorialCard } from '@/components/editorial/harmony';
import PrayerPortalStandalone from '@/components/prayer/PrayerPortalStandalone';
import { resolvePortalTheme } from '@/lib/prayer/portalTheme';

const CANONICAL_BASE = 'https://www.cathedradigital.com.br';
type MissalView = 'celebracao' | 'ordinario' | 'proprio';

function parseDateParam(raw: string | null): Date {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date();
  const [y, m, d] = raw.split('-').map(Number);
  const nd = new Date(y, m - 1, d);
  return Number.isNaN(nd.getTime()) ? new Date() : nd;
}

function isMissalView(s: string | null): s is MissalView {
  return s === 'ordinario' || s === 'proprio' || s === 'celebracao';
}

const MissalPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedDate = useMemo(() => parseDateParam(searchParams.get('d')), [searchParams]);
  const isoDate = toIsoDateKey(selectedDate);
  const todayIso = toIsoDateKey(new Date());
  const isToday = isoDate === todayIso;

  const view: MissalView = isMissalView(searchParams.get('view'))
    ? (searchParams.get('view') as MissalView)
    : 'celebracao';

  const stageSlug = searchParams.get('stage');
  const initialBlockId = searchParams.get('b');
  const celebrationMode = searchParams.get('celebration') === '1';

  const toggleCelebration = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    if (celebrationMode) next.delete('celebration');
    else next.set('celebration', '1');
    setSearchParams(next, { replace: false });
  }, [celebrationMode, searchParams, setSearchParams]);

  useWakeLock(celebrationMode);

  const setView = useCallback(
    (v: MissalView) => {
      const next = new URLSearchParams(searchParams);
      if (v === 'celebracao') next.delete('view');
      else next.set('view', v);
      if (v !== 'ordinario') next.delete('stage');
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  const setStage = useCallback(
    (slug: string | null) => {
      const next = new URLSearchParams(searchParams);
      if (slug) {
        next.set('view', 'ordinario');
        next.set('stage', slug);
      } else {
        next.delete('stage');
      }
      next.delete('b');
      setSearchParams(next, { replace: false });
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
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

  const { hierarchy, loading: ordinarioLoading } = usePrayerHierarchy('missa-ordinario');
  const { prayers } = usePrayers();
  const prayer = useMemo(
    () => prayers.find((p) => p.slug === 'missa-ordinario') ?? null,
    [prayers],
  );
  const { liturgy } = useDailyLiturgy(selectedDate);
  const { proper, isLoading: properLoading } = useMissalProper(isoDate, liturgy);
  const { wrapperStyle: typographyStyle } = useReaderTypography();

  const orderedSections = useMemo(() => {
    if (!hierarchy) return [];
    return [...hierarchy.sections].sort((a, b) => a.order_index - b.order_index);
  }, [hierarchy]);

  const activeSection = useMemo(
    () => orderedSections.find((s) => s.slug === stageSlug) ?? null,
    [orderedSections, stageSlug],
  );

  const activeBlocks = useMemo(
    () => (hierarchy && activeSection ? flattenSectionToBlocks(hierarchy, activeSection) : []),
    [hierarchy, activeSection],
  );

  const activeIndex = activeSection
    ? orderedSections.findIndex((s) => s.slug === activeSection.slug)
    : -1;
  const prevStage = activeIndex > 0 ? orderedSections[activeIndex - 1] : null;
  const nextStage =
    activeIndex >= 0 && activeIndex < orderedSections.length - 1
      ? orderedSections[activeIndex + 1]
      : null;

  // Se abrirmos ?view=ordinario sem stage e o Ordinário já carregou,
  // permanecemos no seletor de etapas (não force o primeiro stage).
  useEffect(() => {
    if (view === 'ordinario' && stageSlug && !ordinarioLoading && !activeSection) {
      // slug inválido → limpa
      const next = new URLSearchParams(searchParams);
      next.delete('stage');
      setSearchParams(next, { replace: true });
    }
  }, [view, stageSlug, ordinarioLoading, activeSection, searchParams, setSearchParams]);

  const canonical =
    `${CANONICAL_BASE}/missal?view=${view}` +
    (activeSection ? `&stage=${activeSection.slug}` : '') +
    (isToday ? '' : `&d=${isoDate}`);

  // ─────────────────────────────── Reader ativo ───────────────────────────────
  if (view === 'ordinario' && activeSection && hierarchy && prayer) {
    const pageTitle = `${activeSection.title} · Missal Romano`;
    const pageDescription = activeSection.subtitle
      ? `${activeSection.title} (${activeSection.subtitle}) — parte do Ordo Missæ.`
      : `${activeSection.title} — parte do Ordo Missæ.`;

    return (
      <>
        <SEOHead
          title={pageTitle}
          description={pageDescription}
          path={`/missal?view=ordinario&stage=${activeSection.slug}${isToday ? '' : `&d=${isoDate}`}`}
        />
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
        </Helmet>

        <div className="mx-auto max-w-3xl mb-spacing-sm flex flex-wrap items-center justify-between gap-spacing-2xs px-spacing-sm">
          <ReaderTypographyControl />
          <div className="flex items-center gap-spacing-2xs">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStage(null)}
              className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary"
            >
              <Icons.ArrowLeft className="w-spacing-sm h-spacing-sm mr-spacing-2xs" />
              Etapas
            </Button>
          </div>
        </div>

        <PrayerEngineReader
          prayer={prayer}
          blocks={activeBlocks}
          mysteries={[]}
          activeSection={activeSection}
          kicker={activeSection.subtitle ?? 'Ordo Missæ'}
          contextKey={`missal:${activeSection.slug}:${isoDate}`}
          initialBlockId={initialBlockId}
          contentStyle={typographyStyle}
          prefaceSlot={
            (proper || properLoading) ? (
              <MissalProperCards proper={proper} isLoading={properLoading} />
            ) : null
          }
        />

        {/* Navegação entre etapas do Ordinário */}
        {(prevStage || nextStage) && (
          <nav
            aria-label="Navegação entre etapas do Ordinário"
            className="mx-auto max-w-3xl mt-spacing-xl px-spacing-sm flex items-center justify-between gap-spacing-sm"
          >
            {prevStage ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStage(prevStage.slug)}
                className="flex flex-col items-start text-left"
              >
                <span className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">
                  Etapa anterior
                </span>
                <span className="font-display text-premium-base text-foreground">
                  {prevStage.title}
                </span>
              </Button>
            ) : <span />}
            {nextStage ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStage(nextStage.slug)}
                className="flex flex-col items-end text-right"
              >
                <span className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">
                  Próxima etapa
                </span>
                <span className="font-display text-premium-base text-foreground">
                  {nextStage.title}
                </span>
              </Button>
            ) : <span />}
          </nav>
        )}
      </>
    );
  }

  // ── B.2.5.d — Portal do Missal (antessala contemplativa) ──
  // Antes do seletor de vistas, exibe limiar contemplativo. Só aparece na
  // vista `celebracao` (default) e enquanto `?enter=1` não estiver ativo.
  const enterRequested = searchParams.get('enter') === '1';
  if (view === 'celebracao' && !enterRequested && !celebrationMode) {
    const missalTheme = resolvePortalTheme('missa-ordinario');
    const readingRef = liturgy?.evangelho?.referencia ?? liturgy?.primeiraLeitura?.referencia;
    return (
      <PrayerPortalStandalone
        slug="missa-ordinario"
        title="Santa Missa"
        estimatedSeconds={45 * 60}
        kicker="Cathedra · Ordo Missæ"
        backHref="/oracao"
        showRhythm={false}
        theme={missalTheme.theme}
        accentIcon={missalTheme.accentIcon}
        quote={missalTheme.quote}
        highlight={{
          eyebrow: isToday ? 'Missa de hoje' : 'Missa do dia',
          title: proper?.celebration_title ?? liturgy?.liturgia ?? 'Celebração eucarística',
          subtitle: liturgy?.season ?? liturgy?.dia ?? undefined,
          meta: [
            ...(readingRef ? [{ label: 'Escritura', value: readingRef, icon: 'book' as const }] : []),
            ...(liturgy?.cor ? [{ label: 'Cor litúrgica', value: liturgy.cor, icon: 'sparkles' as const }] : []),
            { label: 'Ordo Missæ', value: 'Ordinário · Próprio · Comunhão', icon: 'church' as const },
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

  // ─────────────────────────────── Seletor / Hero ───────────────────────────────
  return (

    <>
      <SEOHead
        title="Missal Romano · Ordo Missæ"
        description="Acompanhe a Santa Missa: Ordinário estruturado por etapas, Próprio do dia (leituras, coleta, oferendas, comunhão) e nexus com Bíblia, Catecismo, Magistério, Santos e Glossário."
        path="/missal"
      />
      <Helmet>
        <link rel="canonical" href={canonical} />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <div className="w-full space-y-spacing-xl">
        {/* Hero + Nav ocultos no Modo Celebração para tela limpa (C3) */}
        {!celebrationMode && (
          <>
            <EditorialHero align="center">
              <EditorialHero.Eyebrow>Ordo Missæ</EditorialHero.Eyebrow>
              <EditorialHero.Title>Missal Romano</EditorialHero.Title>
              <EditorialHero.Subtitle>
                O Ordinário e o Próprio da Santa Missa — 3ª edição típica do Missal Romano,
                estruturados como uma única experiência de oração.
              </EditorialHero.Subtitle>
              {liturgy?.season && (
                <EditorialHero.Meta>
                  Tempo litúrgico · {liturgy.season}
                </EditorialHero.Meta>
              )}
            </EditorialHero>


            <LiturgyDateNav date={selectedDate} onChange={setSelectedDate} isToday={isToday} />

            <div
              role="tablist"
              aria-label="Alternar visualização do Missal"
              className="bg-muted/40 p-spacing-2xs rounded-[2.5rem] border border-border/40 flex gap-spacing-2xs mx-auto w-fit shadow-premium-md"
            >
              {([
                { id: 'celebracao', label: 'Celebração', icon: <Icons.Church className="w-spacing-md h-spacing-md" /> },
                { id: 'proprio', label: 'Próprio', icon: <Icons.Calendar className="w-spacing-md h-spacing-md" /> },
                { id: 'ordinario', label: 'Ordinário', icon: <Icons.BookOpen className="w-spacing-md h-spacing-md" /> },
              ] as const).map((tab) => {
                const active = view === tab.id;
                return (
                  <Button
                    key={tab.id}
                    role="tab"
                    aria-selected={active}
                    variant="ghost"
                    onClick={() => setView(tab.id)}
                    className={`flex items-center justify-center gap-spacing-xs px-spacing-md py-spacing-sm rounded-premium-full text-premium-xs font-black uppercase tracking-widest transition-all ${
                      active
                        ? 'bg-background shadow-premium-hover text-primary'
                        : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    {tab.icon} <span>{tab.label}</span>
                  </Button>
                );
              })}
            </div>
          </>
        )}

        {/* Vista: Celebração Contínua */}
        {view === 'celebracao' && hierarchy && prayer && (
          <section aria-label="Celebração da Santa Missa">
            <div className="mb-spacing-sm flex justify-between items-center gap-spacing-sm">
              <Button
                type="button"
                variant={celebrationMode ? 'default' : 'outline'}
                onClick={toggleCelebration}
                aria-pressed={celebrationMode}
                className="rounded-full text-premium-xs font-black uppercase tracking-widest"
              >
                <Icons.Flame className="w-spacing-sm h-spacing-sm mr-spacing-2xs" />
                {celebrationMode ? 'Sair do modo celebração' : 'Modo celebração'}
              </Button>
              <ReaderTypographyControl />
            </div>
            <MissaContinuousReader
              prayer={prayer}
              hierarchy={hierarchy}
              proper={proper}
              properLoading={properLoading}
              liturgy={liturgy ?? null}
              isoDate={isoDate}
              celebrationMode={celebrationMode}
            />
          </section>
        )}
        {view === 'celebracao' && (!hierarchy || !prayer) && (
          <div className="mx-auto max-w-3xl space-y-spacing-sm">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-premium" />
            ))}
          </div>
        )}

        {/* Vista: Próprio do Dia */}
        {view === 'proprio' && (
          <section aria-label="Próprio da Missa">
            {(properLoading || proper) ? (
              <MissalProperCards proper={proper} isLoading={properLoading} />
            ) : (
              <p className="text-center text-muted-foreground font-serif italic">
                Próprio ainda não disponível para {isoDate}. Volte em instantes.
              </p>
            )}
          </section>
        )}


        {/* Vista: Ordinário — grid editorial de etapas */}
        {view === 'ordinario' && (
          <section aria-label="Etapas do Ordinário da Missa" className="space-y-spacing-md">
            <div className="text-center space-y-spacing-2xs">
              <p className="text-premium-xs font-black uppercase tracking-[0.25em] text-muted-foreground">
                Escolha a etapa
              </p>
              <p className="font-serif italic text-muted-foreground">
                Cada etapa se abre com barra de progresso, modo foco e ligações automáticas.
              </p>
            </div>

            {ordinarioLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-sm">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-premium" />
                ))}
              </div>
            ) : (
              <ol className="grid grid-cols-1 md:grid-cols-2 gap-spacing-sm list-none">
                {orderedSections.map((s, idx) => (
                  <li key={s.id}>
                    <EditorialCard
                      as="button"
                      interactive
                      onClick={() => setStage(s.slug)}
                      className="w-full text-left cursor-pointer"
                    >
                      <EditorialCard.Eyebrow>
                        Etapa {String(idx + 1).padStart(2, '0')}
                      </EditorialCard.Eyebrow>
                      <EditorialCard.Title>{s.title}</EditorialCard.Title>
                      {s.subtitle && (
                        <EditorialCard.Description>{s.subtitle}</EditorialCard.Description>
                      )}
                    </EditorialCard>
                  </li>
                ))}
              </ol>

            )}
          </section>
        )}
      </div>
    </>
  );
};

export default MissalPage;
