/**
 * JornadaDetailPage — refino editorial Logos 2030.
 *
 * Alinha o detalhe da jornada ao padrão de /jornadas (tokens stitch-*):
 *  - Hero editorial com kicker, título serifado e meta em versalete
 *  - Barra de progresso sóbria
 *  - Timeline vertical de etapas (índice · tipo · duração · CTA)
 *  - Preserva toda a lógica de leitura, progresso e locks PRO
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Compass,
  Hand,
  HelpCircle,
  Lock,
  PartyPopper,
  PenLine,
  Sparkles,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';

const STEP_META: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  reading: { label: 'Leitura', Icon: BookOpen },
  prayer: { label: 'Oração', Icon: Hand },
  reflection: { label: 'Reflexão', Icon: PenLine },
  quiz: { label: 'Quiz', Icon: HelpCircle },
};

const DIFFICULTY_LABELS: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
  'avançado': 'Avançado',
};

const JornadaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const [journey, setJourney] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadJourney();
     
  }, [id, user]);

  const loadJourney = async () => {
    setLoading(true);
    try {
      const [journeyRes, stepsRes] = await Promise.all([
        supabase.from('journeys').select('*').eq('id', id!).single(),
        supabase.from('journey_steps').select('*').eq('journey_id', id!).order('step_order', { ascending: true }),
      ]);
      if (journeyRes.data) setJourney(journeyRes.data);
      if (stepsRes.data) setSteps(stepsRes.data);
      if (user) {
        const { data: progress } = await supabase
          .from('journey_progress')
          .select('step_id')
          .eq('user_id', user.id)
          .eq('journey_id', id!);
        if (progress) setCompletedStepIds(new Set(progress.map((p) => p.step_id)));
      }
    } catch (err) {
      console.error('Failed to load journey:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = steps.length;
  const completedCount = completedStepIds.size;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const isLocked = journey?.is_premium && !isPremium;
  const isJourneyComplete = totalSteps > 0 && completedCount === totalSteps;

  const nextStepIndex = useMemo(() => {
    if (!steps.length) return -1;
    for (let i = 0; i < steps.length; i++) {
      if (!completedStepIds.has(steps[i].id)) return i;
    }
    return -1;
  }, [steps, completedStepIds]);

  const primaryCta = useMemo(() => {
    if (!steps.length) return null;
    if (isJourneyComplete) {
      return { label: 'Ver conclusão', to: `/jornadas/${id}/complete` };
    }
    const idx = nextStepIndex >= 0 ? nextStepIndex : 0;
    const step = steps[idx];
    if (!step) return null;
    const label = completedCount === 0 ? 'Iniciar Jornada' : 'Continuar';
    return { label, to: `/jornadas/${id}/step?step=${step.id}` };
  }, [steps, nextStepIndex, isJourneyComplete, completedCount, id]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-stitch-background">
        <div className="mx-auto max-w-[1120px] px-5 pt-16 md:px-16">
          <div className="h-6 w-40 animate-pulse bg-stitch-surface-container-high" />
          <div className="mt-6 h-14 w-3/4 animate-pulse bg-stitch-surface-container-high" />
          <div className="mt-10 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse border border-stitch-outline-variant/20 bg-stitch-surface-container-lowest" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-stitch-body text-stitch-on-surface-variant">Jornada não encontrada.</p>
          <Link
            to={AppRoute.JORNADAS}
            className="inline-flex items-center gap-2 border border-stitch-secondary/40 px-5 py-2 font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-secondary hover:bg-stitch-secondary/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full bg-stitch-background text-stitch-on-background"
      style={{
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/p6.png")',
      }}
    >
      <Helmet>
        <title>{journey.title} — Cathedra</title>
        {journey.description && <meta name="description" content={journey.description} />}
      </Helmet>

      <main className="mx-auto w-full max-w-[1120px] px-5 pb-24 pt-8 md:px-16 md:pt-12 animate-fade-in">
        {/* Breadcrumb */}
        <Link
          to={AppRoute.JORNADAS}
          className="inline-flex items-center gap-2 font-stitch-body text-[12px] font-bold uppercase tracking-[0.2em] text-stitch-on-surface-variant transition-colors hover:text-stitch-secondary"
        >
          <ArrowLeft className="h-3 w-3" /> Formação
        </Link>

        {/* ─── Hero editorial ─────────────────────────── */}
        <section className="mt-6 border-b border-stitch-secondary/10 pb-10">
          <span className="mb-2 flex items-center gap-2 font-stitch-body text-[12px] font-bold uppercase tracking-[0.32em] text-stitch-secondary">
            <Compass className="h-3 w-3" />
            {journey.category ?? 'Jornada'}
            {journey.is_premium && (
              <>
                <span className="text-stitch-outline-variant">·</span>
                <span className="inline-flex items-center gap-1 text-stitch-secondary">
                  <Sparkles className="h-3 w-3" /> PRO
                </span>
              </>
            )}
          </span>
          <h1 className="font-stitch-display text-[32px] italic leading-[40px] text-stitch-primary md:text-[52px] md:leading-[60px] md:tracking-[-0.02em]">
            {journey.title}
          </h1>
          {journey.subtitle && (
            <p className="mt-3 font-stitch-body text-[16px] italic leading-[26px] text-stitch-on-surface-variant md:text-[18px]">
              {journey.subtitle}
            </p>
          )}
          {journey.description && (
            <p className="mt-6 max-w-[68ch] font-stitch-body text-[17px] leading-[30px] text-stitch-on-surface-variant md:text-[19px] md:leading-[32px]">
              {journey.description}
            </p>
          )}

          {/* Meta + CTA */}
          <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-stitch-body text-[12px] font-bold uppercase tracking-[0.18em] text-stitch-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                ~{journey.estimated_days ?? journey.duration_days ?? '—'} dias
              </span>
              <span className="text-stitch-outline-variant">·</span>
              <span>{totalSteps} etapas</span>
              {journey.difficulty && (
                <>
                  <span className="text-stitch-outline-variant">·</span>
                  <span>{DIFFICULTY_LABELS[journey.difficulty] ?? journey.difficulty}</span>
                </>
              )}
            </div>

            {!isLocked && primaryCta && (
              <Link
                to={primaryCta.to}
                className="group inline-flex items-center justify-center gap-2 bg-stitch-primary px-7 py-3 font-stitch-body text-[13px] font-bold uppercase tracking-[0.18em] text-stitch-primary-foreground transition-all hover:bg-stitch-primary/90"
              >
                {primaryCta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </section>

        {/* ─── Progresso ─────────────────────────────── */}
        {totalSteps > 0 && !isLocked && (
          <section className="pt-10">
            <div className="mb-3 flex items-center justify-between font-stitch-body text-[12px] font-bold uppercase tracking-[0.18em]">
              <span className="text-stitch-on-surface-variant">Progresso</span>
              <span className="text-stitch-secondary">
                {completedCount}/{totalSteps} · {progressPercent}%
              </span>
            </div>
            <div className="h-[3px] w-full overflow-hidden bg-stitch-surface-container-high">
              <div
                className="h-full bg-stitch-secondary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {isJourneyComplete && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex flex-col items-start gap-4 border border-stitch-secondary/30 bg-stitch-surface-container-lowest p-6 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-stitch-secondary/15">
                    <Award className="h-6 w-6 text-stitch-secondary" />
                  </div>
                  <div>
                    <p className="flex items-center gap-2 font-stitch-display text-[18px] italic text-stitch-primary">
                      <PartyPopper className="h-4 w-4 text-stitch-secondary" /> Jornada concluída
                    </p>
                    <p className="mt-1 font-stitch-body text-[13px] text-stitch-on-surface-variant">
                      Veja seu certificado e reflexões finais.
                    </p>
                  </div>
                </div>
                <Link
                  to={`/jornadas/${id}/complete`}
                  className="inline-flex items-center gap-2 border border-stitch-secondary px-5 py-2 font-stitch-body text-[12px] font-bold uppercase tracking-[0.18em] text-stitch-secondary transition-colors hover:bg-stitch-secondary hover:text-stitch-primary"
                >
                  Abrir <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            )}
          </section>
        )}

        {/* ─── Timeline de etapas ────────────────────── */}
        <section className="pt-14">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-stitch-display text-[24px] italic leading-[32px] text-stitch-primary md:text-[28px]">
              Etapas
            </h2>
            <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-on-surface-variant">
              {totalSteps} {totalSteps === 1 ? 'passo' : 'passos'}
            </span>
          </div>

          {totalSteps === 0 ? (
            <p className="border-t border-stitch-secondary/10 pt-8 text-center font-stitch-body text-[14px] italic text-stitch-on-surface-variant">
              Nenhuma etapa disponível ainda.
            </p>
          ) : (
            <ol className="relative border-l border-stitch-outline-variant/30">
              {steps.map((step, index) => {
                const isCompleted = completedStepIds.has(step.id);
                const isStepLocked = isLocked && !step.is_free;
                const isNext = !isCompleted && !isStepLocked && index === nextStepIndex;
                const meta = STEP_META[step.step_type] ?? STEP_META.reading;

                return (
                  <motion.li
                    key={step.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.04, 0.3) }}
                    className={`relative pl-8 md:pl-12 ${index === steps.length - 1 ? '' : 'pb-6'} ${
                      isStepLocked ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Bullet */}
                    <span
                      className={`absolute -left-[11px] top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        isCompleted
                          ? 'border-stitch-secondary bg-stitch-secondary text-stitch-primary'
                          : isNext
                            ? 'border-stitch-secondary bg-stitch-background text-stitch-secondary'
                            : 'border-stitch-outline-variant/60 bg-stitch-background text-stitch-on-surface-variant'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3 w-3" strokeWidth={3} />
                      ) : isStepLocked ? (
                        <Lock className="h-2.5 w-2.5" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </span>

                    <div
                      className={`group flex flex-col gap-4 border p-5 transition-all md:flex-row md:items-center md:justify-between md:p-6 ${
                        isNext
                          ? 'border-stitch-secondary/50 bg-stitch-surface-container-lowest shadow-sm'
                          : isCompleted
                            ? 'border-stitch-outline-variant/20 bg-stitch-surface-container-lowest/50'
                            : 'border-stitch-outline-variant/20 bg-stitch-surface-container-lowest hover:border-stitch-secondary/30'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-stitch-display text-[22px] italic leading-none text-stitch-secondary/40">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-stitch-body text-[11px] font-bold uppercase tracking-[0.18em] text-stitch-secondary">
                            <meta.Icon className="h-3 w-3" /> {meta.label}
                          </span>
                          {isStepLocked && (
                            <span className="inline-flex items-center gap-1 font-stitch-body text-[10px] font-bold uppercase tracking-[0.15em] text-stitch-secondary">
                              <Lock className="h-2.5 w-2.5" /> PRO
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 font-stitch-display text-[19px] leading-snug text-stitch-primary md:text-[21px]">
                          {step.title}
                        </h3>
                        {step.description && (
                          <p className="mt-1.5 line-clamp-2 font-stitch-body text-[14px] leading-relaxed text-stitch-on-surface-variant">
                            {step.description}
                          </p>
                        )}
                        <p className="mt-3 font-stitch-body text-[11px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
                          <Clock className="mr-1.5 inline h-3 w-3" />
                          {step.duration_minutes ?? 5} min
                        </p>
                      </div>

                      {!isStepLocked && (
                        <button
                          type="button"
                          onClick={() => navigate(`/jornadas/${id}/step?step=${step.id}`)}
                          className={`inline-flex flex-shrink-0 items-center gap-2 self-start px-5 py-2 font-stitch-body text-[12px] font-bold uppercase tracking-[0.18em] transition-all md:self-auto ${
                            isNext
                              ? 'bg-stitch-primary text-stitch-primary-foreground hover:bg-stitch-primary/90'
                              : 'border border-stitch-outline-variant/40 text-stitch-primary hover:border-stitch-secondary hover:text-stitch-secondary'
                          }`}
                        >
                          {isCompleted ? 'Rever' : isNext ? 'Iniciar' : 'Abrir'}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </section>

        {/* ─── Lock PRO ──────────────────────────────── */}
        {isLocked && (
          <section className="mt-14 border border-stitch-secondary/30 bg-stitch-surface-container-lowest p-8 text-center md:p-12">
            <Sparkles className="mx-auto h-8 w-8 text-stitch-secondary" />
            <h3 className="mt-4 font-stitch-display text-[24px] italic text-stitch-primary md:text-[28px]">
              Jornada exclusiva PRO
            </h3>
            <p className="mx-auto mt-3 max-w-md font-stitch-body text-[15px] leading-relaxed text-stitch-on-surface-variant">
              Assine para acessar esta e todas as trilhas de formação, biblioteca completa e o Nexus Theologicus.
            </p>
            <Link
              to={AppRoute.PRICING}
              className="mt-6 inline-flex items-center gap-2 bg-stitch-primary px-7 py-3 font-stitch-body text-[13px] font-bold uppercase tracking-[0.18em] text-stitch-primary-foreground transition-all hover:bg-stitch-primary/90"
            >
              Ver planos <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}
      </main>
    </div>
  );
};

export default JornadaDetailPage;
