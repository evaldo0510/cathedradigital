/**
 * JornadaStepPage — refino editorial Logos 2030.
 *
 * Preserva integralmente a lógica de leitura (variantes por nível, reflexão,
 * conclusão, próxima etapa, Nexus e ReaderContinuation). Apenas realinha
 * o visual ao padrão stitch-*: hero editorial, meta em versalete,
 * barra de progresso sóbria, seções em cartões editoriais numerados
 * e barra de ação inferior discreta.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Award,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Hand,
  Lock,
  PenLine,
  Save,
  ShieldQuestion,
  Sparkles,
  X,
} from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { saveUserPsychology } from '@/lib/psychologicalProfile';
import { AppRoute } from '@/types';
import AudioContentPlayer from './AudioContentPlayer';
import { getSaintBySubtitle } from '@/services/saintsService';
import SacredImage from './SacredImage';
import { ReaderContinuation } from '@/components/shared/ReaderContinuation';
import NexusBubbles from '@/components/cathedra/NexusBubbles';

type SectionDef = {
  key: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  isPremium: boolean;
};

const SECTION_CONFIG: SectionDef[] = [
  { key: 'padh', label: 'A Palavra', Icon: Sparkles, isPremium: false },
  { key: 'interpretation', label: 'Reflexão', Icon: BookOpen, isPremium: false },
  { key: 'practical_direction', label: 'Prática do Dia', Icon: Hand, isPremium: true },
  { key: 'guided_exercise', label: 'Exercício Espiritual', Icon: PenLine, isPremium: true },
  // Legacy / hybrid
  { key: 'intro', label: 'Introdução', Icon: BookOpen, isPremium: false },
  { key: 'reflection', label: 'Reflexão', Icon: PenLine, isPremium: true },
  { key: 'practice', label: 'Prática', Icon: Hand, isPremium: true },
  { key: 'prayer', label: 'Oração', Icon: Sparkles, isPremium: true },
];

const JornadaStepPage: React.FC = () => {
  const { id: journeyId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const stepId = searchParams.get('step');
  const navigate = useNavigate();
  const { user, userLevel: userLevelClass, isPremium: isUserPremium } = useAuth();
  const { saveLastRead } = useReadingMarks();

  const [step, setStep] = useState<any>(null);
  const [journeyTitle, setJourneyTitle] = useState('');
  const [totalSteps, setTotalSteps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reflection, setReflection] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [nextStep, setNextStep] = useState<any>(null);
  const [prevStep, setPrevStep] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [saintImage, setSaintImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const reflectionRef = useRef<HTMLTextAreaElement | null>(null);
  const restoredScrollRef = useRef(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const storageKey = stepId ? `cathedra:journey-step:${stepId}` : null;

  const content = useMemo(() => (step?.content as Record<string, any>) || {}, [step]);
  const stepProgress = useMemo(
    () => (totalSteps > 0 && step ? (step.step_order / totalSteps) * 100 : 0),
    [step, totalSteps],
  );

  useEffect(() => {
    if (!step?.subtitle) return;
    getSaintBySubtitle(step.subtitle).then((s) => {
      if (s?.image) setSaintImage(s.image);
    });
  }, [step?.subtitle]);

  useEffect(() => {
    if (stepId && journeyId && step?.title) {
      loadData();
      saveLastRead({
        content_type: 'journey',
        content_id: stepId,
        label: `${step.title} (${journeyTitle || 'Jornada'})`,
        url: `/jornadas/${journeyId}/step?step=${stepId}`,
        is_last_read: true,
      });
      supabase.from('user_history').insert({
        user_id: user?.id,
        title: step.title,
        route: `/jornadas/${journeyId}/step?step=${stepId}`,
        type: 'journey',
      } as any);
    }
     
  }, [stepId, journeyId, step?.title, journeyTitle, user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stepRes, journeyRes, countRes] = await Promise.all([
        supabase.from('journey_steps').select('*').eq('id', stepId!).single(),
        supabase.from('journeys').select('title').eq('id', journeyId!).single(),
        supabase.from('journey_steps').select('*', { count: 'exact', head: true }).eq('journey_id', journeyId!),
      ]);

      if (stepRes.data) {
        setStep(stepRes.data);
        const dataContent = stepRes.data.content as Record<string, any>;
        const firstWithContent = SECTION_CONFIG.find((s) => {
          const val = dataContent[s.key] || dataContent[`${s.key}_iniciante`];
          return !!val;
        });
        if (firstWithContent) setExpandedSection(firstWithContent.key);
      }
      if (journeyRes.data) setJourneyTitle(journeyRes.data.title);
      setTotalSteps(countRes.count || 0);

      const { data: allSteps } = await supabase
        .from('journey_steps')
        .select('*')
        .eq('journey_id', journeyId!)
        .order('step_order', { ascending: true });

      if (allSteps && stepRes.data) {
        const currentIndex = allSteps.findIndex((s) => s.id === stepId);
        if (currentIndex !== -1) {
          if (currentIndex > 0) setPrevStep(allSteps[currentIndex - 1]);
          else setPrevStep(null);
          if (currentIndex < allSteps.length - 1) setNextStep(allSteps[currentIndex + 1]);
          else setNextStep(null);
        }
      }

      // Retomar seção expandida salva
      if (storageKey) {
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
          if (saved.expandedSection) setExpandedSection(saved.expandedSection);
        } catch { /* noop */ }
      }

      if (user && stepRes.data) {
        const { data: progress } = await supabase
          .from('journey_progress')
          .select('id, reflection')
          .eq('user_id', user.id)
          .eq('step_id', stepId!)
          .maybeSingle();
        if (progress) {
          setCompleted(true);
          setReflection(progress.reflection || '');
        } else if (storageKey) {
          // Retomar rascunho de reflexão salvo localmente
          try {
            const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
            if (typeof saved.draftReflection === 'string' && saved.draftReflection.trim()) {
              setReflection(saved.draftReflection);
            }
          } catch { /* noop */ }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async () => {
    if (!user || !journeyId || !stepId) return;
    // Validação: se há pergunta final, a reflexão é obrigatória (mínimo 10 chars).
    const finalPromptCheck =
      getVariantContent('final_question', content) ||
      getVariantContent('journal_prompt', content) ||
      getVariantContent('question', content);
    if (finalPromptCheck && reflection.trim().length < 10) {
      setStatusMessage('Escreva sua reflexão antes de concluir (mínimo 10 caracteres).');
      toast.error('Escreva sua reflexão antes de concluir (mínimo 10 caracteres).');
      return;
    }
    setCompleting(true);
    setStatusMessage('Concluindo etapa…');
    try {
      const { error } = await supabase.from('journey_progress').upsert(
        {
          user_id: user.id,
          journey_id: journeyId,
          step_id: stepId,
          reflection: reflection.trim() || null,
        },
        { onConflict: 'user_id,step_id' },
      );
      if (error) throw error;

      if (reflection.trim()) {
        supabase
          .from('spiritual_journal')
          .insert([
            {
              user_id: user.id,
              content: reflection.trim(),
              journey_id: journeyId,
              step_id: stepId,
              entry_date: new Date().toISOString().split('T')[0],
            },
          ])
          .then(({ error }) => {
            if (error) console.error('BG Journal save failed:', error);
          });
        saveUserPsychology(user.id, reflection.trim(), `journey_${journeyId}`);
      }

      setCompleted(true);
      setStatusMessage('Etapa concluída.');
      toast.success('Etapa concluída.');
      // Se for a última, direciona para conclusão da jornada
      if (!nextStep && journeyId) {
        setTimeout(() => navigate(`/jornadas/${journeyId}/conclusao`), 600);
      }
    } catch (err) {
      console.error('Failed to complete step:', err);
      setStatusMessage('Erro ao concluir. Tente novamente.');
      toast.error('Não foi possível concluir a etapa.');
    } finally {
      setCompleting(false);
    }
  };

  const handleSaveReflection = async () => {
    if (!user || !reflection.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('reading_reflections').insert([
        {
          user_id: user.id,
          reading_type: 'journey',
          content: reflection.trim(),
          context_id: `journey_${journeyId}_step_${stepId}`,
        },
      ]);
      if (error) throw error;
      toast.success('Reflexão salva no seu perfil.');
    } catch (err) {
      console.error('Failed to save reflection:', err);
      toast.error('Erro ao salvar reflexão.');
    } finally {
      setSaving(false);
    }
  };

  const getVariantContent = (key: string, content: any): string | null => {
    if (!content) return null;
    if (typeof content[key] === 'string') return content[key];
    if (content[key] && typeof content[key] === 'object') {
      return (
        content[key][userLevelClass] ||
        content[key]['iniciante'] ||
        (Object.values(content[key])[0] as string)
      );
    }
    const variantKey = `${key}_${userLevelClass}`;
    if (content[variantKey]) return content[variantKey];
    return content[key] || null;
  };

  const persistLocal = useCallback((patch: Record<string, any>) => {
    if (!storageKey) return;
    try {
      const prev = JSON.parse(localStorage.getItem(storageKey) || '{}');
      localStorage.setItem(storageKey, JSON.stringify({ ...prev, ...patch, ts: Date.now() }));
    } catch { /* noop */ }
  }, [storageKey]);

  const toggleSection = (key: string) => {
    setExpandedSection((prev) => {
      const next = prev === key ? null : key;
      persistLocal({ expandedSection: next });
      return next;
    });
  };

  // Retomar scroll do usuário na volta à etapa
  useEffect(() => {
    if (loading || !step || restoredScrollRef.current || !storageKey || !scrollRef.current) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (typeof saved.scrollY === 'number' && saved.scrollY > 0) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ top: saved.scrollY, behavior: 'auto' });
        });
      }
    } catch { /* noop */ }
    restoredScrollRef.current = true;
  }, [loading, step, storageKey]);

  // Persistir scroll (throttled)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !storageKey) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        persistLocal({ scrollY: el.scrollTop });
        raf = 0;
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [storageKey, persistLocal, loading]);

  // Autosave do rascunho de reflexão (debounced 500ms). Não persiste após conclusão.
  useEffect(() => {
    if (!storageKey || completed || loading) return;
    const handle = window.setTimeout(() => {
      persistLocal({ draftReflection: reflection });
      if (reflection.trim()) setDraftSavedAt(Date.now());
    }, 500);
    return () => window.clearTimeout(handle);
  }, [reflection, storageKey, persistLocal, completed, loading]);

  // Limpar rascunho ao concluir para liberar o localStorage
  useEffect(() => {
    if (completed && storageKey) {
      persistLocal({ draftReflection: '' });
      setDraftSavedAt(null);
    }
  }, [completed, storageKey, persistLocal]);

  // Atalhos de teclado: ← → navega entre etapas; Alt+Enter conclui
  useEffect(() => {
    const isTypingTarget = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
    };
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === 'ArrowRight' && nextStep) {
        e.preventDefault();
        navigate(`/jornadas/${journeyId}/step?step=${nextStep.id}`);
      } else if (e.key === 'ArrowLeft' && prevStep) {
        e.preventDefault();
        navigate(`/jornadas/${journeyId}/step?step=${prevStep.id}`);
      } else if (e.key === 'Escape') {
        navigate(`/jornadas/${journeyId}`);
      } else if (e.altKey && e.key === 'Enter' && !completed && !completing) {
        e.preventDefault();
        completeStep();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
     
  }, [nextStep, prevStep, journeyId, completed, completing]);


  if (loading) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stitch-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stitch-secondary border-t-transparent" />
      </div>,
      document.body,
    );
  }

  if (!step) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stitch-background">
        <div className="space-y-4 text-center">
          <p className="font-stitch-body text-stitch-on-surface-variant">Etapa não encontrada.</p>
          <button
            onClick={() => navigate(-1)}
            className="border-b border-stitch-secondary/40 pb-0.5 font-stitch-body text-[12px] font-bold uppercase tracking-[0.2em] text-stitch-secondary hover:border-stitch-secondary"
          >
            Voltar
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  const bibleRef = content.bible_ref;
  const finalPrompt =
    getVariantContent('final_question', content) ||
    getVariantContent('journal_prompt', content) ||
    getVariantContent('question', content);
  const MIN_REFLECTION_LEN = 10;
  const trimmedReflection = reflection.trim();
  const reflectionRequired = !!finalPrompt;
  const reflectionValid = trimmedReflection.length >= MIN_REFLECTION_LEN;
  const canComplete = !reflectionRequired || reflectionValid;
  const reflectionCount = trimmedReflection.length;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-stitch-background text-stitch-on-background"
      style={{
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/p6.png")',
      }}
    >
      {/* ─── Header editorial ─────────────────────────── */}
      <header className="flex-shrink-0 border-b border-stitch-secondary/10 bg-stitch-background/95 px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur md:px-16">
        <div className="mx-auto flex w-full max-w-[900px] items-center gap-4">
          <button
            onClick={() => navigate(`/jornadas/${journeyId}`)}
            aria-label="Fechar etapa"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-stitch-outline-variant/40 text-stitch-on-surface-variant transition-colors hover:border-stitch-secondary hover:text-stitch-secondary"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-stitch-body text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-secondary">
              <span className="truncate">{journeyTitle}</span>
              <span className="text-stitch-outline-variant">·</span>
              <span className="text-stitch-on-surface-variant">
                Etapa {step.step_order}/{totalSteps}
              </span>
              <span className="text-stitch-outline-variant">·</span>
              <span className="group relative inline-flex cursor-help items-center gap-1 text-stitch-on-surface-variant">
                {userLevelClass}
                <ShieldQuestion className="h-3 w-3 opacity-60" />
                <span className="pointer-events-none invisible absolute left-0 top-full z-50 mt-2 w-64 rounded border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest p-3 text-left font-stitch-body text-[11px] normal-case tracking-normal text-stitch-on-surface opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                  <span className="mb-1 block font-bold uppercase tracking-[0.15em] text-stitch-secondary">
                    Conteúdo adaptado
                  </span>
                  <span className="opacity-80">
                    {userLevelClass === 'iniciante' && 'Nível Iniciante: conteúdo simplificado e guiado.'}
                    {userLevelClass === 'intermediário' && 'Nível Intermediário: reflexão e aprofundamento.'}
                    {userLevelClass === 'avançado' && 'Nível Avançado: profundidade e confrontação.'}
                  </span>
                </span>
              </span>
            </div>
          </div>
          <span className="hidden flex-shrink-0 items-center gap-1.5 font-stitch-body text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-on-surface-variant md:inline-flex">
            <Clock className="h-3 w-3" /> {step.duration_minutes}min
          </span>
        </div>
        {/* Barra sóbria */}
        <div className="mx-auto mt-3 h-[2px] w-full max-w-[900px] overflow-hidden bg-stitch-surface-container-high">
          <div
            className="h-full bg-stitch-secondary transition-all duration-500"
            style={{ width: `${stepProgress}%` }}
          />
        </div>
      </header>

      {/* ─── Conteúdo rolável ─────────────────────────── */}
      <div ref={scrollRef} className="custom-scrollbar flex-1 overflow-y-auto overscroll-auto" role="main" aria-label={`Etapa ${step.step_order} de ${totalSteps}: ${step.title}`}>
        <div className="mx-auto w-full max-w-[720px] px-5 pb-32 pt-10 md:px-8 md:pt-14">
          {/* Hero */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-stitch-secondary/10 pb-8 text-center"
          >
            {saintImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto mb-6 h-24 w-24 overflow-hidden rounded-full border border-stitch-secondary/30 shadow-sm"
              >
                <SacredImage src={saintImage} alt={step.subtitle || ''} className="h-full w-full object-cover" />
              </motion.div>
            )}
            {bibleRef && (
              <span className="mb-3 inline-flex items-center gap-1.5 font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
                <BookOpen className="h-3 w-3" /> {bibleRef}
              </span>
            )}
            <h1 className="font-stitch-display text-[30px] italic leading-[38px] text-stitch-primary md:text-[44px] md:leading-[54px] md:tracking-[-0.01em]">
              {step.title}
            </h1>
            {step.subtitle && (
              <p className="mt-3 font-stitch-body text-[16px] italic text-stitch-on-surface-variant md:text-[17px]">
                {step.subtitle}
              </p>
            )}
            <div className="mt-6 flex justify-center md:hidden">
              <span className="inline-flex items-center gap-1.5 font-stitch-body text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-on-surface-variant">
                <Clock className="h-3 w-3" /> {step.duration_minutes} min
              </span>
            </div>
            <div className="mt-6 flex justify-center">
              <AudioContentPlayer
                text={`${step.title}. ${step.subtitle || ''}. ${SECTION_CONFIG.map((s) => getVariantContent(s.key, content))
                  .filter(Boolean)
                  .join('. ')}`}
                title="Ouvir conteúdo"
              />
            </div>
          </motion.section>

          {/* Seções */}
          <div className="mt-10 space-y-3">
            {SECTION_CONFIG.map(({ key, label, Icon, isPremium: sectionIsPremium }, i) => {
              const sectionContent = getVariantContent(key, content);
              if (!sectionContent) return null;
              const isExpanded = expandedSection === key;
              const isLocked = sectionIsPremium && !isUserPremium;

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.04 }}
                  className={`border transition-colors ${
                    isExpanded
                      ? 'border-stitch-secondary/40 bg-stitch-surface-container-lowest'
                      : 'border-stitch-outline-variant/25 bg-stitch-surface-container-lowest/60 hover:border-stitch-secondary/30'
                  } ${isLocked ? 'opacity-90' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(key)}
                    aria-expanded={isExpanded}
                    aria-controls={`section-panel-${key}`}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-stitch-background"
                  >
                    <span className="font-stitch-display text-[20px] italic leading-none text-stitch-secondary/40">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        isExpanded ? 'bg-stitch-secondary text-stitch-primary' : 'bg-stitch-surface-container-high text-stitch-on-surface-variant'
                      }`}
                    >
                      {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                    </span>
                    <span className="flex flex-1 flex-wrap items-center gap-2">
                      <span
                        className={`font-stitch-body text-[12px] font-bold uppercase tracking-[0.2em] ${
                          isExpanded ? 'text-stitch-primary' : 'text-stitch-on-surface-variant'
                        }`}
                      >
                        {label}
                      </span>
                      {sectionIsPremium && (
                        <span className="inline-flex items-center gap-1 font-stitch-body text-[10px] font-bold uppercase tracking-[0.18em] text-stitch-secondary">
                          <Sparkles className="h-2.5 w-2.5" /> PRO
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-stitch-on-surface-variant transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        id={`section-panel-${key}`}
                        role="region"
                        aria-label={label}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="relative px-5 pb-6 pt-2 md:px-8">
                          {isLocked ? (
                            <div className="relative">
                              <p className="select-none pointer-events-none whitespace-pre-line font-stitch-body text-[16px] leading-[28px] text-stitch-on-surface-variant opacity-40 blur-[5px]">
                                {sectionContent}
                              </p>
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-transparent via-stitch-surface-container-lowest/95 to-stitch-surface-container-lowest px-6 text-center">
                                <Sparkles className="h-6 w-6 text-stitch-secondary" />
                                <p className="max-w-[220px] font-stitch-body text-[13px] leading-relaxed text-stitch-on-surface-variant">
                                  Continue aprofundando essa experiência.
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(AppRoute.PRICING);
                                  }}
                                  className="mt-1 inline-flex items-center gap-2 bg-stitch-primary px-5 py-2 font-stitch-body text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-primary-foreground transition-colors hover:bg-stitch-primary/90"
                                >
                                  Desbloquear PRO <ArrowRight className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p
                              className={`whitespace-pre-line font-stitch-body text-[16px] leading-[30px] text-stitch-on-surface md:text-[17px] md:leading-[32px] ${
                                key === 'padh'
                                  ? 'border-l-2 border-stitch-secondary/40 pl-5 font-stitch-display text-[19px] italic leading-[32px] text-stitch-primary md:text-[22px] md:leading-[36px]'
                                  : ''
                              }`}
                            >
                              {sectionContent}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Reflexão */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-12 border-t border-stitch-secondary/10 pt-8"
          >
            <span className="mb-3 flex items-center gap-2 font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
              <PenLine className="h-3 w-3" /> Pergunta Final
            </span>
            {finalPrompt && (
              <p className="mb-5 border-l-2 border-stitch-secondary/30 pl-5 font-stitch-display text-[19px] italic leading-[30px] text-stitch-primary md:text-[21px] md:leading-[32px]">
                {finalPrompt}
              </p>
            )}
            <Textarea
              ref={reflectionRef}
              id="reflection-textarea"
              placeholder="Escreva sua reflexão aqui. Suas palavras são privadas."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              aria-invalid={reflectionRequired && !reflectionValid && reflectionCount > 0}
              aria-describedby="reflection-help"
              className={`min-h-[140px] resize-none bg-stitch-surface-container-lowest font-stitch-body text-[15px] leading-relaxed text-stitch-on-surface placeholder:text-stitch-on-surface-variant/70 focus-visible:ring-0 ${
                reflectionRequired && !reflectionValid && reflectionCount > 0
                  ? 'border-destructive/60 focus-visible:border-destructive'
                  : 'border-stitch-outline-variant/40 focus-visible:border-stitch-secondary'
              }`}
              disabled={completed}
            />
            {!completed && (
              <div
                id="reflection-help"
                className="mt-2 flex items-center justify-between font-stitch-body text-[11px] uppercase tracking-[0.18em]"
              >
                <span
                  className={
                    reflectionRequired && !reflectionValid
                      ? 'text-destructive'
                      : 'text-stitch-on-surface-variant/70'
                  }
                  data-testid="reflection-status"
                >
                  {reflectionRequired
                    ? reflectionValid
                      ? 'Pronto para concluir.'
                      : `Escreva ao menos ${MIN_REFLECTION_LEN} caracteres para concluir.`
                    : 'Opcional — escreva se quiser guardar a reflexão.'}
                </span>
                <span className="flex items-center gap-3 text-stitch-on-surface-variant/60">
                  {draftSavedAt && reflection.trim() && (
                    <span aria-live="polite" className="normal-case tracking-normal italic">
                      Rascunho salvo
                    </span>
                  )}
                  <span>{reflectionCount}</span>
                </span>
              </div>
            )}
          </motion.section>

          {/* Nexus + continuação após conclusão */}
          {completed && (
            <div className="mt-12 space-y-8 border-t border-stitch-secondary/10 pt-8">
              <NexusBubbles />
              <ReaderContinuation
                context={{
                  kind: 'journey-step',
                  id: stepId ?? undefined,
                  meta: {
                    journeyId: journeyId ?? undefined,
                    nextStepId: nextStep?.id,
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── Ação inferior ────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-stitch-secondary/10 bg-stitch-background/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:px-16">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-2">
          {/* Anúncios para leitores de tela */}
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {statusMessage}
          </div>

          <div className="flex gap-2">
            {/* Navegação entre etapas (sempre visível) */}
            <button
              type="button"
              onClick={() => prevStep && navigate(`/jornadas/${journeyId}/step?step=${prevStep.id}`)}
              disabled={!prevStep}
              aria-label={prevStep ? `Etapa anterior: ${prevStep.title}` : 'Sem etapa anterior'}
              title="Etapa anterior (←)"
              className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center border border-stitch-outline-variant/40 text-stitch-primary transition-colors hover:border-stitch-secondary hover:text-stitch-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {!completed && (
              <button
                onClick={handleSaveReflection}
                disabled={saving || completing || !reflection.trim()}
                aria-busy={saving}
                aria-label={reflection.trim() ? 'Salvar reflexão' : 'Escreva uma reflexão para habilitar'}
                title="Salvar reflexão"
                className="inline-flex flex-1 items-center justify-center gap-2 border border-stitch-outline-variant/40 px-4 py-3 font-stitch-body text-[12px] font-bold uppercase tracking-[0.2em] text-stitch-primary transition-colors hover:border-stitch-secondary hover:text-stitch-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Salvando…
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" /> Salvar
                  </>
                )}
              </button>
            )}

            <button
              onClick={
                completed
                  ? () =>
                      nextStep
                        ? navigate(`/jornadas/${journeyId}/step?step=${nextStep.id}`)
                        : navigate(`/jornadas/${journeyId}/conclusao`)
                  : completeStep
              }
              disabled={completing || saving || (!completed && !canComplete)}
              aria-busy={completing}
              aria-disabled={!completed && !canComplete}
              aria-label={
                completed
                  ? nextStep
                    ? `Próxima etapa: ${nextStep.title}`
                    : 'Ir para a conclusão da jornada'
                  : canComplete
                    ? 'Concluir esta etapa'
                    : `Escreva ao menos ${MIN_REFLECTION_LEN} caracteres para concluir`
              }
              title={completed ? 'Próxima etapa (→)' : canComplete ? 'Concluir etapa (Alt+Enter)' : 'Escreva sua reflexão para habilitar'}
              className={`${
                completed ? 'flex-1' : 'flex-[2]'
              } inline-flex items-center justify-center gap-2 bg-stitch-primary px-5 py-3 font-stitch-body text-[12px] font-bold uppercase tracking-[0.22em] text-stitch-primary-foreground transition-colors hover:bg-stitch-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-stitch-background disabled:opacity-50`}
            >
              {completing ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Concluindo…
                </>
              ) : completed ? (
                nextStep ? (
                  <>
                    Próxima Etapa <ChevronRight className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <Award className="h-3.5 w-3.5" /> Conclusão
                  </>
                )
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" /> Concluir Etapa
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
};

export default JornadaStepPage;
