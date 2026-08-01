/**
 * PrayerPortal — Portal Universal de Oração (B.2.5 → B.2.5.b).
 *
 * Espaço de preparação exibido ANTES do PrayerEngineReader / leitores
 * legados. Não é landing de marketing: é um limiar contemplativo.
 *
 * Estrutura:
 *   1. Hero limpo (kicker · título · versículo · destaque do dia · duração)
 *   2. Destaque do dia (Mistério · Estação · Hora — via prop `highlight`)
 *   3. Preparar o coração
 *   4. Configurações (modo + ritmo — se `showRhythm` habilitado)
 *   5. Continuar / Recomeçar (quando há sessão aberta)
 *   6. ENTRAR EM ORAÇÃO
 *
 * Uso:
 *   • Rosário — passa `activeSection` + `mysteries` (backwards compat).
 *   • Via Sacra / Liturgia das Horas — passa `highlight` custom.
 *
 * Contraste: rótulos micro em `text-stitch-secondary font-black`; corpo
 * sempre em `text-stitch-on-surface`. `-variant` reservado a citações.
 */
import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, Sparkles, PlayCircle, RotateCcw, BookOpen, Church, Circle, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditorialHero } from '@/components/editorial/harmony';
import PrayerModeSelector, { type PrayerMode } from '@/components/prayer/PrayerModeSelector';
import ContemplativeSettingsDialog from '@/components/prayer/rosary/ContemplativeSettingsDialog';
import { resolveMysteryPalette } from '@/components/prayer/rosary/sectionPalette';
import { readMysteryMeta } from '@/components/prayer/rosary/mysteryMeta';
import { usePrayerEngineSession } from '@/prayer-engine/usePrayerEngineSession';
import type { Prayer } from '@/hooks/usePrayers';
import type { DBMystery, DBSection } from '@/prayer-engine/loadPrayerHierarchy';
import { cn } from '@/lib/utils';

export type PrayerPortalTheme = 'church' | 'passion' | 'dawn' | 'noon' | 'sunset' | 'night';


/**
 * Bloco de destaque universal — usado por orações que não têm mistérios
 * (Via Sacra usa Estação inicial; Liturgia das Horas usa Hora recomendada).
 */
export interface PortalHighlight {
  /** Rótulo micro exibido acima do título (ex.: "Estação inicial"). */
  eyebrow: string;
  /** Título do destaque (ex.: "Jesus é condenado à morte"). */
  title: string;
  /** Subtítulo opcional (ex.: latim, cor litúrgica). */
  subtitle?: string;
  /** Meta list (Evangelho / cor / fruto / etc). */
  meta?: Array<{ label: string; value: string; icon?: 'book' | 'sparkles' | 'church' | 'clock' }>;
  /** Cor de acento HSL (bolinha). Default: `stitch-secondary`. */
  accentClassName?: string;
}

interface Props {
  prayer: Prayer;
  kicker: string;
  /** Rosário: seção ativa vinda do Prayer Engine. */
  activeSection?: DBSection | null;
  /** Rosário: lista completa de mistérios para calcular o "do dia". */
  mysteries?: DBMystery[];
  /** Fallback / uso genérico: bloco de destaque manual. */
  highlight?: PortalHighlight;
  /** Versículo de abertura (opcional). Se omitido usa `OPENING_QUOTE[slug]`. */
  quote?: { text: string; ref: string };
  /** Habilita o `ContemplativeSettingsDialog` (Rosário/Via Sacra). Default: true. */
  showRhythm?: boolean;
  /** Rota destino ao "Entrar em oração" (default: rota atual + ?enter=1). */
  onEnter?: () => void;
  /** Rota do link "Voltar" (default: /oracao). */
  backHref?: string;
  /** Rótulo do link de retorno. */
  backLabel?: string;
  /** Tema visual (halo, filete, tint). Default: `church`. */
  theme?: PrayerPortalTheme;
  /** Ícone de destaque exibido no Hero.Meta e circulo do highlight. */
  accentIcon?: LucideIcon;
}


