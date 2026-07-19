/**
 * CAT-12.3 — Sessão de oração do Rosário (contemplativo, guiado, automático).
 *
 * - Overlay full-screen com tokens Logos 2030 (Cormorant + Karla, dourado
 *   discreto sobre azul profundo respirando).
 * - Fase linear derivada de `stepIndex`:
 *     0            → intro (Sinal + Credo + Pai-Nosso + 3 Ave + Glória)
 *     1..70        → 5 × (Anúncio + Pai-Nosso + 10 Ave + Glória + Fátima)
 *     71           → closing (Salve Rainha) + ReaderContinuation
 * - Contemplativo: sem timer, botão único grande, sem contagem visual da
 *   Ave-Maria atual (só progresso geral). Fundo respira.
 * - Guiado: passo a passo, mostra Pai-Nosso/Ave/Glória em ordem com o
 *   número da Ave-Maria em destaque.
 * - Automático: avança sozinho a cada N segundos (Play/Pause). Anima.
 * - Persistência: `useDevotionalProgress` (chave 'rosary'). Retoma exato.
 * - Telemetria: rosary.started, mode_changed, mystery_started/completed,
 *   completed, continuation.clicked.
 * - Acessibilidade: role="dialog", aria-modal, aria-live, focus trap
 *   nativo do overlay, botões semânticos com labels claros, tap ≥44px.
 * - Continuação: <ReaderContinuation kind="prayer" ...> + links diretos
 *   Bíblia/Catecismo/Santo/Jornada do mistério final.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Icons } from "@/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReaderContinuation } from "@/components/shared/ReaderContinuation";
import { telemetry } from "@/utils/navigation-telemetry";
import { RosaryProgress } from "./RosaryProgress";
import type { MysterySet, MysterySetData, Mystery } from "./mysteries";

export type RosaryMode = "contemplativo" | "guiado" | "automatico";

interface Props {
  set: MysterySetData;
  intention: string;
  initialMode: RosaryMode;
  initialStepIndex?: number;
  /** Tempo já rezado antes desta retomada (ms). Somado ao cronômetro atual. */
  initialElapsedMs?: number;
  /** ISO da 1ª vez que esta sessão começou (mantido através de reloads). */
  initialStartedAt?: string;
  onClose: () => void;
  onProgress: (
    stepIndex: number,
    mysteryIndex: number,
    mode: RosaryMode,
    elapsedMs: number,
    startedAt: string,
  ) => void;
}

/* -------------------------------------------------------------------------- */
/* Orações (texto)                                                            */
/* -------------------------------------------------------------------------- */

const PRAYER_TEXT: Record<string, { title: string; text: string }> = {
  signOfCross: {
    title: "Sinal da Cruz",
    text: "Em nome do Pai, e do Filho, e do Espírito Santo. Amém.",
  },
  creed: {
    title: "Credo Apostólico",
    text: "Creio em Deus Pai Todo-Poderoso, Criador do céu e da terra; e em Jesus Cristo, seu único Filho, nosso Senhor, que foi concebido pelo poder do Espírito Santo, nasceu da Virgem Maria; padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado; desceu à mansão dos mortos; ressuscitou ao terceiro dia; subiu aos céus; está sentado à direita de Deus Pai Todo-Poderoso, donde há de vir a julgar os vivos e os mortos. Creio no Espírito Santo, na Santa Igreja Católica, na comunhão dos Santos, na remissão dos pecados, na ressurreição da carne, na vida eterna. Amém.",
  },
  ourFather: {
    title: "Pai Nosso",
    text: "Pai nosso que estais nos céus, santificado seja o vosso nome, venha a nós o vosso reino, seja feita a vossa vontade assim na terra como no céu. O pão nosso de cada dia nos dai hoje, perdoai-nos as nossas ofensas assim como nós perdoamos a quem nos tem ofendido, e não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.",
  },
  hailMary: {
    title: "Ave Maria",
    text: "Ave Maria, cheia de graça, o Senhor é convosco, bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós pecadores, agora e na hora de nossa morte. Amém.",
  },
  glory: {
    title: "Glória ao Pai",
    text: "Glória ao Pai, e ao Filho, e ao Espírito Santo. Como era no princípio, agora e sempre. Amém.",
  },
  fatima: {
    title: "Oração de Fátima",
    text: "Ó meu Jesus, perdoai-nos, livrai-nos do fogo do Inferno, levai as almas todas para o Céu, e socorrei principalmente as que mais precisarem da vossa misericórdia.",
  },
  salveRainha: {
    title: "Salve Rainha",
    text: "Salve Rainha, Mãe de Misericórdia, vida, doçura, esperança nossa, salve! A vós bradamos, os degredados filhos de Eva. A vós suspiramos, gemendo e chorando neste vale de lágrimas. Eia, pois, advogada nossa, esses vossos olhos misericordiosos a nós volvei. E, depois deste desterro, mostrai-nos Jesus, bendito fruto do vosso ventre. Ó clemente, ó piedosa, ó doce sempre Virgem Maria. Rogai por nós, Santa Mãe de Deus, para que sejamos dignos das promessas de Cristo. Amém.",
  },
};

