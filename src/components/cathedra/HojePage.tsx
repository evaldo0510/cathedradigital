import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { LangContext } from '@/contexts/LangContext';
import { useSaintsToday, useOfficialSaint } from '@/hooks/useSaints';
import RitualDoDia from './RitualDoDia';
import HomeMainDoors from './HomeMainDoors';
import { useDashboardData } from '@/hooks/useDashboardData';
import SEOHead from '@/components/SEOHead';
import { useQuery } from '@tanstack/react-query';
import { DashboardSkeleton } from './DashboardSkeleton';
import DevDataInspector from './DevDataInspector';

const LITURGICAL_QUOTES = [
  '"Sede misericordiosos como vosso Pai é misericordioso." — Lc 6,36',
  '"Eu sou o caminho, a verdade e a vida." — Jo 14,6',
  '"Vinde a mim todos vós que estais cansados." — Mt 11,28',
  '"Não tenhais medo, eu venci o mundo." — Jo 16,33',
  '"Amai-vos uns aos outros como eu vos amei." — Jo 15,12',
];

function useActiveJourney(userId: string | undefined) {
  return useQuery({
    queryKey: ['active-journey', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data: progress } = await supabase
        .from('journey_progress')
        .select('journey_id')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(1);
      if (!progress?.length) return null;
      const lastJourneyId = progress[0].journey_id;
      const [journeyRes, completedRes, stepsRes] = await Promise.all([
        supabase.from('journeys').select('*').eq('id', lastJourneyId).maybeSingle(),
        supabase.from('journey_progress').select('step_id').eq('user_id', userId).eq('journey_id', lastJourneyId),
        supabase.from('journey_steps').select('id, step_order, title, subtitle, content').eq('journey_id', lastJourneyId).order('step_order', { ascending: true }),
      ]);
      if (!journeyRes.data) return null;
      const completedIds = (completedRes.data || []).map(s => s.step_id);
      const allSteps = stepsRes.data || [];
      const nextStep = allSteps.find(s => !completedIds.includes(s.id)) || null;
      return {
        journey: journeyRes.data,
        progress: { completed: completedIds.length, total: allSteps.length },
        nextStep,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

function useRecommendedJourney(userId: string | undefined, profile: any, userLevel: string | undefined, hasActiveJourney: boolean) {
  return useQuery({
    queryKey: ['recommended-journey', userId, userLevel],
    queryFn: async () => {
      if (!userId) return null;
      const result = profile?._sensitive?.diagnosis_result as Record<string, string> | undefined;
      const { moment, prayer, knowledge, goal } = result || {};
      let category = 'fundamentos';
      if (userLevel === 'iniciante' || moment === 'beginning' || knowledge === 'basic') category = 'fundamentos';
      else if (userLevel === 'avançado' || prayer === 'contemplative' || goal === 'transformation') category = 'formacao';
      else if (moment === 'struggling' || goal === 'peace') category = 'mistico';
      else if (goal === 'routine' || prayer === 'rarely' || prayer === 'sometimes') category = 'rotina';
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
    enabled: !!userId && !hasActiveJourney,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
}

const HojePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, userLevel } = useAuth();
  const { t, lang } = useContext(LangContext);
  const [todayQuote] = useState(() => LITURGICAL_QUOTES[new Date().getDate() % LITURGICAL_QUOTES.length]);

  const { data: allSaintsToday = [], isLoading: loadingSaints } = useSaintsToday();
  const { data: officialSaint } = useOfficialSaint();
  
  const { isLoading: loadingStats } = useDashboardData(user as any);

  const { data: activeJourneyData, isLoading: loadingJourney } = useActiveJourney(user?.id);
  const activeJourney = activeJourneyData?.journey || null;
  const journeyStep = activeJourneyData?.nextStep || null;
  const journeyProgress = activeJourneyData?.progress || { completed: 0, total: 0 };
  
  const { data: recommendedJourney } = useRecommendedJourney(user?.id, profile, userLevel, !!activeJourney);

  const hour = new Date().getHours();
  const greeting = useMemo(() => {
    if (hour < 12) return lang === 'pt' ? 'Bom dia' : 'Good morning';
    if (hour < 18) return lang === 'pt' ? 'Boa tarde' : 'Good afternoon';
    return lang === 'pt' ? 'Boa noite' : 'Good evening';
  }, [hour, lang]);

  const nextUp = useMemo(() => {
    // Simplified nextUp logic for clean UI
    if (activeJourney) return {
      type: 'journey',
      label: activeJourney.title,
      subtitle: 'Continuar Jornada',
      route: journeyStep ? `/jornadas/${activeJourney.id}/step?step=${journeyStep.id}` : `/jornadas/${activeJourney.id}/complete`
    };
    return null;
  }, [activeJourney, journeyStep]);

  if (loadingStats || loadingJourney) return <DashboardSkeleton />;

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-background pt-12 md:pt-24 pb-48">
      <SEOHead title="Hoje - Sua Jornada Espiritual" description="Acompanhe sua caminhada de fé diária." path="/hoje" />
      {import.meta.env.DEV && <DevDataInspector data={{ officialSaint, allSaintsToday, activeJourney, profile: profile?._sensitive }} />}
      
      <div className="app-container space-y-24 md:space-y-40 lg:space-y-56">
        {/* HERO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center space-y-12 max-w-4xl mx-auto"
        >
          <div className="space-y-6">
            <p className="text-premium-tiny font-black uppercase tracking-[0.5em] text-primary/40">
              {greeting}, {profile?.name?.split(' ')[0] || 'fiel'}
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-primary leading-[1.1]">
              Sua jornada espiritual <br />
              <span className="text-secondary italic font-serif">guiada pela Sabedoria.</span>
            </h1>
          </div>
          
          <div className="flex items-center justify-center gap-6 flex-wrap">
             {(profile?.streak || 0) > 0 && (
              <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-primary/[0.03] border border-primary/10">
                <Icons.Zap className="w-4 h-4 text-primary" />
                <span className="text-premium-tiny font-bold text-primary uppercase tracking-widest">{profile?.streak} {profile?.streak === 1 ? 'Dia' : 'Dias'}</span>
              </div>
            )}
            <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-primary/[0.03] border border-primary/10">
              <Icons.Star className="w-4 h-4 text-secondary" />
              <span className="text-premium-tiny font-bold text-primary uppercase tracking-widest">{profile?.xp || 0} XP</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-8 space-y-24 md:space-y-40">
            {/* CONTINUE JORNADA */}
            {nextUp && (
              <section className="space-y-10">
                <div className="flex items-center gap-6">
                  <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-primary/30 whitespace-nowrap">
                    Memória da Jornada
                  </h2>
                  <div className="h-px flex-1 bg-border/40" />
                </div>
                
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(nextUp.route)}
                  className="p-10 md:p-14 rounded-premium border border-border/40 bg-card cursor-pointer hover:shadow-premium-hover hover:border-secondary/30 transition-all flex flex-col md:flex-row items-center justify-between gap-10 shadow-premium group"
                >
                  <div className="flex items-center gap-8 flex-col md:flex-row text-center md:text-left">
                    <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform duration-700">
                      <Icons.Flame className="w-10 h-10" />
                    </div>
                    <div>
                      <p className="text-premium-tiny font-bold uppercase tracking-widest text-primary/40 mb-3">{nextUp.subtitle}</p>
                      <h3 className="text-2xl md:text-3xl font-bold text-primary">{nextUp.label}</h3>
                      {activeJourney && (
                        <div className="mt-6 flex items-center gap-4 w-full md:w-64">
                          <div className="flex-1 h-1.5 bg-primary/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${journeyProgress.total > 0 ? (journeyProgress.completed / journeyProgress.total) * 100 : 0}%` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className="h-full bg-secondary" 
                            />
                          </div>
                          <span className="text-premium-tiny font-bold text-primary/60 tabular-nums">{journeyProgress.completed}/{journeyProgress.total}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-border/30 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Icons.ChevronRight className="w-6 h-6" />
                  </div>
                </motion.div>
              </section>
            )}

            {/* RITUAL DO DIA */}
            <section className="space-y-10">
              <div className="flex items-center gap-6">
                <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-primary/30 whitespace-nowrap">
                  Ritual do Dia
                </h2>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <RitualDoDia />
            </section>
          </div>

          {/* SIDEBAR CONTENT - For Desktop Refinement */}
          <aside className="lg:col-span-4 space-y-24">
            {/* TEMAS PRINCIPAIS */}
            <section className="space-y-10">
              <div className="flex items-center gap-6">
                <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-primary/30 whitespace-nowrap">
                  Explorar
                </h2>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="grid grid-cols-1 gap-6">
                <HomeMainDoors t={t} variant="sidebar" />
              </div>
            </section>

            {/* CATECISMO CARD */}
            <section className="space-y-10">
              <div className="flex items-center gap-6">
                <h2 className="text-premium-tiny font-black uppercase tracking-[0.4em] text-primary/30 whitespace-nowrap">
                  Doutrina
                </h2>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <motion.div 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(AppRoute.CATECHISM)}
                className="p-10 rounded-premium border border-border/40 bg-card cursor-pointer hover:shadow-premium-hover hover:border-primary/20 transition-all shadow-premium group text-center space-y-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-secondary mx-auto group-hover:rotate-12 transition-transform duration-700">
                  <Icons.Catechism className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-primary">Catecismo</h3>
                  <p className="text-sm text-primary/50 leading-relaxed">A sabedoria milenar da Igreja em suas mãos.</p>
                </div>
              </motion.div>
            </section>
          </aside>
        </div>

        {/* FOOTER QUOTE */}
        <div className="pt-32 text-center opacity-20 hover:opacity-40 transition-opacity duration-1000">
          <p className="text-base text-primary font-serif italic max-w-sm mx-auto leading-relaxed">
            {todayQuote}
          </p>
        </div>
      </div>
    </div>
  );
};
};

export default HojePage;
