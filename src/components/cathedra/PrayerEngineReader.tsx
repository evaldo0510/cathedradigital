/**
 * PrayerEngineReader — leitor conectado à sessão hierárquica persistente
 * do Prayer Engine v2.
 *
 * Sprint 1.0 · Fase E · Onda 2.
 *
 * - Retomada automática via `usePrayerEngineSession`
 * - Cursor/progresso/favoritos vindos da sessão (nunca localStorage)
 * - Barra de progresso em três níveis (seção → mistério → bloco)
 * - Continuação inteligente ao concluir um mistério
 * - Bookmarks reais (favorites) + lista "Meus marcadores"
 * - Reinício seguro com confirmação
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Church,
  ChevronRight,
  RotateCcw,
  Star,
  StarOff,
  Focus,
  X,
  PlayCircle,
  Heart, // Use Heart as a placeholder if HandsPraying is not available
} from 'lucide-react';
import SacredImage from './SacredImage';

const Icons = {
  BookOpen,
  Church,
  Prayer: Heart,
};
import ContemplativeSettingsDialog from '@/components/prayer/rosary/ContemplativeSettingsDialog';
import { useContemplativeRhythm } from '@/hooks/useContemplativeRhythm';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import PrayerTTSButton from '@/components/cathedra/PrayerTTSButton';
import PrayerModeSelector, { type PrayerMode } from '@/components/prayer/PrayerModeSelector';
import PrayerAudioPlayer from '@/components/prayer/PrayerAudioPlayer';
import {
  ReaderShell,
  EditorialHero,
  PrayerContext,
  NexusPanel,
  ReaderContinuation,
  ReferencePopover,
} from '@/components/reader';

import { resolvePrayerAutoNexus } from '@/core/knowledge/adapters/prayerAutoNexus';
import { resolveMysteryAutoNexus } from '@/core/knowledge/adapters/mysteryAutoNexus';
import { usePrayerAutoAdvance } from '@/hooks/usePrayerAutoAdvance';
import { usePrayerEngineSession } from '@/prayer-engine/usePrayerEngineSession';
import MysteryHero from '@/components/prayer/rosary/MysteryHero';
import MysteryLogosMeditation from '@/components/prayer/rosary/MysteryLogosMeditation';
import SpiritualFruitBadge from '@/components/prayer/rosary/SpiritualFruitBadge';
import ContemplationInvitation from '@/components/prayer/rosary/ContemplationInvitation';

import MysteryClosingCard from '@/components/prayer/rosary/MysteryClosingCard';
import SpiritualProgressDots from '@/components/prayer/rosary/SpiritualProgressDots';
import { resolveMysteryPalette } from '@/components/prayer/rosary/sectionPalette';
import { readMysteryMeta } from '@/components/prayer/rosary/mysteryMeta';
import { resolveMysteryImage } from '@/components/prayer/rosary/mysteryImages';
import type { PrayerBlock } from '@/types/prayer';
import type { Prayer } from '@/hooks/usePrayers';
import type { DBMystery, DBSection } from '@/prayer-engine/loadPrayerHierarchy';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Props {
  prayer: Prayer;
  blocks: PrayerBlock[];
  mysteries: DBMystery[];
  activeSection: DBSection | null;
  kicker?: string;
  /**
   * Slot editorial renderizado imediatamente após a barra de progresso e
   * antes do bloco atual. Usado, por exemplo, para exibir o Próprio da
   * Liturgia das Horas junto ao Ordinário no BreviaryPage.
   */
  prefaceSlot?: React.ReactNode;
  /**
   * Chave estável de contexto para persistir cursor granular por sub-recurso
   * (ex.: `breviary:laudes:2026-07-21`). Quando presente:
   *   - lê `localStorage[prayer-cursor:<key>]` e restaura a posição na entrada;
   *   - grava o `current_block_uuid` a cada mudança de cursor.
   * Funciona 100% offline (localStorage) e sobrevive a refresh.
   */
  contextKey?: string;
  /**
   * Deep link `?b=<blockId>` — quando informado, sobrescreve o cursor
   * persistido para esta única navegação.
   */
  initialBlockId?: string | null;
  /** Estilo aplicado ao wrapper editorial — usado para tipografia/densidade. */
  contentStyle?: React.CSSProperties;
  sacredImage?: string;
}

const KIND_LABEL: Record<string, string> = {
  mystery: 'Mistério',
  decade: 'Ave-Maria',
  station: 'Estação',
  hour: 'Hora Litúrgica',
  meditation: 'Meditação',
  prayer: 'Oração',
  closing: 'Encerramento',
  intro: 'Introdução',
};

/**
 * Identidade de leitura por tipo de conteúdo litúrgico.
 * Cada voz recebe tratamento tipográfico próprio via `[data-prayer-voice]`
 * (definido em index.css) — sem cor hardcoded, sem CSS duplicado.
 */
const PRAYER_VOICE: Record<string, string> = {
  psalm: 'salmo',
  salmo: 'salmo',
  antiphon: 'antifona',
  antifona: 'antifona',
  response: 'resposta',
  responsorio: 'resposta',
  refrain: 'refrao',
  reading: 'leitura',
  ave_maria: 'refrao',
  gloria: 'refrao',
};


