import React, { useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { LangContext } from '@/contexts/LangContext';
import { useSaintsToday, useOfficialSaint } from '@/hooks/useSaints';
import RitualDoDia from './RitualDoDia';
import NexusBubbles from './NexusBubbles';
import HomeMainDoors from './HomeMainDoors';
import { useDashboardData } from '@/hooks/useDashboardData';
import SEOHead from '@/components/SEOHead';
import { useQuery } from '@tanstack/react-query';
import { DashboardSkeleton } from './DashboardSkeleton';
import DevDataInspector from './DevDataInspector';
import { ProfileId } from './SpiritualQuiz';

// Home components
import HomeHero from '../home/HomeHero';
import HomeContinuar from '../home/HomeContinuar';
import HomeJornadaAtiva from '../home/HomeJornadaAtiva';
import HomeQuickAccess from '../home/HomeQuickAccess';

const HojePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, userLevel, loading: authLoading, refreshProfile } = useAuth();
  const { lang } = useContext(LangContext);
  const { data: allSaintsToday = [] } = useSaintsToday();
  const { data: officialSaint } = useOfficialSaint();
  
  const { spiritualProfile, nextUp, activeJourneys, isLoading: dataLoading } = useDashboardData(user as any);
  const loadingStats = authLoading || dataLoading;

  const activeJourney = activeJourneys?.[0] || null;
  const hasActiveJourney = activeJourneys && activeJourneys.length > 0;
  
  const { data: recommendedJourney } = useQuery({
    queryKey: ['recommended-journey', user?.id, userLevel],
    queryFn: async () => {
      if (!user?.id || hasActiveJourney) return null;
      const result = profile?._sensitive?.diagnosis_result as Record<string, string> | undefined;
      const { moment, prayer, knowledge } = result || {};
      let category = 'fundamentos';
      if (userLevel === 'iniciante' || moment === 'beginning' || knowledge === 'basic') category = 'fundamentos';
      else if (userLevel === 'avançado' || prayer === 'contemplative') category = 'formacao';
      else if (moment === 'struggling') category = 'mistico';
      
      const { data } = await supabase
        .from('journeys')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !hasActiveJourney,
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    if (user && !profile && !authLoading) {
      refreshProfile();
    }
  }, [user, profile, authLoading, refreshProfile]);

  const dailySections = useMemo(() => [
    { title: 'Ritual do dia', icon: <Icons.Calendar className="w-5 h-5" />, route: `${AppRoute.LITURGIA}?tab=liturgia` },
    { title: 'Temas principais', icon: <span className="text-xl">🫧</span>, route: AppRoute.TEMAS },
    { title: 'Catecismo Interativo', icon: <span className="text-xl">📘</span>, route: AppRoute.CATECHISM },
    { title: 'Trilhas guiadas', icon: <span className="text-xl">🧭</span>, route: AppRoute.JORNADAS },
    { title: 'Logos recomenda', icon: <span className="text-xl">🧠</span>, route: AppRoute.STUDY_MODE },
    { title: 'Favoritos', icon: <span className="text-xl">❤️</span>, route: AppRoute.FAVORITES },
  ], []);

  return (
    <div className="desktop-layout pt-0 md:pt-10 lg:pt-20 pb-24 relative overflow-x-hidden">
      {loadingStats && profile && <DashboardSkeleton />}
      <SEOHead 
        title="Cathedra Digital — Nem toda prisão é visível" 
        description="Explore o Catecismo, a Bíblia e jornadas espirituais para uma vida de liberdade e verdade. A sabedoria da Igreja Católica ao seu alcance." 
        path="/hoje" 
      />
      {import.meta.env.DEV && <DevDataInspector data={{ officialSaint, allSaintsToday, activeJourney, profile: profile?._sensitive }} />}
      
      <div className="desktop-main space-y-20 max-w-2xl mx-auto lg:max-w-none lg:mx-0">
        <HomeHero />

        <HomeContinuar nextUp={nextUp} />

        <RitualDoDia />

        <div className="space-y-16">
          <section className="space-y-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 flex items-center gap-4 px-2">
              <div className="h-px w-10 bg-primary/20" /> Portas da Fé
            </h2>
            <HomeMainDoors t={(k) => k} />
          </section>

          <section className="space-y-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 flex items-center gap-4 px-2">
              <div className="h-px w-10 bg-primary/20" /> Nexus Espiritual
            </h2>
            <div className="p-2">
              <NexusBubbles profileId={spiritualProfile as ProfileId} />
            </div>
          </section>
          
          <HomeJornadaAtiva 
            activeJourney={activeJourney} 
            recommendedJourney={recommendedJourney} 
          />

          <HomeQuickAccess sections={dailySections} />
        </div>
      </div>
    </div>
  );
};

export default HojePage;
