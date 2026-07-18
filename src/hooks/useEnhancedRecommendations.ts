import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useEnhancedRecommendations() {
  const { user, profile, userLevel } = useAuth();

  return useQuery({
    queryKey: ['enhanced-recommendations', user?.id, userLevel],
    queryFn: async () => {
      if (!user) return {
        type: 'ritual',
        title: 'Ritual do Dia',
        subtitle: 'Prática Espiritual',
        description: 'Mantenha sua constância diária no caminho de santidade.',
        route: '/hoje',
      };

      // 1. Fetch reading marks (recent activity)
      const { data: marks } = await supabase
        .from('reading_marks')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(3);

      // 2. Fetch journal entries (emotional state/topics)
      const { data: journal } = await supabase
        .from('spiritual_journal')
        .select('mood, content')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(1);

      // 3. Fetch active journey progress
      const { data: activeJourney } = await supabase
        .from('journey_progress')
        .select('journey_id, step_id')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1);

      // Simple recommendation engine logic:
      // Priority 1: Continue Journey
      if (activeJourney?.[0]) {
        const { data: journey } = await supabase
          .from('journeys')
          .select('*')
          .eq('id', activeJourney[0].journey_id)
          .single();
        
        if (journey) {
          const { data: nextStep } = await supabase
            .from('journey_steps')
            .select('*')
            .eq('journey_id', journey.id)
            .order('step_order', { ascending: true })
            .gt('step_order', 0) // This is simplified
            .limit(1); // Real logic would find the actual NEXT step

          return {
            type: 'journey',
            title: journey.title,
            subtitle: 'Continuar sua caminhada',
            description: `Você está progredindo bem. Próximo passo: ${nextStep?.[0]?.title || 'Finalizar'}`,
            route: `/jornadas/${journey.id}/step`,
            metadata: { journey, nextStep: nextStep?.[0] }
          };
        }
      }

      // Priority 2: Based on mood/journal
      if (journal?.[0]?.mood === 'struggle') {
        return {
          type: 'bible',
          title: 'Salmo de Confiança',
          subtitle: 'Conforto na tribulação',
          description: 'Leia o Salmo 23 e encontre descanso no Bom Pastor.',
          route: '/bible?book=Salmos&ch=23',
        };
      }

      // Priority 3: Based on level/profile
      const diagnosis = profile?._sensitive?.diagnosis_result as any;
      if (diagnosis?.goal === 'knowledge' || userLevel === 'iniciante') {
        return {
          type: 'catechism',
          title: 'Fundamentos da Fé',
          subtitle: 'O Símbolo dos Apóstolos',
          description: 'Aprofunde-se no que cremos através do Catecismo.',
          route: '/catechism?p=1',
        };
      }

      // Default
      return {
        type: 'ritual',
        title: 'Ritual do Dia',
        subtitle: 'Prática Espiritual',
        description: 'Mantenha sua constância diária no caminho de santidade.',
        route: '/hoje',
      };
    },
    enabled: true,
    staleTime: 1000 * 60 * 15,
  });
}