import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, BookOpen, Hand, PenLine, Sparkles, Clock, ChevronDown, X, ShieldQuestion } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { saveUserPsychology } from '@/lib/psychologicalProfile';
import ProConversionBanner from './ProConversionBanner';

const SECTION_CONFIG = [
  { key: 'reflection', label: 'Reflexão', icon: <PenLine className="w-4 h-4" /> },
  { key: 'intro', label: 'Interpretação', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'practice', label: 'Direção Prática', icon: <Hand className="w-4 h-4" /> },
  { key: 'prayer', label: 'Exercício Guiado', icon: <Sparkles className="w-4 h-4" /> },
];

type UserLevelClass = 'iniciante' | 'intermediário' | 'avançado';

const JornadaStepPage: React.FC = () => {
  const { id: journeyId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const stepId = searchParams.get('step');
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [step, setStep] = useState<any>(null);
  const [journeyTitle, setJourneyTitle] = useState('');
  const [totalSteps, setTotalSteps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reflection, setReflection] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('intro');


  useEffect(() => {
    if (stepId && journeyId) loadData();
  }, [stepId, journeyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stepRes, journeyRes, countRes] = await Promise.all([
        supabase.from('journey_steps').select('*').eq('id', stepId!).single(),
        supabase.from('journeys').select('title').eq('id', journeyId!).single(),
        supabase.from('journey_steps').select('*', { count: 'exact', head: true }).eq('journey_id', journeyId!),
      ]);

      if (stepRes.data) setStep(stepRes.data);
      if (journeyRes.data) setJourneyTitle(journeyRes.data.title);
      setTotalSteps(countRes.count || 0);

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
    setSaving(true);
    try {
      await supabase.from('journey_progress').upsert({
        user_id: user.id,
        journey_id: journeyId,
        step_id: stepId,
        reflection: reflection.trim() || null,
      }, { onConflict: 'user_id,step_id' });

      // Also save to spiritual journal if there's a journal prompt response
      if (reflection.trim()) {
        await Promise.all([
          supabase.from('spiritual_journal').insert([{
            user_id: user.id,
            content: reflection.trim(),
            journey_id: journeyId,
            step_id: stepId,
            entry_date: new Date().toISOString().split('T')[0],
          }]),
          saveUserPsychology(user.id, reflection.trim(), `journey_${journeyId}`)
        ]);
      }

      setCompleted(true);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.7 },
        colors: ['#d4af37', '#e8c547', '#b8860b', '#8B5CF6', '#4ECDC4'],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSection(prev => prev === key ? null : key);
  };

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 bg-background flex items-center justify-center z-[200]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>,
      document.body
    );
  }

  if (!step) {
    return createPortal(
      <div className="fixed inset-0 bg-background flex items-center justify-center z-[200]">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Etapa não encontrada.</p>
          <button onClick={() => navigate(-1)} className="text-primary underline text-sm">Voltar</button>
        </div>
      </div>,
      document.body
    );
  }

  const content = step.content as Record<string, any>;
  const stepProgress = totalSteps > 0 ? (step.step_order / totalSteps) * 100 : 0;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-background z-[200] flex flex-col overflow-hidden"
    >
      {/* Immersive Header */}
      <div className="flex-shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-border/50">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(`/jornadas/${journeyId}`)}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">{journeyTitle}</p>
            <p className="text-xs text-muted-foreground">Etapa {step.step_order} de {totalSteps}</p>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {step.duration_minutes}min
          </span>
        </div>
        <div className="max-w-2xl mx-auto mt-2">
          <Progress value={stepProgress} className="h-1" />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
          {/* Step Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-foreground">{step.title}</h1>
            {step.subtitle && (
              <p className="text-sm text-muted-foreground italic">{step.subtitle}</p>
            )}
          </motion.div>

          {/* Content Sections */}
          {SECTION_CONFIG.map(({ key, label, icon }, i) => {
            const sectionContent = content[key];
            if (!sectionContent) return null;
            const isExpanded = expandedSection === key;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <button
                  onClick={() => toggleSection(key)}
                  className={`w-full flex items-center gap-3 p-4 rounded-t-2xl transition-all text-left ${
                    isExpanded
                      ? 'bg-card border border-b-0 border-border'
                      : 'bg-card border border-border rounded-b-2xl hover:border-primary/30'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isExpanded ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {icon}
                  </span>
                  <span className={`flex-1 text-sm font-bold ${isExpanded ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-card border border-t-0 border-border rounded-b-2xl p-5">
                        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line font-serif">
                          {sectionContent}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* Journal / Reflection */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <PenLine className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Diário Espiritual</h3>
            </div>

            {content.journal_prompt && (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                <p className="text-sm text-foreground/80 italic font-serif">{content.journal_prompt}</p>
              </div>
            )}

            <Textarea
              placeholder="Escreva sua reflexão aqui... Suas palavras são privadas e só você pode ver."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="min-h-[120px] resize-none text-sm bg-card border-border"
              disabled={completed}
            />
          </motion.div>
        </div>
      </div>

      {/* Fixed Bottom Action */}
      <div className="flex-shrink-0 border-t border-border/50 bg-background/95 backdrop-blur-sm px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto">
          {!completed ? (
            <button
              onClick={completeStep}
              disabled={saving}
              className="w-full py-4 bg-foreground text-background rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>Salvando...</>
              ) : (
                <>
                  Concluir Etapa <Check className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm font-bold text-primary">✓ Etapa concluída!</p>
              </div>
              <ProConversionBanner context="jornada" />
              <button
                onClick={() => navigate(`/jornadas/${journeyId}`)}
                className="w-full py-4 bg-muted text-foreground rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar à Jornada
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>,
    document.body
  );
};

export default JornadaStepPage;
