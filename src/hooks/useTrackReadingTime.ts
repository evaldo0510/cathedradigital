import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook to track reading/study time in minutes.
 * Increments total_minutes_read in the profile every minute of active visibility.
 */
export function useTrackReadingTime(isActive: boolean = true) {
  const { user } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Increment every 60 seconds
    timerRef.current = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_minutes_read')
          .eq('id', user.id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ 
              total_minutes_read: (profile.total_minutes_read || 0) + 1 
            } as any)
            .eq('id', user.id);
        }
      }
    }, 60000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user, isActive]);
}
