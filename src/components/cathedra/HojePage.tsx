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
import SpiritualTrailCard from './SpiritualTrailCard';
import { HomeCard as Card } from './HomeCard';
import { Button } from './Button';
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

  const openLogosChat = () => {
    const chatBtn = document.querySelector('button[aria-label*="Logos"]') as HTMLButtonElement;
    if (chatBtn) chatBtn.click();
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-background pb-32">
      <SEOHead title="Home - Cathedra" description="Seu portal de espiritualidade católica guiado." path="/hoje" />
      
      {/* 1. HERO PRINCIPAL */}
      <section className="w-full min-h-[70vh] flex flex-col items-center justify-center text-center px-6 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-12 max-w-4xl"
        >
          <div className="space-y-6">
            <p className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-primary/30">
              {greeting}, {profile?.name?.split(' ')[0] || 'fiel'}
            </p>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display text-primary leading-tight tracking-tight">
              A beleza <br />
              <span className="text-secondary italic font-serif">salvará o mundo.</span>
            </h1>
          </div>
          
          <div className="flex items-center justify-center gap-6">
             {(profile?.streak || 0) > 0 && (
              <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-primary/[0.03] border border-primary/5">
                <Icons.Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{profile?.streak} {profile?.streak === 1 ? 'Dia' : 'Dias'}</span>
              </div>
            )}
            <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-primary/[0.03] border border-primary/5">
              <Icons.Star className="w-3.5 h-3.5 text-secondary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">{profile?.xp || 0} XP</span>
            </div>
          </div>
        </motion.div>
      </section>

      <div className="app-container max-w-3xl space-y-32">
        {/* 2. CONTINUAR JORNADA */}
        {nextUp && (
          <section className="space-y-10">
            <SectionHeader label="Continuar Jornada" />
            <Card 
              variant="interactive"
              padding="none"
              onClick={() => navigate(nextUp.route)}
              className="group border-primary/5 bg-primary/[0.01] p-6 sm:p-8"
            >
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                  <div className="w-14 h-14 rounded-premium-sm bg-primary/[0.02] border border-primary/5 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform duration-700">
                    <Icons.Flame className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/30 mb-2">{nextUp.subtitle}</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">{nextUp.label}</h3>
                  </div>
                </div>
                <Icons.ChevronRight className="w-6 h-6 text-primary/10 group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </section>
        )}

        {/* 3. RITUAL DO DIA */}
        <section className="space-y-10">
          <SectionHeader label="Ritual do Dia" />
          <RitualDoDia />
        </section>

        {/* 4. TRILHAS PRINCIPAIS */}
        <section className="space-y-10">
          <SectionHeader label="Trilhas Principais" />
          <SpiritualTrailCard />
        </section>

        {/* 5. CATECISMO */}
        <section className="space-y-10">
          <SectionHeader label="Catecismo" />
          <Card 
            variant="interactive"
            padding="lg"
            onClick={() => navigate(AppRoute.CATECHISM)}
            className="group border-primary/5 bg-primary/[0.01]"
          >
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="w-14 h-14 rounded-premium-sm bg-primary/[0.02] border border-primary/5 flex items-center justify-center text-secondary group-hover:rotate-12 transition-transform duration-700">
                  <Icons.Catechism className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary tracking-tight">Doutrina da Igreja</h3>
                  <p className="text-sm text-primary/40 mt-1">Explore a sabedoria milenar da Tradição Viva.</p>
                </div>
              </div>
              <Icons.ChevronRight className="w-6 h-6 text-primary/10 group-hover:translate-x-1 transition-all" />
            </div>
          </Card>
        </section>

        {/* 6. LOGOS IA */}
        <section className="space-y-10">
          <SectionHeader label="Logos IA" />
          <Card 
            variant="interactive"
            padding="lg"
            onClick={openLogosChat}
            className="group border-primary/5 bg-primary/[0.01]"
          >
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="w-14 h-14 rounded-full bg-primary/[0.02] border border-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-700">
                  <Icons.Compass className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary tracking-tight">Mestre Contemplativo</h3>
                  <p className="text-sm text-primary/40 mt-1">Diálogos teológicos para iluminar sua caminhada.</p>
                </div>
              </div>
              <Icons.Sparkles className="w-5 h-5 text-primary/10 group-hover:text-primary/30 transition-all" />
            </div>
          </Card>
        </section>

        {/* FOOTER QUOTE */}
        <div className="pt-32 text-center opacity-10">
          <p className="text-[10px] font-serif italic max-w-sm mx-auto leading-relaxed tracking-[0.2em] uppercase">
            {todayQuote}
          </p>
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ label }: { label: string }) => (
  <div className="flex items-center gap-6">
    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/20 whitespace-nowrap">
      {label}
    </h2>
    <div className="h-px flex-1 bg-primary/5" />
  </div>
);

export default HojePage;
