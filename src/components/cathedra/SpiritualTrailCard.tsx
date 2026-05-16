import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { PROFILES, ProfileId } from './SpiritualQuiz';
import { HomeCard as Card } from './HomeCard';
import { updateUserStreak } from '@/lib/streak';

const SpiritualTrailCard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [profileId, setProfileId] = useState<ProfileId | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Get spiritual profile from sensitive data
    supabase
      .from('user_sensitive_data')
      .select('diagnosis_result')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const result = data?.diagnosis_result as any;
        const sp = result?.spiritual_profile as ProfileId;
        if (sp && PROFILES[sp]) {
          setProfileId(sp);
          
          // Get progress
          supabase
            .from('trail_progress')
            .select('step_index')
            .eq('user_id', user.id)
            .eq('trail_id', sp)
            .then(({ data: progress }) => {
              if (progress) setCompletedSteps(progress.map(p => p.step_index));
            });
        }
      });
  }, [user]);

  const toggleStep = async (index: number) => {
    if (!user || !profileId) return;
    
    const isCompleted = completedSteps.includes(index);
    if (isCompleted) {
      await supabase
        .from('trail_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('trail_id', profileId)
        .eq('step_index', index);
      setCompletedSteps(prev => prev.filter(i => i !== index));
    } else {
      await (supabase as any)
        .from('trail_progress')
        .insert({
          user_id: user.id,
          trail_id: profileId,
          step_index: index
        });
      setCompletedSteps(prev => [...prev, index]);
      await updateUserStreak(user.id);
    }
  };

  if (!profileId) return null;

  const p = PROFILES[profileId];
  const progress = (completedSteps.length / p.steps.length) * 100;

  return (
    <Card padding="md" className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="text-premium-tiny font-black uppercase tracking-[0.3em] text-primary/60">Sua Trilha Diária</span>
        </div>
        <button 
          onClick={() => navigate(AppRoute.PROGRESS)}
          className="flex items-center gap-2 text-[10px] font-black text-primary/30 uppercase tracking-widest hover:text-primary transition-colors"
        >
          {Math.round(progress)}% <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {p.steps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => toggleStep(idx)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group ${
              completedSteps.includes(idx)
                ? 'bg-primary/5 border-primary/10 opacity-60'
                : 'bg-primary/[0.01] border-border/5 hover:border-primary/20'
            }`}
          >
            <div className={`shrink-0 ${completedSteps.includes(idx) ? 'text-primary' : 'text-primary/20 group-hover:text-primary/40'}`}>
              {completedSteps.includes(idx) ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold truncate ${completedSteps.includes(idx) ? 'text-primary/40 line-through' : 'text-primary'}`}>
                {step.title}
              </p>
              <p className="text-[10px] text-primary/30 uppercase tracking-widest">{step.time}</p>
            </div>
            <step.icon className={`w-4 h-4 shrink-0 ${completedSteps.includes(idx) ? 'text-primary/20' : 'text-primary/10'}`} />
          </button>
        ))}
      </div>
    </Card>
  );
};

export default SpiritualTrailCard;
