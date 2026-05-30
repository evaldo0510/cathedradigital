import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BookOpen, Clock, ChevronDown, Check, PenLine, Hand, Save, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Relatio from './Relatio';
import LogosAI from './LogosAI';
import { Icons } from '@/constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { useIsMobile } from '@/hooks/use-mobile';
import DOMPurify from 'dompurify';

const ItinerariumStepPage: React.FC = () => {
  const { id: itinerariumId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const stepId = searchParams.get('step');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reflection, setReflection] = useState('');
  const [isLogosOpen, setIsLogosOpen] = useState(false);
  const [logosQuery, setLogosQuery] = useState('');
  const [allSteps, setAllSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const { settings } = useReadingSettings();
  const { saveLastRead } = useReadingMarks();
  const isMobile = useIsMobile();
  const autoSaveTimer = useRef<number | null>(null);
  const lastSavedReflection = useRef<string>('');

  // Auto-save reflexão (debounced) e progresso de leitura local
  useEffect(() => {
    if (!user || !stepId || reflection === lastSavedReflection.current) return;
    if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = window.setTimeout(async () => {
      try {
        await supabase.from('itineraria_progress').upsert({
          user_id: user.id,
          itinerarium_id: itinerariumId!,
          step_id: stepId,
          reflection: reflection || null,
          completed_at: completed ? new Date().toISOString() : new Date().toISOString(),
        }, { onConflict: 'user_id,step_id' });
        lastSavedReflection.current = reflection;
      } catch (e) {
        console.warn('auto-save reflection failed', e);
      }
    }, 1500);
    return () => {
      if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current);
    };
  }, [reflection, user, stepId, itinerariumId, completed]);

  // Persistir último ponto visitado (retomada natural sincronizada)
  useEffect(() => {
    if (!stepId || !itinerariumId || !step?.title) return;
    
    const persistReadingMark = async () => {
      try {
        // Local fallback
        localStorage.setItem('cathedra:last-itineraria-step', JSON.stringify({
          itinerariumId,
          stepId,
          at: Date.now(),
        }));

        // Sync to DB for global resumption
        await saveLastRead({
          content_type: 'itinerarium',
          content_id: stepId,
          label: `${step.title} (Itinerarium)`,
          url: `/itineraria/${itinerariumId}/step?step=${stepId}`,
          is_last_read: true
        });
        
        // Update general history
        await supabase.from('user_history').insert({
          user_id: user?.id,
          title: step.title,
          route: `/itineraria/${itinerariumId}/step?step=${stepId}`,
          type: 'itinerarium'
        });
      } catch (e) {
        console.warn('Failed to persist reading mark', e);
      }
    };

    persistReadingMark();
  }, [stepId, itinerariumId, step?.title, user?.id]);

  useEffect(() => {
    if (stepId) {
      loadStep();
      loadAllSteps();
    }
  }, [stepId, user]);

  const loadAllSteps = async () => {
    if (!itinerariumId) return;
    const { data } = await supabase
      .from('itineraria_steps')
      .select('id, title, step_order')
      .eq('itinerarium_id', itinerariumId)
      .order('step_order', { ascending: true });
    
    if (data) {
      setAllSteps(data);
      setCurrentStepIndex(data.findIndex(s => s.id === stepId));
    }
  };

  const loadStep = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('itineraria_steps')
        .select('*')
        .eq('id', stepId!)
        .single();
      
      if (data) setStep(data);

      if (user && stepId) {
        const { data: progress } = await supabase
          .from('itineraria_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('step_id', stepId)
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

  const checkAchievements = async () => {
    if (!user) return;
    
    // Check total steps completed
    const { count } = await supabase
      .from('itineraria_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (count) {
      const { data: achievements } = await supabase
        .from('achievements')
        .select('*')
        .eq('requirement_type', 'steps_completed')
        .lte('requirement_value', count);
      
      if (achievements) {
        for (const ach of achievements) {
          await supabase.from('user_achievements').upsert({
            user_id: user.id,
            achievement_id: ach.id
          }, { onConflict: 'user_id,achievement_id' });
        }
      }
    }

    // Update weekly goals
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(today.setDate(diff)).toISOString().split('T')[0];

    const { data: goal } = await supabase
      .from('weekly_goals_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStart)
      .maybeSingle();
    
    if (goal) {
      await supabase
        .from('weekly_goals_history')
        .update({ achieved_count: goal.achieved_count + 1 })
        .eq('id', goal.id);
    }
  };

  const handleComplete = async () => {
    if (!user || !stepId || !itinerariumId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('itineraria_progress').upsert({
        user_id: user.id,
        itinerarium_id: itinerariumId,
        step_id: stepId,
        reflection: reflection.trim() || null,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,step_id' });

      if (error) throw error;
      
      await checkAchievements();
      
      setCompleted(true);
      toast.success("Passo concluído! Caminhada honrada.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar progresso.");
    } finally {
      setSaving(false);
    }
  };

  // Real-time sync subscription
  useEffect(() => {
    if (!user || !stepId) return;

    const channel = supabase
      .channel(`itinerarium_step_sync_${stepId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itineraria_progress',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            if (newData && newData.step_id === stepId) {
              setCompleted(true);
              setReflection(newData.reflection || '');
              lastSavedReflection.current = newData.reflection || '';
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, stepId]);

  const navigateToStep = useCallback((index: number) => {
    const targetStep = allSteps[index];
    if (targetStep) {
      navigate(`/itineraria/${itinerariumId}/step?step=${targetStep.id}`);
    }
  }, [allSteps, itinerariumId, navigate]);

  // Navegação por gestos (mobile) e tap-to-reveal da UI
  const revealTimer = useRef<number | null>(null);
  const revealChrome = useCallback(() => {
    document.documentElement.classList.add('reveal-chrome');
    if (revealTimer.current) window.clearTimeout(revealTimer.current);
    revealTimer.current = window.setTimeout(() => {
      document.documentElement.classList.remove('reveal-chrome');
    }, 2800);
  }, []);

  useSwipeNavigation({
    enabled: isMobile,
    onSwipeLeft: () => {
      if (currentStepIndex >= 0 && currentStepIndex < allSteps.length - 1) {
        navigateToStep(currentStepIndex + 1);
      }
    },
    onSwipeRight: () => {
      if (currentStepIndex > 0) {
        navigateToStep(currentStepIndex - 1);
      }
    },
    onTap: () => {
      if (settings.autoHideUI || settings.contemplativeMode) revealChrome();
    },
  });

  const exportStepPDF = () => {
    if (!step) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text(step.title, 20, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Itinerarium Step ${step.step_order} - ${step.step_type}`, 20, 40);
    
    // Content
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text("Sua Reflexão:", 20, 60);
    
    doc.setFontSize(12);
    const splitReflection = doc.splitTextToSize(reflection || "Nenhuma reflexão registrada.", 170);
    doc.text(splitReflection, 20, 70);
    
    doc.save(`reflexao-${step.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    toast.success("PDF gerado com sucesso!");
  };

  if (loading || !step) return <div className="p-spacing-4xl text-center">Iniciando passo contemplativo...</div>;

  return createPortal(
    <div className="fixed inset-0 bg-background z-[200] flex flex-col overflow-hidden">
      <div data-reading-chrome className="reading-chrome px-spacing-lg py-spacing-md border-b border-border/50 flex items-center justify-between bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-spacing-md">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/itineraria/${itinerariumId}`)}
            aria-label="Voltar para o itinerário"
          >
            <X className="w-spacing-md h-spacing-md text-primary" />
          </Button>
          <div className="space-y-spacing-3xs" aria-live="polite">
            <h1 className="text-sm font-bold truncate max-w-[200px] text-primary">{step.title}</h1>
            <p className="text-[10px] text-foreground font-bold uppercase tracking-widest flex items-center gap-spacing-xs">
              <Clock className="w-spacing-sm h-spacing-sm text-primary" /> {step.duration_minutes} min • Passo {step.step_order}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-spacing-xs">
          <Button
            variant="ghost"
            size="sm"
            className="gap-spacing-xs text-[10px] font-black uppercase tracking-widest hidden md:flex"
            onClick={exportStepPDF}
          >
            <FileText className="w-spacing-sm h-spacing-sm" /> PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-spacing-xs text-[10px] font-black uppercase tracking-widest border-primary/20"
            onClick={() => setIsLogosOpen(true)}
          >
            <Sparkles className="w-spacing-sm h-spacing-sm text-primary" /> Logos IA
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar reader-container" data-side-margins={settings.sideMargins} style={{ maxWidth: `${settings.columnWidth}ch`, margin: '0 auto' }}>
        <div className="mx-auto px-spacing-md md:px-spacing-lg py-spacing-2xl space-y-spacing-2xl pb-spacing-4xl reader-text">

          <header className="text-center space-y-spacing-md">
            <Badge variant="outline" className="text-primary/60 border-primary/10">{step.step_type}</Badge>
            <h2 className="text-3xl font-display font-bold leading-tight">{step.subtitle || step.title}</h2>
          </header>

          <article className="prose prose-premium dark:prose-invert max-w-none font-serif text-lg md:text-xl leading-[1.8] text-foreground/90 selection:bg-primary/10">
             <div className="space-y-spacing-lg" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(step.content.html || '') }} />
             {!step.content.html && (
               <div className="flex flex-col items-center justify-center py-spacing-3xl space-y-spacing-lg opacity-30">
                 <Icons.Sparkles className="w-spacing-2xl h-spacing-2xl animate-pulse" />
                 <p className="italic text-center font-serif">O conteúdo deste passo está sendo preparado em silêncio...</p>
               </div>
             )}
          </article>

          <div className="space-y-spacing-md pt-spacing-2xl border-t border-border/10">
            <div className="flex items-center gap-spacing-xs text-primary">
              <PenLine className="w-spacing-md h-spacing-md" />
              <h3 className="text-sm font-black uppercase tracking-widest">Sua Reflexão</h3>
            </div>
            <textarea
              className="w-full bg-muted/30 border border-border/50 rounded-premium p-spacing-lg font-serif italic focus:ring-2 focus:ring-primary/20 outline-none min-h-[150px] transition-all"
              placeholder="O que o Espírito diz ao seu coração hoje?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
            />
          </div>

          <Relatio 
            context={{ 
              type: 'theme', 
              tags: step.content.tags || [],
              id: step.id
            }} 
            onSelectLogosQuery={(query) => {
              setLogosQuery(query);
              setIsLogosOpen(true);
            }}
          />
        </div>
      </div>

      <div data-reading-chrome className="reading-chrome fixed bottom-0 left-0 right-0 p-spacing-lg bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
        <div className="max-w-spacing-2xl mx-auto flex items-center justify-between gap-spacing-md pointer-events-auto">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-spacing-2xl h-spacing-2xl p-0 flex-shrink-0 border-primary/20 hover:border-primary/40 bg-background/50"
            disabled={currentStepIndex <= 0}
            onClick={() => navigateToStep(currentStepIndex - 1)}
            aria-label="Passo anterior"
          >
            <ChevronLeft className="w-spacing-lg h-spacing-lg" />
          </Button>

          <Button 
            className="flex-1 h-spacing-2xl rounded-full shadow-premium text-sm font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground hover:opacity-90"
            onClick={handleComplete}
            disabled={saving}
          >
            {completed ? 'Passo Concluído' : saving ? 'Salvando...' : 'Concluir Passo'}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-spacing-2xl h-spacing-2xl p-0 flex-shrink-0 border-primary/20 hover:border-primary/40 bg-background/50"
            disabled={currentStepIndex === -1 || currentStepIndex >= allSteps.length - 1}
            onClick={() => navigateToStep(currentStepIndex + 1)}
            aria-label="Próximo passo"
          >
            <ChevronRight className="w-spacing-lg h-spacing-lg" />
          </Button>
        </div>
      </div>

      <LogosAI 
        isOpen={isLogosOpen} 
        onClose={() => setIsLogosOpen(false)} 
        initialQuery={logosQuery}
        context={`itineraria_step_${step.id}`}
      />
    </div>,
    document.body
  );
};

export default ItinerariumStepPage;
