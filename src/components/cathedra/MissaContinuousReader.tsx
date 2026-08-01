/**
 * MissaContinuousReader — Sprint 2 · Onda C (Missal Completo).
 *
 * Adições sobre a Onda B:
 * - C1: Orações Eucarísticas I-IV + Reconciliação + Diversas Necessidades
 *       (blocos com meta.option_group='eucharistic-prayer').
 * - C2: Opções rituais para Ato Penitencial (A/B/C), Rito da Paz, Despedida.
 *       O leitor agrupa blocos por `optionGroup`, exibe `RitualOptionSelector`
 *       e renderiza apenas o bloco escolhido; a preferência persiste em
 *       localStorage por grupo.
 * - C3: Modo Celebração (tela limpa, wake-lock, tipografia ampliada) —
 *       ativado por prop `celebrationMode`.
 * - C4: Áudio narrado por bloco via `PrayerTTSButton`.
 * - C5: Cabeçalho litúrgico enriquecido (tempo, cor, celebração, santo, saltério).
 * - C6: Cartão "Ação concreta" + ReaderContinuation (Nexus) ao final.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Icons } from '../../constants';
import { flattenSectionToBlocks, type PrayerHierarchy } from '@/prayer-engine/loadPrayerHierarchy';
import type { PrayerBlock } from '@/types/prayer';
import type { Prayer } from '@/hooks/usePrayers';
import type { DailyLiturgy } from '@/core/liturgy/LiturgyProvider';
import type { MissalProperRow } from '@/hooks/useMissalProper';
import {
  ReaderShell,
  EditorialHero,
  LiturgicalContext,
  NexusPanel,
  ReaderContinuation,
} from '@/components/reader';

import { resolvePrayerAutoNexus } from '@/core/knowledge/adapters/prayerAutoNexus';
import { useReaderTypography } from '@/hooks/useReaderTypography';
import { useSaintOfDay } from '@/hooks/useSaintOfDay';
import { PrayerTTSButton } from './PrayerTTSButton';
import { RitualOptionSelector } from './primitives/liturgy/RitualOptionSelector';
import { LiturgyRichHeader } from './primitives/liturgy/LiturgyRichHeader';
import { LiturgyBlockCard } from './primitives/liturgy/LiturgyBlockCard';
import { EditorialClosure } from '@/components/reader';
import { resolveEditorialClosure } from '@/lib/editorial/resolveClosure';
import { MissaClosingActionCard } from './primitives/liturgy/MissaClosingActionCard';

interface Props {
  prayer: Prayer;
  hierarchy: PrayerHierarchy;
  proper: MissalProperRow | null;
  properLoading: boolean;
  liturgy: DailyLiturgy | null;
  isoDate: string;
  /** C3: Modo Celebração — remove chrome adjacente. */
  celebrationMode?: boolean;
}

/* ─────────────────────── Slot Cards (editorial) ───────────────────────
 * Unificados via `LiturgyBlockCard` (Etapa 1 · Sprint C.4).
 * ------------------------------------------------------------------- */

