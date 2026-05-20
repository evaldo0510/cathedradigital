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
import { useEnhancedRecommendations } from '@/hooks/useEnhancedRecommendations';

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
  const { data: enhancedRec, isLoading: loadingRec } = useEnhancedRecommendations();

  const hour = new Date().getHours();
  const greeting = useMemo(() => {
    if (hour < 12) return lang === 'pt' ? 'Bom dia' : 'Good morning';
    if (hour < 18) return lang === 'pt' ? 'Boa tarde' : 'Good afternoon';
    return lang === 'pt' ? 'Boa noite' : 'Good evening';
  }, [hour, lang]);

  const nextUp = useMemo(() => {
    if (enhancedRec) return enhancedRec;
    
    if (activeJourney) return {
      type: 'journey',
      title: activeJourney.title,
      subtitle: 'Continuar Jornada',
      route: journeyStep ? `/jornadas/${activeJourney.id}/step?step=${journeyStep.id}` : `/jornadas/${activeJourney.id}/complete`
    };
    return null;
  }, [enhancedRec, activeJourney, journeyStep]);

  if (loadingStats || loadingJourney || loadingRec) return <DashboardSkeleton />;

  return (
    <div className="flex flex-col items-center w-full min-h-screen pt-24 md:pt-40 pb-64 monastic-sanctuary">
      <SEOHead 
        title={`Sanctuarium - ${new Date().toLocaleDateString('pt-BR')} | Cathedra`} 
        description="Refúgio digital contemplativo guiado pela Fé. Liturgia, Ritual e Sabedoria em silêncio visual." 
        path="/hoje" 
        image="https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-hoje.png"
        keywords="mosteiro digital, ritual diário, cathedra digital, silêncio espiritual, contemplação"
        breadcrumbs={[
          { name: "Sanctuarium", path: "/hoje" }
        ]}
      />
      {import.meta.env.DEV && <DevDataInspector data={{ officialSaint, allSaintsToday, activeJourney, profile: profile?._sensitive }} />}
      
      <div className="app-container stack-spacing">
        {/* HERO SECTION - MONASTIC WELCOME */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 2.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="text-center space-y-24 max-w-6xl mx-auto"
        >
          <div className="space-y-12">
            <div className="flex flex-col items-center gap-6">
              <div className="w-px h-16 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
              <p className="text-[10px] font-black uppercase tracking-[0.8em] text-primary/20">
                {greeting}, {profile?.name?.split(' ')[0] || 'Anima Fidelis'}
              </p>
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-display text-primary leading-[0.9] tracking-tighter filter blur-[0.3px]">
              Silêncio <br />
              <span className="text-secondary/60 italic font-serif">da Alma.</span>
            </h1>
          </div>
          
          <div className="flex items-center justify-center gap-10 flex-wrap opacity-40 hover:opacity-100 transition-opacity duration-1000">
             {(profile?.streak || 0) > 0 && (
              <div className="flex items-center gap-4 px-10 py-4 rounded-full bg-primary/[0.01] border border-primary/5 transition-all hover:bg-primary/[0.03]">
                <Icons.Zap className="w-3.5 h-3.5 text-primary/40" />
                <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.3em]">{profile?.streak} {profile?.streak === 1 ? 'Dies' : 'Dies'}</span>
              </div>
            )}
            <div className="flex items-center gap-4 px-10 py-4 rounded-full bg-primary/[0.01] border border-primary/5 transition-all hover:bg-primary/[0.03]">
              <Icons.Star className="w-3.5 h-3.5 text-secondary/40" />
              <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.3em]">{profile?.xp || 0} XP</span>
            </div>
          </div>
        </motion.div>

        {/* PRÓXIMO PASSO - RECOMENDAÇÃO DINÂMICA */}
        {nextUp && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto w-full"
          >
            <div 
              onClick={() => navigate(nextUp.route)}
              className="p-12 md:p-16 rounded-[4rem] border border-primary/5 bg-primary/[0.01] hover:bg-primary/[0.02] transition-all duration-1000 cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-16 opacity-[0.01] group-hover:opacity-[0.03] transition-opacity duration-1000">
                <Icons.Sparkles className="w-48 h-48 text-primary" />
              </div>
              
              <div className="space-y-10 relative z-10 text-center">
                <div className="flex flex-col items-center gap-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.5em] text-primary/20">
                    VIA SAPIENTIAE
                  </span>
                  <div className="w-px h-8 bg-primary/10" />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-4xl md:text-5xl lg:text-6xl font-display text-primary leading-tight">{nextUp.title}</h3>
                  <p className="text-xl text-primary/40 font-serif italic">{nextUp.subtitle}</p>
                </div>
                
                {nextUp && 'description' in nextUp && (
                  <p className="text-base leading-relaxed text-muted-foreground/60 max-w-2xl mx-auto font-serif italic">
                    {(nextUp as any).description}
                  </p>
                )}
                
                <div className="pt-8 flex flex-col items-center gap-4 text-primary/30 font-black uppercase tracking-[0.4em] text-[9px] group-hover:text-primary transition-colors duration-1000">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary animate-pulse" />
                  <span>Proseguir</span>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          <div className="lg:col-span-8 stack-spacing">
            {/* NÚCLEO SAGRADO - PORTAS PRINCIPAIS */}
            <section className="space-y-12">
              <div className="flex items-center gap-8">
                <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
                  Núcleo Sagrado
                </h2>
                <div className="h-px flex-1 bg-border/30" />
              </div>
              <HomeMainDoors t={t} className="grid-cols-1 md:grid-cols-2" />
            </section>

            {/* RITUAL DO DIA */}
            <section className="space-y-12">
              <div className="flex items-center gap-8">
                <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
                  Ritual de Hoje
                </h2>
                <div className="h-px flex-1 bg-border/30" />
              </div>
              <RitualDoDia />
            </section>
          </div>

          <aside className="lg:col-span-4 stack-spacing">
            {/* EM BREVE - EVOLUÇÃO FUTURA */}
            <section className="space-y-12">
              <div className="flex items-center gap-8">
                <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
                  Em Breve
                </h2>
                <div className="h-px flex-1 bg-border/30" />
              </div>
              <div className="space-y-6">
                {[
                  { title: 'Jornadas de Fé', icon: <Icons.Journeys />, label: 'Formação' },
                  { title: 'Comunidade Contemplativa', icon: <Icons.Users />, label: 'Social' },
                  { title: 'Certamen (Quiz Avançado)', icon: <Icons.Trophy />, label: 'Desafio' },
                  { title: 'Dashboard do Peregrino', icon: <Icons.Activity />, label: 'Progresso' },
                ].map((item) => (
                  <div key={item.title} className="p-6 rounded-[2rem] border border-border/20 bg-muted/20 opacity-60 flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-premium-sm bg-primary/5 flex items-center justify-center text-primary/40">
                      {React.cloneElement(item.icon as React.ReactElement, { className: 'w-6 h-6' })}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/20 mb-1">{item.label}</p>
                      <h4 className="text-sm font-bold text-primary/60">{item.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* FRASES DO DIA */}
            <div className="pt-12 px-8 text-center bg-primary/[0.02] rounded-[3rem] p-12 border border-border/10">
               <Icons.Quote className="w-8 h-8 text-secondary/20 mx-auto mb-6" />
               <p className="text-lg text-primary/60 font-serif italic leading-relaxed">
                {todayQuote}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default HojePage;