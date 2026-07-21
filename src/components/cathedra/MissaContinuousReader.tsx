/**
 * MissaContinuousReader — Sprint 2 · Onda B.
 *
 * Uma única leitura contínua da Santa Missa. Renderiza todo o Ordinário
 * (5 seções, ~34 blocos) em ordem e injeta os SLOTS editoriais do Próprio
 * do dia nos pontos litúrgicos corretos:
 *
 *   Ritos Iniciais
 *     → EntranceSlot (antífona de entrada)
 *     → CollectSlot  (oração da coleta)
 *   Liturgia da Palavra
 *     → ReadingsSlot (1ª leitura, salmo, 2ª leitura, evangelho)
 *   Liturgia Eucarística
 *     → OfferingsSlot (oração sobre as oferendas)
 *     → PrefaceSlot   (prefácio sugerido)
 *   Rito da Comunhão
 *     → CommunionSlot     (antífona de comunhão)
 *     → PostCommunionSlot (oração depois da comunhão)
 *   Ritos Finais
 *     → ReaderContinuation (Nexus automático)
 *
 * O leitor:
 * - Persistência: `missal:continuous:<isoDate>` grava o id do último bloco
 *   visível (IntersectionObserver) e restaura no próximo carregamento.
 * - Barra de progresso sticky com scroll depth.
 * - Rubricas em vermelho litúrgico; capitulares nas orações principais.
 * - Nexus automático plugado ao final via `resolvePrayerAutoNexus`.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Icons } from '../../constants';
import { flattenSectionToBlocks, type PrayerHierarchy } from '@/prayer-engine/loadPrayerHierarchy';
import type { PrayerBlock } from '@/types/prayer';
import type { Prayer } from '@/hooks/usePrayers';
import type { DailyLiturgy } from '@/core/liturgy/LiturgyProvider';
import type { MissalProperRow } from '@/hooks/useMissalProper';
import ReaderContinuation from '@/components/shared/ReaderContinuation';
import { resolvePrayerAutoNexus } from '@/core/knowledge/adapters/prayerAutoNexus';
import { useReaderTypography } from '@/hooks/useReaderTypography';

interface Props {
  prayer: Prayer;
  hierarchy: PrayerHierarchy;
  proper: MissalProperRow | null;
  properLoading: boolean;
  liturgy: DailyLiturgy | null;
  isoDate: string;
}

/* ─────────────────────── Slot Cards (editorial) ─────────────────────── */

interface SlotCardProps {
  kicker: string;
  title: string;
  text?: string | null;
  note?: string | null;
  variant?: 'default' | 'antiphon' | 'preface';
  loading?: boolean;
  children?: React.ReactNode;
}

const SlotCard: React.FC<SlotCardProps> = ({
  kicker,
  title,
  text,
  note,
  variant = 'default',
  loading,
  children,
}) => (
  <section
    aria-label={title}
    className={cn(
      'relative my-spacing-lg rounded-2xl border p-spacing-md md:p-spacing-lg',
      'before:absolute before:inset-x-spacing-md before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/50 before:to-transparent',
      variant === 'antiphon' &&
        'border-primary/30 bg-primary/[0.03] italic',
      variant === 'preface' &&
        'border-liturgical-gold/40 bg-liturgical-gold/[0.04]',
      variant === 'default' && 'border-border/60 bg-card/60',
    )}
  >
    <p className="font-stitch-body text-[10px] font-black uppercase tracking-[0.3em] text-primary">
      {kicker}
    </p>
    <h3 className="mt-spacing-2xs font-stitch-display text-premium-lg md:text-premium-xl leading-tight text-foreground">
      {title}
    </h3>
    {loading ? (
      <div className="mt-spacing-sm space-y-2">
        <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
        <div className="h-3 w-5/6 bg-muted/60 rounded animate-pulse" />
        <div className="h-3 w-3/4 bg-muted/60 rounded animate-pulse" />
      </div>
    ) : text ? (
      <p
        className={cn(
          'mt-spacing-sm whitespace-pre-line font-stitch-display leading-[1.65] text-foreground',
          variant === 'antiphon'
            ? 'text-premium-lg italic text-center'
            : 'text-premium-base md:text-premium-lg',
        )}
      >
        {text}
      </p>
    ) : null}
    {children}
    {note && (
      <p className="mt-spacing-sm font-stitch-body text-premium-xs italic text-muted-foreground">
        {note}
      </p>
    )}
  </section>
);

