import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BookOpen, Clock, ChevronDown, Check, PenLine, Hand, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Relatio from './Relatio';
import LogosAI from './LogosAI';
import { Icons } from '@/constants';

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

  useEffect(() => {
    if (stepId) loadStep();
  }, [stepId, user]);

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
      setCompleted(true);
      toast.success("Passo concluído!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar progresso.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !step) return <div className="p-24 text-center">Iniciando passo contemplativo...</div>;

  return createPortal(
    <div className="fixed inset-0 bg-background z-[200] flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/itineraria/${itinerariumId}`)}>
            <X className="w-5 h-5" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-sm font-bold truncate max-w-[200px]">{step.title}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3" /> {step.duration_minutes} min • Passo {step.step_order}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 text-[10px] font-black uppercase tracking-widest border-primary/20"
          onClick={() => setIsLogosOpen(true)}
        >
          <Sparkles className="w-3.5 h-3.5" /> Logos IA
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl mx-auto px-6 py-12 space-y-12 pb-32">
          <header className="text-center space-y-4">
            <Badge variant="outline" className="text-primary/60 border-primary/10">{step.step_type}</Badge>
            <h2 className="text-3xl font-display font-bold leading-tight">{step.subtitle || step.title}</h2>
          </header>

          <article className="prose prose-premium dark:prose-invert max-w-none font-serif text-lg md:text-xl leading-[1.8] text-foreground/90 selection:bg-primary/10">
             <div className="space-y-6" dangerouslySetInnerHTML={{ __html: step.content.html || '' }} />
             {!step.content.html && (
               <div className="flex flex-col items-center justify-center py-20 space-y-6 opacity-30">
                 <Icons.Sparkles className="w-12 h-12 animate-pulse" />
                 <p className="italic text-center font-serif">O conteúdo deste passo está sendo preparado em silêncio...</p>
               </div>
             )}
          </article>

          <div className="space-y-4 pt-12 border-t border-border/10">
            <div className="flex items-center gap-2 text-primary">
              <PenLine className="w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Sua Reflexão</h3>
            </div>
            <textarea
              className="w-full bg-muted/30 border border-border/50 rounded-2xl p-6 font-serif italic focus:ring-2 focus:ring-primary/20 outline-none min-h-[150px] transition-all"
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

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
        <div className="max-w-2xl mx-auto flex justify-center pointer-events-auto">
          <Button 
            className="w-full max-w-xs h-14 rounded-full shadow-premium text-sm font-black uppercase tracking-[0.2em]"
            onClick={handleComplete}
            disabled={saving}
          >
            {completed ? 'Concluído' : saving ? 'Salvando...' : 'Concluir Passo'}
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
