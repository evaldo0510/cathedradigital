/**
 * CAT-12.3 — Rosário (orquestrador).
 *
 * - Landing editorial com os 4 conjuntos + sugestão do dia.
 * - Preparação: escolha do modo, intenção, arte e resumo dos mistérios.
 * - Sessão: delegada para <RosarySession/> (contemplativo, guiado, automático).
 * - Persistência: useDevotionalProgress (`section`=conjunto, `step`=stepIndex,
 *   `label`=`${set.name}|${mode}|${mysteryIndex}`). Retoma exatamente onde parou.
 * - Integração devocional: mantém setIndex/setFavorite do DevotionalReaderContext.
 * - Sem novas dependências, sem alterar API pública (default export React.FC).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Icons } from "@/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDevotionalProgress } from "@/hooks/useDevotionalProgress";
import { useDevotionalReader } from "@/components/mobile/DevotionalReaderContext";
import {
  MYSTERY_SETS,
  MYSTERY_ORDER,
  suggestSetForToday,
  type MysterySet,
} from "./rosary/mysteries";
import { RosaryArt } from "./rosary/RosaryArt";
import { RosarySession, type RosaryMode } from "./rosary/RosarySession";

const Rosary: React.FC = () => {
  const [selectedSet, setSelectedSet] = useState<MysterySet | null>(null);
  const [isPraying, setIsPraying] = useState(false);
  const [mode, setMode] = useState<RosaryMode>("guiado");
  const [intention, setIntention] = useState("");
  const [resumeStepIndex, setResumeStepIndex] = useState<number | undefined>(undefined);
  const [resumeElapsedMs, setResumeElapsedMs] = useState<number>(0);
  const [resumeStartedAt, setResumeStartedAt] = useState<string | undefined>(undefined);

  const { progress, loaded, save } = useDevotionalProgress("rosary");
  const { setIndex, setFavorite } = useDevotionalReader();

  const todaySet = useMemo(() => suggestSetForToday(), []);

  /* ---------- Restaurar progresso salvo ---------- */
  useEffect(() => {
    if (!loaded || selectedSet) return;
    const section = progress.section as MysterySet | null;
    if (section && MYSTERY_SETS[section]) {
      setSelectedSet(section);
    }
    // Decodificar label = `${name}|${mode}|${mysteryIndex}|${elapsedMs}|${startedAt}`
    if (progress.label) {
      const parts = String(progress.label).split("|");
      const savedMode = parts[1] as RosaryMode | undefined;
      if (savedMode === "contemplativo" || savedMode === "guiado" || savedMode === "automatico") {
        setMode(savedMode);
      }
      const savedElapsed = Number(parts[3]);
      if (Number.isFinite(savedElapsed) && savedElapsed > 0) setResumeElapsedMs(savedElapsed);
      if (parts[4]) setResumeStartedAt(parts[4]);
    }
    if (typeof progress.step === "number" && progress.step > 0) {
      setResumeStepIndex(progress.step);
    }
  }, [loaded, progress.section, progress.step, progress.label, selectedSet]);

  /* ---------- Registrar índice + favorito ---------- */
  useEffect(() => {
    setIndex(
      "Mistérios do Rosário",
      MYSTERY_ORDER.map((key) => {
        const val = MYSTERY_SETS[key];
        return {
          id: key,
          label: val.name,
          hint: val.day,
          active: selectedSet === key,
          onSelect: () => {
            setSelectedSet(key);
            setResumeStepIndex(undefined);
            setResumeElapsedMs(0);
            setResumeStartedAt(undefined);
          },
        };
      }),
    );
    setFavorite(
      selectedSet
        ? {
            contentType: "rosary_mystery_set",
            contentId: selectedSet,
            title: `Rosário — ${MYSTERY_SETS[selectedSet].name}`,
            content: MYSTERY_SETS[selectedSet].mysteries.map((m) => `• ${m.title}`).join("\n"),
            url: "/rosary",
            metadata: { set: selectedSet, day: MYSTERY_SETS[selectedSet].day },
          }
        : null,
    );
    // setIndex/setFavorite recriados a cada render do provider; incluí-los causa loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSet]);

  /* Handlers estáveis (devem ficar antes de qualquer return condicional). */
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);
  const handleClose = useCallback(() => setIsPraying(false), []);
  const handleProgress = useCallback(
    (
      stepIndex: number,
      mysteryIndex: number,
      currentMode: RosaryMode,
      elapsedMs: number,
      startedAt: string,
    ) => {
      if (!selectedSet) return;
      const s = MYSTERY_SETS[selectedSet];
      saveRef.current({
        section: selectedSet,
        step: stepIndex,
        label: `${s.name}|${currentMode}|${mysteryIndex}|${Math.round(elapsedMs)}|${startedAt}`,
      });
    },
    [selectedSet],
  );



  /* -------------------------------------------------------------------------- */
  /* Landing — seleção do conjunto                                              */
  /* -------------------------------------------------------------------------- */
  if (!selectedSet) {
    return (
      <motion.div
        className="w-full space-y-spacing-2xl pb-spacing-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <header className="text-center space-y-spacing-md pt-spacing-md">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-secondary">
            Rosarium · Cathedra
          </p>
          <h1 className="font-display text-premium-4xl md:text-premium-6xl text-foreground tracking-tight">
            Santo Rosário
          </h1>
          <p className="text-premium-lg text-muted-foreground font-serif italic max-w-prose mx-auto">
            Quatro conjuntos, vinte mistérios, uma só oração — para ser rezada em silêncio,
            passo a passo ou em mãos livres.
          </p>
        </header>

        {/* Sugestão do dia */}
        <div className="max-w-prose mx-auto rounded-premium border border-secondary/20 bg-secondary/[0.04] p-spacing-md text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-secondary/60">
            Mistério sugerido para hoje
          </p>
          <p className="mt-1 font-serif italic text-foreground">
            {MYSTERY_SETS[todaySet].name} — {MYSTERY_SETS[todaySet].day}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg">
          {MYSTERY_ORDER.map((key) => {
            const val = MYSTERY_SETS[key];
            const isToday = key === todaySet;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedSet(key);
                  setResumeStepIndex(undefined);
                }}
                className={cn(
                  "group relative overflow-hidden rounded-[2.5rem] border bg-card p-spacing-xl text-left",
                  "transition-all hover:-translate-y-1 hover:shadow-premium-hover",
                  isToday
                    ? "border-secondary/50 shadow-premium shadow-secondary/10"
                    : "border-border hover:border-primary/40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
                aria-label={`${val.name}${isToday ? " (sugestão de hoje)" : ""} — ${val.day}`}
              >
                <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.09] text-primary group-hover:opacity-[0.14] transition-opacity">
                  <RosaryArt set={key} variant="hero" />
                </div>

                <div className="relative z-10 space-y-spacing-sm">
                  <div className="flex items-center gap-spacing-sm">
                    <RosaryArt set={key} className="text-secondary" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-secondary/70">
                        {val.day}
                      </p>
                      <h2 className="font-display text-premium-2xl md:text-premium-3xl text-foreground group-hover:text-primary transition-colors">
                        {val.name}
                      </h2>
                      <p className="text-premium-xs text-muted-foreground/80 italic font-serif">
                        {val.latin}
                      </p>
                    </div>
                  </div>

                  <ul className="mt-spacing-md space-y-1">
                    {val.mysteries.map((m, i) => (
                      <li
                        key={m.id}
                        className="flex items-baseline gap-2 text-premium-xs text-muted-foreground font-serif"
                      >
                        <span className="text-secondary/60 font-black">{i + 1}.</span>
                        <span className="truncate">{m.title}</span>
                      </li>
                    ))}
                  </ul>

                  {isToday && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.22em] text-secondary">
                      <Icons.Sparkles className="w-3 h-3" /> Hoje
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  const set = MYSTERY_SETS[selectedSet];

  /* -------------------------------------------------------------------------- */
  /* Sessão de oração                                                           */
  /* -------------------------------------------------------------------------- */
  if (isPraying) {
    return (
      <RosarySession
        set={set}
        intention={intention}
        initialMode={mode}
        initialStepIndex={resumeStepIndex}
        initialElapsedMs={resumeElapsedMs}
        initialStartedAt={resumeStartedAt}
        onClose={handleClose}
        onProgress={handleProgress}
      />
    );
  }



  /* -------------------------------------------------------------------------- */
  /* Preparação — modo, intenção, resumo                                        */
  /* -------------------------------------------------------------------------- */
  const canResume = typeof resumeStepIndex === "number" && resumeStepIndex > 0;
  return (
    <div className="w-full space-y-spacing-xl pb-spacing-2xl">
      <div className="flex flex-col md:flex-row md:items-center gap-spacing-lg justify-between">
        <div className="flex items-center gap-spacing-lg">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedSet(null);
              setResumeStepIndex(undefined);
            }}
            aria-label="Voltar aos conjuntos"
            className="min-h-11 min-w-11 rounded-premium-full border border-border"
          >
            <Icons.ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-secondary/70">
              {set.day} · {set.latin}
            </p>
            <h1 className="font-display text-premium-3xl md:text-premium-4xl text-foreground">
              {set.name}
            </h1>
            <p className="text-premium-sm text-muted-foreground font-serif italic">
              {set.epigraph}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-spacing-sm">
          {canResume && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPraying(true)}
              className="min-h-11 rounded-premium-full border-secondary/40 text-foreground"
            >
              <Icons.ChevronRight className="w-4 h-4 mr-1" />
              Retomar oração
            </Button>
          )}
          <Button
            type="button"
            onClick={() => {
              setResumeStepIndex(0);
              setIsPraying(true);
            }}
            className="min-h-12 rounded-premium-full bg-foreground text-background px-6 font-black uppercase tracking-[0.18em] text-[11px] shadow-premium-hover hover:bg-primary hover:text-primary-foreground"
          >
            {canResume ? "Começar novamente" : "Iniciar Oração"}
          </Button>
        </div>
      </div>

      {/* Seletor de modo */}
      <section aria-labelledby="rosary-mode-title" className="space-y-spacing-md">
        <h2 id="rosary-mode-title" className="font-display text-premium-xl text-foreground">
          Escolha o modo
        </h2>
        <div role="radiogroup" aria-labelledby="rosary-mode-title" className="grid grid-cols-1 md:grid-cols-3 gap-spacing-md">
          {(
            [
              {
                key: "contemplativo",
                title: "Contemplativo",
                icon: Icons.Heart,
                desc: "Sem cronômetro. Silêncio, respiração, ritmo interior. Você avança quando estiver pronto.",
              },
              {
                key: "guiado",
                title: "Guiado",
                icon: Icons.BookOpen,
                desc: "Passo a passo com texto sincronizado. Ideal para aprender e rezar com atenção.",
              },
              {
                key: "automatico",
                title: "Automático",
                icon: Icons.Sparkles,
                desc: "Avança sozinho no ritmo tradicional. Mãos livres — ideal para trajetos.",
              },
            ] as const
          ).map((opt) => {
            const active = mode === opt.key;
            const Icon = opt.icon;
            return (
              <label
                key={opt.key}
                className={cn(
                  "cursor-pointer rounded-[1.5rem] border p-spacing-lg transition-all",
                  active
                    ? "border-secondary/50 bg-secondary/[0.06] shadow-premium"
                    : "border-border bg-card hover:border-secondary/30",
                  "focus-within:ring-2 focus-within:ring-secondary focus-within:ring-offset-2 focus-within:ring-offset-background",
                )}
              >
                <input
                  type="radio"
                  name="rosary-mode-choose"
                  value={opt.key}
                  checked={active}
                  onChange={() => setMode(opt.key)}
                  className="sr-only"
                />
                <div className="flex items-center gap-spacing-sm">
                  <Icon className={cn("w-5 h-5", active ? "text-secondary" : "text-muted-foreground")} />
                  <span className="font-display text-premium-lg text-foreground">{opt.title}</span>
                </div>
                <p className="mt-2 text-premium-xs text-muted-foreground font-serif leading-relaxed">
                  {opt.desc}
                </p>
              </label>
            );
          })}
        </div>
      </section>

      {/* Intenção */}
      <section aria-labelledby="rosary-intention-title" className="space-y-spacing-sm">
        <h2 id="rosary-intention-title" className="font-display text-premium-xl text-foreground">
          Sua intenção
        </h2>
        <label htmlFor="rosary-intention" className="sr-only">
          Intenção da oração
        </label>
        <textarea
          id="rosary-intention"
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          rows={3}
          placeholder="Por quem ou pelo quê você oferece este Rosário?"
          className="w-full rounded-premium border border-border bg-card p-spacing-md font-serif text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
      </section>

      {/* Resumo dos mistérios */}
      <section aria-labelledby="rosary-mysteries-title" className="space-y-spacing-md">
        <h2 id="rosary-mysteries-title" className="font-display text-premium-xl text-foreground">
          Mistérios
        </h2>
        <ol className="grid gap-spacing-sm">
          {set.mysteries.map((m, i) => (
            <li
              key={m.id}
              className="rounded-premium border border-border bg-card p-spacing-lg"
            >
              <div className="flex items-start gap-spacing-md">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-premium-full bg-secondary/10 text-secondary font-black">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="font-display text-premium-lg text-foreground">{m.title}</p>
                  <p className="text-premium-xs font-black uppercase tracking-[0.22em] text-secondary">
                    {m.scripture}
                  </p>
                  <p className="italic text-muted-foreground font-serif leading-relaxed">
                    “{m.meditation}”
                  </p>
                  <p className="text-premium-xs text-muted-foreground/80 font-serif">
                    <strong className="text-foreground">Intenção:</strong> {m.intention} ·{" "}
                    <strong className="text-foreground">Fruto:</strong> {m.fruit}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default Rosary;