const EntranceSlot: React.FC<{ proper: MissalProperRow | null; loading: boolean }> = ({ proper, loading }) => {
  if (!proper?.entrance_antiphon && !loading) return null;
  return (
    <LiturgyBlockCard
      kicker="Próprio · Antiphona ad introitum"
      title="Antífona de Entrada"
      text={proper?.entrance_antiphon ?? null}
      variant="antiphon"
      align="center"
      loading={loading}
    />
  );
};
const CollectSlot: React.FC<{ proper: MissalProperRow | null; loading: boolean }> = ({ proper, loading }) => (
  <LiturgyBlockCard
    kicker="Próprio · Collecta"
    title="Oração da Coleta"
    text={proper?.collect ?? null}
    loading={loading}
    note={proper?.season_note ?? null}
  />
);
const ReadingsSlot: React.FC<{ liturgy: DailyLiturgy | null }> = ({ liturgy }) => {
  if (!liturgy) return null;
  const { primeiraLeitura, salmo, segundaLeitura, evangelho } = liturgy;
  return (
    <div className="my-spacing-lg space-y-spacing-md">
      {primeiraLeitura && (
        <LiturgyBlockCard
          kicker={`Liturgia da Palavra · ${primeiraLeitura.referencia}`}
          title={primeiraLeitura.titulo || 'Primeira Leitura'}
          text={primeiraLeitura.texto}
        />
      )}
      {salmo && (
        <LiturgyBlockCard
          kicker={`Salmo Responsorial · ${salmo.referencia}`}
          title={salmo.refrao || 'Salmo'}
          text={salmo.texto}
          variant="antiphon"
          align="center"
        />
      )}
      {segundaLeitura && (
        <LiturgyBlockCard
          kicker={`Segunda Leitura · ${segundaLeitura.referencia}`}
          title={segundaLeitura.titulo || 'Segunda Leitura'}
          text={segundaLeitura.texto}
        />
      )}
      {evangelho && (
        <LiturgyBlockCard
          kicker={`Evangelho · ${evangelho.referencia}`}
          title={evangelho.titulo || 'Evangelho'}
          text={evangelho.texto}
          variant="preface"
        />
      )}
    </div>
  );
};
const OfferingsSlot: React.FC<{ proper: MissalProperRow | null; loading: boolean }> = ({ proper, loading }) => (
  <LiturgyBlockCard
    kicker="Próprio · Super oblata"
    title="Oração sobre as Oferendas"
    text={proper?.offertory_prayer ?? null}
    loading={loading}
  />
);
const PrefaceSlot: React.FC<{ proper: MissalProperRow | null; loading: boolean }> = ({ proper, loading }) => {
  if (!proper?.preface_suggestion && !loading) return null;
  return (
    <LiturgyBlockCard
      kicker="Próprio · Praefatio"
      title="Prefácio Próprio"
      text={proper?.preface_suggestion ?? null}
      variant="preface"
      loading={loading}
    />
  );
};
const CommunionSlot: React.FC<{ proper: MissalProperRow | null; loading: boolean }> = ({ proper, loading }) => {
  if (!proper?.communion_antiphon && !loading) return null;
  return (
    <LiturgyBlockCard
      kicker="Próprio · Antiphona ad communionem"
      title="Antífona de Comunhão"
      text={proper?.communion_antiphon ?? null}
      variant="antiphon"
      align="center"
      loading={loading}
    />
  );
};
const PostCommunionSlot: React.FC<{ proper: MissalProperRow | null; loading: boolean }> = ({ proper, loading }) => (
  <LiturgyBlockCard
    kicker="Próprio · Post communionem"
    title="Oração depois da Comunhão"
    text={proper?.prayer_after_communion ?? null}
    loading={loading}
  />
);

/* ─────────────────────── Block View ─────────────────────── */

