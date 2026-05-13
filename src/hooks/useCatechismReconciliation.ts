import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useCatechismReconciliation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reconcile = useCallback(async () => {
    if (!user) return;

    try {
      // 1. Detect and fix duplicates (now handled by DB, but good to check if any weirdness remains)
      // Actually, with the UNIQUE constraint, we don't need to manually delete duplicates anymore,
      // as the constraint prevents them. But we can check for paragraphs that are in "error" state
      // but are actually in the "read" list, suggesting they might need a retry or status update.
      
      const { data: readParagraphs, error: readError } = await supabase
        .from('catechism_paragraphs_read')
        .select('paragraph')
        .eq('user_id', user.id);

      if (readError) throw readError;

      const readSet = new Set(readParagraphs.map(p => p.paragraph));

      // 2. Check for pending failures in cache that are actually marked as read
      // This is a form of inconsistency
      const { data: cachedFailed, error: cacheError } = await supabase
        .from('catechism_cache')
        .select('paragraph, status')
        .in('paragraph', Array.from(readSet))
        .or('status.eq.error,status.eq.error_402,status.eq.incomplete');

      if (cacheError) throw cacheError;

      if (cachedFailed && cachedFailed.length > 0) {
        console.log(`Reconciling ${cachedFailed.length} paragraphs that are read but have error status in cache.`);
        
        // Attempt to reprocess these paragraphs
        for (const item of cachedFailed) {
          await supabase.functions.invoke('catechism-text', {
            body: { paragraph: item.paragraph, action: 'reprocess' }
          });
        }
        
        queryClient.invalidateQueries({ queryKey: ['catechism-failed-paragraphs'] });
        toast.info(`${cachedFailed.length} parágrafos inconsistentes foram colocados para reprocessamento.`);
      }

    } catch (err) {
      console.error('Reconciliation failed:', err);
    }
  }, [user, queryClient]);

  useEffect(() => {
    if (user) {
      // Run once on mount and then every 5 minutes
      reconcile();
      const interval = setInterval(reconcile, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, reconcile]);

  return { reconcile };
};