/* ─────────────────────── Slots Litúrgicos ─────────────────────── */

const EntranceSlot: React.FC<{ proper: MissalProperRow | null; loading: boolean }> = ({
  proper,
  loading,
}) => {
  if (!proper?.entrance_antiphon && !loading) return null;
  return (
    <SlotCard
      kicker="Próprio · Antiphona ad introitum"
      title="Antífona de Entrada"
      text={proper?.entrance_antiphon ?? null}
      variant="antiphon"
      loading={loading}
    />
  );
};

const CollectSlot: React.FC<{ proper: MissalProperRow | null; loading: boolean }> = ({
  proper,
  loading,
}) => (
  <SlotCard
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
        <SlotCard
          kicker={`Liturgia da Palavra · ${primeiraLeitura.referencia}`}
          title={primeiraLeitura.titulo || 'Primeira Leitura'}
          text={primeiraLeitura.texto}
        />
      )}
      {salmo && (
        <SlotCard
          kicker={`Salmo Responsorial · ${salmo.referencia}`}
          title={salmo.refrao || 'Salmo'}
          text={salmo.texto}
          variant="antiphon"
        />
      )}
      {segundaLeitura && (
        <SlotCard
          kicker={`Segunda Leitura · ${segundaLeitura.referencia}`}
          title={segundaLeitura.titulo || 'Segunda Leitura'}
          text={segundaLeitura.texto}
        />
      )}
      {evangelho && (
        <SlotCard
          kicker={`Evangelho · ${evangelho.referencia}`}
          title={evangelho.titulo || 'Evangelho'}
          text={evangelho.texto}
          variant="preface"
        />
      )}
    </div>
  );
};

const OfferingsSlot: React.FC<{ proper: MissalProperRow | null; loading: boolean }> = ({
  proper,
  loading,
}) => (
  <SlotCard
    kicker="Próprio · Super oblata"
    title="Oração sobre as Oferendas"
    text={proper?.offertory_prayer ?? null}
    loading={loading}
  />
);

const PrefaceSlot: React.FC<{ proper: MissalProperRow | null; loading: boolean }> = ({
  proper,
  loading,
}) => {
  if (!proper?.preface_suggestion && !loading) return null;
  return (
    <SlotCard
      kicker="Próprio · Praefatio"
      title="Prefácio Próprio"
      text={proper?.preface_suggestion ?? null}
      variant="preface"
      loading={loading}
    />
  );
};

const CommunionSlot: React.FC<{ proper: MissalProperRow | null; loading: boolean }> = ({
  proper,
  loading,
}) => {
  if (!proper?.communion_antiphon && !loading) return null;
  return (
    <SlotCard
      kicker="Próprio · Antiphona ad communionem"
      title="Antífona de Comunhão"
      text={proper?.communion_antiphon ?? null}
      variant="antiphon"
      loading={loading}
    />
  );
};

const PostCommunionSlot: React.FC<{ proper: MissalProperRow | null; loading: boolean }> = ({
  proper,
  loading,
}) => (
  <SlotCard
    kicker="Próprio · Post communionem"
    title="Oração depois da Comunhão"
    text={proper?.prayer_after_communion ?? null}
    loading={loading}
  />
);

/* ─────────────────────── Block View ─────────────────────── */

