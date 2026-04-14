import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, BookOpen, Hand, PenLine, Sparkles, Clock, ChevronDown, X, ShieldQuestion, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { saveUserPsychology } from '@/lib/psychologicalProfile';
import { AppRoute } from '@/types';
import ProConversionBanner from './ProConversionBanner';
import { Icons } from '@/constants';
import AudioContentPlayer from './AudioContentPlayer';
import { ALL_SAINTS } from '@/data/saints';
import SacredImage from './SacredImage';

const SECTION_CONFIG = [
  { key: 'pch', label: 'A Palavra', icon: <Sparkles className="w-4 h-4" />, isPremium: false },
  { key: 'interpretation', label: 'Reflexão', icon: <Icons.Bible className="w-4 h-4" />, isPremium: false },
  { key: 'practical_direction', label: 'Prática do Dia', icon: <Hand className="w-4 h-4" />, isPremium: true },
  { key: 'guided_exercise', label: 'Exercício Espiritual', icon: <PenLine className="w-4 h-4" />, isPremium: true },
  
  // Legacy / Hybrid mappings
  { key: 'intro', label: 'Introdução', icon: <BookOpen className="w-4 h-4" />, isPremium: false },
  { key: 'reflection', label: 'Reflexão', icon: <PenLine className="w-4 h-4" />, isPremium: true },
  { key: 'practice', label: 'Prática', icon: <Hand className="w-4 h-4" />, isPremium: true },
  { key: 'prayer', label: 'Oração', icon: <Sparkles className="w-4 h-4" />, isPremium: true },
];

type UserLevelClass = 'iniciante' | 'intermediário' | 'avançado';

