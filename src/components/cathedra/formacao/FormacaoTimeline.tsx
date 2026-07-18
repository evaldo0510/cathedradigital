/**
 * FormacaoTimeline — timeline vertical de capítulos de um caminho.
 *
 * Regras (CAT-032):
 *  - Consome APENAS JourneyService.
 *  - Cada etapa é um capítulo (não um card de dashboard).
 *  - Concluído: ● dourado + check. Atual: ◐ iluminado. Futuro: ○ discreto.
 *  - Clique navega direto para o Reader (JornadaStepPage).
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { JourneyService } from '@/core/journey';
import type { Journey, JourneyProgress, JourneyStep } from '@/core/journey';

type StepState = 'done' | 'current' | 'future';

const FormacaoTimeline: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [steps, setSteps] = useState<JourneyStep[]>([]);
  const [progress, setProgress] = useState<JourneyProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: mine } = await JourneyService.listUserJourneys(user.id);
        const active = (mine ?? [])[0] ?? null;
        if (!active) {
          if (!cancelled) {
            setJourney(null);
            setSteps([]);
            setProgress([]);
          }
          return;
        }
        const [{ data: s }, { data: p }] = await Promise.all([
          JourneyService.listSteps(active.id),
          JourneyService.getProgress(user.id, active.id),
        ]);
        if (!cancelled) {
          setJourney(active);
          setSteps(s ?? []);
          setProgress(p ?? []);
        }
      } catch (err) {
        console.error('[FormacaoTimeline] load failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const stateByStepId = useMemo(() => {
    const doneIds = new Set(progress.map((p) => p.step_id));
    const map = new Map<string, StepState>();
    let currentAssigned = false;
    for (const s of steps) {
      if (doneIds.has(s.id)) {
        map.set(s.id, 'done');
      } else if (!currentAssigned) {
        map.set(s.id, 'current');
        currentAssigned = true;
      } else {
        map.set(s.id, 'future');
      }
    }
    return map;
  }, [steps, progress]);

  if (loading || !journey || steps.length === 0) {
    return null;
  }

  const openStep = (s: JourneyStep) => {
    navigate(`/jornadas/${journey.id}/step?step=${s.id}`);
  };

  return (
    <section
      className="editorial-column mx-auto py-spacing-xl"
      aria-labelledby="formacao-timeline-title"
    >
      <p
        id="formacao-timeline-title"
        className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-spacing-lg"
      >
        Capítulos de {journey.title}
      </p>

      <ol className="relative" role="list">
        {steps.map((step, idx) => {
          const st = stateByStepId.get(step.id) ?? 'future';
          const isLast = idx === steps.length - 1;
          return (
            <motion.li
              key={step.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.4 }}
              className="relative pl-spacing-lg md:pl-spacing-xl pb-spacing-lg"
            >
              {/* Linha vertical */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[7px] md:left-[9px] top-6 bottom-0 w-px ${
                    st === 'done' ? 'bg-primary/40' : 'bg-border'
                  }`}
                />
              )}

              {/* Marcador */}
              <span
                aria-hidden="true"
                className={`absolute left-0 top-1.5 flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full transition-colors ${
                  st === 'done'
                    ? 'bg-primary text-primary-foreground'
                    : st === 'current'
                      ? 'bg-primary/20 ring-2 ring-primary'
                      : 'bg-background border border-border'
                }`}
              >
                {st === 'done' && <Icons.Check className="w-3 h-3" />}
              </span>

              <button
                type="button"
                onClick={() => openStep(step)}
                className={`group text-left w-full min-h-11 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-opacity ${
                  st === 'future' ? 'opacity-60 hover:opacity-100' : 'opacity-100'
                }`}
                aria-label={`Abrir capítulo ${step.step_order}: ${step.title} (${
                  st === 'done' ? 'concluído' : st === 'current' ? 'em andamento' : 'próximo'
                })`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-1">
                  Capítulo {step.step_order}
                  {st === 'current' && (
                    <span className="ml-2 text-primary">· Em andamento</span>
                  )}
                </p>
                <h3
                  className={`font-display leading-snug transition-colors ${
                    st === 'current'
                      ? 'text-2xl md:text-3xl text-foreground'
                      : 'text-xl md:text-2xl text-foreground/90 group-hover:text-foreground'
                  }`}
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {step.title}
                </h3>
                {step.subtitle && (
                  <p className="font-serif italic text-sm md:text-base text-muted-foreground mt-1">
                    {step.subtitle}
                  </p>
                )}
                {step.duration_minutes && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    ~{step.duration_minutes} min
                  </p>
                )}
              </button>
            </motion.li>
          );
        })}
      </ol>

      <hr className="editorial-rule editorial-rule--hair mt-spacing-lg" />
    </section>
  );
};

export default FormacaoTimeline;