function bodyForTTS(b: PrayerBlock): string {
  const parts: string[] = [b.title];
  if (b.subtitle) parts.push(b.subtitle);
  if (b.body) parts.push(b.body);
  if (b.meditation) parts.push(`Meditação: ${b.meditation}`);
  if (b.repeat?.text) parts.push(b.repeat.text);
  return parts.join('. ');
}

export const PrayerEngineReader: React.FC<Props> = ({
  prayer,
  blocks,
  mysteries,
  activeSection,
  kicker,
  prefaceSlot,
  contextKey,
  initialBlockId,
  contentStyle,
  sacredImage,
}) => {
  const session = usePrayerEngineSession(prayer.id);
  const { rhythm } = useContemplativeRhythm();

  // Índice atual derivado do cursor persistido.
  const cursorIndex = useMemo(() => {
    const uuid = session.session?.current_block_uuid;
    if (!uuid) return 0;
    const i = blocks.findIndex((b) => b.id === uuid);
    return i >= 0 ? i : 0;
  }, [blocks, session.session?.current_block_uuid]);

  const [dismissedResume, setDismissedResume] = useState(false);
  const [focus, setFocus] = useState(false);
  const [mode, setMode] = useState<PrayerMode>('guided');
  const [autoIntervalMs, setAutoIntervalMs] = useState(30000);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [heroConfirmed, setHeroConfirmed] = useState<Set<string>>(() => new Set());

  const current = blocks[cursorIndex];
  const isRosary = prayer.slug === 'rosario';
  const palette = resolveMysteryPalette(activeSection?.slug);
  const contemplative = mode === 'contemplative';


  const mysteriesInSection = useMemo(
    () =>
      activeSection
        ? mysteries
            .filter((m) => m.section_id === activeSection.id)
            .sort((a, b) => a.order_index - b.order_index)
        : [],
    [mysteries, activeSection],
  );

  // Oração simples = sem mistérios/décadas/estações. Apenas texto linear.
  const isSimple = mysteriesInSection.length === 0;

  // Contagens por mistério — para cálculos e barra hierárquica.
  const blocksByMystery = useMemo(() => {
    const map = new Map<string, PrayerBlock[]>();
    for (const b of blocks) {
      if (!b.mysteryId) continue;
      const list = map.get(b.mysteryId) ?? [];
      list.push(b);
      map.set(b.mysteryId, list);
    }
    return map;
  }, [blocks]);

  const currentMystery = current?.mysteryId
    ? mysteriesInSection.find((m) => m.id === current.mysteryId) ?? null
    : null;
  const currentMysteryIndex = currentMystery
    ? mysteriesInSection.findIndex((m) => m.id === currentMystery.id)
    : -1;
  const currentMysteryBlocks = currentMystery
    ? blocksByMystery.get(currentMystery.id) ?? []
    : [];
  const blockInMysteryIndex = current
    ? currentMysteryBlocks.findIndex((b) => b.id === current.id)
    : -1;

  const aveCount = useMemo(
    () => currentMysteryBlocks.filter((b) => b.sourceType === 'ave_maria').length,
    [currentMysteryBlocks],
  );
  const aveCurrentIdx = useMemo(() => {
    if (!current || current.sourceType !== 'ave_maria') return -1;
    return currentMysteryBlocks
      .filter((b) => b.sourceType === 'ave_maria')
      .findIndex((b) => b.id === current.id);
  }, [current, currentMysteryBlocks]);

  const completedCount = session.session?.completed_block_ids.length ?? 0;
  const overallPercent = blocks.length > 0 ? Math.round((completedCount / blocks.length) * 100) : 0;

  const isLastOfMystery =
    !!currentMystery &&
    blockInMysteryIndex >= 0 &&
    blockInMysteryIndex === currentMysteryBlocks.length - 1;
  const isLastOverall = cursorIndex >= blocks.length - 1;
  const mysteryJustCompleted =
    !!currentMystery &&
    session.session?.completed_mystery_ids.includes(currentMystery.id) === true &&
    isLastOfMystery;

  // ── Prefetch adaptativo da imagem do próximo mistério ──
  // Usa IntersectionObserver num sentinel no final do mistério corrente;
  // rootMargin adapta-se ao tipo de conexão (mais antecipado em redes
  // rápidas, mais próximo em lentas). Respeita `Save-Data`: se ativo,
  // não pré-carrega — o hero só baixa quando entrar em viewport.
  const nextMystery = useMemo(() => {
    if (currentMysteryIndex < 0) return null;
    return mysteriesInSection[currentMysteryIndex + 1] ?? null;
  }, [mysteriesInSection, currentMysteryIndex]);

  const prefetchSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!nextMystery) return;
    // Save-Data ou 2G/slow-2g → não pré-carregar imagem (respeita economia).
    const conn = (navigator as any).connection as
      | { saveData?: boolean; effectiveType?: string }
      | undefined;
    if (conn?.saveData) return;
    if (conn?.effectiveType && /^(slow-)?2g$/.test(conn.effectiveType)) return;

    const nextMeta = readMysteryMeta(nextMystery);
    const href = resolveMysteryImage(nextMeta.image_slug ?? nextMeta.hero_image_path, nextMeta.image_collection);
    if (!href) return;
    const selector = `link[rel="preload"][data-mystery-preload="${nextMystery.id}"]`;
    if (document.head.querySelector(selector)) return;

    // Margem adaptativa: redes rápidas antecipam mais o preload.
    const rootMargin =
      conn?.effectiveType === '4g' ? '600px'
      : conn?.effectiveType === '3g' ? '250px'
      : '400px';

    const injectPreload = () => {
      if (document.head.querySelector(selector)) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = href;
      link.setAttribute('fetchpriority', 'low');
      link.setAttribute('data-mystery-preload', nextMystery.id);
      document.head.appendChild(link);
    };

    const nearEnd =
      isLastOfMystery ||
      (aveCount > 0 && aveCurrentIdx >= 0 && aveCurrentIdx >= aveCount - 2);

    let io: IntersectionObserver | null = null;
    const el = prefetchSentinelRef.current;
    if (el && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              injectPreload();
              io?.disconnect();
              break;
            }
          }
        },
        { rootMargin },
      );
      io.observe(el);
    } else if (nearEnd) {
      // Fallback sem IO: usa a heurística anterior.
      injectPreload();
    }

    return () => {
      io?.disconnect();
      document.head.querySelector(selector)?.remove();
    };
  }, [nextMystery, isLastOfMystery, aveCount, aveCurrentIdx]);

  const goTo = useCallback(
    (nextIdx: number) => {
      const clamped = Math.max(0, Math.min(blocks.length - 1, nextIdx));
      const b = blocks[clamped];
      if (!b) return;
      session.setCursor({
        blockId: b.id,
        mysteryId: b.mysteryId ?? null,
        sectionId: b.sectionId ?? null,
      });
    },
    [blocks, session],
  );

  const goNext = useCallback(() => {
    if (!current) return;
    const mysteryBlockIds = current.mysteryId
      ? (blocksByMystery.get(current.mysteryId) ?? []).map((b) => b.id)
      : undefined;
    const sectionMysteryIds = activeSection
      ? mysteriesInSection.map((m) => m.id)
      : undefined;
    session.advance({
      blockId: current.id,
      mysteryId: current.mysteryId ?? null,
      sectionId: current.sectionId ?? null,
      mysteryBlockIds,
      sectionMysteryIds,
    });
    if (isLastOverall) {
      void session.finish();
      return;
    }
    goTo(cursorIndex + 1);
  }, [
    current,
    session,
    isLastOverall,
    goTo,
    cursorIndex,
    blocksByMystery,
    activeSection,
    mysteriesInSection,
  ]);

  const goPrev = useCallback(() => goTo(cursorIndex - 1), [goTo, cursorIndex]);

  // Aplica a "pausa entre blocos" configurada em ritmo contemplativo às
  // transições disparadas manualmente (Próximo, Continuar mistério, Encerramento).
  // Não afeta o auto-avanço, que já é temporizado por `usePrayerAutoAdvance`.
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimerRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
  }, []);
  const goNextRhythmed = useCallback(() => {
    if (rhythm.pauseMs <= 0) {
      goNext();
      return;
    }
    setIsTransitioning(true);
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(() => {
      goNext();
      setIsTransitioning(false);
    }, rhythm.pauseMs);
  }, [goNext, rhythm.pauseMs]);

  // ── Persistência de cursor por sub-recurso (contextKey) ──
  // Ex.: Breviário grava/lê "prayer-cursor:breviary:laudes:2026-07-21" no
  // localStorage, garantindo retomada exata por Hora+data offline.
  const cursorStorageKey = contextKey ? `prayer-cursor:${contextKey}` : null;

  // Restaura cursor de contexto uma vez por contextKey (ou aplica deep link `b`).
  const restoredContextRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!contextKey || !cursorStorageKey) return;
    if (restoredContextRef.current === contextKey) return;
    if (!session.session || blocks.length === 0) return;
    let target: string | null = initialBlockId ?? null;
    if (!target) {
      try { target = localStorage.getItem(cursorStorageKey); } catch { /* silent */ }
    }
    restoredContextRef.current = contextKey;
    if (!target || target === session.session.current_block_uuid) return;
    const b = blocks.find((bl) => bl.id === target);
    if (!b) return;
    session.setCursor({
      blockId: b.id,
      mysteryId: b.mysteryId ?? null,
      sectionId: b.sectionId ?? null,
    });
  }, [contextKey, cursorStorageKey, initialBlockId, blocks, session]);

  // Grava o cursor atual sempre que ele mudar dentro do mesmo contexto.
  useEffect(() => {
    if (!cursorStorageKey) return;
    const uuid = session.session?.current_block_uuid;
    if (!uuid) return;
    try { localStorage.setItem(cursorStorageKey, uuid); } catch { /* silent */ }
  }, [cursorStorageKey, session.session?.current_block_uuid]);

  // Modo contemplativo = foco.
  useEffect(() => {
    if (mode === 'contemplative') setFocus(true);
    else if (mode !== 'guided') setFocus(false);
  }, [mode]);

  // Auto-avanço.
  usePrayerAutoAdvance({
    enabled: mode === 'auto',
    intervalMs: autoIntervalMs,
    onAdvance: goNext,
    key: `${cursorIndex}-${autoIntervalMs}`,
  });

  // Keyboard.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA') return;
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setFocus((f) => !f);
      } else if (e.key === 'ArrowRight' || e.key === 'j') {
        e.preventDefault();
        goNextRhythmed();
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape' && focus) {
        setFocus(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNextRhythmed, goPrev, focus]);

  const bookmarks = session.session?.bookmarks ?? [];
  const isFavoriteCurrent =
    !!current && bookmarks.some((b) => b.block_id === current.id && b.kind === 'favorite');

  const toggleFavorite = () => {
    if (!current) return;
    session.addBookmark(current.id, 'favorite', current.title);
    toast.success(isFavoriteCurrent ? 'Marcador removido' : 'Oração salva');
  };

  const handleReset = async () => {
    setConfirmReset(false);
    await session.reset();
    setDismissedResume(true);
    toast.success('Rosário reiniciado');
  };

  const chromeKicker = kicker ?? `Cathedra · ${prayer.title}`;

  // ============ RESUME CARD ============
  const showResumeCard =
    session.hasOpenSession &&
    !dismissedResume &&
    !session.loading &&
    !session.session?.completed_at &&
    completedCount > 0;

  if (showResumeCard) {
    const label = currentMystery
      ? `${activeSection?.title ?? 'Seção'} • ${currentMystery.title}`
      : activeSection?.title ?? 'Continuar de onde parou';
    const detail =
      current?.sourceType === 'ave_maria' && aveCurrentIdx >= 0 && aveCount > 0
        ? `Última oração: Ave-Maria ${aveCurrentIdx + 1}/${aveCount}`
        : current
          ? `Última oração: ${current.title}`
          : null;
    return (
      <>
        <ReaderShell
          hero={
            <EditorialHero
              kicker={chromeKicker}
              title={prayer.title}
              subtitle={prayer.subtitle ?? undefined}
              align="center"
              size="md"
            />
          }
          contentMaxWidth="max-w-[720px]"
          ariaLabel={`${prayer.title} — retomar`}
        >
          <section
            aria-labelledby="resume-title"
            className="rounded-2xl border border-stitch-secondary/40 bg-stitch-surface-container-lowest/40 p-6 md:p-8"
          >
            <p className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
              Você parou aqui
            </p>
            <h2
              id="resume-title"
              className="mt-3 font-stitch-display text-2xl md:text-3xl leading-tight text-stitch-on-surface"
            >
              {label}
            </h2>
            {detail && (
              <p className="mt-2 font-stitch-body text-sm text-stitch-on-surface-variant">
                {detail}
              </p>
            )}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-stitch-on-surface-variant font-stitch-body">
                <span>Progresso</span>
                <span>{overallPercent}%</span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-stitch-outline-variant/30">
                <div
                  className="h-full bg-stitch-secondary transition-all duration-500"
                  style={{ width: `${overallPercent}%` }}
                  aria-hidden
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="pill-active"
                size="pill"
                onClick={() => setDismissedResume(true)}
              >
                <PlayCircle aria-hidden />
                Continuar oração
              </Button>
              <Button
                type="button"
                variant="pill"
                size="pill"
                onClick={() => setConfirmReset(true)}
              >
                <RotateCcw aria-hidden />
                Recomeçar
              </Button>
            </div>
          </section>
        </ReaderShell>
        <ResetDialog open={confirmReset} onOpenChange={setConfirmReset} onConfirm={handleReset} />
      </>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-stitch-body text-sm text-stitch-on-surface-variant">
          Estrutura de blocos ainda não configurada para esta oração.
        </p>
        <Link
          to="/oracao"
          className="mt-4 inline-block font-stitch-body text-sm font-semibold uppercase tracking-widest text-stitch-secondary hover:underline"
        >
          Voltar ao Livro de Orações
        </Link>
      </div>
    );
  }

  // ============ HERO CONTEMPLATIVO (Rosário — antes de cada dezena) ============
  const showMysteryHero =
    isRosary &&
    !!currentMystery &&
    current?.sourceType === 'announce' &&
    !heroConfirmed.has(currentMystery.id);

  const heroContent = showMysteryHero && currentMystery ? (
    <div className="mx-auto w-full max-w-[860px] px-4 pb-16 pt-6 md:px-8 md:pt-10">
      <MysteryHero
        mystery={currentMystery}
        onStart={() => {
          setHeroConfirmed((prev) => {
            const next = new Set(prev);
            next.add(currentMystery.id);
            return next;
          });
        }}
      />
    </div>
  ) : null;

  // ============ READER ============
  const content = (
    <article
      key={current.id}
      data-contemplative={contemplative || undefined}
      style={{
        ...contentStyle,
        // Velocidade do fade controlada por ritmo contemplativo.
        animationDuration: `${rhythm.fadeMs}ms`,
        // Enquanto aguardamos a "pausa entre blocos", suavizamos o artigo.
        opacity: isTransitioning ? 0 : undefined,
        transition: isTransitioning ? `opacity ${rhythm.fadeMs}ms ease-out` : undefined,
      }}
      className={cn(
        'cathedra-reader-article mx-auto w-full max-w-[60ch] px-[var(--sp-m)] pb-32 pt-[var(--sp-l)] md:px-0 md:pt-[var(--sp-xl)] animate-in fade-in motion-reduce:animate-none',
        contemplative && 'max-w-[64ch] [&_h2]:text-4xl md:[&_h2]:text-5xl [&_p]:leading-[1.8]',
      )}

    >
      {/* Barra de progresso — hierárquica ou simples conforme o tipo de oração */}
      {isSimple ? (
        <div className="mb-8">
          <div className="flex items-center justify-between font-stitch-body text-[11px] uppercase tracking-widest text-stitch-on-surface-variant">
            <span className="font-bold text-stitch-secondary">{prayer.title}</span>
            <span>{overallPercent}%</span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-stitch-outline-variant/30">
            <div
              className="h-full bg-stitch-secondary transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
              aria-hidden
            />
          </div>
        </div>
      ) : isRosary ? (
        <div className="mb-10 flex flex-col items-center gap-4">
          {activeSection && (
            <p className="font-stitch-body text-[10px] font-bold uppercase tracking-[0.32em] text-stitch-on-surface-variant">
              {activeSection.title}
            </p>
          )}
          <SpiritualProgressDots
            total={mysteriesInSection.length}
            currentIndex={Math.max(currentMysteryIndex, 0)}
            ids={mysteriesInSection.map((m) => m.id)}
            completedIds={session.session?.completed_mystery_ids ?? []}
            accentClass={palette.accentClass}
            label={
              currentMystery
                ? `Mistério ${currentMysteryIndex + 1} de ${mysteriesInSection.length} · ${currentMystery.title}`
                : undefined
            }
          />
          {aveCount > 0 && aveCurrentIdx >= 0 && (
            <p className="font-stitch-body text-[11px] uppercase tracking-widest text-stitch-on-surface-variant">
              Ave-Maria {aveCurrentIdx + 1} <span className="opacity-60">de {aveCount}</span>
            </p>
          )}
        </div>
      ) : (
        <div className="mb-8 rounded-2xl border border-stitch-outline-variant/30 bg-stitch-surface-container-lowest/30 p-4">
          <div className="flex items-center justify-between font-stitch-body text-[11px] uppercase tracking-widest text-stitch-on-surface-variant">
            <span className="font-bold text-stitch-secondary">{prayer.title}</span>
            <span>{overallPercent}%</span>
          </div>
          {activeSection && (
            <p className="mt-2 font-stitch-body text-sm text-stitch-on-surface">
              <span className="text-stitch-secondary">●</span> {activeSection.title}
            </p>
          )}
          {currentMystery && (
            <div className="mt-2 font-stitch-body text-xs text-stitch-on-surface-variant">
              {currentMystery.title} · Mistério {currentMysteryIndex + 1} de {mysteriesInSection.length}
            </div>
          )}
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-stitch-outline-variant/30">
            <div
              className="h-full bg-stitch-secondary transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
              aria-hidden
            />
          </div>
        </div>
      )}

      {prefaceSlot && <div className="mb-8">{prefaceSlot}</div>}

      {/* Cabeçalho do bloco */}
      <header className="mb-8 text-center">
        <p className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">

          {KIND_LABEL[current.kind] ?? current.kind}
        </p>
        <h2 className="mt-3 font-stitch-display text-3xl md:text-4xl leading-tight text-stitch-on-surface">
          {current.title}
        </h2>
        {current.subtitle && (
          <p className="mx-auto mt-2 max-w-[52ch] font-stitch-body text-sm italic text-stitch-on-surface-variant">
            {current.subtitle}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <PrayerTTSButton text={bodyForTTS(current)} />
          <Button
            type="button"
            variant={isFavoriteCurrent ? 'pill-toned' : 'pill'}
            size="pill"
            onClick={toggleFavorite}
            aria-pressed={isFavoriteCurrent}
          >
            {isFavoriteCurrent ? <Star className="fill-current" aria-hidden /> : <StarOff aria-hidden />}
            {isFavoriteCurrent ? 'Salva' : 'Salvar'}
          </Button>
          <Button
            type="button"
            variant="pill"
            size="pill"
            onClick={() => setFocus((f) => !f)}
            aria-pressed={focus}
            aria-label="Alternar modo foco (F)"
          >
            {focus ? <X aria-hidden /> : <Focus aria-hidden />}
            {focus ? 'Sair do foco' : 'Modo foco'}
          </Button>
          <ContemplativeSettingsDialog />
          {!isSimple && (
            <Button
              type="button"
              variant="pill"
              size="pill"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw aria-hidden />
              Recomeçar
            </Button>
          )}
        </div>
        {!focus && !isSimple && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <PrayerModeSelector
              mode={mode}
              onChange={setMode}
              autoIntervalMs={autoIntervalMs}
              onIntervalChange={setAutoIntervalMs}
            />
            <PrayerAudioPlayer audioUrl={prayer.audio_url} label={`Áudio: ${prayer.title}`} />

          </div>
        )}
      </header>

      {/* Slots contemplativos (Rosário) — Meditação Logos + Nexus automático + Convite à Contemplação */}
      {isRosary && currentMystery && current.sourceType === 'announce' && (
        <>
          <MysteryLogosMeditation mystery={currentMystery} />
          <div className="text-center">
            <SpiritualFruitBadge mystery={currentMystery} />
          </div>
          {!contemplative && (
            <div className="my-8">
              <NexusPanel
                output={resolveMysteryAutoNexus(currentMystery)}
                title="Nexus do mistério"
                kicker={activeSection?.title ?? undefined}
                className="border-stitch-outline-variant/40 bg-stitch-surface-container-lowest/30"
              />
            </div>
          )}
          <ContemplationInvitation mystery={currentMystery} accentClass={palette.accentClass} />
        </>
      )}

      {/* Corpo — voz principal da oração */}
      {current.body && (
        <section data-prayer-voice={PRAYER_VOICE[current.sourceType ?? ''] ?? 'oracao'}>
          <p className="whitespace-pre-line font-stitch-display text-[1.4rem] md:text-[1.6rem] text-stitch-on-surface">
            {current.body}
          </p>
        </section>
      )}

      {current.meditation && (
        <section
          data-prayer-voice="meditacao"
          className="border-l border-stitch-secondary/40 pl-[var(--sp-m)]"
        >
          <p className="mb-2 font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
            Meditação
          </p>
          <p className="font-stitch-body text-[0.98rem] text-stitch-on-surface-variant">
            {current.meditation}
          </p>
        </section>
      )}

      {current.fruit && (
        <section data-prayer-voice="fruto" className="text-center">
          <p className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
            Fruto
          </p>
          <p className="mt-2 font-stitch-display italic text-xl text-stitch-on-surface">
            {current.fruit}
          </p>
        </section>
      )}

      {(current.kind === 'mystery' || current.kind === 'decade') && current.repeat && (
        <section
          data-prayer-voice="refrao"
          className="rounded-premium border border-stitch-outline-variant/25 bg-stitch-surface-container-lowest/50 px-[var(--sp-l)] py-[var(--sp-l)]"
        >
          <p className="text-center font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
            {current.repeat.label} · {current.repeat.count}×
          </p>
          {current.repeat.text && (
            <p className="mt-3 whitespace-pre-line text-center font-stitch-display text-lg text-stitch-on-surface">
              {current.repeat.text}
            </p>
          )}
        </section>
      )}

      {current.latin && (
        <section data-prayer-voice="latim">
          <p className="mb-2 font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
            Em latim
          </p>
          <p className="whitespace-pre-line font-stitch-display italic text-lg text-stitch-on-surface-variant">
            {current.latin}
          </p>
        </section>
      )}

      {current.rubric && (
        <section
          data-prayer-voice="rubrica"
          className="rounded-premium border-l border-stitch-secondary/35 bg-stitch-surface-container-lowest/40 px-[var(--sp-m)] py-[var(--sp-s)]"
          aria-label="Rubrica litúrgica"
        >
          <p className="mb-1 font-stitch-body text-[10px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
            Rubrica
          </p>
          <p className="font-stitch-body text-sm italic text-stitch-on-surface-variant">
            {current.rubric}
          </p>
        </section>
      )}


      {/* Encerramento ritual da dezena (Rosário) — Fruto + Pequena Oração + Ação Concreta + Próximo mistério */}
      {mysteryJustCompleted && !focus && currentMystery && isRosary && (
        <MysteryClosingCard
          mystery={currentMystery}
          isLast={isLastOverall}
          onNext={goNextRhythmed}
          accentClass={palette.accentClass}
        />
      )}

      {/* Continuação inteligente ao concluir mistério (não-Rosário) */}
      {mysteryJustCompleted && !focus && !isLastOverall && currentMystery && !isRosary && (
        <section
          aria-labelledby="mystery-done"
          className="mb-10 rounded-2xl border border-stitch-secondary/40 bg-stitch-surface-container-lowest/50 p-6"
        >
          <p className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
            Mistério concluído
          </p>
          <h3
            id="mystery-done"
            className="mt-2 font-stitch-display text-xl text-stitch-on-surface"
          >
            {currentMystery.title}
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="pill-active" size="pill" onClick={goNextRhythmed}>
              <ArrowRight aria-hidden />
              Continuar para o próximo mistério
            </Button>
            {currentMystery.gospel_ref && (
              <Button asChild type="button" variant="pill" size="pill">
                <Link to={`/bible?q=${encodeURIComponent(currentMystery.gospel_ref)}`}>
                  <BookOpen aria-hidden />
                  Refletir na passagem bíblica
                </Link>
              </Button>
            )}
            {current.refs?.catechism?.[0] != null && (
              <Button asChild type="button" variant="pill" size="pill">
                <Link to={`/catechism?p=${current.refs.catechism[0]}`}>
                  <Church aria-hidden />
                  Abrir Catecismo relacionado
                </Link>
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Referências inline — via ReferencePopover canônico */}
      {(current.refs?.bible?.length || current.refs?.catechism?.length) && !focus && (
        <section className="mb-10 border-t border-stitch-outline-variant/30 pt-6">
          <p className="mb-3 font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-secondary">
            Referências
          </p>
          <div className="flex flex-wrap gap-2 font-stitch-body text-sm">
            {current.refs?.bible?.map((ref) => (
              <ReferencePopover
                key={`b-${ref}`}
                kind="bible"
                label={ref}
                ariaLabel={`Abrir passagem ${ref}`}
                title={ref}
                content={
                  <Link
                    to={`/bible?q=${encodeURIComponent(ref)}`}
                    className="inline-flex items-center gap-2 text-stitch-secondary hover:underline"
                  >
                    <BookOpen className="h-4 w-4" aria-hidden />
                    Abrir na Bíblia
                  </Link>
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-stitch-outline-variant/50 bg-stitch-surface/40 px-3 py-1 text-stitch-on-surface hover:border-stitch-secondary/60"
              />
            ))}
            {current.refs?.catechism?.map((n) => (
              <ReferencePopover
                key={`c-${n}`}
                kind="catechism"
                label={`CIC §${n}`}
                ariaLabel={`Abrir Catecismo §${n}`}
                title={`Catecismo §${n}`}
                content={
                  <Link
                    to={`/catechism?p=${n}`}
                    className="inline-flex items-center gap-2 text-stitch-secondary hover:underline"
                  >
                    <Church className="h-4 w-4" aria-hidden />
                    Abrir no Catecismo
                  </Link>
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-stitch-outline-variant/50 bg-stitch-surface/40 px-3 py-1 text-stitch-on-surface hover:border-stitch-secondary/60"
              />
            ))}
          </div>
        </section>
      )}

      {/* Navegação */}
      <nav
        className={cn(
          'mt-[var(--sp-xxl)] flex items-center justify-between gap-4',
          // Mobile: ancorado ao alcance do polegar, sem cobrir o texto.
          'sticky bottom-[calc(var(--bottom-nav-height)+var(--sp-s))] z-20 rounded-full',
          'border border-stitch-outline-variant/25 bg-stitch-surface/90 px-2 py-2 backdrop-blur',
          'md:static md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none',
        )}
        aria-label="Navegação da oração"
      >
        <Button
          type="button"
          variant="pill"
          size="pill"
          onClick={goPrev}
          disabled={cursorIndex === 0}
          className="min-h-11"
        >
          <ArrowLeft aria-hidden />
          Anterior
        </Button>
        <Button
          type="button"
          variant="pill-active"
          size="pill"
          onClick={goNextRhythmed}
          className="min-h-11"
        >
          {isLastOverall ? 'Concluir' : 'Próximo'}
          {isLastOverall ? null : <ArrowRight aria-hidden />}
        </Button>
      </nav>


      {/* Meus marcadores */}
      {bookmarks.length > 0 && !focus && (
        <section className="mt-10 rounded-2xl border border-stitch-outline-variant/30 p-4">
          <button
            type="button"
            onClick={() => setShowBookmarks((v) => !v)}
            className="flex w-full items-center justify-between font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-secondary"
            aria-expanded={showBookmarks}
          >
            <span>Meus marcadores ({bookmarks.length})</span>
            <ChevronRight
              className={cn('h-3 w-3 transition-transform', showBookmarks && 'rotate-90')}
              aria-hidden
            />
          </button>
          {showBookmarks && (
            <ul className="mt-3 space-y-1 font-stitch-body text-sm">
              {bookmarks.map((bm) => {
                const target = blocks.findIndex((b) => b.id === bm.block_id);
                const title = target >= 0 ? blocks[target].title : bm.text ?? 'Bloco';
                return (
                  <li key={bm.id} className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => target >= 0 && goTo(target)}
                      className="flex-1 text-left text-stitch-on-surface hover:text-stitch-secondary hover:underline"
                    >
                      <Star className="mr-2 inline h-3 w-3 fill-current" aria-hidden />
                      {title}
                    </button>
                    <button
                      type="button"
                      onClick={() => session.removeBookmark(bm.id)}
                      className="text-xs text-stitch-on-surface-variant hover:text-destructive"
                      aria-label="Remover marcador"
                    >
                      Remover
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* Continuidade final: agora servida pelo slot `continuation` do
          ReaderShell (canônico). Ver retorno principal abaixo. */}
    </article>
  );


  if (focus) {
    return (
      <>
        <div
          className={cn(
            'fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden text-stitch-on-surface transition-colors duration-500',
            contemplative
              ? 'bg-black text-white'
              : 'bg-stitch-surface',
          )}
          role="dialog"
          aria-label={contemplative ? 'Modo contemplação' : 'Modo foco de oração'}
        >
          {contemplative && (
            <>
              <div
                aria-hidden
                className={cn(
                  'pointer-events-none absolute inset-0 bg-gradient-to-b',
                  palette.overlayGradient,
                )}
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/55" />
            </>
          )}
          <div className="relative z-10 w-full max-w-[820px] max-h-screen overflow-y-auto px-2">
            {content}
          </div>
          <button
            type="button"
            onClick={() => { setMode('guided'); setFocus(false); }}
            className="absolute right-4 top-4 z-20 rounded-full border border-white/20 bg-black/30 px-3 py-1 font-stitch-body text-[11px] uppercase tracking-widest text-white/80 backdrop-blur transition hover:border-white/40 hover:text-white"
            aria-label="Sair do modo contemplação"
          >
            Sair
          </button>
        </div>
        <ResetDialog open={confirmReset} onOpenChange={setConfirmReset} onConfirm={handleReset} />
      </>
    );
  }

  // Nexus canônico da oração inteira (usado pelo slot do ReaderShell).
  const prayerNexus = useMemo(
    () =>
      resolvePrayerAutoNexus({
        slug: prayer.slug,
        title: prayer.title,
        category: prayer.category,
        related_bible: prayer.related_bible,
        related_catechism: prayer.related_catechism,
        related_saints: prayer.related_saints,
        related_glossary: prayer.related_glossary,
        block_refs: blocks.map((b) => ({
          bible: b.refs?.bible,
          catechism: b.refs?.catechism,
        })),
      }),
    [prayer, blocks],
  );

  // Rota de exceção: MysteryHero (Rosário) toma a tela inteira antes da
  // dezena — não passa pelo ReaderShell, análogo ao Modo Celebração do Missal.
  if (heroContent) {
    return (
      <>
        {heroContent}
        <div ref={prefetchSentinelRef} aria-hidden className="h-px w-full" />
        <ResetDialog open={confirmReset} onOpenChange={setConfirmReset} onConfirm={handleReset} />
      </>
    );
  }

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      {/* Desktop Sidebar: Sacred Visuals for Prayer */}
      {!focus && (
        <div className="hidden md:flex md:w-[40%] sticky top-0 h-screen overflow-hidden bg-primary/5 border-r border-primary/5">
          <SacredImage 
            src={sacredImage || (currentMystery ? resolveMysteryImage(readMysteryMeta(currentMystery).image_slug, readMysteryMeta(currentMystery).image_collection) : undefined)} 
            className="w-full h-full object-cover opacity-60 mix-blend-multiply" 
            alt={prayer.title} 
          />
          <div className="absolute inset-0 bg-gradient-to-l from-background via-transparent to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-spacing-xl text-center space-y-spacing-lg">
           <div className="w-spacing-4xl h-spacing-4xl mx-auto rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-premium">
             <Icons.Prayer className="w-spacing-xl h-spacing-xl text-secondary" />
           </div>
             <div className="space-y-spacing-xs">
               <h2 className="font-display text-4xl text-primary/40 tracking-widest uppercase italic">{prayer.title}</h2>
               {activeSection && (
                 <p className="text-[10px] uppercase tracking-[0.4em] text-secondary/60 font-bold">{activeSection.title}</p>
               )}
             </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <ReaderShell
          hero={
            <EditorialHero
              kicker={chromeKicker}
              title={prayer.title}
              subtitle={prayer.subtitle ?? undefined}
              align="center"
              size="md"
            />
          }
          headerContext={
            <PrayerContext
              category={prayer.category ?? undefined}
              station={
                currentMystery
                  ? `${activeSection?.title ? activeSection.title + ' · ' : ''}${currentMystery.title}`
                  : undefined
              }
              step={
                !isSimple
                  ? `${cursorIndex + 1} de ${blocks.length}`
                  : undefined
              }
            />
          }
          contentMaxWidth="max-w-[720px]"
          ariaLabel={prayer.title}
          nexus={<NexusPanel output={prayerNexus} />}
          continuation={
            isLastOverall && prayerNexus.suggestions.length > 0 ? (
              <ReaderContinuation
                context={{
                  kind: 'prayer',
                  id: prayer.slug,
                  graphNodeId: prayerNexus.selfId ?? undefined,
                  meta: { prayerCategory: prayer.category },
                }}
                suggestions={prayerNexus.suggestions}
              />
            ) : undefined
          }
        >
          {content}
        </ReaderShell>
      </div>
      <div ref={prefetchSentinelRef} aria-hidden className="h-px w-full" />

      <ResetDialog open={confirmReset} onOpenChange={setConfirmReset} onConfirm={handleReset} />
    </div>
  );
};

const ResetDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}> = ({ open, onOpenChange, onConfirm }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Deseja reiniciar?</AlertDialogTitle>
        <AlertDialogDescription>
          O progresso atual será encerrado e uma nova sessão começará do primeiro bloco. Seus
          marcadores anteriores serão preservados no histórico.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Reiniciar do início</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default PrayerEngineReader;