const JornadaStepPage: React.FC = () => {
  const { id: journeyId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const stepId = searchParams.get('step');
  const navigate = useNavigate();
  const { user, profile, userLevel: userLevelClass, isPremium: isUserPremium } = useAuth();

  const [step, setStep] = useState<any>(null);
  const [journeyTitle, setJourneyTitle] = useState('');
  const [totalSteps, setTotalSteps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reflection, setReflection] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nextStep, setNextStep] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const content = useMemo(() => (step?.content as Record<string, any>) || {}, [step]);
  const stepProgress = useMemo(() => totalSteps > 0 ? (step?.step_order / totalSteps) * 100 : 0, [step, totalSteps]);

  const saintImage = useMemo(() => {
    if (!step?.subtitle) return null;
    const sub = step.subtitle.toLowerCase();
    const match = ALL_SAINTS.find(s => 
      sub.includes(s.name.toLowerCase()) || 
      s.name.toLowerCase().includes(sub)
    );
    return match?.image;
  }, [step?.subtitle]);


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

      if (stepRes.data) {
        setStep(stepRes.data);
        const content = stepRes.data.content as Record<string, any>;
        const firstWithContent = SECTION_CONFIG.find(s => {
          const val = content[s.key] || content[`${s.key}_iniciante`];
          return !!val;
        });
        if (firstWithContent) setExpandedSection(firstWithContent.key);
      }
      if (journeyRes.data) setJourneyTitle(journeyRes.data.title);
      setTotalSteps(countRes.count || 0);

      // Load next step
      const { data: allSteps } = await supabase
        .from('journey_steps')
        .select('*')
        .eq('journey_id', journeyId!)
        .order('step_order', { ascending: true });
      
      if (allSteps && stepRes.data) {
        const currentIndex = allSteps.findIndex(s => s.id === stepId);
        if (currentIndex !== -1 && currentIndex < allSteps.length - 1) {
          setNextStep(allSteps[currentIndex + 1]);
        }
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
      // 1. Core progress update - must be awaited to show completion
      const { error } = await supabase.from('journey_progress').upsert({
        user_id: user.id,
        journey_id: journeyId,
        step_id: stepId,
        reflection: reflection.trim() || null,
      }, { onConflict: 'user_id,step_id' });

      if (error) throw error;

      // 2. Secondary saves are backgrounded to improve perceived speed
      if (reflection.trim()) {
        supabase.from('spiritual_journal').insert([{
          user_id: user.id,
          content: reflection.trim(),
          journey_id: journeyId,
          step_id: stepId,
          entry_date: new Date().toISOString().split('T')[0],
        }]).then(({ error }) => { if (error) console.error('BG Journal save failed:', error); });
        
        saveUserPsychology(user.id, reflection.trim(), `journey_${journeyId}`);
      }

      setCompleted(true);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.7 },
        colors: ['#d4af37', '#e8c547', '#b8860b', '#8B5CF6', '#4ECDC4'],
      });
    } catch (err) {
      console.error('Failed to complete step:', err);
    } finally {
      setSaving(false);
    }
  };


  const getVariantContent = (key: string, content: any): string | null => {
    if (!content) return null;
    
    // If it's a string, return it
    if (typeof content[key] === 'string') return content[key];
    
    // If it's an object with variants
    if (content[key] && typeof content[key] === 'object') {
      return content[key][userLevelClass] || content[key]['iniciante'] || Object.values(content[key])[0] as string;
    }
    
    // Try separate keys (e.g. reflection_iniciante)
    const variantKey = `${key}_${userLevelClass}`;
    if (content[variantKey]) return content[variantKey];
    
    return content[key] || null;
  };

  const toggleSection = (key: string) => {
    setExpandedSection(prev => prev === key ? null : key);
  };

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 bg-background flex items-center justify-center z-[200]">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
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

  // Content is already calculated at the top


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
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">{journeyTitle}</p>
              <div className="group relative">
                <span className="cursor-help px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                  {userLevelClass} <ShieldQuestion className="w-2 h-2 opacity-50" />
                </span>
                <div className="absolute left-0 top-full mt-2 w-48 p-2 bg-popover text-popover-foreground rounded-lg border border-border shadow-xl text-[10px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <p className="font-bold mb-1">Conteúdo Adaptado</p>
                  <p className="opacity-80">
                    {userLevelClass === 'iniciante' && "Nível Iniciante: conteúdo simplificado e guiado."}
                    {userLevelClass === 'intermediário' && "Nível Intermediário: foco em reflexão e aprofundamento."}
                    {userLevelClass === 'avançado' && "Nível Avançado: foco em profundidade e confrontação."}
                  </p>
                </div>
              </div>
            </div>

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
            {content.bible_ref && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-wider mx-auto">
                <BookOpen className="w-3 h-3" /> {content.bible_ref}
              </div>
            )}
            
            <div className="flex justify-center pt-2">
              <AudioContentPlayer 
                text={`${step.title}. ${step.subtitle || ''}. ${SECTION_CONFIG.map(s => getVariantContent(s.key, content)).filter(Boolean).join('. ')}`}
                title="Ouvir conteúdo"
              />
            </div>
          </motion.div>

          {/* Content Sections */}
          {SECTION_CONFIG.map(({ key, label, icon, isPremium: sectionIsPremium }, i) => {
            const sectionContent = getVariantContent(key, content);
            if (!sectionContent) return null;
            const isExpanded = expandedSection === key;
            const isLocked = sectionIsPremium && !isUserPremium;

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
                      ? 'bg-card border border-b-0 border-border shadow-sm'
                      : 'bg-card border border-border rounded-b-2xl hover:border-primary/30'
                  } ${isLocked ? 'opacity-70' : ''}`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isExpanded ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'
                  }`}>
                    {isLocked ? <Lock className="w-4 h-4" /> : icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isExpanded ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {label}
                      </span>
                      {sectionIsPremium && (
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[8px] uppercase font-black px-1.5 py-0">PRO</Badge>
                      )}
                    </div>
                  </div>
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
                      <div className="bg-card border border-t-0 border-border rounded-b-2xl p-5 relative min-h-[140px]">
                        {isLocked ? (
                          <div className="space-y-4 py-4 text-center">
                            <div className="blur-[6px] select-none pointer-events-none opacity-40">
                              <p className="text-sm font-serif line-clamp-4">
                                {sectionContent}
                              </p>
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/40 backdrop-blur-[2px] p-6 space-y-4 rounded-b-2xl">
                              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                              <p className="text-sm font-bold text-foreground max-w-[180px] leading-relaxed">
                                Continue aprofundando essa experiência
                              </p>
                              <Button 
                                size="sm" 
                                className="font-bold text-[10px] uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(AppRoute.PRICING);
                                }}
                              >
                                Desbloquear PRO
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-sm text-foreground/90 leading-relaxed whitespace-pre-line font-serif ${key === 'pch' ? 'text-lg italic text-primary text-center' : ''}`}>
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

          {/* Journal / Reflection */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <PenLine className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Pergunta Final & Reflexão</h3>
            </div>

            {(getVariantContent('final_question', content) || getVariantContent('journal_prompt', content) || getVariantContent('question', content)) && (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                <p className="text-sm text-foreground/80 italic font-serif">
                  {getVariantContent('final_question', content) || getVariantContent('journal_prompt', content) || getVariantContent('question', content)}
                </p>
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
              {nextStep ? (
                <button
                  onClick={() => navigate(`/jornadas/${journeyId}/step?step=${nextStep.id}`)}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  Próxima Etapa <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/jornadas/${journeyId}/complete`)}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  Concluir Jornada <Icons.Award className="w-4 h-4" />
                </button>
              )}
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
