/**
 * Memória espiritual do usuário — não é gamificação, é presença.
 *
 * Consolida contagens simples (leituras, orações, jornadas) e o streak
 * atual/recorde para exibir "Sua caminhada" no Átrio.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SpiritualMemory {
  streakDays: number;
  maxStreak: number;
  readings: number;
  prayers: number;
  journeys: number;
  loading: boolean;
}

const INITIAL: SpiritualMemory = {
  streakDays: 0,
  maxStreak: 0,
  readings: 0,
  prayers: 0,
  journeys: 0,
  loading: true,
};

export function useSpiritualMemory(
  userId: string | null | undefined,
  streakDays: number = 0,
  maxStreak: number = 0
): SpiritualMemory {
  const [state, setState] = useState<SpiritualMemory>(INITIAL);

  useEffect(() => {
    if (!userId) {
      setState({ ...INITIAL, loading: false });
      return;
    }

    let active = true;

    (async () => {
      const [readingsRes, prayersRes, journeysRes] = await Promise.all([
        supabase
          .from('user_notes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        (supabase as any)
          .from('prayer_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('journey_progress')
          .select('journey_id', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);

      if (!active) return;
      setState({
        streakDays,
        maxStreak: Math.max(maxStreak, streakDays),
        readings: readingsRes.count ?? 0,
        prayers: prayersRes.count ?? 0,
        journeys: journeysRes.count ?? 0,
        loading: false,
      });
    })().catch(() => {
      if (active) setState({ ...INITIAL, streakDays, maxStreak, loading: false });
    });

    return () => {
      active = false;
    };
  }, [userId, streakDays, maxStreak]);

  return state;
}
