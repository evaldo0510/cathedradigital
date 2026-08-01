/**
 * BreviaryContinuousReader — Liturgia das Horas em fluxo contínuo.
 *
 * Renderiza uma (modo 'hour') ou todas as sete horas (modo 'day') em um
 * único fluxo, interpolando o Próprio do dia (antífonas, salmodia, leitura
 * breve, cântico evangélico, preces, oração conclusiva) dentro do Ordinário.
 *
 * - Persistência de cursor por contextKey no localStorage (autosave via
 *   IntersectionObserver).
 * - Deep link `?b=<blockAnchorId>` faz scroll para o trecho exato.
 * - Áudio narrado por bloco (`PrayerTTSButton`).
 * - `ReaderContinuation` (Nexus automático) ao final.
 *
 * Não altera schema: reutiliza `usePrayerHierarchy('liturgia-das-horas')`
 * e `useLiturgyHoursOffice(isoDate, hour, liturgy)`.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Icons } from '../../constants';
import { flattenSectionToBlocks, type PrayerHierarchy } from '@/prayer-engine/loadPrayerHierarchy';
import type { PrayerBlock } from '@/types/prayer';
import type { Prayer } from '@/hooks/usePrayers';
import type { DailyLiturgy } from '@/core/liturgy/LiturgyProvider';
import type { HourSlug, LiturgyHoursOfficeRow, OfficePsalmody } from '@/hooks/useLiturgyHoursOffice';
import {
  ReaderShell,
  EditorialHero,
  LiturgicalContext,
  NexusPanel,
  ReaderContinuation,
} from '@/components/reader';

import { resolvePrayerAutoNexus } from '@/core/knowledge/adapters/prayerAutoNexus';
import { PrayerTTSButton } from './PrayerTTSButton';
import { LiturgyBlockCard } from './primitives/liturgy/LiturgyBlockCard';
import { EditorialClosure } from '@/components/reader';
import { resolveEditorialClosure } from '@/lib/editorial/resolveClosure';

export interface BreviaryHourBundle {
  hourSlug: HourSlug;
  title: string;
  subtitle?: string | null;
  ordinaryBlocks: PrayerBlock[];
  office: LiturgyHoursOfficeRow | null;
  officeLoading: boolean;
}

interface Props {
  prayer: Prayer;
  hierarchy: PrayerHierarchy;
  hours: BreviaryHourBundle[];
  isoDate: string;
  /** Chave estável para persistência do cursor (ex.: `breviary:hour:laudes:2026-07-21`). */
  contextKey: string;
  /** Deep link ?b= para restaurar posição exata. */
  initialBlockId?: string | null;
  liturgy?: DailyLiturgy | null;
  contentStyle?: React.CSSProperties;
  /** Modo Celebração — tipografia ampliada, sem chrome adjacente. */
  celebrationMode?: boolean;
}

/* ─────────────────────── SlotCard editorial ─────────────────────── */
/* ─────────────────────── SlotCard editorial ───────────────────────
 * Unificado via `LiturgyBlockCard` (Etapa 1 · Sprint C.4).
 * O breviário sempre oferece TTS por bloco, então defaultamos `withTTS`.
 * ------------------------------------------------------------------ */

const SlotCard: React.FC<
  Omit<React.ComponentProps<typeof LiturgyBlockCard>, 'withTTS'> & { withTTS?: boolean }
> = ({ withTTS = true, ...rest }) => <LiturgyBlockCard withTTS={withTTS} {...rest} />;

/* ─────────────────────── Ordinário block ─────────────────────── */

const OrdinaryBlockView: React.FC<{ block: PrayerBlock; anchorId: string; celebrationMode?: boolean }> = ({
  block, anchorId, celebrationMode,
}) => {
  const tts = block.body ? [block.title, block.body].filter(Boolean).join('. ') : null;
  return (
    <article
      id={anchorId}
      data-block-id={anchorId}
      className="scroll-mt-24 py-spacing-sm"
    >
      {block.title && (
        <header className="mb-spacing-2xs flex items-start justify-between gap-spacing-sm">
          <h4 className={cn(
            'font-stitch-display text-foreground',
            celebrationMode ? 'text-premium-xl' : 'text-premium-base md:text-premium-lg',
          )}>{block.title}</h4>
          {tts && !celebrationMode && <PrayerTTSButton text={tts} label="Ouvir" />}
        </header>
      )}
      {block.rubric && (
        <p className="mb-spacing-2xs font-serif italic text-premium-xs text-primary/80">{block.rubric}</p>
      )}
      {block.body && (
        <p className={cn(
          'whitespace-pre-line font-stitch-display leading-[1.7] text-foreground',
          celebrationMode ? 'text-premium-xl md:text-premium-2xl' : 'text-premium-base md:text-premium-lg',
        )}>{block.body}</p>
      )}
      {block.latin && (
        <p className="mt-spacing-2xs whitespace-pre-line font-serif italic text-premium-xs text-muted-foreground">
          {block.latin}
        </p>
      )}
    </article>
  );
};

