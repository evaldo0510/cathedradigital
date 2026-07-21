/**
 * ViaCrucis — Via Sacra Premium.
 *
 * Aplica o padrão editorial do Rosário Premium:
 *   • Introdução, Contexto e Como rezar (labels curatoriais).
 *   • PrayerModeSelector (Guiado / Contemplativo / Automático).
 *   • PrayerAudioPlayer (preparado para futura integração).
 *   • PrayerFavoriteButton (favoritos por estação).
 *   • ReaderContinuation (na 14ª estação).
 *   • Progresso persistido (posição + estações marcadas) via
 *     `useDevotionalProgress` + localStorage — sem alterar o banco.
 *
 * Conteúdo das 14 estações permanece intocado.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

import { Icons } from '../../constants';
import { Cross } from 'lucide-react';
import PrayerPortalStandalone from '@/components/prayer/PrayerPortalStandalone';
import { Button } from '@/components/ui/button';
import ShareButton from './ShareButton';
import { useDevotionalProgress } from '@/hooks/useDevotionalProgress';
import { useDevotionalReader } from '@/components/mobile/DevotionalReaderContext';
import PrayerModeSelector, { type PrayerMode } from '@/components/prayer/PrayerModeSelector';
import PrayerAudioPlayer from '@/components/prayer/PrayerAudioPlayer';
import PrayerFavoriteButton from '@/components/prayer/PrayerFavoriteButton';
import ReaderContinuation from '@/components/shared/ReaderContinuation';
import { resolvePrayerAutoNexus } from '@/core/knowledge/adapters/prayerAutoNexus';
import { usePrayerAutoAdvance } from '@/hooks/usePrayerAutoAdvance';
import { VIA_SACRA_STATIONS } from '@/data/viaSacraStations';
import StationContemplation from '@/components/prayer/viasacra/StationContemplation';
import StationClosingCard from '@/components/prayer/viasacra/StationClosingCard';
import FinalClosingCard from '@/components/prayer/viasacra/FinalClosingCard';

const VIA_METHOD_LABEL: Record<'landing' | 'journey', string> = {
  landing: 'contemplativo',
  journey: 'guiado',
};

const COMPLETED_LS_KEY = 'cathedra:devotional-progress:viacrucis:completed';
const MODE_LS_KEY = 'cathedra:devotional-progress:viacrucis:mode';
const INTERVAL_LS_KEY = 'cathedra:devotional-progress:viacrucis:interval';

const STATIONS = VIA_SACRA_STATIONS;

/* ------------------------- helpers locais (LS) ------------------------ */

function readCompleted(): Set<number> {
  try {
    const raw = localStorage.getItem(COMPLETED_LS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((n) => Number.isInteger(n))) : new Set();
  } catch {
    return new Set();
  }
}

function writeCompleted(set: Set<number>) {
  try {
    localStorage.setItem(COMPLETED_LS_KEY, JSON.stringify(Array.from(set).sort((a, b) => a - b)));
  } catch {
    /* noop */
  }
}

function readMode(): PrayerMode {
  try {
    const v = localStorage.getItem(MODE_LS_KEY);
    if (v === 'guided' || v === 'contemplative' || v === 'auto') return v;
  } catch { /* ignore */ }
  return 'guided';
}

function readInterval(): number {
  try {
    const n = Number(localStorage.getItem(INTERVAL_LS_KEY));
    if (Number.isFinite(n) && n >= 15000 && n <= 300000) return n;
  } catch { /* ignore */ }
  return 45000;
}

/* ---------------------------- componente ------------------------------ */