const PrayerBlockView: React.FC<{ block: PrayerBlock; index: number; celebrationMode?: boolean }> = ({ block, index, celebrationMode }) => {
  const isMainPrayer = block.kind === 'prayer' || block.kind === 'intro' || block.kind === 'closing';
  const tts = block.body ? [block.title, block.body].filter(Boolean).join('. ') : null;
  return (
    <article id={`block-${block.id}`} data-block-id={block.id} className="scroll-mt-24 py-spacing-sm">
      {block.title && (
        <header className="mb-spacing-xs flex items-start justify-between gap-spacing-sm">
          <div>
            <p className="font-stitch-body text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h4 className={cn(
              'font-stitch-display text-foreground',
              celebrationMode ? 'text-premium-xl md:text-premium-2xl' : 'text-premium-base md:text-premium-lg',
            )}>{block.title}</h4>
            {block.subtitle && <p className="font-serif italic text-premium-xs text-muted-foreground">{block.subtitle}</p>}
          </div>
          {tts && !celebrationMode && <PrayerTTSButton text={tts} label="Ouvir" />}
        </header>
      )}
      {block.body && (
        <p className={cn(
          'whitespace-pre-line font-stitch-display leading-[1.7] text-foreground',
          celebrationMode
            ? 'text-premium-xl md:text-premium-2xl'
            : isMainPrayer
              ? 'text-premium-lg md:text-premium-xl first-letter:font-serif first-letter:text-primary first-letter:text-[3.5rem] first-letter:leading-[0.85] first-letter:mr-2 first-letter:float-left'
              : 'text-premium-base md:text-premium-lg',
        )}>{block.body}</p>
      )}
      {block.repeat && (
        <p className="mt-spacing-xs text-center font-stitch-body text-[11px] font-bold uppercase tracking-widest text-primary">
          {block.repeat.label} · {block.repeat.count}×
        </p>
      )}
      {block.latin && (
        <p className="mt-spacing-xs whitespace-pre-line font-stitch-display italic text-premium-sm leading-relaxed text-muted-foreground">{block.latin}</p>
      )}
      {block.rubric && (
        <aside role="note" aria-label="Rubrica litúrgica" className="mt-spacing-sm border-l-2 border-destructive pl-spacing-sm">
          <p className="font-serif italic text-premium-sm leading-relaxed text-destructive">{block.rubric}</p>
        </aside>
      )}
    </article>
  );
};

/* ─────────────────────── Grouping helper ─────────────────────── */

interface GroupedItem {
  key: string; // group key or block id
  optionGroup?: string;
  options?: { key: string; label: string; block: PrayerBlock }[];
  block?: PrayerBlock;
}

function groupBlocksByOption(blocks: PrayerBlock[]): GroupedItem[] {
  const out: GroupedItem[] = [];
  const groupsSeen = new Map<string, number>();
  for (const b of blocks) {
    if (b.optionGroup && b.optionKey) {
      const existing = groupsSeen.get(b.optionGroup);
      const item: { key: string; label: string; block: PrayerBlock } = {
        key: b.optionKey,
        label: b.optionLabel ?? b.optionKey,
        block: b,
      };
      if (existing !== undefined) {
        out[existing].options!.push(item);
      } else {
        groupsSeen.set(b.optionGroup, out.length);
        out.push({ key: `group:${b.optionGroup}`, optionGroup: b.optionGroup, options: [item] });
      }
    } else {
      out.push({ key: b.id, block: b });
    }
  }
  return out;
}

const GROUP_META: Record<string, { kicker: string; title: string }> = {
  'penitential-act': { kicker: 'Ritus Initiales', title: 'Escolha o Ato Penitencial' },
  'eucharistic-prayer': { kicker: 'Prex Eucharistica', title: 'Escolha a Oração Eucarística' },
  'pax': { kicker: 'Ritus Communionis', title: 'Rito da Paz' },
  'dismissal': { kicker: 'Ritus Conclusionis', title: 'Escolha a fórmula de despedida' },
};

/* ─────────────────────── Main Component ─────────────────────── */

const STORAGE_KEY = (isoDate: string) => `missal:continuous:${isoDate}`;
const OPTION_KEY = (group: string) => `missal:option:${group}`;