const PrayerBlockView: React.FC<{ block: PrayerBlock; index: number }> = ({ block, index }) => {
  const isMainPrayer = block.kind === 'prayer' || block.kind === 'intro' || block.kind === 'closing';
  return (
    <article
      id={`block-${block.id}`}
      data-block-id={block.id}
      className="scroll-mt-24 py-spacing-sm"
    >
      {block.title && (
        <header className="mb-spacing-xs">
          <p className="font-stitch-body text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
            {String(index + 1).padStart(2, '0')}
          </p>
          <h4 className="font-stitch-display text-premium-base md:text-premium-lg text-foreground">
            {block.title}
          </h4>
          {block.subtitle && (
            <p className="font-serif italic text-premium-xs text-muted-foreground">
              {block.subtitle}
            </p>
          )}
        </header>
      )}
      {block.body && (
        <p
          className={cn(
            'whitespace-pre-line font-stitch-display leading-[1.7] text-foreground',
            isMainPrayer
              ? 'text-premium-lg md:text-premium-xl first-letter:font-serif first-letter:text-primary first-letter:text-[3.5rem] first-letter:leading-[0.85] first-letter:mr-2 first-letter:float-left'
              : 'text-premium-base md:text-premium-lg',
          )}
        >
          {block.body}
        </p>
      )}
      {block.repeat && (
        <p className="mt-spacing-xs text-center font-stitch-body text-[11px] font-bold uppercase tracking-widest text-primary">
          {block.repeat.label} · {block.repeat.count}×
        </p>
      )}
      {block.latin && (
        <p className="mt-spacing-xs whitespace-pre-line font-stitch-display italic text-premium-sm leading-relaxed text-muted-foreground">
          {block.latin}
        </p>
      )}
      {block.rubric && (
        <aside
          role="note"
          aria-label="Rubrica litúrgica"
          className="mt-spacing-sm border-l-2 border-liturgical-red pl-spacing-sm"
        >
          <p className="font-serif italic text-premium-sm leading-relaxed text-liturgical-red">
            {block.rubric}
          </p>
        </aside>
      )}
    </article>
  );
};

/* ─────────────────────── Main Component ─────────────────────── */

const STORAGE_KEY = (isoDate: string) => `missal:continuous:${isoDate}`;

