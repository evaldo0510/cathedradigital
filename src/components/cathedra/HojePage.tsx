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
    <div className="flex flex-col items-center w-full min-h-screen bg-[#F8F5EE] pt-6 md:pt-16 pb-32">
      <SEOHead title="Hoje - Sua Jornada Espiritual" description="Acompanhe sua caminhada de fé diária." path="/hoje" />
      {import.meta.env.DEV && <DevDataInspector data={{ officialSaint, allSaintsToday, activeJourney, profile: profile?._sensitive }} />}
      
      <div className="w-full max-w-[640px] px-6 space-y-20">
        {/* HERO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center space-y-8"
        >
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0F172A]/40">
              {greeting}, {profile?.name?.split(' ')[0] || 'fiel'}
            </p>
            <h1 className="text-4xl md:text-5xl font-serif text-[#0F172A] leading-tight">
              Sua jornada espiritual <br />
              <span className="text-[#D4AF37] italic">guiada pela Sabedoria.</span>
            </h1>
          </div>
          
          <div className="flex items-center justify-center gap-4 flex-wrap">
             {(profile?.streak || 0) > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F172A]/5 border border-[#0F172A]/10">
                <Icons.Zap className="w-4 h-4 text-[#0F172A]" />
                <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">{profile?.streak} {profile?.streak === 1 ? 'Dia' : 'Dias'}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F172A]/5 border border-[#0F172A]/10">
              <Icons.Star className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">{profile?.xp || 0} XP</span>
            </div>
          </div>
        </motion.div>

        {/* CONTINUE JORNADA */}
        {nextUp && (
          <section className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0F172A]/30 flex items-center gap-4">
              <div className="h-px w-8 bg-[#0F172A]/10" /> Continue sua Jornada
            </h2>
            
            <motion.div 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(nextUp.route)}
              className="p-8 rounded-[2rem] border border-[#0F172A]/5 bg-white cursor-pointer hover:border-[#D4AF37]/30 transition-all flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[#0F172A]/5 flex items-center justify-center text-[#D4AF37]">
                  <Icons.Flame className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F172A]/40 mb-1.5">{nextUp.subtitle}</p>
                  <h3 className="text-xl font-bold text-[#0F172A]">{nextUp.label}</h3>
                  {activeJourney && (
                    <div className="mt-4 flex items-center gap-4 w-48">
                      <div className="flex-1 h-1 bg-[#0F172A]/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#D4AF37] transition-all duration-1000" style={{ width: `${journeyProgress.total > 0 ? (journeyProgress.completed / journeyProgress.total) * 100 : 0}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-[#0F172A]/60 tabular-nums">{journeyProgress.completed}/{journeyProgress.total}</span>
                    </div>
                  )}
                </div>
              </div>
              <Icons.ChevronRight className="w-6 h-6 text-[#0F172A]/20" />
            </motion.div>
          </section>
        )}

        {/* RITUAL DO DIA */}
        <section className="space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0F172A]/30 flex items-center gap-4">
            <div className="h-px w-8 bg-[#0F172A]/10" /> Ritual do Dia
          </h2>
          <RitualDoDia />
        </section>

        {/* TEMAS PRINCIPAIS */}
        <section className="space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0F172A]/30 flex items-center gap-4">
            <div className="h-px w-8 bg-[#0F172A]/10" /> Temas Principais
          </h2>
          <HomeMainDoors t={t} />
        </section>

        {/* CATECISMO */}
        <section className="space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0F172A]/30 flex items-center gap-4">
            <div className="h-px w-8 bg-[#0F172A]/10" /> Catecismo
          </h2>
          <motion.div 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate(AppRoute.CATECHISM)}
            className="p-10 rounded-[2.5rem] border border-[#0F172A]/5 bg-white cursor-pointer hover:border-[#D4AF37]/30 transition-all group shadow-sm"
          >
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 rounded-3xl bg-[#0F172A]/5 flex items-center justify-center text-[#D4AF37] group-hover:bg-[#0F172A]/10 transition-colors">
                <Icons.Catechism className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-[#0F172A]">Catecismo da Igreja</h3>
                <p className="text-base text-[#0F172A]/60 mt-2">Explore a doutrina católica em profundidade e clareza.</p>
              </div>
              <Icons.ChevronRight className="w-8 h-8 text-[#0F172A]/20" />
            </div>
          </motion.div>
        </section>

        {/* TRILHAS */}
        <section className="space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0F172A]/30 flex items-center gap-4">
            <div className="h-px w-8 bg-[#0F172A]/10" /> Trilhas de Formação
          </h2>
          <motion.div 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate(AppRoute.JORNADAS)} 
            className="p-8 rounded-[2rem] border border-[#0F172A]/5 bg-white hover:border-[#D4AF37]/30 transition-all flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-[#0F172A]/5 flex items-center justify-center text-[#D4AF37] group-hover:bg-[#0F172A]/10 transition-colors">
                <Icons.Route className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#0F172A]">Explorar todas as Trilhas</h3>
                <p className="text-sm text-[#0F172A]/60 mt-1">Descubra novos caminhos para sua vida espiritual.</p>
              </div>
            </div>
            <Icons.ChevronRight className="w-6 h-6 text-[#0F172A]/20" />
          </motion.div>
        </section>

        {/* FOOTER QUOTE */}
        <div className="pt-20 text-center">
          <p className="text-sm text-[#0F172A]/40 font-serif italic max-w-sm mx-auto leading-relaxed">
            {todayQuote}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HojePage;
