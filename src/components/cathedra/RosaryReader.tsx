/**
 * RosaryReader — leitor contemplativo do Santo Rosário.
 *
 * Sub-sprint 1 SEG. Renderiza `prayer.blocks` (mistérios, Ave-Marias,
 * Glória, orações). Foco (`f`), navegação por teclado, TTS por bloco,
 * progresso persistido em `prayer_sessions`.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Focus, X, ChevronRight, BookOpen, Church } from 'lucide-react';
import { cn } from '@/lib/utils';
import EditorialReaderChrome from '@/components/editorial/EditorialReaderChrome';
import { MobileTopBar } from '@/components/mobile/MobileTopBar';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import PrayerTTSButton from '@/components/cathedra/PrayerTTSButton';
import { usePrayerSession } from '@/hooks/usePrayerSession';
import { isPrayerBlockArray, type PrayerBlock } from '@/types/prayer';
import type { Prayer } from '@/hooks/usePrayers';

interface Props {
  prayer: Prayer & { blocks?: unknown; content_status?: string };
  kicker?: string;
}

function bodyForTTS(b: PrayerBlock): string {
  const parts: string[] = [b.title];
  if (b.subtitle) parts.push(b.subtitle);
  if (b.body) parts.push(b.body);
  if (b.meditation) parts.push(`Meditação: ${b.meditation}`);
  if (b.repeat?.text) parts.push(b.repeat.text);
  return parts.join('. ');
}

export const RosaryReader: React.FC<Props> = ({ prayer, kicker }) => {
  const blocks = useMemo<PrayerBlock[]>(
    () => (isPrayerBlockArray(prayer.blocks) ? prayer.blocks.slice().sort((a, b) => a.order - b.order) : []),
    [prayer.blocks],
  );
  const blockIds = useMemo(() => blocks.map((b) => b.id), [blocks]);

  const { state, setIndex, markCompleted } = usePrayerSession(prayer.id, blockIds);
  const [focus, setFocus] = useState(false);

  const idx = Math.min(state.currentBlockIndex, Math.max(0, blocks.length - 1));
  const current = blocks[idx];

  const goPrev = useCallback(() => setIndex(idx - 1), [setIndex, idx]);
  const goNext = useCallback(() => {
    if (idx >= blocks.length - 1) {
      markCompleted();
      return;
    }
    setIndex(idx + 1);
  }, [setIndex, idx, blocks.length, markCompleted]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
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

  if (blocks.length === 0) {
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

  if (!current) return null;

  const isMysteryOrDecade = current.kind === 'mystery' || current.kind === 'decade';
  const progress = ((idx + 1) / blocks.length) * 100;

  const containerCls = focus
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-stitch-surface text-stitch-on-surface'
    : '';

  const content = (
    <article className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-6 md:px-8 md:pt-10">
      {/* Progresso */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-stitch-on-surface-variant font-stitch-body">
          <span>
            Bloco {idx + 1} de {blocks.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-stitch-outline-variant/30">
          <div
            className="h-full bg-stitch-secondary transition-all duration-500"
            style={{ width: `${progress}%` }}
            aria-hidden
          />
        </div>
      </div>

      {/* Cabeçalho do bloco */}
      <header className="mb-8 text-center">
        <p className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
          {({
            mystery: 'Mistério',
            decade: 'Dezena',
            station: 'Estação',
            hour: 'Hora Litúrgica',
            meditation: 'Meditação',
            prayer: 'Oração',
            closing: 'Encerramento',
            intro: 'Introdução',
          } as Record<string, string>)[current.kind] ?? current.kind}
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
          <button
            type="button"
            onClick={() => setFocus((f) => !f)}
            aria-pressed={focus}
            aria-label="Alternar modo foco (F)"
            className="inline-flex items-center gap-1.5 rounded-full border border-stitch-outline-variant/40 px-3 py-1.5 font-stitch-body text-xs uppercase tracking-widest text-stitch-on-surface-variant transition-colors hover:border-stitch-secondary/50 hover:text-stitch-on-surface"
          >
            {focus ? <X className="h-3.5 w-3.5" aria-hidden /> : <Focus className="h-3.5 w-3.5" aria-hidden />}
            {focus ? 'Sair do foco' : 'Modo foco'}
          </button>
        </div>
      </header>

      {/* Corpo */}
      {current.body && (
        <section className="prose-editorial mb-8">
          <p className="whitespace-pre-line font-stitch-display text-2xl md:text-[26px] leading-[1.55] text-stitch-on-surface">
            {current.body}
          </p>
        </section>
      )}

      {/* Meditação */}
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

      {/* Fruto */}
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

      {/* Repetição (Ave-Marias) */}
      {isMysteryOrDecade && current.repeat && (
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

      {/* Latim */}
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
        <button
          type="button"
          onClick={goPrev}
          disabled={idx === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-stitch-outline-variant/40 px-4 py-2 font-stitch-body text-xs uppercase tracking-widest text-stitch-on-surface-variant transition-colors hover:border-stitch-secondary/50 hover:text-stitch-on-surface disabled:opacity-40"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Anterior
        </button>
        <button
          type="button"
          onClick={goNext}
          className="inline-flex items-center gap-1.5 rounded-full bg-stitch-secondary px-4 py-2 font-stitch-body text-xs uppercase tracking-widest text-white transition-colors hover:bg-stitch-secondary/90"
        >
          {idx === blocks.length - 1 ? 'Concluir' : 'Próximo'}
          {idx === blocks.length - 1 ? null : <ArrowRight className="h-3.5 w-3.5" aria-hidden />}
        </button>
      </nav>
    </article>
  );

  if (focus) {
    return (
      <div className={containerCls} role="dialog" aria-label="Modo foco de oração">
        <div className="w-full max-w-[720px] overflow-y-auto max-h-screen">{content}</div>
      </div>
    );
  }

  return (
    <>
      <MobileTopBar kicker={kicker ?? 'Cathedra · Rosário'} title={prayer.title} showBack />
      <EditorialReaderChrome
        kicker={kicker ?? 'Cathedra · Rosário'}
        title={prayer.title}
        subtitle={prayer.subtitle ?? undefined}
        backHref="/oracao"
      />
      {content}

      {/* Sumário lateral (desktop) */}
      <aside
        aria-label="Sumário da oração"
        className="mx-auto mt-4 hidden max-w-[720px] px-4 pb-16 md:block"
      >
        <details className="rounded-2xl border border-stitch-outline-variant/30 p-4">
          <summary className="cursor-pointer font-stitch-body text-[11px] font-bold uppercase tracking-widest text-stitch-secondary">
            Sumário
          </summary>
          <ol className="mt-3 space-y-1 font-stitch-body text-sm">
            {blocks.map((b, i) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    'inline-flex w-full items-center gap-2 rounded px-2 py-1 text-left transition-colors',
                    i === idx
                      ? 'bg-stitch-secondary/10 text-stitch-secondary'
                      : 'text-stitch-on-surface hover:bg-stitch-outline-variant/20',
                  )}
                  aria-current={i === idx ? 'true' : undefined}
                >
                  <ChevronRight className="h-3 w-3 flex-none" aria-hidden />
                  <span className="truncate">
                    {i + 1}. {b.title}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </details>
      </aside>

      <MobileBottomNav />
    </>
  );
};

export default RosaryReader;
