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
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    <div className="flex flex-col items-center w-full min-h-screen bg-background section-spacing">
      <SEOHead title="Hoje - Sua Jornada Espiritual" description="Acompanhe sua caminhada de fé diária." path="/hoje" />
      {import.meta.env.DEV && <DevDataInspector data={{ officialSaint, allSaintsToday, activeJourney, profile: profile?._sensitive }} />}
      
      <div className="app-container stack-spacing">
        {/* HERO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center space-y-20 max-w-6xl mx-auto py-12"
        >
          <div className="space-y-10">
            <div className="premium-tag mx-auto">
              <Icons.Logo className="w-4 h-4 text-secondary" />
              <span>{greeting}, {profile?.name?.split(' ')[0] || 'fiel'}</span>
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-medium text-primary leading-[1] tracking-tighter">
              Aquietai-vos e <br />
              <span className="text-secondary italic font-serif opacity-80">Sabei que Eu Sou Deus.</span>
            </h1>
          </div>
          
          <div className="flex items-center justify-center gap-12 flex-wrap">
             {(profile?.streak || 0) > 0 && (
              <div className="flex items-center gap-4 px-10 py-5 rounded-full bg-primary/[0.02] border border-primary/10 transition-all hover:bg-primary/[0.04] shadow-soft group">
                <Icons.Zap className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-premium-tiny font-bold text-primary uppercase tracking-[0.3em]">{profile?.streak} {profile?.streak === 1 ? 'Dia' : 'Dias'}</span>
              </div>
            )}
            <div className="flex items-center gap-4 px-10 py-5 rounded-full bg-primary/[0.02] border border-primary/10 transition-all hover:bg-primary/[0.04] shadow-soft group">
              <Icons.Star className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />
              <span className="text-premium-tiny font-bold text-primary uppercase tracking-[0.3em]">{profile?.xp || 0} XP</span>
            </div>
          </div>
        </motion.div>

        <div className="desktop-layout">
          <div className="desktop-main stack-spacing">
            {/* CONTINUE JORNADA */}
            {nextUp && (
              <section className="space-y-12">
                <div className="flex items-center gap-8">
                  <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
                    Memória da Jornada
                  </h2>
                  <div className="h-px flex-1 bg-border/30" />
                </div>
                
                <Card 
                  variant="interactive"
                  padding="lg"
                  onClick={() => navigate(nextUp.route)}
                  className="flex flex-col md:flex-row items-center justify-between gap-12 group"
                >
                  <div className="flex items-center gap-10 flex-col md:flex-row text-center md:text-left">
                    <div className="w-24 h-24 rounded-premium-sm bg-primary/[0.02] border border-border/40 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform duration-700">
                      <Icons.Flame className="w-12 h-12" />
                    </div>
                    <div>
                      <p className="text-premium-tiny font-bold uppercase tracking-widest text-primary/30 mb-4">{nextUp.subtitle}</p>
                      <h3 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">{nextUp.label}</h3>
                      {activeJourney && (
                        <div className="mt-8 flex items-center gap-6 w-full md:w-80">
                          <div className="flex-1 h-2 bg-primary/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${journeyProgress.total > 0 ? (journeyProgress.completed / journeyProgress.total) * 100 : 0}%` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className="h-full bg-secondary shadow-[0_0_10px_rgba(212,175,55,0.3)]" 
                            />
                          </div>
                          <span className="text-premium-tiny font-bold text-primary/50 tabular-nums tracking-widest">{journeyProgress.completed}/{journeyProgress.total}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-full border border-border/40 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all shadow-soft">
                    <Icons.ChevronRight className="w-7 h-7" />
                  </div>
                </Card>
              </section>
            )}

            {/* RITUAL DO DIA */}
            <section className="space-y-12">
              <div className="flex items-center gap-8">
                <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
                  Ritual do Dia
                </h2>
                <div className="h-px flex-1 bg-border/30" />
              </div>
              <RitualDoDia />
            </section>
          </div>

          <aside className="desktop-aside stack-spacing">
            {/* TEMAS PRINCIPAIS */}
            <section className="space-y-12">
              <div className="flex items-center gap-8">
                <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
                  Explorar
                </h2>
                <div className="h-px flex-1 bg-border/30" />
              </div>
              <div className="grid grid-cols-1 gap-8">
                <HomeMainDoors t={t} className="grid-cols-1 md:grid-cols-1" />
              </div>
            </section>

            {/* CATECISMO CARD */}
            <section className="space-y-12">
              <div className="flex items-center gap-8">
                <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
                  Doutrina
                </h2>
                <div className="h-px flex-1 bg-border/30" />
              </div>
              <Card 
                variant="interactive"
                padding="lg"
                onClick={() => navigate(AppRoute.CATECHISM)}
                className="text-center space-y-8"
              >
                <div className="w-20 h-20 rounded-premium-sm bg-primary/[0.02] border border-border/40 flex items-center justify-center text-secondary mx-auto group-hover:rotate-12 transition-transform duration-700">
                  <Icons.Catechism className="w-10 h-10" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-primary tracking-tight">Catecismo</h3>
                  <p className="text-sm text-primary/40 leading-relaxed max-w-[200px] mx-auto font-serif italic">A sabedoria milenar da Igreja em suas mãos.</p>
                </div>
              </Card>
            </section>
          </aside>
        </div>

        {/* FOOTER QUOTE */}
        <div className="pt-32 text-center opacity-20 hover:opacity-40 transition-opacity duration-1000">
          <p className="text-premium-base text-primary font-serif italic max-w-sm mx-auto leading-relaxed">
            {todayQuote}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HojePage;
