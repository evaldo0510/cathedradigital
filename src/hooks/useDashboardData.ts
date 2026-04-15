import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSaintsByDate } from '@/services/saintsService';
import { User } from '@/types';
import { ProfileId } from '@/components/cathedra/SpiritualQuiz';

export const useDashboardData = (user: User | null) => {
  const userId = user?.id;

  // Spiritual Profile
  const spiritualProfileQuery = useQuery({
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
        serving: 'ardente_missionario'
      };
      return (spiritualProfileMap[data?.diagnosis_result?.moment] || null) as ProfileId | null;
    },
    enabled: !!userId,
  });

  // Active Journeys
  const activeJourneysQuery = useQuery({
    queryKey: ['active-journeys', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: progress } = await supabase.from('journey_progress').select('journey_id, step_id').eq('user_id', userId);
      if (!progress?.length) return [];
      
      const journeyIds = [...new Set(progress.map(p => p.journey_id))];
      const { data: journeys } = await supabase.from('journeys').select('id, title, icon').in('id', journeyIds);
      if (!journeys) return [];
      
      const { data: steps } = await supabase.from('journey_steps').select('id, journey_id').in('journey_id', journeyIds);
      const stepsByJourney: Record<string, number> = {};
      steps?.forEach(s => { stepsByJourney[s.journey_id] = (stepsByJourney[s.journey_id] || 0) + 1; });
      
      const completedByJourney: Record<string, number> = {};
      progress.forEach(p => { completedByJourney[p.journey_id] = (completedByJourney[p.journey_id] || 0) + 1; });
      
      return journeys.map(j => ({
        id: j.id, title: j.title, icon: j.icon,
        totalSteps: stepsByJourney[j.id] || 0,
        completedSteps: completedByJourney[j.id] || 0,
      }));
    },
    enabled: !!userId,
  });

  // Saints of the Day
  const saintsTodayQuery = useQuery({
    queryKey: ['saints-today'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('saint-of-the-day');
        if (data && !error) {
          return [data];
        }
      } catch (e) {
        console.error('Error fetching saint of the day:', e);
      }
      
      const today = new Date();
      const matched = ALL_SAINTS.filter(s => s.feastMonth === today.getMonth() + 1 && s.feastDayNum === today.getDate());
      return matched.length > 0 ? matched : [ALL_SAINTS[0]];
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  // Next Up
  const nextUpQuery = useQuery({
    queryKey: ['next-up', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const [lastBible, lastCatechism, lastJourney] = await Promise.all([
        (supabase as any).from('bible_chapters_read').select('book_abbr, chapter').eq('user_id', userId).order('read_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('catechism_paragraphs_read').select('paragraph').eq('user_id', userId).order('read_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('journey_progress').select('journey_id, step_id').eq('user_id', userId).order('completed_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (lastJourney.data) {
        const { data: steps } = await supabase.from('journey_steps').select('id, title').eq('journey_id', lastJourney.data.journey_id).order('step_order', { ascending: true });
        const currentIndex = steps?.findIndex(s => s.id === lastJourney.data.step_id) ?? -1;
        if (steps && currentIndex !== -1 && currentIndex < steps.length - 1) {
          const next = steps[currentIndex + 1];
          return { type: 'journey', label: next.title, route: `/jornadas/${lastJourney.data.journey_id}/step?step=${next.id}`, subtitle: 'Próxima Etapa da Jornada' };
        }
      }

      if (lastBible.data) {
        return { type: 'bible', label: `${lastBible.data.book_abbr} ${lastBible.data.chapter + 1}`, route: `/bible?book=${lastBible.data.book_abbr}&ch=${lastBible.data.chapter + 1}`, subtitle: 'Continuar Leitura da Bíblia', lastBible: lastBible.data };
      }

      if (lastCatechism.data) {
        return { type: 'catechism', label: `§${lastCatechism.data.paragraph + 1}`, route: `/catechism?p=${lastCatechism.data.paragraph + 1}`, subtitle: 'Continuar Estudo do Catecismo' };
      }

      return null;
    },
    enabled: !!userId,
  });

  // Weekly Stats
  const weeklyStatsQuery = useQuery({
    queryKey: ['weekly-stats', userId],
    queryFn: async () => {
      if (!userId) return { chaptersRead: 0, journeySteps: 0, catechismParagraphs: 0 };
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const iso = weekAgo.toISOString();

      const [chapRes, jpRes, catRes] = await Promise.all([
        supabase.from('bible_chapters_read').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('read_at', iso),
        supabase.from('journey_progress').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('completed_at', iso),
        supabase.from('catechism_paragraphs_read').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('read_at', iso),
      ]);

      return {
        chaptersRead: chapRes.count || 0,
        journeySteps: jpRes.count || 0,
        catechismParagraphs: catRes.count || 0,
      };
    },
    enabled: !!userId,
  });

  return {
    spiritualProfile: spiritualProfileQuery.data,
    activeJourneys: activeJourneysQuery.data || [],
    saintsToday: saintsTodayQuery.data || [],
    nextUp: nextUpQuery.data,
    weeklyStats: weeklyStatsQuery.data || { chaptersRead: 0, journeySteps: 0, catechismParagraphs: 0 },
    isLoading: spiritualProfileQuery.isLoading || activeJourneysQuery.isLoading || saintsTodayQuery.isLoading || nextUpQuery.isLoading || weeklyStatsQuery.isLoading,
  };
};