/* ─────────────────────── Hour section ─────────────────────── */

const HourSection: React.FC<{ hour: BreviaryHourBundle; celebrationMode?: boolean }> = ({
  hour, celebrationMode,
}) => {
  const { hourSlug, title, subtitle, ordinaryBlocks, office, officeLoading } = hour;
  const anchor = (suffix: string) => `hour:${hourSlug}:${suffix}`;

  return (
    <section id={`hour-${hourSlug}`} aria-labelledby={`hour-${hourSlug}-title`} className="scroll-mt-24">
      <header className="text-center border-b border-border/50 pb-spacing-md mb-spacing-md">
        <p className="font-stitch-body text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          Liturgia das Horas
        </p>
        <h2
          id={`hour-${hourSlug}-title`}
          className={cn(
            'mt-spacing-2xs font-display font-bold text-foreground',
            celebrationMode ? 'text-premium-4xl md:text-premium-5xl' : 'text-premium-2xl md:text-premium-3xl',
          )}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-spacing-2xs font-serif italic text-premium-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
        {office?.season_note && (
          <p className="mt-spacing-2xs font-stitch-body text-premium-xs uppercase tracking-widest text-muted-foreground">
            {office.season_note}
          </p>
        )}
      </header>

      {/* Antífona de abertura (Próprio) */}
      {(officeLoading || office?.antiphon_opening) && (
        <SlotCard
          anchorId={anchor('antiphon-opening')}
          kicker="Antífona · Abertura"
          text={office?.antiphon_opening ?? null}
          variant="antiphon"
          loading={officeLoading && !office}
          celebrationMode={celebrationMode}
        />
      )}

      {/* Ordinário do banco */}
      {ordinaryBlocks.map((block) => (
        <OrdinaryBlockView
          key={block.id}
          block={block}
          anchorId={anchor(`ord:${block.id}`)}
          celebrationMode={celebrationMode}
        />
      ))}

      {/* Salmodia (Próprio) */}
      {office?.psalmody?.length ? office.psalmody.map((p: OfficePsalmody, idx) => (
        <SlotCard
          key={`psalm-${idx}`}
          anchorId={anchor(`psalm-${idx}`)}
          kicker={`Salmodia · ${idx + 1}`}
          title={p.reference}
          text={`${p.antiphon ? `Antífona: ${p.antiphon}\n\n` : ''}${p.text}`}
          variant="psalm"
          celebrationMode={celebrationMode}
        />
      )) : officeLoading && (
        <SlotCard
          anchorId={anchor('psalm-loading')}
          kicker="Salmodia"
          loading
          variant="psalm"
        />
      )}

      {/* Leitura breve (Próprio) */}
      {(office?.brief_reading_text || officeLoading) && (
        <SlotCard
          anchorId={anchor('brief-reading')}
          kicker="Leitura Breve"
          title={office?.brief_reading_ref ?? undefined}
          text={office?.brief_reading_text ?? null}
          loading={officeLoading && !office}
          celebrationMode={celebrationMode}
        />
      )}

      {/* Responsório (Próprio) */}
      {office?.responsory && (
        <SlotCard
          anchorId={anchor('responsory')}
          kicker="Responsório"
          text={office.responsory}
          variant="antiphon"
          celebrationMode={celebrationMode}
        />
      )}

      {/* Cântico evangélico (Próprio) */}
      {office?.gospel_canticle && (
        <SlotCard
          anchorId={anchor('gospel-canticle')}
          kicker="Cântico Evangélico"
          title={office.gospel_canticle.reference}
          text={`${office.gospel_canticle.antiphon ? `Antífona: ${office.gospel_canticle.antiphon}\n\n` : ''}${office.gospel_canticle.text}`}
          celebrationMode={celebrationMode}
        />
      )}

      {/* Preces (Próprio) */}
      {office?.intercessions?.length ? (
        <SlotCard
          anchorId={anchor('intercessions')}
          kicker="Preces"
          text={office.intercessions.map((i) => `• ${i}`).join('\n')}
          celebrationMode={celebrationMode}
        />
      ) : null}

      {/* Oração conclusiva (Próprio) */}
      {(office?.concluding_prayer || officeLoading) && (
        <SlotCard
          anchorId={anchor('concluding-prayer')}
          kicker="Oração Conclusiva"
          text={office?.concluding_prayer ?? null}
          variant="concluding"
          loading={officeLoading && !office}
          celebrationMode={celebrationMode}
        />
      )}
    </section>
  );
};

