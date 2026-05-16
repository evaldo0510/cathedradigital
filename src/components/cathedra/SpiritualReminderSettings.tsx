import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

const SpiritualReminderSettings: React.FC = () => {
  const { user } = useAuth();
  const [reminderTime, setReminderTime] = useState('08:00');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('preferred_reminder_time')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.preferred_reminder_time) {
          setReminderTime(data.preferred_reminder_time.slice(0, 5));
        }
      });
    
    supabase
      .from('profiles_private')
      .select('push_enabled')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setPushEnabled(data.push_enabled ?? true);
      });
  }, [user]);

  const saveSettings = async (time?: string, push?: boolean) => {
    if (!user) return;
    setIsSaving(true);
    const newTime = time !== undefined ? time : reminderTime;
    const newPush = push !== undefined ? push : pushEnabled;

    try {
      const { error: pError } = await supabase
        .from('profiles')
        .update({ preferred_reminder_time: newTime } as any)
        .eq('id', user.id);

      const { error: prError } = await supabase
        .from('profiles_private')
        .update({ push_enabled: newPush } as any)
        .eq('id', user.id);

      if (pError || prError) throw pError || prError;
      toast.success('Lembretes atualizados!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-premium border border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Icons.Bell className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Lembretes Push</p>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Sugestões diárias da trilha</p>
        </div>
        <Switch 
          checked={pushEnabled} 
          onCheckedChange={(val) => {
            setPushEnabled(val);
            saveSettings(reminderTime, val);
          }} 
        />
      </div>

      <div className="space-y-2 px-1">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Icons.Clock className="w-3 h-3" /> Horário Sugerido
        </label>
        <input
          type="time"
          value={reminderTime}
          onChange={(e) => {
            setReminderTime(e.target.value);
            saveSettings(e.target.value, pushEnabled);
          }}
          className="w-full px-5 py-4 bg-primary/[0.02] border border-primary/10 rounded-full text-base font-serif focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <p className="text-[10px] text-primary/30 italic pl-1">
          Receba um chamado para o silêncio neste horário.
        </p>
      </div>
    </div>
  );
};

export default SpiritualReminderSettings;
