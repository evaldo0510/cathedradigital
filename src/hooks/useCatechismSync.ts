import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useCatechismSync = () => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncedParagraph, setSyncedParagraph] = useState<number | null>(null);

  const syncProgress = useCallback(async (p: number, onSuccess?: () => void) => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('catechism_paragraphs_read')
        .upsert({ 
          user_id: user.id, 
          paragraph: p,
          read_at: new Date().toISOString()
        }, { onConflict: 'user_id,paragraph' })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data && data.read_at) {
        setLastSyncTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        setSyncedParagraph(p);
        onSuccess?.();
      }
    } catch (err) {
      console.error('Failed to mark paragraph read:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  return { syncProgress, isSyncing, lastSyncTime, syncedParagraph };
};
