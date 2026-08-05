/**
 * JornadaDetailPage — refino editorial Logos 2030 (SEG-3 / Jornada Editorial).
 *
 * Sem alteração de banco ou rotas. Aproveita campos já existentes em `journeys`:
 * hero_kicker, hero_quote, hero_image_url, narrative_intro, closing_message,
 * estimated_days, difficulty, subtitle.
 *
 * Camadas editoriais:
 *  1. Hero com backdrop opcional (hero_image_url), kicker versalete e quote.
 *  2. Intro narrativa (narrative_intro) em coluna 68ch.
 *  3. "Próxima etapa" destacada antes da timeline.
 *  4. Timeline vertical dignificada (índice, tipo, tempo, CTA).
 *  5. Bloco de conclusão com closing_message.
 *  6. "Continuar depois" — jornadas relacionadas (mesma categoria).
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
import { EditorialQuote } from '@/components/editorial/primitives';
import { NexusPanel } from '@/components/nexus/NexusPanel';
import { ReaderContinuation } from '@/components/shared/ReaderContinuation';
import { useJourneyNexus, JOURNEY_NEXUS_ORDER } from '@/hooks/useJourneyNexus';


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
  const [related, setRelated] = useState<any[]>([]);
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
      const j = journeyRes.data;
      if (j) setJourney(j);
      if (stepsRes.data) setSteps(stepsRes.data);
      if (user && j) {
        const { data: progress } = await supabase
          .from('journey_progress')
          .select('step_id')
          .eq('user_id', user.id)
          .eq('journey_id', id!);
        if (progress) setCompletedStepIds(new Set(progress.map((p) => p.step_id)));
      }
      if (j?.category) {
        const { data: rel } = await supabase
          .from('journeys')
          .select('id, title, subtitle, category, difficulty, estimated_days')
          .eq('category', j.category)
          .eq('is_active', true)
          .neq('id', j.id)
          .order('sort_order', { ascending: true })
          .limit(3);
        if (rel) setRelated(rel);
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

  const nextStep = nextStepIndex >= 0 ? steps[nextStepIndex] : null;

  const nexus = useJourneyNexus(
    journey
      ? {
          id: journey.id,
          slug: journey.slug,
          title: journey.title,
          subtitle: journey.subtitle,
          category: journey.category,
          tags: journey.tags,
        }
      : null,
  );

  const nexusTotal = useMemo(
    () =>
      nexus
        ? Object.values(nexus.byBucket).reduce((n, arr) => n + (arr?.length ?? 0), 0)
        : 0,
    [nexus],
  );

  const continuationSuggestions = nexus?.suggestions ?? [];


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

  const kicker = journey.hero_kicker || journey.category || 'Jornada';
  const canonical = `https://www.cathedradigital.com.br/jornadas/${journey.id}`;

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
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${journey.title} — Cathedra`} />
        {journey.description && <meta property="og:description" content={journey.description} />}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        {journey.hero_image_url && <meta property="og:image" content={journey.hero_image_url} />}
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <section className="mx-auto w-full max-w-[1120px] px-5 pb-24 pt-8 md:px-16 md:pt-12 animate-fade-in">
        {/* Breadcrumb */}
        <Link
          to={AppRoute.JORNADAS}
          className="inline-flex items-center gap-2 font-stitch-body text-[12px] font-bold uppercase tracking-[0.2em] text-stitch-on-surface-variant transition-colors hover:text-stitch-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-stitch-background"
        >
          <ArrowLeft className="h-3 w-3" /> Formação
        </Link>

        {/* ─── Hero editorial ─────────────────────────── */}
        <section data-testid="jornada-hero" className="relative mt-6 overflow-hidden border-b border-stitch-secondary/10 pb-12">
          {journey.hero_image_url && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-0 opacity-[0.08]"
              style={{
                backgroundImage: `url("${journey.hero_image_url}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}
          <div className="relative">
            <span className="mb-3 flex flex-wrap items-center gap-2 font-stitch-body text-[12px] font-bold uppercase tracking-[0.32em] text-stitch-secondary">
              <Compass className="h-3 w-3" />
              {kicker}
              {journey.is_premium && (
                <>
                  <span className="text-stitch-outline-variant">·</span>
                  <span className="inline-flex items-center gap-1 text-stitch-secondary">
                    <Sparkles className="h-3 w-3" /> PRO
                  </span>
                </>
              )}
            </span>
            <h1 className="font-stitch-display text-[34px] italic leading-[42px] text-stitch-primary md:text-[56px] md:leading-[64px] md:tracking-[-0.02em]">
              {journey.title}
            </h1>
            {journey.subtitle && (
              <p className="mt-3 max-w-[62ch] font-stitch-body text-[16px] italic leading-[26px] text-stitch-on-surface-variant md:text-[18px]">
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
              <div data-testid="jornada-meta" className="flex flex-wrap items-center gap-x-5 gap-y-2 font-stitch-body text-[12px] font-bold uppercase tracking-[0.18em] text-stitch-on-surface-variant">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  ~{journey.estimated_days ?? '—'} dias
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
                  data-testid="jornada-cta"
                  className="group inline-flex items-center justify-center gap-2 bg-stitch-primary px-7 py-3 font-stitch-body text-[13px] font-bold uppercase tracking-[0.18em] text-stitch-primary-foreground transition-all hover:bg-stitch-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-stitch-background"
                >
                  {primaryCta.label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ─── Intro narrativa + quote editorial ─────── */}
        {(journey.narrative_intro || journey.hero_quote) && (
          <section data-testid="jornada-intro" className="pt-12">
            <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
              {journey.narrative_intro ? (
                <div className="max-w-[68ch] font-stitch-body text-[17px] leading-[30px] text-stitch-on-background md:text-[18px] md:leading-[32px]">
                  {String(journey.narrative_intro).split(/\n\n+/).map((para: string, i: number) => (
                    <p key={i} className={i === 0 ? '' : 'mt-5'}>
                      {para}
                    </p>
                  ))}
                </div>
              ) : (
                <div />
              )}
              {journey.hero_quote && (
                <EditorialQuote className="text-[20px] md:text-[22px]">
                  {journey.hero_quote}
                </EditorialQuote>
              )}
            </div>
          </section>
        )}

        {/* ─── Próxima Etapa (destaque) ──────────────── */}
        {!isLocked && nextStep && !isJourneyComplete && (
          <section data-testid="jornada-next-step" className="pt-14">
            <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.24em] text-stitch-on-surface-variant">
              A próxima etapa
            </span>
            <Link
              to={`/jornadas/${id}/step?step=${nextStep.id}`}
              data-testid="jornada-next-step-link"
              className="mt-3 group flex flex-col gap-5 border border-stitch-secondary/40 bg-stitch-surface-container-lowest p-6 transition-all hover:border-stitch-secondary hover:shadow-lg md:flex-row md:items-center md:justify-between md:p-8"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-stitch-display text-[28px] italic leading-none text-stitch-secondary/60">
                    {String(nextStepIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-stitch-body text-[11px] font-bold uppercase tracking-[0.18em] text-stitch-secondary">
                    {(() => {
                      const M = STEP_META[nextStep.step_type] ?? STEP_META.reading;
                      return (
                        <>
                          <M.Icon className="h-3 w-3" /> {M.label}
                        </>
                      );
                    })()}
                  </span>
                  <span className="text-stitch-outline-variant">·</span>
                  <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
                    <Clock className="mr-1 inline h-3 w-3" />
                    {nextStep.duration_minutes ?? 5} min
                  </span>
                </div>
                <h3 className="mt-3 font-stitch-display text-[24px] italic leading-snug text-stitch-primary md:text-[28px]">
                  {nextStep.title}
                </h3>
                {nextStep.description && (
                  <p className="mt-2 max-w-[60ch] font-stitch-body text-[15px] leading-relaxed text-stitch-on-surface-variant">
                    {nextStep.description}
                  </p>
                )}
              </div>
              <span className="inline-flex flex-shrink-0 items-center gap-2 self-start bg-stitch-primary px-6 py-3 font-stitch-body text-[12px] font-bold uppercase tracking-[0.18em] text-stitch-primary-foreground transition-all group-hover:bg-stitch-primary/90 md:self-auto">
                {completedCount === 0 ? 'Iniciar' : 'Continuar'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </section>
        )}

        {/* ─── Progresso ─────────────────────────────── */}
        {totalSteps > 0 && !isLocked && (
          <section data-testid="jornada-progress" className="pt-12">
            <div className="mb-3 flex items-center justify-between font-stitch-body text-[12px] font-bold uppercase tracking-[0.18em]">
              <span className="text-stitch-on-surface-variant">Progresso</span>
              <span className="text-stitch-secondary">
                {completedCount}/{totalSteps} · {progressPercent}%
              </span>
            </div>
            <div className="h-[3px] w-full overflow-hidden bg-stitch-surface-container-high" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
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
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-stitch-secondary/15">
                    <Award className="h-6 w-6 text-stitch-secondary" />
                  </div>
                  <div>
                    <p className="flex items-center gap-2 font-stitch-display text-[20px] italic text-stitch-primary">
                      <PartyPopper className="h-4 w-4 text-stitch-secondary" /> Jornada concluída
                    </p>
                    <p className="mt-1 max-w-[52ch] font-stitch-body text-[14px] leading-relaxed text-stitch-on-surface-variant">
                      {journey.closing_message ?? 'Veja seu certificado e as reflexões finais desta jornada.'}
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
        <section data-testid="jornada-timeline" className="pt-14">
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
                          className={`inline-flex flex-shrink-0 items-center gap-2 self-start px-5 py-2 font-stitch-body text-[12px] font-bold uppercase tracking-[0.18em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-stitch-background md:self-auto ${
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

        {/* ─── Reflexão Logos ─────────────────────────── */}
        {(journey.closing_message || journey.hero_quote) && (
          <section data-testid="jornada-reflexao" className="pt-16">
            <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.24em] text-stitch-secondary">
              Reflexão Logos
            </span>
            <div className="mt-4 max-w-[68ch] border-l-2 border-stitch-secondary/40 pl-6">
              <p className="font-stitch-display text-[22px] italic leading-relaxed text-stitch-primary md:text-[26px] md:leading-[38px]">
                {journey.closing_message ?? journey.hero_quote}
              </p>
              {journey.closing_message && journey.hero_quote && (
                <p className="mt-4 font-stitch-body text-[14px] italic text-stitch-on-surface-variant">
                  “{journey.hero_quote}”
                </p>
              )}
            </div>
          </section>
        )}

        {/* ─── Nexus Theologicus (heurístico + curadoria) ───── */}
        {nexus && nexusTotal > 0 && (
          <section id="nexus" data-testid="jornada-nexus" className="pt-16">
            <NexusPanel
              output={nexus}
              order={JOURNEY_NEXUS_ORDER}
              kicker="Conexões desta jornada"
              limitPerBucket={4}
            />
            {continuationSuggestions.length > 0 && (
              <div className="mt-10">
                <ReaderContinuation
                  context={{ kind: 'journey-step', id: journey.id, meta: { journeyId: journey.id, nextStepId: nextStep?.id } }}
                  suggestions={continuationSuggestions}
                />

              </div>
            )}
          </section>
        )}


        {/* ─── Continuar depois — jornadas relacionadas ─── */}
        {related.length > 0 && (
          <section className="pt-16">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="font-stitch-display text-[22px] italic leading-[30px] text-stitch-primary md:text-[26px]">
                Continuar depois
              </h2>
              <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-on-surface-variant">
                {kicker}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/jornadas/${r.id}`}
                  className="group relative flex flex-col border border-stitch-outline-variant/20 bg-stitch-surface-container-lowest p-5 transition-all hover:border-stitch-secondary/40 hover:shadow-md"
                >
                  <div className="absolute left-0 top-0 h-full w-1 origin-top scale-y-0 bg-stitch-secondary transition-transform group-hover:scale-y-100" />
                  <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.18em] text-stitch-secondary">
                    {r.category ?? 'Jornada'}
                  </span>
                  <h3 className="mt-1 font-stitch-display text-[18px] leading-snug text-stitch-primary group-hover:text-stitch-secondary">
                    {r.title}
                  </h3>
                  {r.subtitle && (
                    <p className="mt-2 line-clamp-2 font-stitch-body text-[13px] text-stitch-on-surface-variant">
                      {r.subtitle}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between font-stitch-body text-[11px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
                    <span>
                      {r.estimated_days ? `~${r.estimated_days} dias` : '—'}
                      {r.difficulty ? ` · ${DIFFICULTY_LABELS[r.difficulty] ?? r.difficulty}` : ''}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-stitch-secondary transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

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
      </section>
    </div>
  );
};

export default JornadaDetailPage;
