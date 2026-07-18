/**
 * FormacaoHero — primeira dobra editorial de /jornadas.
 *
 * Regras (CAT-032):
 *  - Consome APENAS JourneyService (nada de supabase.from(...)).
 *  - Visual editorial "livro aberto": Cormorant + Karla, muito ar,
 *    barra de progresso fina, sem cards de dashboard.
 *  - Tap targets ≥ 44px. Mobile-first.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { JourneyService } from '@/core/journey';
import type { Journey, JourneyProgress, JourneyStep } from '@/core/journey';

interface ActiveJourneyState {
  journey: Journey;
  steps: JourneyStep[];
  progress: JourneyProgress[];
  nextStep: JourneyStep | null;
}

const FormacaoHero: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<ActiveJourneyState | null>(null);
  const [suggested, setSuggested] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (user) {
          const { data: mine } = await JourneyService.listUserJourneys(user.id);
          const active = (mine ?? []).find(Boolean) ?? null;
          if (active) {
            const [{ data: steps }, { data: progress }] = await Promise.all([
              JourneyService.listSteps(active.id),
              JourneyService.getProgress(user.id, active.id),
            ]);
            const doneIds = new Set((progress ?? []).map((p) => p.step_id));
            const nextStep = (steps ?? []).find((s) => !doneIds.has(s.id)) ?? null;
            const isDone = !nextStep && (steps?.length ?? 0) > 0;
            if (!cancelled) {
              setState({
                journey: active,
                steps: steps ?? [],
                progress: progress ?? [],
                nextStep: isDone ? null : nextStep,
              });
            }
            if (!isDone) return;
          }
        }
        // Sem jornada ativa (deslogado, sem progresso, ou concluída) → sugestão
        const { data: rec } = user
          ? await JourneyService.recommend(user.id, 1)
          : { data: null };
        if (rec && rec.length > 0) {
          if (!cancelled) setSuggested(rec[0].journey);
        } else {
          const { data: list } = await JourneyService.list({ is_active: true, limit: 1 });
          if (!cancelled) setSuggested(list?.[0] ?? null);
        }
        if (!cancelled) setState(null);
      } catch (err) {
        console.error('[FormacaoHero] load failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const pct = useMemo(() => {
    if (!state) return 0;
    const total = state.steps.length || 1;
    const done = new Set(state.progress.map((p) => p.step_id)).size;
    return Math.min(100, Math.round((done / total) * 100));
  }, [state]);

  const minutesLeft = useMemo(() => {
    if (!state) return 0;
    const doneIds = new Set(state.progress.map((p) => p.step_id));
    return state.steps
      .filter((s) => !doneIds.has(s.id))
      .reduce((acc, s) => acc + (s.duration_minutes ?? 8), 0);
  }, [state]);

  const handleContinue = () => {
    if (!state?.nextStep) return;
    navigate(`/jornadas/${state.journey.id}/step?step=${state.nextStep.id}`);
  };

  const handleRestart = async () => {
    if (!state || !user) return;
    const ok = window.confirm(
      `Reiniciar "${state.journey.title}"? Seu progresso atual será apagado.`,
    );
    if (!ok) return;
    setResetting(true);
    try {
      const { error } = await JourneyService.resetProgress(user.id, state.journey.id);
      if (error) throw error;
      toast.success('Caminho reiniciado.');
      // Recarrega estado local
      const [{ data: steps }] = await Promise.all([
        JourneyService.listSteps(state.journey.id),
      ]);
      setState({
        journey: state.journey,
        steps: steps ?? [],
        progress: [],
        nextStep: (steps ?? [])[0] ?? null,
      });
    } catch (err: any) {
      toast.error(err?.message ?? 'Não foi possível reiniciar.');
    } finally {
      setResetting(false);
    }
  };

  const handleStartSuggested = () => {
    if (!suggested) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate(`/jornadas/${suggested.id}`);
  };

  if (loading) {
    return (
      <section
        aria-busy="true"
        className="editorial-column mx-auto py-spacing-2xl md:py-spacing-3xl space-y-spacing-md"
      >
        <div className="h-3 w-24 bg-muted/50 animate-pulse rounded-sm" />
        <div className="h-12 w-3/4 bg-muted/40 animate-pulse rounded-sm" />
        <div className="h-4 w-full bg-muted/30 animate-pulse rounded-sm" />
        <div className="h-4 w-2/3 bg-muted/30 animate-pulse rounded-sm" />
      </section>
    );
  }

  // Estado vazio: nenhuma jornada iniciada
  if (!state) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="editorial-column mx-auto py-spacing-2xl md:py-spacing-3xl"
        aria-labelledby="formacao-hero-title"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-spacing-md">
          Itinerarium Mentis
        </p>
        <h1
          id="formacao-hero-title"
          className="font-display leading-[1.05] text-foreground mb-spacing-md !tracking-normal break-words hyphens-auto"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(2rem, 7vw, 3.75rem)',
          }}
        >
          {suggested?.title ?? 'Escolha um caminho'}
        </h1>
        {suggested?.subtitle && (
          <p className="font-serif italic text-lg md:text-xl text-muted-foreground mb-spacing-md">
            {suggested.subtitle}
          </p>
        )}
        {suggested?.description && (
          <p className="text-base md:text-lg leading-relaxed text-foreground/80 mb-spacing-lg max-w-[62ch]">
            {suggested.description}
          </p>
        )}
        <Button
          onClick={handleStartSuggested}
          disabled={!suggested}
          className="min-h-11 min-w-11 px-spacing-lg text-sm font-semibold uppercase tracking-[0.15em] bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {user ? 'Começar caminho' : 'Entrar e começar'}
          <Icons.ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.section>
    );
  }

  const { journey, nextStep } = state;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="editorial-column mx-auto py-spacing-2xl md:py-spacing-3xl"
      aria-labelledby="formacao-hero-title"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-spacing-md">
        Itinerarium Mentis
      </p>

      <h1
        id="formacao-hero-title"
        className="font-display leading-[1.05] text-foreground mb-spacing-sm !tracking-normal break-words hyphens-auto"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(2rem, 7vw, 3.75rem)',
        }}
      >
        {journey.title}
      </h1>

      {journey.subtitle && (
        <p className="font-serif italic text-lg md:text-xl text-muted-foreground mb-spacing-lg">
          {journey.subtitle}
        </p>
      )}

      {/* Barra de progresso fina + metadados */}
      <div className="space-y-spacing-xs mb-spacing-lg" aria-label={`Progresso: ${pct}%`}>
        <div
          className="relative h-px w-full bg-border overflow-hidden"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-spacing-md gap-y-spacing-2xs text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <span>{pct}% concluído</span>
          <span aria-hidden="true">·</span>
          <span>
            {state.steps.length - state.progress.length} de {state.steps.length} etapas
          </span>
          {minutesLeft > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>~{minutesLeft} min restantes</span>
            </>
          )}
        </div>
      </div>

      {nextStep && (
        <div className="mb-spacing-lg">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-spacing-2xs">
            Próximo passo
          </p>
          <p
            className="font-display italic text-2xl md:text-3xl text-foreground leading-snug"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {nextStep.title}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-spacing-sm">
        <Button
          onClick={handleContinue}
          disabled={!nextStep}
          className="min-h-11 min-w-11 px-spacing-lg text-sm font-semibold uppercase tracking-[0.15em] bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Continuar
          <Icons.ChevronRight className="w-4 h-4 ml-2" />
        </Button>

        <Button
          variant="ghost"
          onClick={handleRestart}
          disabled={resetting || !user || pct === 0}
          className="min-h-11 min-w-11 px-spacing-md text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
        >
          <Icons.RotateCcw className="w-4 h-4 mr-2" />
          Reiniciar
        </Button>
      </div>

      <hr className="editorial-rule editorial-rule--hair mt-spacing-xl" />
    </motion.section>
  );
};

export default FormacaoHero;
