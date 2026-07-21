/**
 * PrayerPortal — Portal Universal de Oração (B.2.5).
 *
 * Espaço de preparação exibido ANTES do PrayerEngineReader. Não é uma
 * landing de marketing: é um limiar contemplativo. O usuário chega,
 * respira, ajusta configurações e só então entra em oração.
 *
 * Estrutura:
 *   1. Hero limpo (kicker · título · versículo · mistério do dia · duração)
 *   2. Mistério do dia (cor litúrgica, fruto, Evangelho)
 *   3. Preparar o coração (convite curto)
 *   4. Configurações (modo + ritmo)
 *   5. Continuar / Recomeçar (quando há sessão aberta)
 *   6. ENTRAR EM ORAÇÃO (botão único, grande)
 *
 * Pilot: Rosário. O componente é agnóstico ao tipo de oração e será
 * reusado por Via Sacra, Liturgia das Horas, Missal, Lectio, Ladainhas,
 * Novenas, Terços e orações tradicionais.
 *
 * Contraste: todo texto de leitura usa `text-stitch-on-surface` (nunca
 * `-variant` para corpo). Rótulos micro (eyebrows/meta) ficam em
 * `stitch-secondary` para hierarquia sem apagar a leitura.
 */
import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, Sparkles, PlayCircle, RotateCcw, BookOpen, Church, Circle } from 'lucide-react';
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

interface Props {
  prayer: Prayer;
  activeSection: DBSection | null;
  mysteries: DBMystery[];
  kicker: string;
  /** Rota destino ao "Entrar em oração" (default: rota atual + ?enter=1). */
  onEnter?: () => void;
}

const OPENING_QUOTE: Record<string, { text: string; ref: string }> = {
  rosario: { text: 'Permanecei em mim, e eu em vós.', ref: 'Jo 15,4' },
  'via-sacra': { text: 'Se alguém quer vir após mim, tome a sua cruz.', ref: 'Mt 16,24' },
};

/**
 * Palavras curtas para a linha "≈ 25 minutos". Prayer.estimated_seconds já
 * é o total; convertemos com arredondamento amigável.
 */
function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '';
  const min = Math.max(1, Math.round(seconds / 60));
  return `≈ ${min} min`;
}

