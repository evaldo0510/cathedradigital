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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import EditorialReaderChrome from '@/components/editorial/EditorialReaderChrome';
import { MobileTopBar } from '@/components/mobile/MobileTopBar';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import PrayerTTSButton from '@/components/cathedra/PrayerTTSButton';
import PrayerModeSelector, { type PrayerMode } from '@/components/prayer/PrayerModeSelector';
import PrayerAudioPlayer from '@/components/prayer/PrayerAudioPlayer';
import ReaderContinuation from '@/components/shared/ReaderContinuation';
import { resolvePrayerAutoNexus } from '@/core/knowledge/adapters/prayerAutoNexus';
import { usePrayerAutoAdvance } from '@/hooks/usePrayerAutoAdvance';
import { usePrayerEngineSession } from '@/prayer-engine/usePrayerEngineSession';
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
}) => {
  const session = usePrayerEngineSession(prayer.id);

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

  const current = blocks[cursorIndex];

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
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape' && focus) {
        setFocus(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, focus]);

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
        <MobileTopBar kicker={chromeKicker} title={prayer.title} showBack />
        <EditorialReaderChrome
          kicker={chromeKicker}
          title={prayer.title}
          subtitle={prayer.subtitle ?? undefined}
          backHref="/oracao"
        />
        <main className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-8 md:px-8 md:pt-12">
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
        </main>
        <MobileBottomNav />
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

  // ============ READER ============
  const content = (
    <article className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-6 md:px-8 md:pt-10">
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
            <>
              <div className="mt-2 flex items-center justify-between font-stitch-body text-xs text-stitch-on-surface-variant">
                <span>{currentMystery.title}</span>
                <span>
                  Mistério {currentMysteryIndex + 1} de {mysteriesInSection.length}
                </span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-stitch-outline-variant/30">
                <div
                  className="h-full bg-stitch-secondary/80 transition-all duration-500"
                  style={{
                    width: `${((currentMysteryIndex + 1) / mysteriesInSection.length) * 100}%`,
                  }}
                  aria-hidden
                />
              </div>
            </>
          )}
          {aveCount > 0 && aveCurrentIdx >= 0 && (
            <p className="mt-2 font-stitch-body text-xs text-stitch-on-surface-variant">
              <span className="text-stitch-secondary">●</span> Ave-Maria {aveCurrentIdx + 1} de{' '}
              {aveCount}
            </p>
          )}
          <div className="mt-3 border-t border-stitch-outline-variant/30 pt-2">
            <div className="flex items-center justify-between font-stitch-body text-[11px] uppercase tracking-widest text-stitch-on-surface-variant">
              <span>Progresso geral</span>
              <span>{overallPercent}%</span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-stitch-outline-variant/30">
              <div
                className="h-full bg-stitch-secondary transition-all duration-500"
                style={{ width: `${overallPercent}%` }}
                aria-hidden
              />
            </div>
          </div>
        </div>
      )}


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

      {/* Corpo */}
      {current.body && (
        <section className="prose-editorial mb-8">
          <p className="whitespace-pre-line font-stitch-display text-2xl md:text-[26px] leading-[1.55] text-stitch-on-surface">
            {current.body}
          </p>
        </section>
      )}

      {current.meditation && (
        <section className="mb-8 border-l-2 border-stitch-secondary/50 pl-4">
          <p className="mb-1 font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-secondary">
            Meditação
          </p>
          <p className="font-stitch-body text-base leading-relaxed text-stitch-on-surface">
            {current.meditation}
          </p>
        </section>
      )}

      {current.fruit && (
        <section className="mb-8 text-center">
          <p className="font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-secondary">
            Fruto
          </p>
          <p className="mt-1 font-stitch-display italic text-lg text-stitch-on-surface">
            {current.fruit}
          </p>
        </section>
      )}

      {(current.kind === 'mystery' || current.kind === 'decade') && current.repeat && (
        <section className="mb-8 rounded-2xl border border-stitch-outline-variant/30 bg-stitch-surface-container/30 p-6">
          <p className="text-center font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-secondary">
            {current.repeat.label} · {current.repeat.count}×
          </p>
          {current.repeat.text && (
            <p className="mt-3 whitespace-pre-line text-center font-stitch-display text-lg italic leading-relaxed text-stitch-on-surface">
              {current.repeat.text}
            </p>
          )}
        </section>
      )}

      {current.latin && (
        <section className="mb-8">
          <p className="mb-1 font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-secondary">
            Em latim
          </p>
          <p className="whitespace-pre-line font-stitch-display italic leading-[1.55] text-stitch-on-surface-variant">
            {current.latin}
          </p>
        </section>
      )}

      {/* Continuação inteligente ao concluir mistério */}
      {mysteryJustCompleted && !focus && !isLastOverall && currentMystery && (
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
            <Button type="button" variant="pill-active" size="pill" onClick={goNext}>
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

      {/* Referências */}
      {(current.refs?.bible?.length || current.refs?.catechism?.length) && !focus && (
        <section className="mb-10 border-t border-stitch-outline-variant/30 pt-6">
          <p className="mb-3 font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-secondary">
            Nexus
          </p>
          <ul className="space-y-2 font-stitch-body text-sm">
            {current.refs?.bible?.map((ref) => (
              <li key={`b-${ref}`}>
                <Link
                  to={`/bible?q=${encodeURIComponent(ref)}`}
                  className="inline-flex items-center gap-2 text-stitch-on-surface hover:text-stitch-secondary hover:underline"
                >
                  <BookOpen className="h-4 w-4 text-stitch-on-surface-variant" aria-hidden />
                  {ref}
                </Link>
              </li>
            ))}
            {current.refs?.catechism?.map((n) => (
              <li key={`c-${n}`}>
                <Link
                  to={`/catechism?p=${n}`}
                  className="inline-flex items-center gap-2 text-stitch-on-surface hover:text-stitch-secondary hover:underline"
                >
                  <Church className="h-4 w-4 text-stitch-on-surface-variant" aria-hidden />
                  Catecismo §{n}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Navegação */}
      <nav className="mt-10 flex items-center justify-between gap-4" aria-label="Navegação da oração">
        <Button
          type="button"
          variant="pill"
          size="pill"
          onClick={goPrev}
          disabled={cursorIndex === 0}
          className="px-4 py-2"
        >
          <ArrowLeft aria-hidden />
          Anterior
        </Button>
        <Button
          type="button"
          variant="pill-active"
          size="pill"
          onClick={goNext}
          className="px-4 py-2"
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

      {/* Continuidade final */}
      {isLastOverall && !focus && (
        <div className="mt-16">
          <ReaderContinuation
            context={{
              kind: 'prayer',
              id: prayer.slug,
              meta: { prayerCategory: prayer.category },
            }}
          />
        </div>
      )}
    </article>
  );

  if (focus) {
    return (
      <>
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stitch-surface text-stitch-on-surface"
          role="dialog"
          aria-label="Modo foco de oração"
        >
          <div className="w-full max-w-[720px] max-h-screen overflow-y-auto">{content}</div>
        </div>
        <ResetDialog open={confirmReset} onOpenChange={setConfirmReset} onConfirm={handleReset} />
      </>
    );
  }

  return (
    <>
      <MobileTopBar kicker={chromeKicker} title={prayer.title} showBack />
      <EditorialReaderChrome
        kicker={chromeKicker}
        title={prayer.title}
        subtitle={prayer.subtitle ?? undefined}
        backHref="/oracao"
      />
      {content}
      <MobileBottomNav />
      <ResetDialog open={confirmReset} onOpenChange={setConfirmReset} onConfirm={handleReset} />
    </>
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