/* -------------------------------------------------------------------------- */
/* Máquina de fase                                                            */
/* -------------------------------------------------------------------------- */

type PhaseKind =
  | "intro"
  | "announce"
  | "our-father"
  | "hail-mary"
  | "glory"
  | "fatima"
  | "closing";

interface Phase {
  kind: PhaseKind;
  mysteryIndex: number;
  /** 0..9 quando kind='hail-mary'. */
  beadIndex: number;
}

const STEPS_PER_MYSTERY = 1 /*announce*/ + 1 /*our-father*/ + 10 /*hail-mary*/ + 1 /*glory*/ + 1 /*fatima*/; // = 14
const TOTAL_STEPS = 1 /*intro*/ + 5 * STEPS_PER_MYSTERY + 1 /*closing*/; // = 72

function phaseFor(stepIndex: number): Phase {
  if (stepIndex <= 0) return { kind: "intro", mysteryIndex: -1, beadIndex: 0 };
  if (stepIndex >= TOTAL_STEPS - 1)
    return { kind: "closing", mysteryIndex: 4, beadIndex: 0 };

  const within = stepIndex - 1; // 0..69
  const mysteryIndex = Math.floor(within / STEPS_PER_MYSTERY);
  const inMystery = within % STEPS_PER_MYSTERY;

  if (inMystery === 0) return { kind: "announce", mysteryIndex, beadIndex: 0 };
  if (inMystery === 1) return { kind: "our-father", mysteryIndex, beadIndex: 0 };
  if (inMystery >= 2 && inMystery <= 11)
    return { kind: "hail-mary", mysteryIndex, beadIndex: inMystery - 2 };
  if (inMystery === 12) return { kind: "glory", mysteryIndex, beadIndex: 0 };
  return { kind: "fatima", mysteryIndex, beadIndex: 0 };
}

/** Duração automática por tipo de passo (ms). */
function autoDuration(kind: PhaseKind): number {
  switch (kind) {
    case "intro":
      return 24000;
    case "announce":
      return 22000;
    case "our-father":
      return 15000;
    case "hail-mary":
      return 11000;
    case "glory":
      return 9000;
    case "fatima":
      return 12000;
    case "closing":
      return 30000;
  }
}

/* -------------------------------------------------------------------------- */
/* Componente principal                                                       */
/* -------------------------------------------------------------------------- */