const PrayerPortal: React.FC<Props> = ({ prayer, activeSection, mysteries, kicker, onEnter }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const session = usePrayerEngineSession(prayer.id);
  const [mode, setMode] = React.useState<PrayerMode>(() => {
    const stored = typeof window !== 'undefined'
      ? (localStorage.getItem('cathedra.prayer.mode') as PrayerMode | null)
      : null;
    return stored ?? 'guided';
  });

  const palette = resolveMysteryPalette(activeSection?.slug);
  const quote = OPENING_QUOTE[prayer.slug];

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

  const hasOpenSession = Boolean(
    session.session && session.session.current_block_uuid && !session.session.completed_at,
  );
  const completedCount = session.session?.completed_mystery_ids?.length ?? 0;
  const resumeLabel = dayMystery && completedCount > 0
    ? `${completedCount}º mistério concluído`
    : 'Retomar de onde parou';

  const handleEnter = () => {
    localStorage.setItem('cathedra.prayer.mode', mode);
    if (onEnter) return onEnter();
    const next = new URLSearchParams(searchParams);
    next.set('enter', '1');
    next.set('mode', mode);
    setSearchParams(next, { replace: true });
  };

  const handleRestart = async () => {
    await session.reset();
    handleEnter();
  };

  return (
    <main
      className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-10 md:px-8 md:pt-16"
      aria-labelledby="portal-title"
    >
      {/* 1 — Hero limpo */}
      <EditorialHero align="center" as="header">
        <EditorialHero.Eyebrow>{kicker}</EditorialHero.Eyebrow>
        <EditorialHero.Title>
          <span id="portal-title">{prayer.title}</span>
        </EditorialHero.Title>
        {quote && (
          <EditorialHero.Subtitle>
            <span className="italic">"{quote.text}"</span>
            <span className="ml-2 not-italic text-stitch-on-surface-variant">— {quote.ref}</span>
          </EditorialHero.Subtitle>
        )}
        <EditorialHero.Meta>
          {activeSection && (
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-stitch-secondary" aria-hidden />
              {activeSection.title}
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

      {/* 2 — Mistério do dia */}
      {dayMystery && (
        <section
          aria-labelledby="portal-mystery"
          className="mt-14 rounded-2xl border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest/60 px-6 py-7 md:px-8 md:py-8"
        >
          <div className="flex items-center gap-2">
            <Circle
              aria-hidden
              className={cn('h-2.5 w-2.5 fill-current', palette.accentClass)}
            />
            <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
              Mistério do dia
            </span>
          </div>
          <h2
            id="portal-mystery"
            className="mt-3 font-stitch-display text-2xl leading-tight text-stitch-on-surface md:text-3xl"
          >
            {dayMystery.title}
          </h2>
          {dayMystery.subtitle && (
            <p className="mt-2 font-stitch-body text-sm text-stitch-on-surface-variant">
              {dayMystery.subtitle}
            </p>
          )}

          <dl className="mt-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            {dayMystery.gospel_ref && (
              <div className="flex items-start gap-2.5">
                <BookOpen className="mt-0.5 h-4 w-4 flex-none text-stitch-secondary" aria-hidden />
                <div>
                  <dt className="font-stitch-body text-[10px] font-bold uppercase tracking-[0.2em] text-stitch-on-surface-variant">
                    Evangelho
                  </dt>
                  <dd className="mt-0.5 font-stitch-body text-stitch-on-surface">
                    {dayMystery.gospel_ref}
                  </dd>
                </div>
              </div>
            )}
            {dayMystery.fruit && (
              <div className="flex items-start gap-2.5">
                <Circle className="mt-0.5 h-4 w-4 flex-none text-stitch-secondary" aria-hidden />
                <div>
                  <dt className="font-stitch-body text-[10px] font-bold uppercase tracking-[0.2em] text-stitch-on-surface-variant">
                    Fruto espiritual
                  </dt>
                  <dd className="mt-0.5 font-stitch-body text-stitch-on-surface">
                    {dayMystery.fruit}
                  </dd>
                </div>
              </div>
            )}
            {meta?.saints && meta.saints.length > 0 && (
              <div className="flex items-start gap-2.5 md:col-span-2">
                <Church className="mt-0.5 h-4 w-4 flex-none text-stitch-secondary" aria-hidden />
                <div>
                  <dt className="font-stitch-body text-[10px] font-bold uppercase tracking-[0.2em] text-stitch-on-surface-variant">
                    Santos relacionados
                  </dt>
                  <dd className="mt-0.5 font-stitch-body text-stitch-on-surface">
                    {meta.saints.slice(0, 3).join(' · ')}
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </section>
      )}

      {/* 3 — Preparar o coração */}
      <section
        aria-labelledby="portal-prepare"
        className="mt-10 border-l-2 border-stitch-secondary/40 pl-5"
      >
        <h2
          id="portal-prepare"
          className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary"
        >
          Preparar o coração
        </h2>
        <ul className="mt-3 space-y-2 font-stitch-body text-[15px] leading-relaxed text-stitch-on-surface">
          <li>Faça alguns instantes de silêncio.</li>
          <li>Entregue suas intenções ao Senhor.</li>
          <li>Quando estiver pronto, inicie a oração.</li>
        </ul>
      </section>

      {/* 4 — Configurações */}
      <section aria-labelledby="portal-settings" className="mt-12">
        <h2
          id="portal-settings"
          className="mb-4 text-center font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary"
        >
          Como deseja rezar
        </h2>
        <div className="flex flex-col items-center gap-4">
          <PrayerModeSelector mode={mode} onChange={setMode} />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <ContemplativeSettingsDialog />
          </div>
        </div>
      </section>

      {/* 5 — Continuar / Recomeçar */}
      {hasOpenSession && (
        <section
          aria-labelledby="portal-resume"
          className="mt-12 rounded-2xl border-2 border-stitch-secondary/50 bg-stitch-secondary/[0.06] px-6 py-6 md:px-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <span
                id="portal-resume"
                className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary"
              >
                Você tem uma oração em andamento
              </span>
              <p className="mt-1.5 font-stitch-display text-lg text-stitch-on-surface">
                {resumeLabel}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="pill-active" size="pill" onClick={handleEnter}>
                <PlayCircle aria-hidden />
                Continuar
              </Button>
              <Button type="button" variant="pill" size="pill" onClick={handleRestart}>
                <RotateCcw aria-hidden />
                Recomeçar
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* 6 — ENTRAR EM ORAÇÃO */}
      <div className="mt-16 flex flex-col items-center gap-3">
        <Button
          type="button"
          size="lg"
          onClick={handleEnter}
          className={cn(
            'h-14 min-w-[260px] rounded-full px-10',
            'bg-stitch-secondary text-stitch-on-secondary hover:bg-stitch-secondary/90',
            'font-stitch-body text-[13px] font-bold uppercase tracking-[0.32em]',
            'shadow-[0_10px_30px_-12px_hsl(var(--stitch-secondary)/0.55)]',
            'transition-transform duration-200 hover:scale-[1.02]',
          )}
        >
          Entrar em oração
        </Button>
        <p className="text-center font-stitch-body text-[11px] uppercase tracking-[0.24em] text-stitch-on-surface-variant">
          Silêncio · Presença · Contemplação
        </p>
        <Link
          to="/oracao"
          className="mt-4 font-stitch-body text-xs uppercase tracking-widest text-stitch-on-surface-variant hover:text-stitch-secondary"
        >
          ← Voltar ao Livro de Orações
        </Link>
      </div>
    </main>
  );
};

export default PrayerPortal;
