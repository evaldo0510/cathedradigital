import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useCatechismSync = () => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncedParagraph, setSyncedParagraph] = useState<number | null>(null);

  const syncProgress = useCallback(async (p: number, onSuccess?: () => void) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    setIsSyncing(true);
    try {
      // Use upsert with onConflict to ensure uniqueness (handled by DB constraint)
      // and update read_at if it's a newer read or just to sync the timestamp.
      const { data, error } = await supabase
        .from('catechism_paragraphs_read')
        .upsert({ 
          user_id: user.id, 
          paragraph: p,
          read_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id,paragraph',
          ignoreDuplicates: false // We want to update read_at if it exists
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data && data.read_at) {
        setLastSyncTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        setSyncedParagraph(p);
        onSuccess?.();
        return { success: true, data };
      }
      return { success: false, error: 'No data returned' };
    } catch (err: any) {
      console.error('Failed to mark paragraph read:', err);
      return { success: false, error: err.message || 'Unknown error' };
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  return { syncProgress, isSyncing, lastSyncTime, syncedParagraph };
};