export const RosarySession: React.FC<Props> = ({
  set,
  intention,
  initialMode,
  initialStepIndex = 0,
  initialElapsedMs = 0,
  initialStartedAt,
  onClose,
  onProgress,
}) => {
  const [mode, setMode] = useState<RosaryMode>(initialMode);
  const [stepIndex, setStepIndex] = useState<number>(initialStepIndex);
  const [isPlaying, setIsPlaying] = useState<boolean>(initialMode === "automatico");
  const [showText, setShowText] = useState<boolean>(true);

  const phase = phaseFor(stepIndex);
  const mystery: Mystery | undefined =
    phase.mysteryIndex >= 0 ? set.mysteries[phase.mysteryIndex] : undefined;
  const completedMysteries = useMemo(
    () => [0, 1, 2, 3, 4].map((mi) => stepIndex >= 1 + (mi + 1) * STEPS_PER_MYSTERY),
    [stepIndex],
  );

  /* ---------- Cronômetro (soma tempo acumulado + sessão atual) ---------- */
  const startedAtRef = useRef<string>(initialStartedAt ?? new Date().toISOString());
  const sessionStartMsRef = useRef<number>(Date.now());
  const elapsedMs = useCallback(
    () => initialElapsedMs + (Date.now() - sessionStartMsRef.current),
    [initialElapsedMs],
  );

  /* ---------- Telemetria (disparo único por evento) ---------- */
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      telemetry.log("rosary.started", "info", {
        set: set.key,
        mode,
        resumedFromStep: initialStepIndex,
        resumedElapsedMs: initialElapsedMs,
        startedAt: startedAtRef.current,
      });
    }
  }, [set.key, mode, initialStepIndex, initialElapsedMs]);

  const startedMysteriesRef = useRef<Set<number>>(new Set());
  const completedMysteriesRef = useRef<Set<number>>(new Set());
  const completedSessionRef = useRef(false);
  useEffect(() => {
    if (
      phase.kind === "announce" &&
      phase.mysteryIndex >= 0 &&
      !startedMysteriesRef.current.has(phase.mysteryIndex)
    ) {
      startedMysteriesRef.current.add(phase.mysteryIndex);
      telemetry.log("rosary.mystery_started", "info", {
        set: set.key,
        mysteryIndex: phase.mysteryIndex,
        title: set.mysteries[phase.mysteryIndex]?.title,
      });
    }
    if (
      phase.kind === "fatima" &&
      phase.mysteryIndex >= 0 &&
      !completedMysteriesRef.current.has(phase.mysteryIndex)
    ) {
      completedMysteriesRef.current.add(phase.mysteryIndex);
      telemetry.log("rosary.mystery_completed", "info", {
        set: set.key,
        mysteryIndex: phase.mysteryIndex,
        title: set.mysteries[phase.mysteryIndex]?.title,
        elapsedMs: elapsedMs(),
      });
    }
    if (phase.kind === "closing" && !completedSessionRef.current) {
      completedSessionRef.current = true;
      telemetry.log("rosary.completed", "info", {
        set: set.key,
        mode,
        durationMs: elapsedMs(),
        startedAt: startedAtRef.current,
      });
    }
  }, [phase.kind, phase.mysteryIndex, set, mode, elapsedMs]);

  /* ---------- Persistência ---------- */
  useEffect(() => {
    onProgress(
      stepIndex,
      Math.max(0, phase.mysteryIndex),
      mode,
      elapsedMs(),
      startedAtRef.current,
    );
  }, [stepIndex, phase.mysteryIndex, mode, onProgress, elapsedMs]);

  /* ---------- Automático ---------- */
  useEffect(() => {
    if (mode !== "automatico" || !isPlaying) return;
    if (phase.kind === "closing") return;
    const t = setTimeout(() => {
      setStepIndex((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    }, autoDuration(phase.kind));
    return () => clearTimeout(t);
  }, [mode, isPlaying, stepIndex, phase.kind]);

  /* ---------- Handlers ---------- */
  const goNext = useCallback(() => {
    setStepIndex((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);
  const goPrev = useCallback(() => {
    setStepIndex((s) => Math.max(s - 1, 0));
  }, []);

  const changeMode = useCallback(
    (m: RosaryMode) => {
      setMode(m);
      setIsPlaying(m === "automatico");
      telemetry.log("rosary.mode_changed", "info", { set: set.key, mode: m });
    },
    [set.key],
  );

  /* ---------- Teclado ---------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key.toLowerCase() === "p") {
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  /* ---------- Foco inicial ---------- */
  const advanceBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    advanceBtnRef.current?.focus();
  }, []);

  /* ---------- Render ---------- */

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Oração do Santo Rosário — ${set.name}`}
      className={cn(
        "fixed inset-0 z-[200] flex flex-col overflow-y-auto",
        mode === "contemplativo" && "cursor-default",
      )}
      style={{
        background:
          "radial-gradient(circle at 50% 10%, hsl(220 45% 14%) 0%, hsl(220 60% 6%) 55%, hsl(220 65% 4%) 100%)",
      }}
    >
      {/* Fundo respirando (contemplativo) */}
      {mode === "contemplativo" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(200,169,106,0.15), transparent 60%)",
            animation: "rosary-breath 10s ease-in-out infinite",
          }}
        />
      )}
      <style>{`
        @keyframes rosary-breath {
          0%, 100% { transform: scale(1); opacity: 0.22; }
          50%      { transform: scale(1.08); opacity: 0.38; }
        }
      `}</style>

      {/* Header */}
      <header className="relative flex items-center justify-between px-spacing-lg py-spacing-md sticky top-0 z-10 backdrop-blur-sm bg-black/20">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Sair da oração e voltar"
          className="min-h-11 min-w-11 rounded-premium-full border border-white/10 text-secondary/80 hover:bg-white/10"
        >
          <Icons.ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.28em] text-secondary/60">
            {set.latin}
          </span>
          <span className="text-premium-sm font-serif text-secondary/85">{set.name}</span>
        </div>

        {/* Seletor de modo (chips) */}
        <fieldset className="flex items-center gap-1 rounded-premium-full border border-white/10 bg-black/30 p-1">
          <legend className="sr-only">Modo de oração</legend>
          {(["contemplativo", "guiado", "automatico"] as RosaryMode[]).map((m) => (
            <label
              key={m}
              className={cn(
                "cursor-pointer rounded-premium-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] transition-all min-h-8",
                mode === m
                  ? "bg-secondary text-primary"
                  : "text-secondary/60 hover:text-secondary",
              )}
            >
              <input
                type="radio"
                name="rosary-mode"
                value={m}
                checked={mode === m}
                onChange={() => changeMode(m)}
                className="sr-only"
              />
              {m === "contemplativo" ? "Contempl." : m === "guiado" ? "Guiado" : "Auto"}
            </label>
          ))}
        </fieldset>
      </header>

      {/* Progresso */}
      {phase.kind !== "intro" && phase.kind !== "closing" && (
        <div className="relative px-spacing-lg py-spacing-md flex justify-center">
          <RosaryProgress
            mysteryIndex={phase.mysteryIndex}
            beadIndex={phase.kind === "hail-mary" ? phase.beadIndex + 1 : phase.kind === "our-father" ? 0 : 10}
            completed={completedMysteries}
            className="text-secondary"
          />
        </div>
      )}

      {/* Corpo */}
      <main
        id="rosary-session-main"
        className="relative flex-1 flex items-start justify-center px-spacing-lg pb-spacing-2xl"
      >
        <div className="w-full max-w-[70ch] mx-auto pt-spacing-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${phase.kind}-${phase.mysteryIndex}-${phase.beadIndex}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: mode === "contemplativo" ? 0.9 : 0.4 }}
              className="rounded-[2.5rem] border border-white/[0.07] bg-white/[0.03] p-spacing-xl md:p-spacing-2xl shadow-premium-hover shadow-black/40"
            >
              <PhaseContent
                phase={phase}
                mystery={mystery}
                intention={intention}
                set={set}
                showText={showText}
                onToggleText={() => setShowText((v) => !v)}
                onCtaClick={(evt) =>
                  telemetry.log("rosary.continuation.clicked", "info", {
                    set: set.key,
                    mysteryIndex: phase.mysteryIndex,
                    ...evt,
                  })
                }
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer / controles */}
      <footer className="sticky bottom-0 z-10 backdrop-blur-sm bg-black/25 border-t border-white/5 px-spacing-lg py-spacing-md">
        <div className="max-w-[70ch] mx-auto flex items-center justify-between gap-spacing-md">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={stepIndex === 0}
            aria-label="Passo anterior"
            className="min-h-11 rounded-premium-full text-secondary/70 hover:bg-white/10 disabled:opacity-30"
          >
            <Icons.ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          {mode === "automatico" && phase.kind !== "closing" && (
            <Button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? "Pausar avanço automático" : "Retomar avanço automático"}
              aria-pressed={isPlaying}
              className="min-h-11 rounded-premium-full bg-secondary text-primary px-6 font-black uppercase tracking-[0.18em] text-[11px]"
            >
              {isPlaying ? (
                <>
                  <Icons.Circle className="w-3 h-3 mr-2 fill-current" /> Pausar
                </>
              ) : (
                <>
                  <Icons.ChevronRight className="w-4 h-4 mr-1" /> Retomar
                </>
              )}
            </Button>
          )}

          {mode !== "automatico" && phase.kind !== "closing" && (
            <Button
              type="button"
              ref={advanceBtnRef}
              onClick={goNext}
              className="min-h-12 rounded-premium-full bg-secondary text-primary px-8 font-black uppercase tracking-[0.18em] text-[11px] shadow-premium-hover shadow-secondary/25"
            >
              Avançar <Icons.ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}

          {phase.kind === "closing" && (
            <Button
              type="button"
              onClick={onClose}
              className="min-h-12 rounded-premium-full bg-secondary text-primary px-8 font-black uppercase tracking-[0.18em] text-[11px]"
            >
              <Icons.Cross className="w-4 h-4 mr-2" /> Amém — Encerrar
            </Button>
          )}

          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-secondary/50 hidden md:block">
            {stepIndex}/{TOTAL_STEPS - 1}
          </div>
        </div>
      </footer>
    </div>
  );

  return createPortal(overlay, document.body);
};

/* -------------------------------------------------------------------------- */
/* Conteúdo por fase                                                          */
/* -------------------------------------------------------------------------- */

interface PhaseContentProps {
  phase: Phase;
  mystery?: Mystery;
  intention: string;
  set: MysterySetData;
  showText: boolean;
  onToggleText: () => void;
  onCtaClick: (evt: { label: string; href: string; kind: string }) => void;
}

const PhaseContent: React.FC<PhaseContentProps> = ({
  phase,
  mystery,
  intention,
  set,
  showText,
  onToggleText,
  onCtaClick,
}) => {
  if (phase.kind === "intro") {
    return (
      <div className="space-y-spacing-lg text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-secondary/60">
          Orações Iniciais
        </p>
        <h2 className="font-display text-premium-3xl text-secondary">Sinal da Cruz</h2>
        <p className="italic text-secondary/85 font-serif text-premium-lg leading-relaxed">
          {PRAYER_TEXT.signOfCross.text}
        </p>
        {intention && (
          <blockquote className="mt-spacing-md mx-auto max-w-prose rounded-premium border border-secondary/15 bg-secondary/[0.04] p-spacing-md">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-secondary/50">
              Intenção
            </p>
            <p className="mt-1 italic font-serif text-secondary/80">“{intention}”</p>
          </blockquote>
        )}
        <p className="text-premium-xs text-secondary/50 font-serif italic max-w-prose mx-auto">
          Sinal da Cruz · Credo · Pai-Nosso · 3 Ave-Marias (Fé, Esperança, Caridade) · Glória.
        </p>
        <details className="text-left mt-spacing-lg">
          <summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.22em] text-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded">
            Ler o Credo Apostólico
          </summary>
          <p className="mt-3 text-secondary/75 font-serif leading-relaxed">{PRAYER_TEXT.creed.text}</p>
        </details>
      </div>
    );
  }

  if (phase.kind === "announce" && mystery) {
    return (
      <div className="space-y-spacing-lg text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-secondary/60">
          {phase.mysteryIndex + 1}º Mistério
        </p>
        <h2 className="font-display text-premium-3xl md:text-premium-4xl text-secondary leading-tight">
          {mystery.title}
        </h2>
        <Link
          to={mystery.scriptureHref}
          className="inline-block text-premium-xs font-black uppercase tracking-[0.22em] text-secondary/80 hover:text-secondary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
          onClick={() =>
            onCtaClick({ label: mystery.scripture, href: mystery.scriptureHref, kind: "bible-inline" })
          }
        >
          {mystery.scripture}
        </Link>
        <p className="italic font-serif text-premium-lg text-secondary/85 leading-relaxed max-w-prose mx-auto">
          “{mystery.meditation}”
        </p>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-spacing-md mt-spacing-lg text-left">
          <div className="rounded-premium border border-secondary/15 bg-secondary/[0.03] p-spacing-md">
            <dt className="text-[10px] font-black uppercase tracking-[0.24em] text-secondary/55">
              Intenção sugerida
            </dt>
            <dd className="mt-2 font-serif text-secondary/85">{mystery.intention}</dd>
          </div>
          <div className="rounded-premium border border-secondary/15 bg-secondary/[0.03] p-spacing-md">
            <dt className="text-[10px] font-black uppercase tracking-[0.24em] text-secondary/55">
              Fruto espiritual
            </dt>
            <dd className="mt-2 font-serif text-secondary/85">{mystery.fruit}</dd>
          </div>
        </dl>
      </div>
    );
  }

  if (phase.kind === "our-father") {
    return (
      <div className="space-y-spacing-md text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-secondary/60">
          {phase.mysteryIndex + 1}º Mistério · Pai-Nosso
        </p>
        <h2 className="font-display text-premium-2xl text-secondary">Pai Nosso</h2>
        {showText ? (
          <p className="italic font-serif text-premium-lg text-secondary/85 leading-relaxed max-w-prose mx-auto">
            {PRAYER_TEXT.ourFather.text}
          </p>
        ) : null}
        <TextToggle showText={showText} onToggle={onToggleText} />
      </div>
    );
  }

  if (phase.kind === "hail-mary") {
    const n = phase.beadIndex + 1;
    return (
      <div className="space-y-spacing-md text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-secondary/60">
          {phase.mysteryIndex + 1}º Mistério · Ave-Maria
        </p>
        <div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-premium-full border-2 border-secondary/40 bg-secondary/10 text-secondary font-display text-premium-4xl"
          aria-live="polite"
          aria-atomic="true"
        >
          {n}
          <span className="sr-only"> de 10</span>
        </div>
        {showText && (
          <p className="italic font-serif text-premium-lg text-secondary/85 leading-relaxed max-w-prose mx-auto">
            {PRAYER_TEXT.hailMary.text}
          </p>
        )}
        <TextToggle showText={showText} onToggle={onToggleText} />
      </div>
    );
  }

  if (phase.kind === "glory") {
    return (
      <div className="space-y-spacing-md text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-secondary/60">
          {phase.mysteryIndex + 1}º Mistério · Glória
        </p>
        <h2 className="font-display text-premium-2xl text-secondary">Glória ao Pai</h2>
        {showText && (
          <p className="italic font-serif text-premium-lg text-secondary/85 leading-relaxed max-w-prose mx-auto">
            {PRAYER_TEXT.glory.text}
          </p>
        )}
        <TextToggle showText={showText} onToggle={onToggleText} />
      </div>
    );
  }

  if (phase.kind === "fatima") {
    const isFinal = phase.mysteryIndex === 4;
    return (
      <div className="space-y-spacing-lg text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-secondary/75">
          {phase.mysteryIndex + 1}º Mistério · Oração de Fátima
        </p>
        <p className="italic font-serif text-premium-lg text-secondary/85 leading-relaxed max-w-prose mx-auto">
          {PRAYER_TEXT.fatima.text}
        </p>

        {/* Continuação inteligente por mistério (não apenas no closing). */}
        {mystery && !isFinal && (
          <MysteryContinuation
            mystery={mystery}
            setKey={set.key}
            onCtaClick={onCtaClick}
          />
        )}
      </div>
    );
  }



  // closing
  const finalMystery = set.mysteries[4];
  return (
    <div className="space-y-spacing-xl text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-secondary/60">
        Oração Final
      </p>
      <h2 className="font-display text-premium-3xl text-secondary">Salve Rainha</h2>
      <p className="italic font-serif text-premium-lg text-secondary/85 leading-relaxed max-w-prose mx-auto">
        {PRAYER_TEXT.salveRainha.text}
      </p>

      <div className="pt-spacing-lg">
        <Icons.Heart className="w-10 h-10 mx-auto text-secondary/70" />
        <p className="mt-spacing-md font-display text-premium-2xl text-secondary">
          Rosário completo.
        </p>
        <p className="text-premium-sm text-secondary/60 font-serif italic max-w-prose mx-auto">
          {set.epigraph}
        </p>
      </div>

      {/* Continuação inteligente — Bíblia/Catecismo/Santo/Jornada do último mistério */}
      {finalMystery.links.length > 0 && (
        <section
          aria-label="Aprofundar este mistério"
          className="mt-spacing-2xl border-t border-secondary/20 pt-spacing-xl text-left"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-secondary/60 text-center">
            Aprofundar “{finalMystery.title}”
          </p>
          <ul className="mt-spacing-md flex flex-col gap-spacing-sm">
            {finalMystery.links.map((l) => (
              <li key={l.href}>
                <Link
                  to={l.href}
                  onClick={() =>
                    onCtaClick({ label: l.label, href: l.href, kind: `rosary-link:${l.kind}` })
                  }
                  className="flex items-center gap-3 min-h-11 px-4 py-3 rounded-premium-lg border border-secondary/20 bg-secondary/[0.04] text-secondary/90 hover:bg-secondary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-secondary/55 w-20">
                    {l.eyebrow ?? l.kind}
                  </span>
                  <span className="font-serif">{l.label}</span>
                  <Icons.ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ReaderContinuation — mesma continuidade das outras leituras */}
      <div className="mt-spacing-xl text-left">
        <ReaderContinuation
          context={{
            kind: "prayer",
            id: `rosary:${set.key}`,
            themeIds: finalMystery.themeIds,
            meta: { prayerCategory: "marianas" },
          }}
          onCtaClick={(evt) => onCtaClick({ ...evt, kind: "reader-continuation" })}
        />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Toggle de texto (contemplativo pode esconder o texto)                      */
/* -------------------------------------------------------------------------- */

const TextToggle: React.FC<{ showText: boolean; onToggle: () => void }> = ({
  showText,
  onToggle,
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={!showText}
    className="text-[10px] font-black uppercase tracking-[0.22em] text-secondary/75 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded px-2 py-1"
  >
    {showText ? "Ocultar texto" : "Mostrar texto"}
  </button>
);

/* -------------------------------------------------------------------------- */
/* Continuação inteligente por mistério                                       */
/* -------------------------------------------------------------------------- */

interface MysteryContinuationProps {
  mystery: Mystery;
  setKey: MysterySet;
  onCtaClick: (evt: { label: string; href: string; kind: string }) => void;
}

const MysteryContinuation: React.FC<MysteryContinuationProps> = ({
  mystery,
  setKey,
  onCtaClick,
}) => (
  <section
    aria-label={`Aprofundar o mistério ${mystery.title}`}
    className="mt-spacing-lg border-t border-secondary/25 pt-spacing-lg text-left"
  >
    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-secondary/80 text-center">
      Aprofundar “{mystery.title}”
    </p>
    {mystery.links.length > 0 && (
      <ul className="mt-spacing-md flex flex-col gap-spacing-sm">
        {mystery.links.map((l) => (
          <li key={l.href}>
            <Link
              to={l.href}
              onClick={() =>
                onCtaClick({ label: l.label, href: l.href, kind: `rosary-link:${l.kind}` })
              }
              className="flex items-center gap-3 min-h-11 px-4 py-3 rounded-premium-lg border border-secondary/25 bg-secondary/[0.05] text-secondary hover:bg-secondary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-secondary/80 w-20">
                {l.eyebrow ?? l.kind}
              </span>
              <span className="font-serif">{l.label}</span>
              <Icons.ChevronRight className="w-4 h-4 ml-auto opacity-70" />
            </Link>
          </li>
        ))}
      </ul>
    )}
    <div className="mt-spacing-md">
      <ReaderContinuation
        context={{
          kind: "prayer",
          id: `rosary:${setKey}:${mystery.id}`,
          themeIds: mystery.themeIds,
          meta: { prayerCategory: "marianas" },
        }}
        onCtaClick={(evt) =>
          onCtaClick({ ...evt, kind: `reader-continuation:${mystery.id}` })
        }
      />
    </div>
  </section>
);

export default RosarySession;