const ViaCrucis: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentStation, setCurrentStation] = useState(0);
  const [isJourney, setIsJourney] = useState(false);
  const [showFinalClosing, setShowFinalClosing] = useState(false);
  const { progress, loaded, save } = useDevotionalProgress('viacrucis');
  const { setIndex, setFavorite } = useDevotionalReader();

  // Marcação de estações (persistida em localStorage — não altera o banco).
  const [completed, setCompleted] = useState<Set<number>>(() => readCompleted());
  const markStationCompleted = useCallback((num: number) => {
    setCompleted((prev) => {
      if (prev.has(num)) return prev;
      const next = new Set(prev);
      next.add(num);
      writeCompleted(next);
      return next;
    });
  }, []);

  // Modos editoriais.
  const [mode, setModeState] = useState<PrayerMode>(() => readMode());
  const [autoIntervalMs, setAutoIntervalMs] = useState<number>(() => readInterval());
  const setMode = useCallback((m: PrayerMode) => {
    setModeState(m);
    try { localStorage.setItem(MODE_LS_KEY, m); } catch { /* ignore */ }
  }, []);
  const handleIntervalChange = useCallback((ms: number) => {
    setAutoIntervalMs(ms);
    try { localStorage.setItem(INTERVAL_LS_KEY, String(ms)); } catch { /* ignore */ }
  }, []);

  // Modo Contemplativo = tela limpa (foco absoluto).
  const contemplative = mode === 'contemplative';

  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const didFocusHeadingRef = useRef(false);
  const [restoreAnnouncement, setRestoreAnnouncement] = useState('');

  // Restauro de posição.
  useEffect(() => {
    if (loaded && progress.step != null) {
      setCurrentStation(Math.max(0, Math.min(STATIONS.length - 1, progress.step - 1)));
      if (progress.section === 'station') setIsJourney(true);
    }
  }, [loaded, progress.step, progress.section]);

  const focusHeading = useCallback(
    (reason: 'hash' | 'history' | 'bfcache' | 'popstate') => {
      if (typeof window === 'undefined') return;
      const el = headingRef.current;
      if (!el) return;
      if (document.activeElement === el) {
        didFocusHeadingRef.current = true;
        return;
      }
      el.focus();
      didFocusHeadingRef.current = true;
      if (reason !== 'hash') {
        const method = isJourney ? VIA_METHOD_LABEL.journey : VIA_METHOD_LABEL.landing;
        const state = isJourney
          ? `estação ${currentStation + 1} de ${STATIONS.length}`
          : 'introdução';
        setRestoreAnnouncement('');
        window.requestAnimationFrame(() => {
          setRestoreAnnouncement(`Via Sacra restaurada no modo ${method}, ${state}.`);
        });
      }
    },
    [isJourney, currentStation],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!loaded) return;
    if (didFocusHeadingRef.current) return;

    const hasHash = window.location.hash === '#via-sacra';
    const navEntry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    const isHistoryRestore = navEntry?.type === 'back_forward';

    if (!hasHash && !isHistoryRestore) return;

    const raf = window.requestAnimationFrame(() => {
      focusHeading(hasHash ? 'hash' : 'history');
      if (hasHash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [loaded, focusHeading]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopstate = () => {
      didFocusHeadingRef.current = false;
      window.requestAnimationFrame(() => focusHeading('popstate'));
    };
    const onPageshow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      didFocusHeadingRef.current = false;
      window.requestAnimationFrame(() => focusHeading('bfcache'));
    };
    window.addEventListener('popstate', onPopstate);
    window.addEventListener('pageshow', onPageshow);
    return () => {
      window.removeEventListener('popstate', onPopstate);
      window.removeEventListener('pageshow', onPageshow);
    };
  }, [focusHeading]);

  // Persistência de posição.
  useEffect(() => {
    if (isJourney) {
      save({ section: 'station', step: currentStation + 1, label: STATIONS[currentStation].title });
    }
  }, [currentStation, isJourney, save]);

  // Integração mobile shell (favorito + sumário) — inalterado.
  useEffect(() => {
    setIndex(
      'Estações da Via Sacra',
      STATIONS.map((s, i) => ({
        id: String(s.num),
        label: `${s.num}. ${s.title}`,
        hint: s.scripture,
        active: isJourney && i === currentStation,
        onSelect: () => {
          setCurrentStation(i);
          setIsJourney(true);
        },
      })),
    );
    const cur = STATIONS[currentStation];
    setFavorite({
      contentType: 'viacrucis_station',
      contentId: `station-${cur.num}`,
      title: `Via Crucis — ${cur.num}ª Estação: ${cur.title}`,
      content: cur.prayer,
      url: '/viacrucis',
      metadata: { station: cur.num, scripture: cur.scripture },
    });
  }, [currentStation, isJourney, setIndex, setFavorite]);

  // Navegação.
  const goNext = useCallback(() => {
    setCurrentStation((s) => {
      const cur = STATIONS[s];
      if (cur) markStationCompleted(cur.num);
      return Math.min(s + 1, STATIONS.length - 1);
    });
  }, [markStationCompleted]);

  const goPrev = useCallback(() => {
    setCurrentStation((s) => Math.max(0, s - 1));
  }, []);

  // Modo Automático — timer com auto-avanço (reinicia a cada estação).
  usePrayerAutoAdvance({
    enabled: isJourney && mode === 'auto',
    intervalMs: autoIntervalMs,
    onAdvance: goNext,
    key: `station-${currentStation}-${autoIntervalMs}`,
  });

  const station = STATIONS[currentStation];
  const totalCompleted = completed.size;
  const progressPct = useMemo(() => Math.round((totalCompleted / STATIONS.length) * 100), [totalCompleted]);

  /* --------------------------------- Landing -------------------------------- */
  if (!isJourney) {
    // B.2.5.b — Portal de Oração (limiar contemplativo antes do reader).
    const enterRequested = searchParams.get('enter') === '1';
    if (!enterRequested) {
      const first = STATIONS[0];
      return (
        <PrayerPortalStandalone
          slug="viacrucis"
          title="Via Sacra"
          estimatedSeconds={25 * 60}
          kicker="Cathedra · Via Dolorosa"
          backHref="/oracao"
          theme="passion"
          accentIcon={Cross}
          highlight={{
            eyebrow: 'Estação inicial',
            title: first.title,
            meta: [
              { label: 'Escritura', value: first.scripture, icon: 'book' },
              { label: 'Estações', value: '14 estações · caminho da Cruz', icon: 'sparkles' },
            ],
          }}
          onEnter={() => {
            const next = new URLSearchParams(searchParams);
            next.set('enter', '1');
            setSearchParams(next, { replace: true });
            setIsJourney(true);
          }}
        />
      );
    }
    return (
      <motion.div
        className="max-w-5xl mx-auto space-y-spacing-2xl pb-spacing-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        data-testid="via-sacra-landing"
      >
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          data-testid="via-sacra-restore-live"
        >
          {restoreAnnouncement}
        </div>

        <motion.div
          className="text-center space-y-spacing-md pt-spacing-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs bg-primary/5 border border-primary/10 rounded-premium">
            <Icons.Cross className="w-spacing-md h-spacing-md text-primary" />
            <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">Via Dolorosa</span>
          </div>
          <h1
            id="via-sacra-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-premium-4xl md:text-premium-6xl font-serif font-bold text-foreground tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-md"
          >
            Via Crucis
          </h1>
          <p className="text-premium-lg text-muted-foreground font-serif italic max-w-2xl mx-auto">
            "Se alguém quer vir após mim, negue-se a si mesmo, tome sua cruz e siga-me."
          </p>
        </motion.div>

        {/* Introdução · Contexto · Como rezar (labels curatoriais). */}
        <section
          aria-labelledby="via-sacra-intro-heading"
          data-testid="via-sacra-intro"
          className="max-w-2xl mx-auto rounded-2xl border border-primary/10 bg-card/60 p-spacing-lg space-y-spacing-md"
        >
          <h2
            id="via-sacra-intro-heading"
            className="font-serif text-premium-xs font-black uppercase tracking-[0.2em] text-primary"
          >
            Introdução
          </h2>
          <p className="font-serif italic text-foreground/90 text-premium-base leading-relaxed">
            Meditar a Via Sacra é percorrer, passo a passo, o caminho de Cristo até o Calvário —
            deixar-se acompanhar pelo mistério da Cruz.
          </p>
          <div>
            <p className="text-premium-xs font-black uppercase tracking-widest text-primary/70 mb-spacing-2xs">
              Contexto
            </p>
            <p className="text-premium-sm text-muted-foreground leading-relaxed">
              Devoção medieval consolidada pelos franciscanos, ligada à peregrinação a Jerusalém.
              A Igreja recomenda-a especialmente nas sextas-feiras da Quaresma.
            </p>
          </div>
          <div>
            <p className="text-premium-xs font-black uppercase tracking-widest text-primary/70 mb-spacing-2xs">
              Como rezar
            </p>
            <p className="text-premium-sm text-muted-foreground leading-relaxed">
              Percorra as 14 estações em silêncio interior. A cada estação, escute a Escritura,
              contemple o mistério e ofereça a oração final unindo os seus sofrimentos aos de Cristo.
            </p>
          </div>
          <div className="pt-spacing-xs flex flex-col items-start gap-spacing-sm">
            <PrayerModeSelector
              mode={mode}
              onChange={setMode}
              autoIntervalMs={autoIntervalMs}
              onIntervalChange={handleIntervalChange}
            />
            <div className="flex items-center gap-spacing-sm flex-wrap">
              <PrayerAudioPlayer audioUrl={null} label="Áudio da Via Sacra" />
              <PrayerFavoriteButton
                contentType="viacrucis"
                contentId="via-sacra"
                title="Via Sacra"
                url="/viacrucis"
              />
            </div>
          </div>
        </section>

        {/* Progresso persistido (marcação). */}
        {totalCompleted > 0 && (
          <div
            data-testid="via-sacra-progress-summary"
            className="text-center text-premium-xs uppercase tracking-widest text-muted-foreground"
          >
            {totalCompleted} de {STATIONS.length} estações concluídas · {progressPct}%
          </div>
        )}

        <div className="flex justify-center">
          <Button
            onClick={() => setIsJourney(true)}
            size="lg"
            className="h-spacing-3xl px-spacing-xl gap-spacing-sm rounded-premium-full shadow-premium-hover"
            data-testid="via-sacra-start"
          >
            <Icons.Play className="w-spacing-md h-spacing-md fill-current" />
            {totalCompleted > 0 ? 'Continuar Via Sacra' : 'Iniciar Via Sacra'}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-spacing-md">
          {STATIONS.map((s, i) => {
            const done = completed.has(s.num);
            return (
              <Button
                key={i}
                onClick={() => { setCurrentStation(i); setIsJourney(true); }}
                data-testid={`via-sacra-station-tile-${s.num}`}
                aria-label={`Estação ${s.num}: ${s.title}${done ? ' (concluída)' : ''}`}
                className="text-left p-spacing-lg rounded-premium-full bg-card border border-border hover:border-primary/40 hover:shadow-premium-hover hover:-translate-y-1 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-spacing-0 right-0 p-spacing-lg opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <Icons.Cross className="w-spacing-4xl h-spacing-4xl -mr-spacing-xl -mt-spacing-xl rotate-12" />
                </div>
                <div className="relative z-10 flex items-center gap-spacing-md">
                  <div className={`w-spacing-2xl h-spacing-2xl rounded-premium flex items-center justify-center font-black text-premium-lg shrink-0 border transition-colors ${done ? 'bg-primary text-primary-foreground border-primary' : 'bg-primary/5 text-primary border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground'}`}>
                    {done ? <Icons.Check className="w-spacing-md h-spacing-md" /> : s.num}
                  </div>
                  <div>
                    <p className="font-serif font-bold text-premium-lg text-foreground group-hover:text-primary transition-colors leading-tight">{s.title}</p>
                    <p className="text-premium-xs text-muted-foreground mt-spacing-2xs uppercase tracking-widest font-black">{s.scripture}</p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  /* --------------------------------- Jornada -------------------------------- */
  const isLast = currentStation >= STATIONS.length - 1;
  const isStationDone = completed.has(station.num);

  const containerCls = contemplative
    ? 'max-w-2xl mx-auto py-spacing-3xl px-spacing-md text-center animate-in fade-in duration-500'
    : 'max-w-4xl mx-auto space-y-spacing-xl pb-spacing-2xl animate-in fade-in duration-700';

  return (
    <div className={containerCls} data-testid="via-sacra-journey" data-mode={mode}>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="via-sacra-restore-live"
      >
        {restoreAnnouncement}
      </div>

      {/* Cabeçalho de navegação — oculto no modo contemplativo. */}
      {!contemplative && (
        <div className="flex items-center justify-between px-spacing-xs">
          <Button variant="outline" size="sm" onClick={() => setIsJourney(false)} className="rounded-premium-full shadow-premium-md gap-spacing-xs">
            <Icons.ArrowLeft className="w-spacing-md h-spacing-md text-foreground" />
            <span className="text-premium-xs font-black uppercase tracking-widest hidden md:block">Voltar</span>
          </Button>
          <div className="text-center">
            <p className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary/60 mb-spacing-2xs">Via Sacra</p>
            <span className="text-premium-sm font-serif font-bold text-foreground">
              Estação {currentStation + 1} de 14
            </span>
          </div>
          <div className="w-spacing-2xl" />
        </div>
      )}

      {/* Progresso visual — oculto no modo contemplativo. */}
      {!contemplative && (
        <div
          className="flex gap-spacing-2xs px-spacing-xs"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={STATIONS.length}
          aria-valuenow={currentStation + 1}
          aria-label={`Progresso: estação ${currentStation + 1} de ${STATIONS.length}`}
        >
          {STATIONS.map((_, i) => (
            <div key={i} className={`flex-1 h-spacing-2xs rounded-premium-full transition-all duration-500 ${completed.has(STATIONS[i].num) || i <= currentStation ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]' : 'bg-border'}`} />
          ))}
        </div>
      )}

      {/* Controles editoriais — modo, áudio, favorito. */}
      {!contemplative && (
        <div
          data-testid="via-sacra-controls"
          className="flex flex-col items-center gap-spacing-sm px-spacing-md"
        >
          <PrayerModeSelector
            mode={mode}
            onChange={setMode}
            autoIntervalMs={autoIntervalMs}
            onIntervalChange={handleIntervalChange}
          />
          <div className="flex items-center gap-spacing-sm flex-wrap justify-center">
            <PrayerAudioPlayer audioUrl={null} label={`Áudio da Estação ${station.num}`} />
            <PrayerFavoriteButton
              contentType="viacrucis_station"
              contentId={`station-${station.num}`}
              title={`Via Crucis — ${station.num}ª Estação: ${station.title}`}
              url="/viacrucis"
            />
            <span
              data-testid={`via-sacra-station-status-${station.num}`}
              className={`text-premium-xs uppercase tracking-widest font-black ${isStationDone ? 'text-primary' : 'text-muted-foreground/60'}`}
              aria-live="polite"
            >
              {isStationDone ? 'Concluída' : 'Em oração'}
            </span>
          </div>
        </div>
      )}

      {/* Corpo da estação */}
      <div className={contemplative
        ? 'space-y-spacing-2xl'
        : 'bg-card border border-border rounded-[3rem] p-spacing-xl md:p-spacing-3xl space-y-spacing-2xl shadow-premium-hover shadow-black/[0.02] relative overflow-hidden'}>
        {!contemplative && (
          <div className="absolute top-spacing-0 right-0 p-spacing-2xl opacity-[0.02]">
            <Icons.Cross className="w-spacing-4xl h-spacing-4xl -mr-spacing-3xl -mt-spacing-3xl rotate-12" />
          </div>
        )}

        <div className="relative text-center space-y-spacing-lg">
          {!contemplative && (
            <div className="w-spacing-3xl h-spacing-3xl rounded-[2rem] bg-foreground text-background flex items-center justify-center font-black text-premium-3xl mx-auto shadow-premium-hover border-4 border-background">
              {station.num}
            </div>
          )}
          <div className="space-y-spacing-xs">
            <h2
              id="via-sacra-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-premium-3xl md:text-premium-5xl font-serif font-bold text-foreground tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-md"
            >
              {station.title}
            </h2>
            {!contemplative && (
              <p className="text-premium-sm text-primary font-bold uppercase tracking-widest flex items-center justify-center gap-spacing-xs">
                <Icons.BookOpen className="w-spacing-md h-spacing-md" /> {station.scripture}
              </p>
            )}
          </div>
        </div>

        <div className="relative space-y-spacing-2xl max-w-2xl mx-auto">
          {/* Passagem bíblica expandida — só fora do contemplativo */}
          {!contemplative && (
            <div className="text-center space-y-spacing-xs">
              <h3 className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary/40">Escritura</h3>
              <p className="font-serif text-premium-base leading-relaxed text-foreground/85 italic max-w-[54ch] mx-auto">
                {station.biblicalPassage}
              </p>
            </div>
          )}

          <div className="space-y-spacing-md">
            {!contemplative && (
              <h3 className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary/40 text-center">Meditação</h3>
            )}
            <p className="text-premium-xl md:text-premium-2xl text-foreground/90 leading-relaxed font-serif text-center italic">
              "{station.meditation}"
            </p>
          </div>

          <div className={contemplative
            ? ''
            : 'bg-primary/5 rounded-[2.5rem] p-spacing-xl md:p-spacing-2xl border border-primary/10 relative'}>
            {!contemplative && (
              <>
                <Icons.Flame className="absolute -top-spacing-sm -right-spacing-sm w-spacing-xl h-spacing-xl text-primary/60 rotate-12" />
                <h3 className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary/40 text-center mb-spacing-lg">Oração</h3>
              </>
            )}
            <p className="text-premium-lg text-foreground/80 leading-relaxed font-serif text-center">
              {station.prayer}
            </p>
          </div>

          {/* Camada contemplativa: silêncio, Logos, Padres, Catecismo */}
          <StationContemplation station={station} contemplative={contemplative} />

          {/* Encerramento ritual da estação (fruto · oração · ação) */}
          {!contemplative && <StationClosingCard station={station} />}

          {!contemplative && (
            <>
              <div className="text-center space-y-spacing-xs pt-spacing-md opacity-60">
                <p className="text-premium-sm font-serif font-bold text-foreground">V. Adoramus te, Christe, et benedicimus tibi.</p>
                <p className="text-premium-sm font-serif italic text-muted-foreground">R. Quia per sanctam Crucem tuam redemisti mundum.</p>
              </div>

              <div className="flex justify-center pt-spacing-xs">
                <ShareButton
                  title={`Via Crucis — ${station.num}ª Estação`}
                  text={`${station.title}\n\n${station.meditation}\n\nOração: ${station.prayer}`}
                  variant="outline"
                  size="sm"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Encerramento editorial final da Via Sacra */}
      {showFinalClosing && (
        <FinalClosingCard
          onRestart={() => {
            setShowFinalClosing(false);
            setCurrentStation(0);
          }}
          onExit={() => {
            setShowFinalClosing(false);
            setIsJourney(false);
          }}
        />
      )}

      {/* Navegação */}
      <div className="flex gap-spacing-md justify-center px-spacing-md" data-testid="via-sacra-nav">
        <Button
          variant="outline"
          disabled={currentStation <= 0}
          onClick={goPrev}
          className="flex-1 max-w-[200px] h-spacing-2xl rounded-premium-full"
          data-testid="via-sacra-prev"
        >
          <Icons.ChevronLeft className="w-spacing-md h-spacing-md" /> Anterior
        </Button>

        {!isLast ? (
          <Button
            onClick={goNext}
            data-testid="via-sacra-next"
            className="flex-1 max-w-[200px] h-spacing-2xl rounded-premium-full bg-foreground text-background hover:bg-primary"
          >
            Próxima <Icons.ChevronRight className="w-spacing-md h-spacing-md" />
          </Button>
        ) : (
          <Button
            onClick={() => {
              markStationCompleted(station.num);
              setShowFinalClosing(true);
            }}
            data-testid="via-sacra-finish"
            className="flex-1 max-w-[200px] h-spacing-2xl rounded-premium-full bg-primary text-primary-foreground shadow-premium-hover shadow-primary/20"
          >
            <Icons.Cross className="w-spacing-md h-spacing-md" /> Concluir
          </Button>
        )}
      </div>

      {/* Continuidade — só na última estação, fora do modo contemplativo. */}
      {isLast && !contemplative && (() => {
        const nexus = resolvePrayerAutoNexus({
          slug: 'via-sacra',
          title: 'Via Sacra',
          category: 'via-sacra',
        });
        return (
          <div className="mt-spacing-2xl" data-testid="via-sacra-continuation">
            <ReaderContinuation
              context={{
                kind: 'prayer',
                id: 'via-sacra',
                graphNodeId: nexus.selfId ?? undefined,
                meta: { prayerCategory: 'via-sacra' },
              }}
              suggestions={nexus.suggestions.length > 0 ? nexus.suggestions : undefined}
            />
          </div>
        );
      })()}
    </div>
  );
};

export default ViaCrucis;