/* ─────────────────────── Main ─────────────────────── */

const CURSOR_PREFIX = 'prayer-cursor';

export const BreviaryContinuousReader: React.FC<Props> = ({
  prayer, hierarchy, hours, isoDate, contextKey, initialBlockId,
  liturgy, contentStyle, celebrationMode,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const cursorKey = `${CURSOR_PREFIX}:${contextKey}`;

  // Restaurar cursor (deep link tem prioridade sobre localStorage)
  useEffect(() => {
    const target =
      initialBlockId ??
      (typeof window !== 'undefined' ? window.localStorage.getItem(cursorKey) : null);
    if (!target) return;
    const t = setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${CSS.escape(target)}"]`) as HTMLElement | null;
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 250);
    return () => clearTimeout(t);
  }, [cursorKey, initialBlockId, isoDate]);

  // Autosave cursor via IntersectionObserver
  useEffect(() => {
    if (!rootRef.current || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const id = (visible?.target as HTMLElement | undefined)?.dataset.blockId;
        if (id) window.localStorage.setItem(cursorKey, id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.25, 1] },
    );
    rootRef.current.querySelectorAll<HTMLElement>('[data-block-id]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [cursorKey, hours, isoDate]);

  // Sugestões Nexus para o final da sessão
  const nexus = useMemo(
    () =>
      resolvePrayerAutoNexus({
        slug: prayer.slug,
        title: prayer.title,
        category: (prayer as unknown as { category?: string | null }).category ?? null,
      }),
    [prayer],
  );

  const primaryHour = hours[0];
  const heroTitle = hours.length > 1
    ? 'Liturgia das Horas'
    : (primaryHour?.title ?? 'Liturgia das Horas');
  const heroKicker = hours.length > 1
    ? `Ofício divino · ${new Date(isoDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`
    : (primaryHour?.subtitle ?? undefined);

  const dateLabel = new Date(isoDate + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const liturgicalColor = liturgy?.cor ?? null;
  const liturgicalSeason = liturgy?.season ?? primaryHour?.office?.season_note ?? null;

  const body = (
    <div ref={rootRef} style={contentStyle}>
      {hours.map((h) => (
        <HourSection key={h.hourSlug} hour={h} celebrationMode={celebrationMode} />
      ))}

      <footer className="mt-spacing-xl border-t border-border/50 pt-spacing-lg text-center">
        <Icons.Cross className="w-spacing-md h-spacing-md text-primary mx-auto" />
        <p className="mt-spacing-sm font-serif italic text-muted-foreground">
          Bendigamos ao Senhor. — Graças a Deus.
        </p>
      </footer>
    </div>
  );

  if (celebrationMode) {
    return <div className="mx-auto max-w-3xl">{body}</div>;
  }

  return (
    <ReaderShell
      hero={
        <EditorialHero
          kicker={heroKicker}
          title={heroTitle}
          align="center"
          size="md"
        />
      }
      headerContext={
        <LiturgicalContext
          date={dateLabel}
          color={liturgicalColor ?? undefined}
          season={liturgicalSeason ?? undefined}
        />
      }
      contentMaxWidth="max-w-3xl"
      ariaLabel="Liturgia das Horas"
      nexus={<NexusPanel output={nexus} />}
      continuation={(() => {
        const closure = resolveEditorialClosure(prayer as unknown as { editorial_closure?: unknown });
        const hasSuggestions = nexus.suggestions.length > 0;
        if (!closure && !hasSuggestions) return undefined;
        return (
          <div className="flex flex-col gap-spacing-2xl">
            {closure ? <EditorialClosure {...closure} /> : null}
            {hasSuggestions ? (
              <ReaderContinuation
                context={{ kind: 'prayer', id: prayer.slug }}
                suggestions={nexus.suggestions}
              />
            ) : null}
          </div>
        );
      })()}
    >
      {body}
    </ReaderShell>
  );
};

export default BreviaryContinuousReader;