export const MissaContinuousReader: React.FC<Props> = ({
  prayer, hierarchy, proper, properLoading, liturgy, isoDate, celebrationMode = false,
}) => {
  const { wrapperStyle: typographyStyle } = useReaderTypography();
  const { data: saint } = useSaintOfDay(new Date(isoDate + 'T00:00:00'));
  const [progress, setProgress] = useState(0);
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);

  // Selecionar opção ritual (com persistência)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    const out: Record<string, string> = {};
    Object.keys(GROUP_META).forEach((g) => {
      try {
        const v = localStorage.getItem(OPTION_KEY(g));
        if (v) out[g] = v;
      } catch {}
    });
    return out;
  });

  const selectOption = (group: string, key: string) => {
    setSelectedOptions((prev) => ({ ...prev, [group]: key }));
    try { localStorage.setItem(OPTION_KEY(group), key); } catch {}
  };

  const orderedSections = useMemo(
    () => [...hierarchy.sections].sort((a, b) => a.order_index - b.order_index),
    [hierarchy],
  );

  const sectionBlocks = useMemo(
    () => orderedSections.map((s) => ({ section: s, blocks: flattenSectionToBlocks(hierarchy, s) })),
    [hierarchy, orderedSections],
  );

  const nexus = useMemo(() => resolvePrayerAutoNexus(prayer), [prayer]);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      setProgress(total > 0 ? Math.min(1, doc.scrollTop / total) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
          .sort((a, b) => (a.target.getBoundingClientRect().top ?? 0) - (b.target.getBoundingClientRect().top ?? 0))[0];
        if (visible) {
          const id = (visible.target as HTMLElement).dataset.blockId;
          if (id) {
            setCurrentBlockId(id);
            try { localStorage.setItem(STORAGE_KEY(isoDate), id); } catch {}
          }
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0.01 },
    );
    container.querySelectorAll<HTMLElement>('[data-block-id]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isoDate, sectionBlocks, selectedOptions]);

  useEffect(() => {
    if (restoredRef.current) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY(isoDate));
      if (saved) {
        const el = document.getElementById(`block-${saved}`);
        if (el) {
          restoredRef.current = true;
          requestAnimationFrame(() => el.scrollIntoView({ block: 'start', behavior: 'auto' }));
        }
      }
    } catch {}
  }, [isoDate]);

  const renderGroupedItem = (item: GroupedItem, index: number): React.ReactNode => {
    if (item.block) return <PrayerBlockView key={item.block.id} block={item.block} index={index} celebrationMode={celebrationMode} />;
    if (!item.options || !item.optionGroup) return null;
    const groupMeta = GROUP_META[item.optionGroup] ?? { kicker: item.optionGroup, title: 'Escolha' };
    const activeKey = selectedOptions[item.optionGroup] ?? item.options[0].key;
    const active = item.options.find((o) => o.key === activeKey) ?? item.options[0];
    return (
      <React.Fragment key={item.key}>
        <RitualOptionSelector
          kicker={groupMeta.kicker}
          title={groupMeta.title}
          options={item.options.map((o) => ({ key: o.key, label: o.label }))}
          selectedKey={active.key}
          onSelect={(k) => selectOption(item.optionGroup!, k)}
        />
        <PrayerBlockView block={active.block} index={index} celebrationMode={celebrationMode} />
      </React.Fragment>
    );
  };

  const renderSlotsBeforeSection = (sectionSlug: string) => {
    if (sectionSlug === 'entrada') return <EntranceSlot proper={proper} loading={properLoading} />;
    if (sectionSlug === 'palavra') return <ReadingsSlot liturgy={liturgy} />;
    if (sectionSlug === 'comunhao') return <CommunionSlot proper={proper} loading={properLoading} />;
    return null;
  };

  const renderSlotsAfterSection = (sectionSlug: string) => {
    if (sectionSlug === 'entrada') return <CollectSlot proper={proper} loading={properLoading} />;
    if (sectionSlug === 'eucaristica') return (
      <>
        <OfferingsSlot proper={proper} loading={properLoading} />
        <PrefaceSlot proper={proper} loading={properLoading} />
      </>
    );
    if (sectionSlug === 'comunhao') return <PostCommunionSlot proper={proper} loading={properLoading} />;
    return null;
  };

  const dateLabel = new Date(isoDate + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const celebrationTitle = proper?.celebration_title || (properLoading ? '…' : 'Missa do Dia');
  const liturgicalColor = proper?.liturgical_color ?? liturgy?.cor ?? null;
  const liturgicalSeason = liturgy?.season ?? proper?.season_note ?? null;

  const hero = !celebrationMode ? (
    <EditorialHero
      kicker={`Santa Missa · ${dateLabel}`}
      title={celebrationTitle}
      subtitle={saint?.name ? `Memória: ${saint.name}` : undefined}
      align="center"
      size="md"
    />
  ) : null;

  const headerContext = !celebrationMode ? (
    <LiturgicalContext
      date={dateLabel}
      celebration={celebrationTitle}
      color={liturgicalColor ?? undefined}
      season={liturgicalSeason ?? undefined}
    />
  ) : null;

  const body = (
    <div className={cn(celebrationMode && 'px-spacing-md')}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso da celebração"
        className="sticky top-0 z-30 -mx-spacing-sm h-1 bg-transparent"
      >
        <div className="h-full bg-gradient-to-r from-primary via-primary to-primary transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
      </div>

      {!celebrationMode && (
        <LiturgyRichHeader liturgy={liturgy} proper={proper} saintOfDay={saint?.name ?? null} isoDate={isoDate} />
      )}

      <div ref={scrollRef} style={typographyStyle}>
        {sectionBlocks.map(({ section, blocks }) => {
          const grouped = groupBlocksByOption(blocks);
          return (
            <section
              key={section.id}
              id={`section-${section.slug}`}
              aria-labelledby={`section-title-${section.slug}`}
              className="mt-spacing-xl scroll-mt-16"
            >
              {!celebrationMode && (
                <header className="mb-spacing-md text-center">
                  <div className="mx-auto w-24 h-px bg-gradient-to-r from-transparent via-primary to-transparent mb-spacing-sm" />
                  <p className="font-stitch-body text-[11px] font-black uppercase tracking-[0.35em] text-primary">
                    {section.subtitle || section.title}
                  </p>
                  <h3 id={`section-title-${section.slug}`} className="mt-spacing-2xs font-stitch-display text-premium-2xl md:text-premium-3xl text-foreground">
                    {section.title}
                  </h3>
                </header>
              )}
              {renderSlotsBeforeSection(section.slug)}
              {grouped.map((it, idx) => renderGroupedItem(it, idx))}
              {renderSlotsAfterSection(section.slug)}
            </section>
          );
        })}
      </div>

      <MissaClosingActionCard gospelSummary={liturgy?.evangelho?.texto ?? null} />

      {currentBlockId && import.meta.env.DEV && (
        <p className="sr-only" aria-live="polite">Bloco atual: {currentBlockId}</p>
      )}

      <BackToTopFab />
    </div>
  );

  if (celebrationMode) {
    // Modo Celebração: chrome removido; apenas o corpo é renderizado.
    return <div className="mx-auto max-w-3xl px-spacing-md">{body}</div>;
  }

  return (
    <ReaderShell
      hero={hero}
      headerContext={headerContext}
      contentMaxWidth="max-w-3xl"
      ariaLabel="Santa Missa"
      nexus={<NexusPanel output={nexus} />}
      continuation={
        <div className="flex flex-col gap-spacing-2xl">
          {(() => {
            const closure = resolveEditorialClosure(prayer as unknown as { editorial_closure?: unknown });
            return closure ? <EditorialClosure {...closure} /> : null;
          })()}
          <ReaderContinuation
            context={{ kind: 'prayer', id: prayer.id }}
            suggestions={nexus.suggestions}
          />
        </div>
      }
    >
      {body}
    </ReaderShell>
  );
};


const BackToTopFab: React.FC = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Voltar ao topo da celebração"
      className="fixed bottom-24 right-4 z-40 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-premium-hover flex items-center justify-center hover:scale-105 transition-transform"
    >
      <Icons.ArrowLeft className="w-5 h-5 rotate-90" />
    </button>
  );
};

export default MissaContinuousReader;