export const MissaContinuousReader: React.FC<Props> = ({
  prayer,
  hierarchy,
  proper,
  properLoading,
  liturgy,
  isoDate,
}) => {
  const { wrapperStyle: typographyStyle } = useReaderTypography();
  const [progress, setProgress] = useState(0);
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);

  const orderedSections = useMemo(
    () => [...hierarchy.sections].sort((a, b) => a.order_index - b.order_index),
    [hierarchy],
  );

  const sectionBlocks = useMemo(
    () => orderedSections.map((s) => ({ section: s, blocks: flattenSectionToBlocks(hierarchy, s) })),
    [hierarchy, orderedSections],
  );

  // Nexus automático baseado na oração raiz
  const nexus = useMemo(() => resolvePrayerAutoNexus(prayer), [prayer]);

  // Progresso de scroll
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

  // IntersectionObserver → grava bloco atual
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.target.getBoundingClientRect().top ?? 0) - (b.target.getBoundingClientRect().top ?? 0))[0];
        if (visible) {
          const id = (visible.target as HTMLElement).dataset.blockId;
          if (id) {
            setCurrentBlockId(id);
            try {
              localStorage.setItem(STORAGE_KEY(isoDate), id);
            } catch {}
          }
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0.01 },
    );
    container.querySelectorAll<HTMLElement>('[data-block-id]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isoDate, sectionBlocks]);

  // Restaura posição
  useEffect(() => {
    if (restoredRef.current) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY(isoDate));
      if (saved) {
        const el = document.getElementById(`block-${saved}`);
        if (el) {
          restoredRef.current = true;
          requestAnimationFrame(() =>
            el.scrollIntoView({ block: 'start', behavior: 'auto' }),
          );
        }
      }
    } catch {}
  }, [isoDate]);

  const renderSlotsAfterBlock = (sectionSlug: string, blockIndex: number, totalBlocks: number) => {
    // Injetamos slots em pontos estratégicos:
    //  Ritos Iniciais: EntranceSlot no início; CollectSlot no final
    //  Palavra: ReadingsSlot no início (substitui leituras narradas)
    //  Eucarística: OfferingsSlot no 2º bloco; PrefaceSlot antes do final
    //  Comunhão: CommunionSlot no início; PostCommunionSlot no final
    const nodes: React.ReactNode[] = [];
    const last = blockIndex === totalBlocks - 1;
    if (sectionSlug === 'entrada' && last) {
      nodes.push(<CollectSlot key="collect" proper={proper} loading={properLoading} />);
    }
    if (sectionSlug === 'eucaristica' && blockIndex === 1) {
      nodes.push(<OfferingsSlot key="offerings" proper={proper} loading={properLoading} />);
    }
    if (sectionSlug === 'eucaristica' && last) {
      nodes.push(<PrefaceSlot key="preface" proper={proper} loading={properLoading} />);
    }
    if (sectionSlug === 'comunhao' && last) {
      nodes.push(<PostCommunionSlot key="post-communion" proper={proper} loading={properLoading} />);
    }
    return nodes;
  };

  const renderSlotsBeforeSection = (sectionSlug: string) => {
    if (sectionSlug === 'entrada') {
      return <EntranceSlot proper={proper} loading={properLoading} />;
    }
    if (sectionSlug === 'palavra') {
      return <ReadingsSlot liturgy={liturgy} />;
    }
    if (sectionSlug === 'comunhao') {
      return <CommunionSlot proper={proper} loading={properLoading} />;
    }
    return null;
  };

  return (
    <div className="mx-auto max-w-3xl px-spacing-sm">
      {/* Barra de progresso sticky */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso da celebração"
        className="sticky top-0 z-30 -mx-spacing-sm h-1 bg-transparent"
      >
        <div
          className="h-full bg-gradient-to-r from-primary via-liturgical-gold to-primary transition-[width] duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Header litúrgico do dia */}
      {(proper || properLoading) && (
        <header className="text-center py-spacing-lg">
          <p className="font-stitch-body text-[11px] font-black uppercase tracking-[0.3em] text-primary">
            Santa Missa · {new Date(isoDate + 'T00:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </p>
          <h2 className="mt-spacing-2xs font-stitch-display text-premium-2xl md:text-premium-3xl text-foreground">
            {proper?.celebration_title || (properLoading ? '…' : 'Missa do Dia')}
          </h2>
          {proper?.liturgical_color && (
            <p className="mt-spacing-2xs font-serif italic text-premium-sm text-muted-foreground">
              Cor litúrgica: {proper.liturgical_color}
            </p>
          )}
        </header>
      )}

      <div ref={scrollRef} style={typographyStyle}>
        {sectionBlocks.map(({ section, blocks }) => (
          <section
            key={section.id}
            id={`section-${section.slug}`}
            aria-labelledby={`section-title-${section.slug}`}
            className="mt-spacing-xl scroll-mt-16"
          >
            <header className="mb-spacing-md text-center">
              <div className="mx-auto w-24 h-px bg-gradient-to-r from-transparent via-liturgical-gold to-transparent mb-spacing-sm" />
              <p className="font-stitch-body text-[11px] font-black uppercase tracking-[0.35em] text-liturgical-gold">
                {section.subtitle || section.title}
              </p>
              <h3
                id={`section-title-${section.slug}`}
                className="mt-spacing-2xs font-stitch-display text-premium-2xl md:text-premium-3xl text-foreground"
              >
                {section.title}
              </h3>
            </header>

            {renderSlotsBeforeSection(section.slug)}

            {blocks.map((block, idx) => (
              <React.Fragment key={block.id}>
                <PrayerBlockView block={block} index={idx} />
                {renderSlotsAfterBlock(section.slug, idx, blocks.length)}
              </React.Fragment>
            ))}
          </section>
        ))}
      </div>

      {/* Rito Final: ReaderContinuation com Nexus automático */}
      <div className="mt-spacing-2xl border-t border-border/40 pt-spacing-xl">
        <ReaderContinuation
          context={{
            kind: 'prayer',
            id: prayer.id,
            slug: prayer.slug,
            title: prayer.title,
          }}
          suggestions={nexus}
        />
      </div>

      {/* Debug (dev only) — bloco atual */}
      {currentBlockId && import.meta.env.DEV && (
        <p className="sr-only" aria-live="polite">
          Bloco atual: {currentBlockId}
        </p>
      )}

      {/* Retomada visual (topo) */}
      <BackToTopFab />
    </div>
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
