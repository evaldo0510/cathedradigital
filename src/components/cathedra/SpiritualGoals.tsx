import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CathedraCard } from './CathedraCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Target, Bell, Calendar, ChevronRight, Settings2, CheckCircle2, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const SpiritualGoals: React.FC = () => {
  const { user } = useAuth();
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newGoalCount, setNewGoalCount] = useState(3);
  const [reminderSettings, setReminderSettings] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadGoal();
      loadReminderSettings();
    }
  }, [user]);

  const loadGoal = async () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const weekStart = new Date(today.setDate(diff)).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('weekly_goals_history')
      .select('*')
      .eq('user_id', user!.id)
      .eq('week_start_date', weekStart)
      .maybeSingle();
    
    if (data) {
      setGoal(data);
      setNewGoalCount(data.goal_count);
    } else {
      // Create a default one if none exists
      const { data: newGoal } = await supabase
        .from('weekly_goals_history')
        .insert({
          user_id: user!.id,
          week_start_date: weekStart,
          goal_count: 3,
          achieved_count: 0
        })
        .select()
        .single();
      if (newGoal) setGoal(newGoal);
    }
    setLoading(false);
  };

  const loadReminderSettings = async () => {
    const { data } = await supabase
      .from('user_reminder_settings')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();
    
    if (data) {
      setReminderSettings(data);
    } else {
      const { data: newSettings } = await supabase
        .from('user_reminder_settings')
        .insert({ user_id: user!.id })
        .select()
        .single();
      if (newSettings) setReminderSettings(newSettings);
    }
  };

  const handleUpdateGoal = async () => {
    try {
      const { error } = await supabase
        .from('weekly_goals_history')
        .update({ goal_count: newGoalCount })
        .eq('id', goal.id);
      
      if (error) throw error;
      setGoal({ ...goal, goal_count: newGoalCount });
      setIsEditing(false);
      toast.success("Meta semanal atualizada!");
    } catch (err) {
      toast.error("Erro ao atualizar meta.");
    }
  };

  const toggleReminder = async (type: 'push' | 'email') => {
    const updated = { ...reminderSettings };
    if (type === 'push') updated.push_enabled = !updated.push_enabled;
    else updated.email_enabled = !updated.email_enabled;

    try {
      const { error } = await supabase
        .from('user_reminder_settings')
        .update(updated)
        .eq('user_id', user!.id);
      
      if (error) throw error;
      setReminderSettings(updated);
      toast.success("Configurações atualizadas!");
    } catch (err) {
      toast.error("Erro ao salvar preferências.");
    }
  };

  if (loading || !goal) return null;

  const progress = Math.min((goal.achieved_count / goal.goal_count) * 100, 100);

  return (
    <CathedraCard padding="md" className="premium-card bg-primary/[0.02] border-primary/5 rounded-[2.5rem] overflow-hidden shadow-premium-none space-y-spacing-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-spacing-sm">
            <div className="p-spacing-xs bg-primary/10 rounded-premium">
              <Target className="w-spacing-md h-spacing-md text-primary" />
            </div>
            <div>
              <h3 className="text-premium-xl font-bold font-serif">Meta da Semana</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Progresso Espiritual</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(!isEditing)}
            className="text-[10px] font-black uppercase tracking-widest"
          >
            {isEditing ? 'Cancelar' : <Settings2 className="w-spacing-md h-spacing-md" />}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-spacing-lg"
            >
              <div className="space-y-spacing-xs">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Quantos passos nesta semana?</label>
                <div className="flex gap-spacing-xs">
                  <Input 
                    type="number" 
                    value={newGoalCount} 
                    onChange={(e) => setNewGoalCount(parseInt(e.target.value))}
                    className="bg-background border-primary/10 rounded-premium"
                  />
                  <Button onClick={handleUpdateGoal} className="rounded-premium px-spacing-lg">Salvar</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-spacing-md pt-spacing-md border-t border-primary/5">
                <Button 
                  variant={reminderSettings?.push_enabled ? "default" : "outline"}
                  onClick={() => toggleReminder('push')}
                  className="rounded-premium gap-spacing-xs text-[10px] font-black uppercase tracking-widest h-spacing-2xl"
                >
                  <Bell className="w-spacing-sm h-spacing-sm" /> Push {reminderSettings?.push_enabled ? 'ON' : 'OFF'}
                </Button>
                <Button 
                  variant={reminderSettings?.email_enabled ? "default" : "outline"}
                  onClick={() => toggleReminder('email')}
                  className="rounded-premium gap-spacing-xs text-[10px] font-black uppercase tracking-widest h-spacing-2xl"
                >
                  <Calendar className="w-spacing-sm h-spacing-sm" /> E-mail {reminderSettings?.email_enabled ? 'ON' : 'OFF'}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-spacing-lg"
            >
              <div className="flex justify-between items-end mb-spacing-xs">
                <div className="space-y-spacing-2xs">
                  <span className="text-premium-4xl font-display font-bold text-primary">{goal.achieved_count}</span>
                  <span className="text-premium-xl text-muted-foreground/40 font-serif italic mx-spacing-xs">/</span>
                  <span className="text-premium-xl font-bold text-muted-foreground">{goal.goal_count} passos</span>
                </div>
                {progress === 100 && (
                  <Badge className="bg-primary/20 text-primary border-primary/10 animate-bounce">
                    <CheckCircle2 className="w-spacing-sm h-spacing-sm mr-spacing-2xs" /> Meta Alcançada
                  </Badge>
                )}
              </div>
              
              <Progress value={progress} className="h-spacing-xs bg-primary/5" />
              
              <p className="text-premium-xs text-muted-foreground/60 font-serif italic">
                {progress === 100 
                  ? "Parabéns! Sua alma encontrou descanso na disciplina." 
                  : `Faltam ${goal.goal_count - goal.achieved_count} passos para completar sua meta esta semana.`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
    </CathedraCard>
  );
};

export default SpiritualGoals;