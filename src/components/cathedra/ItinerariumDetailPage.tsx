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
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      <Button variant="ghost" size="sm" onClick={() => navigate('/itineraria')} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      <div className="space-y-4">
        <h1 className="text-3xl font-display font-bold">{itinerarium.title}</h1>
        <p className="text-muted-foreground">{itinerarium.description}</p>
      </div>

      <Card className="premium-card">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span>Progresso da Trilha</span>
            <span>{completedSteps.size}/{steps.length} etapas</span>
          </div>
          <Progress value={progress} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isCompleted = completedSteps.has(step.id);
          const isLocked = !isCompleted && idx > 0 && !completedSteps.has(steps[idx-1].id);

          return (
            <Card key={step.id} className={`premium-card ${isLocked ? 'opacity-50 grayscale' : ''}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-primary text-white' : 'bg-muted'}`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold">{step.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {step.duration_minutes}min • {step.step_type}
                    </div>
                  </div>
                </div>
                {!isLocked && (
                  <Button size="sm" onClick={() => navigate(`/itineraria/${id}/step?step=${step.id}`)}>
                    {isCompleted ? 'Rever' : 'Iniciar'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ItinerariumDetailPage;