const OPENING_QUOTE: Record<string, { text: string; ref: string }> = {
  rosario: { text: 'Permanecei em mim, e eu em vós.', ref: 'Jo 15,4' },
  'via-sacra': { text: 'Se alguém quer vir após mim, tome a sua cruz.', ref: 'Mt 16,24' },
  viacrucis: { text: 'Se alguém quer vir após mim, tome a sua cruz.', ref: 'Mt 16,24' },
  'liturgia-das-horas': { text: 'Sete vezes por dia eu vos louvo.', ref: 'Sl 118,164' },
};

const ICON_MAP = {
  book: BookOpen,
  sparkles: Sparkles,
  church: Church,
  clock: Clock,
} as const;

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '';
  const min = Math.max(1, Math.round(seconds / 60));
  return `≈ ${min} min`;
}

const PrayerPortal: React.FC<Props> = ({
  prayer,
  kicker,
  activeSection = null,
  mysteries = [],
  highlight,
  quote: quoteProp,
  showRhythm = true,
  onEnter,
  backHref = '/oracao',
  backLabel = '← Voltar ao Livro de Orações',
  theme = 'church',
  accentIcon,
}) => {
  const AccentIcon = accentIcon ?? Sparkles;

  const [searchParams, setSearchParams] = useSearchParams();
  const session = usePrayerEngineSession(prayer.id);
  const [mode, setMode] = React.useState<PrayerMode>(() => {
    const stored = typeof window !== 'undefined'
      ? (localStorage.getItem('cathedra.prayer.mode') as PrayerMode | null)
      : null;
    return stored ?? 'guided';
  });

  const palette = resolveMysteryPalette(activeSection?.slug);
  const quote = quoteProp ?? OPENING_QUOTE[prayer.slug];

  const mysteriesInSection = useMemo(
    () =>
      activeSection
        ? mysteries
            .filter((m) => m.section_id === activeSection.id)
            .sort((a, b) => a.order_index - b.order_index)
        : [],
    [mysteries, activeSection],
  );

  const dayMystery = mysteriesInSection[0] ?? null;
  const meta = dayMystery ? readMysteryMeta(dayMystery) : null;

  // Highlight derivado: prioridade → prop explícita > mistério do dia.
  const resolvedHighlight: PortalHighlight | null = useMemo(() => {
    if (highlight) return highlight;
    if (!dayMystery) return null;
    const items: PortalHighlight['meta'] = [];
    if (dayMystery.gospel_ref) items.push({ label: 'Evangelho', value: dayMystery.gospel_ref, icon: 'book' });
    if (dayMystery.fruit) items.push({ label: 'Fruto espiritual', value: dayMystery.fruit, icon: 'sparkles' });
    if (meta?.related_saints && meta.related_saints.length > 0) {
      items.push({
        label: 'Santos relacionados',
        value: meta.related_saints.slice(0, 3).map((s) => s.name).join(' · '),
        icon: 'church',
      });
    }
    return {
      eyebrow: 'Mistério do dia',
      title: dayMystery.title,
      subtitle: dayMystery.subtitle ?? undefined,
      meta: items,
      accentClassName: palette.accentClass,
    };
  }, [highlight, dayMystery, meta, palette.accentClass]);

  const hasOpenSession = Boolean(
    session.session && session.session.current_block_uuid && !session.session.completed_at,
  );
  const completedCount = session.session?.completed_mystery_ids?.length ?? 0;

  // Rótulo rico para retomada — ex.: "3º Mistério Doloroso".
  const sectionShortLabel = useMemo(() => {
    if (!activeSection?.title) return null;
    // "Mistérios Dolorosos" → "Mistério Doloroso"
    return activeSection.title
      .replace(/^Mistérios?\s+/i, 'Mistério ')
      .replace(/s$/, '');
  }, [activeSection?.title]);
  const resumeOrdinal = completedCount + 1;
  const resumeTitle = sectionShortLabel
    ? `${resumeOrdinal}º ${sectionShortLabel}`
    : dayMystery?.title ?? 'Continuar oração';

  const isReducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const [thresholdActive, setThresholdActive] = React.useState(false);

  const commitEnter = () => {
    localStorage.setItem('cathedra.prayer.mode', mode);
    if (onEnter) return onEnter();
    const next = new URLSearchParams(searchParams);
    next.set('enter', '1');
    next.set('mode', mode);
    setSearchParams(next, { replace: true });
  };

  const handleEnter = () => {
    if (isReducedMotion) return commitEnter();
    setThresholdActive(true);
    // 780ms = duração do keyframe portal-threshold
    window.setTimeout(commitEnter, 700);
  };

  const handleRestart = async () => {
    await session.reset();
    handleEnter();
  };


  return (
    <section
      className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-10 md:px-8 md:pt-16"
      aria-labelledby="portal-title"
      data-testid="prayer-portal"
      data-portal-oracao
      data-portal-theme={theme}
    >
      {/* 1 — Hero limpo */}
      <EditorialHero align="center" as="header">
        <EditorialHero.Eyebrow>{kicker}</EditorialHero.Eyebrow>
        <EditorialHero.Title>
          <span id="portal-title">{prayer.title}</span>
        </EditorialHero.Title>
        {quote && (
          <EditorialHero.Subtitle>
            <span className="italic text-stitch-on-surface">"{quote.text}"</span>
            <span className="ml-2 not-italic font-stitch-body text-[13px] font-bold text-stitch-secondary">— {quote.ref}</span>
          </EditorialHero.Subtitle>
        )}
        <EditorialHero.Meta>
          {resolvedHighlight && (
            <span className="inline-flex items-center gap-1.5">
              <AccentIcon className="h-3.5 w-3.5 text-stitch-secondary" aria-hidden />
              {resolvedHighlight.title}
            </span>
          )}

          {prayer.estimated_seconds && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {formatDuration(prayer.estimated_seconds)}
            </span>
          )}
        </EditorialHero.Meta>
      </EditorialHero>

      {/* 2 — Destaque do dia */}
      {resolvedHighlight && (
        <section
          aria-labelledby="portal-highlight"
          className="mt-14 rounded-2xl border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest/60 px-6 py-7 md:px-8 md:py-8"
          data-testid="portal-highlight"
        >
          <div className="flex items-center gap-2">
            <Circle
              aria-hidden
              className={cn('h-2.5 w-2.5 fill-current', resolvedHighlight.accentClassName ?? 'text-stitch-secondary')}
            />
            <span className="font-stitch-body text-[11px] font-black uppercase tracking-[0.28em] text-stitch-secondary">
              {resolvedHighlight.eyebrow}
            </span>
          </div>
          <h2
            id="portal-highlight"
            className="mt-3 font-stitch-display text-2xl leading-tight text-stitch-on-surface md:text-3xl"
          >
            {resolvedHighlight.title}
          </h2>
          {resolvedHighlight.subtitle && (
            <p className="mt-2 font-stitch-body text-sm font-medium text-stitch-on-surface">
              {resolvedHighlight.subtitle}
            </p>
          )}

          {resolvedHighlight.meta && resolvedHighlight.meta.length > 0 && (
            <dl className="mt-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              {resolvedHighlight.meta.map((item, idx) => {
                const Icon = ICON_MAP[item.icon ?? 'sparkles'];
                const spanAll = resolvedHighlight.meta && resolvedHighlight.meta.length % 2 === 1 && idx === resolvedHighlight.meta.length - 1;
                return (
                  <div key={item.label} className={cn('flex items-start gap-2.5', spanAll && 'md:col-span-2')}>
                    <Icon className="mt-0.5 h-4 w-4 flex-none text-stitch-secondary" aria-hidden />
                    <div>
                      <dt className="font-stitch-body text-[10px] font-black uppercase tracking-[0.22em] text-stitch-secondary">
                        {item.label}
                      </dt>
                      <dd className="mt-0.5 font-stitch-body font-medium text-stitch-on-surface">
                        {item.value}
                      </dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          )}
        </section>
      )}

      {/* 3 — Preparar o coração */}
      <section
        aria-labelledby="portal-prepare"
        className="mt-10 border-l-2 border-stitch-secondary/60 pl-5"
      >
        <h2
          id="portal-prepare"
          className="font-stitch-body text-[11px] font-black uppercase tracking-[0.28em] text-stitch-secondary"
        >
          Preparar o coração
        </h2>
        <ul className="mt-3 space-y-2 font-stitch-body text-[15px] font-medium leading-relaxed text-stitch-on-surface">
          <li>Faça alguns instantes de silêncio.</li>
          <li>Entregue suas intenções ao Senhor.</li>
          <li>Quando estiver pronto, inicie a oração.</li>
        </ul>
      </section>

      {/* 4 — Configurações */}
      <section aria-labelledby="portal-settings" className="mt-12">
        <h2
          id="portal-settings"
          className="mb-4 text-center font-stitch-body text-[11px] font-black uppercase tracking-[0.28em] text-stitch-secondary"
        >
          Como deseja rezar
        </h2>
        <div className="flex flex-col items-center gap-4">
          <PrayerModeSelector mode={mode} onChange={setMode} />
          {showRhythm && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ContemplativeSettingsDialog />
            </div>
          )}
        </div>
      </section>

      {/* 5 — Você parou aqui (promovido: vira o card mais forte) */}
      {hasOpenSession && (
        <section
          aria-labelledby="portal-resume"
          className={cn(
            'mt-14 rounded-2xl border-2 border-stitch-secondary/70 px-6 py-7 md:px-9 md:py-8',
            'bg-[linear-gradient(180deg,hsl(var(--stitch-secondary)/0.14),hsl(var(--stitch-secondary)/0.06))]',
            'shadow-[0_12px_40px_-18px_hsl(var(--stitch-secondary)/0.5)]',
          )}
          data-testid="portal-resume"
        >
          <span
            id="portal-resume"
            className="font-stitch-body text-[11px] font-black uppercase tracking-[0.28em] text-stitch-secondary"
          >
            Você parou no
          </span>
          <p className="mt-2 font-stitch-display text-2xl leading-tight text-stitch-on-surface md:text-3xl">
            {resumeTitle}
          </p>
          <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              size="lg"
              onClick={handleEnter}
              data-testid="portal-continue"
              className={cn(
                'h-12 flex-1 rounded-full px-8',
                'bg-stitch-secondary text-stitch-secondary-foreground hover:bg-stitch-secondary/90',
                'font-stitch-body text-[12px] font-black uppercase tracking-[0.28em]',
                'shadow-[0_8px_24px_-10px_hsl(var(--stitch-secondary)/0.55)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary focus-visible:ring-offset-2',
              )}
            >
              <PlayCircle className="h-4 w-4" aria-hidden />
              Continuar oração
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={handleRestart}
              data-testid="portal-restart"
              className="h-12 rounded-full px-6 font-stitch-body text-[12px] font-bold uppercase tracking-[0.24em] text-stitch-on-surface hover:bg-stitch-secondary/10 hover:text-stitch-secondary"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Recomeçar
            </Button>
          </div>
        </section>
      )}

      {/* 6 — ENTRAR EM ORAÇÃO (CTA único quando não há sessão) */}
      {!hasOpenSession && (
        <div className="mt-16 flex flex-col items-center gap-3">
          <Button
            type="button"
            size="lg"
            onClick={handleEnter}
            data-testid="portal-enter"
            className={cn(
              'h-14 min-w-[260px] rounded-full px-10',
              'bg-stitch-secondary text-stitch-secondary-foreground hover:bg-stitch-secondary/90',
              'font-stitch-body text-[13px] font-black uppercase tracking-[0.32em]',
              'shadow-[0_10px_30px_-12px_hsl(var(--stitch-secondary)/0.55)]',
              'transition-transform duration-200 hover:scale-[1.02]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary focus-visible:ring-offset-2',
            )}
          >
            Entrar em oração
          </Button>
          <p className="text-center font-stitch-body text-[12px] font-bold uppercase tracking-[0.24em] text-stitch-secondary">
            Silêncio · Presença · Contemplação
          </p>
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Link
          to={backHref}
          className="inline-flex min-h-[44px] items-center font-stitch-body text-xs font-semibold uppercase tracking-widest text-stitch-on-surface hover:text-stitch-secondary"
        >
          {backLabel}
        </Link>
      </div>

      {thresholdActive && <div data-portal-threshold aria-hidden="true" />}
    </section>
  );
};

export default PrayerPortal;

