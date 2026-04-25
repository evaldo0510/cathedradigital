import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ProfileId } from '@/components/cathedra/SpiritualQuiz';

/**
 * Reusable hook to retrieve the current user's spiritual profile.
 * Used to highlight suggested bubbles across all pages where the
 * Nexus theological bubbles appear.
 */
export const useSpiritualProfile = (): { profileId: ProfileId | null; isLoading: boolean } => {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ['spiritual-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await (supabase as any)
        .from('user_sensitive_data')
        .select('diagnosis_result')
        .eq('user_id', userId)
        .maybeSingle();

      const sp = data?.diagnosis_result?.spiritual_profile;
      if (sp) return sp as ProfileId;

      const spiritualProfileMap: Record<string, string> = {
        beginning: 'sedento_de_sentido',
        deepening: 'firme_aprofundando',
        struggling: 'ferido_em_busca',
        serving: 'ardente_missionario',
      };
      return (spiritualProfileMap[data?.diagnosis_result?.moment] || null) as ProfileId | null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });

  return { profileId: (query.data ?? null) as ProfileId | null, isLoading: query.isLoading };
};
