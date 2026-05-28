import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Icons } from '@/constants';
import { ChevronRight, ArrowLeft, Check, Lock, Clock } from 'lucide-react';

const ItinerariumDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [itinerarium, setItinerarium] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id, user]);

  const loadData = async () => {
    setLoading(true);
    const [itRes, stepsRes] = await Promise.all([
      supabase.from('itineraria').select('*').eq('id', id!).single(),
      supabase.from('itineraria_steps').select('*').eq('itinerarium_id', id!).order('step_order', { ascending: true })
    ]);

    if (itRes.data) setItinerarium(itRes.data);
    if (stepsRes.data) setSteps(stepsRes.data);

    if (user && id) {
      const { data: progress } = await supabase.from('itineraria_progress').select('step_id').eq('user_id', user.id).eq('itinerarium_id', id);
      if (progress) setCompletedSteps(new Set(progress.map(p => p.step_id)));
    }
    setLoading(false);
  };

  if (loading || !itinerarium) return <div className="p-24 text-center">Carregando jornada...</div>;

  const progress = (completedSteps.size / steps.length) * 100;

  return (
    <div className="max-w-2xl mx-auto py-12 md:py-24 space-y-16">
      <motion.div 
        initial={{ opacity: 0, x: -10 }} 
        animate={{ opacity: 1, x: 0 }}
      >
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/itineraria')} 
          className="group gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Voltar para Trilhas
        </Button>
      </motion.div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-primary/20 rounded-full" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary tracking-tight">{itinerarium.title}</h1>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground/80 font-serif italic leading-relaxed">{itinerarium.description}</p>
      </div>

      <Card className="premium-card bg-primary/[0.01] border-primary/5 rounded-[2.5rem] shadow-none overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
          <Icons.Compass className="w-24 h-24 text-primary" />
        </div>
        <CardContent className="p-8 md:p-10 space-y-6 relative z-10">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Progresso Atual</p>
              <h4 className="text-2xl font-bold font-serif">{Math.round(progress)}% Concluído</h4>
            </div>
            <span className="text-sm font-bold text-primary/60">{completedSteps.size} de {steps.length} passos</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-primary/5" />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Caminho de Contemplação</span>
          <div className="flex-1 h-px bg-primary/5" />
        </div>
        
        {steps.map((step, idx) => {
          const isCompleted = completedSteps.has(step.id);
          const isLocked = !isCompleted && idx > 0 && !completedSteps.has(steps[idx-1].id);

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card 
                className={`premium-card transition-all duration-700 border-primary/5 rounded-[2rem] shadow-none group ${
                  isLocked ? 'opacity-30 grayscale pointer-events-none' : 'hover:border-primary/20 hover:bg-primary/[0.01]'
                } ${isCompleted ? 'bg-primary/[0.02]' : ''}`}
              >
                <CardContent className="p-6 md:p-8 flex items-center justify-between gap-6">
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all duration-700 ${
                      isCompleted 
                        ? 'bg-primary text-primary-foreground shadow-premium' 
                        : 'bg-primary/5 text-primary/40 border border-primary/10'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <span className="text-sm font-bold">{idx + 1}</span>}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg md:text-xl font-bold font-serif text-foreground truncate">{step.title}</h3>
                        {!step.is_free && <Icons.Lock className="w-3 h-3 text-primary/20" />}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {step.duration_minutes} MIN</span>
                        <div className="w-1 h-1 rounded-full bg-border" />
                        <span>{step.step_type}</span>
                      </div>
                    </div>
                  </div>

                  {!isLocked && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate(`/itineraria/${id}/step?step=${step.id}`)}
                      className="group/btn h-12 px-6 rounded-full border border-primary/5 hover:bg-primary hover:text-primary-foreground transition-all duration-500 text-[10px] font-black uppercase tracking-widest"
                    >
                      {isCompleted ? 'Revisitar' : 'Iniciar'}
                      <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ItinerariumDetailPage;
