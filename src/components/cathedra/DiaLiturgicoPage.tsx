/**
 * DiaLiturgicoPage — Homologação do Liturgy Expert.
 *
 * Página parametrizada por data (`/liturgia/dia/:d?`, default: hoje) que
 * agrega, em uma única peregrinação, todos os módulos litúrgicos do
 * Cathedra sem introduzir componentes paralelos:
 *
 *   • Cabeçalho do dia    — LiturgyDayHeader (tempo, cor, celebração)
 *   • Santo do Dia        — useSaintOfDay + EditorialCard (balanced)
 *   • Missal (Próprio)    — MissalProperCards inline + CTA /missal?d=…
 *   • Liturgia das Horas  — grid de EditorialCard → /breviary?d=…&hour=…
 *   • Continuação         — ReaderContinuation (Bíblia · Catecismo · Rosário)
 *
 * Todos os links são internos (SPA). `data-space="church"` é aplicado por
 * `resolveSpaceForPath` (rota já mapeada). Sem URL hardcoded.
 *
 * Ver `docs/CATHEDRA-CONSTITUTION.md`, artigos 3, 6, 7, 8, 9.
 */
import React, { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

import { EditorialHero, EditorialCard } from '@/components/editorial/harmony';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/SEOHead';
import { Icons } from '@/constants';

import { useDailyLiturgy } from '@/hooks/useDailyLiturgy';
import { useMissalProper } from '@/hooks/useMissalProper';
import { useSaintOfDay } from '@/hooks/useSaintOfDay';
import { useRecommendedHour } from '@/hooks/useRecommendedHour';
import { usePrayers } from '@/hooks/usePrayers';
import { toIsoDateKey } from '@/core/liturgy/LiturgyProvider';

import { LiturgyDateNav } from './primitives/liturgy/LiturgyDateNav';
import { LiturgyDayHeader } from './primitives/liturgy/LiturgyDayHeader';
import { MissalProperCards } from './primitives/liturgy/MissalProperCards';
import ReaderContinuation from '@/components/shared/ReaderContinuation';

const CANONICAL_BASE = 'https://www.cathedradigital.com.br';

function parseDateParam(raw: string | undefined): Date {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date();
  const [y, m, d] = raw.split('-').map(Number);
  const nd = new Date(y, m - 1, d);
  return Number.isNaN(nd.getTime()) ? new Date() : nd;
}

function formatFullDate(d: Date): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

const HOUR_ORDER: readonly string[] = [
  'breviario-oficio-leituras',
  'breviario-laudes',
  'breviario-hora-media',
  'breviario-vesperas',
  'breviario-completas',
];

const DiaLiturgicoPage: React.FC = () => {
  const params = useParams<{ d?: string }>();
  const navigate = useNavigate();

  const selectedDate = useMemo(() => parseDateParam(params.d), [params.d]);
  const isoDate = toIsoDateKey(selectedDate);
  const todayIso = toIsoDateKey(new Date());
  const isToday = isoDate === todayIso;

  const setSelectedDate = useCallback(
    (d: Date) => {
      const iso = toIsoDateKey(d);
      navigate(iso === todayIso ? '/liturgia/dia' : `/liturgia/dia/${iso}`, { replace: false });
    },
    [navigate, todayIso],
  );

  const { liturgy, isLoading: liturgyLoading } = useDailyLiturgy(selectedDate);
  const { proper, isLoading: properLoading } = useMissalProper(isoDate, liturgy);
  const { data: saint } = useSaintOfDay(selectedDate);
  const recommended = useRecommendedHour(selectedDate);
  const { prayers } = usePrayers();

  const hours = useMemo(
    () =>
      HOUR_ORDER.map((slug) => prayers.find((p) => p.slug === slug)).filter(
        (p): p is NonNullable<typeof p> => Boolean(p),
      ),
    [prayers],
  );

  const dateLabel = formatFullDate(selectedDate);
  const celebration = liturgy?.liturgia ?? (liturgyLoading ? 'Carregando celebração…' : 'Dia Litúrgico');
  const canonical = `${CANONICAL_BASE}/liturgia/dia${isToday ? '' : `/${isoDate}`}`;

  // Referência para a Continuação (evangelho > 1ª leitura > salmo)
  const scriptureRef =
    liturgy?.evangelho?.referencia ??
    liturgy?.primeiraLeitura?.referencia ??
    liturgy?.salmo?.referencia ??
    null;

  return (
    <>
      <SEOHead
        title={`Dia Litúrgico · ${dateLabel}`}
        description={`${celebration}. Missal, Liturgia das Horas, Santo do Dia e Escrituras — a peregrinação litúrgica completa do Cathedra.`}
        path={`/liturgia/dia${isToday ? '' : `/${isoDate}`}`}
      />
      <Helmet>
        <link rel="canonical" href={canonical} />
      </Helmet>

      <div className="w-full space-y-spacing-2xl pb-spacing-3xl">
        {/* ── Hero editorial ───────────────────────────────────────── */}
        <EditorialHero align="center">
          <EditorialHero.Eyebrow>Cathedra · Dia Litúrgico</EditorialHero.Eyebrow>
          <EditorialHero.Title>{isToday ? 'Hoje na Igreja' : 'Dia Litúrgico'}</EditorialHero.Title>
          <EditorialHero.Subtitle>
            {celebration}
            {liturgy?.season ? ` · ${liturgy.season}` : ''}
          </EditorialHero.Subtitle>
          <EditorialHero.Meta>{dateLabel}</EditorialHero.Meta>
        </EditorialHero>

        {/* ── Navegação de data ────────────────────────────────────── */}
        <LiturgyDateNav date={selectedDate} onChange={setSelectedDate} isToday={isToday} />

        {/* ── Cabeçalho do dia (cor litúrgica, tempo) ─────────────── */}
        {liturgy ? (
          <LiturgyDayHeader
            formattedDate={dateLabel}
            isToday={isToday}
            liturgia={liturgy.liturgia}
            dia={liturgy.dia}
            season={liturgy.season}
            colorToken={liturgy.colorToken}
          />
        ) : (
          <div className="mx-auto max-w-2xl space-y-spacing-xs">
            <Skeleton className="h-6 w-2/3 mx-auto" />
            <Skeleton className="h-8 w-1/2 mx-auto" />
          </div>
        )}

        {/* ── Santo do Dia ─────────────────────────────────────────── */}
        <section
          aria-label="Santo do Dia"
          className="mx-auto max-w-3xl px-spacing-sm"
        >
          <EditorialCard density="balanced" as="article">
            <EditorialCard.Eyebrow>Santo do Dia</EditorialCard.Eyebrow>
            <EditorialCard.Title>
              {saint?.name ?? (isToday ? 'Consultando o santoral…' : 'Sem memória específica')}
            </EditorialCard.Title>
            {saint?.title && (
              <EditorialCard.Description>{saint.title}</EditorialCard.Description>
            )}
            {saint?.slug && (
              <EditorialCard.CTA>
                <Link
                  to={`/santos/${saint.slug}`}
                  className="inline-flex items-center gap-spacing-2xs text-primary hover:underline text-premium-sm font-black uppercase tracking-widest"
                >
                  <Icons.User className="w-spacing-sm h-spacing-sm" />
                  Vida e testemunho
                </Link>
              </EditorialCard.CTA>
            )}
          </EditorialCard>
        </section>

        {/* ── Missal · Próprio do Dia ──────────────────────────────── */}
        <section
          aria-label="Missal — Próprio do Dia"
          className="mx-auto max-w-3xl px-spacing-sm space-y-spacing-md"
        >
          <header className="flex items-baseline justify-between gap-spacing-sm">
            <div>
              <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">
                Missal Romano
              </p>
              <h2 className="font-display text-premium-xl text-foreground">Próprio do Dia</h2>
            </div>
            <Button asChild variant="outline" className="rounded-premium-full">
              <Link to={`/missal${isToday ? '' : `?d=${isoDate}`}`}>
                Celebrar
                <Icons.ArrowRight className="w-spacing-sm h-spacing-sm ml-spacing-2xs" />
              </Link>
            </Button>
          </header>
          {(properLoading || proper) ? (
            <MissalProperCards proper={proper} isLoading={properLoading} />
          ) : (
            <p className="text-muted-foreground font-serif italic">
              Próprio ainda não gerado para {isoDate}. Abra o Missal para invocá-lo.
            </p>
          )}
        </section>

        {/* ── Liturgia das Horas ───────────────────────────────────── */}
        <section
          aria-label="Liturgia das Horas"
          className="mx-auto max-w-5xl px-spacing-sm space-y-spacing-md"
        >
          <header className="text-center">
            <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">
              Ofício Divino
            </p>
            <h2 className="font-display text-premium-xl text-foreground">Liturgia das Horas</h2>
            {recommended && isToday && (
              <p className="mt-spacing-2xs font-serif italic text-primary">
                Agora: {recommended.prayer.title} · {recommended.windowLabel}
              </p>
            )}
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-spacing-md">
            {hours.length === 0
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-premium" />
                ))
              : hours.map((h) => {
                  const isRecommended = recommended?.prayer.slug === h.slug && isToday;
                  const hourSlug = h.slug.replace(/^breviario-/, '');
                  return (
                    <EditorialCard
                      key={h.slug}
                      density="minimal"
                      as="a"
                      href={`/breviary?hour=${hourSlug}${isToday ? '' : `&d=${isoDate}`}`}
                      interactive
                    >
                      <EditorialCard.Eyebrow>
                        {isRecommended ? 'Hora recomendada agora' : 'Hora canônica'}
                      </EditorialCard.Eyebrow>
                      <EditorialCard.Title>{h.title}</EditorialCard.Title>
                      {h.subtitle && (
                        <EditorialCard.Description>{h.subtitle}</EditorialCard.Description>
                      )}
                      <EditorialCard.CTA>Rezar</EditorialCard.CTA>
                    </EditorialCard>
                  );
                })}
          </div>
        </section>

        {/* ── Continuação (Knowledge Engine) ───────────────────────── */}
        <ReaderContinuation
          context={{
            kind: 'prayer',
            id: `dia-liturgico:${isoDate}`,
            meta: {
              prayerCategory: 'liturgia',
              nextPrayerSlug: recommended?.prayer.slug,
              // pistas para o motor sugerir Bíblia/Catecismo automaticamente:
              theme: liturgy?.season ?? undefined,
            },
          }}
        />

        {/* ── Atalhos finais internos (peregrinação nunca termina) ── */}
        <div className="mx-auto max-w-3xl px-spacing-sm flex flex-wrap justify-center gap-spacing-sm">
          {scriptureRef && (
            <Button asChild variant="ghost" className="rounded-premium-full">
              <Link to="/bible">
                <Icons.BookOpen className="w-spacing-sm h-spacing-sm mr-spacing-2xs" />
                {scriptureRef}
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost" className="rounded-premium-full">
            <Link to="/rosary">
              <Icons.Flame className="w-spacing-sm h-spacing-sm mr-spacing-2xs" />
              Rosário
            </Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-premium-full">
            <Link to="/catechism">
              <Icons.Church className="w-spacing-sm h-spacing-sm mr-spacing-2xs" />
              Catecismo
            </Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-premium-full">
            <Link to="/glossario">
              <Icons.Book className="w-spacing-sm h-spacing-sm mr-spacing-2xs" />
              Glossário
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default DiaLiturgicoPage;
