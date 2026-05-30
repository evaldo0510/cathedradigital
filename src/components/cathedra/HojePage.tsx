import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { LangContext } from '@/contexts/LangContext';
import { useSaintsToday, useOfficialSaint } from '@/hooks/useSaints';
import { CathedraButton } from './CathedraButton';
import { useDashboardData } from '@/hooks/useDashboardData';
import SEOHead from '@/components/SEOHead';
import { useQuery } from '@tanstack/react-query';
import { DashboardSkeleton } from './DashboardSkeleton';
import DevDataInspector from './DevDataInspector';
import { useEnhancedRecommendations } from '@/hooks/useEnhancedRecommendations';
import { SpiritualContinuity } from './SpiritualContinuity';
import ContemplativeLayout from './ContemplativeLayout';

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
  
  const { nextUp, isLoading: loadingStats } = useDashboardData(user as any || null);

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


  if (loadingStats || loadingJourney || loadingRec) return <DashboardSkeleton />;

  return (
    <ContemplativeLayout
      title="Mosteiro"
      subtitle={greeting + (profile?.name ? `, ${profile.name.split(' ')[0]}` : ', Anima Fidelis')}
      icon={Icons.Logo}
      className="monastic-sanctuary"
    >
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
      
      {import.meta.env.DEV && <DevDataInspector data={{ officialSaint, allSaintsToday: allSaintsToday || [], activeJourney: activeJourney || null, profile: profile?._sensitive || null }} />}
      
      <div className="w-full space-y-24 md:space-y-32">
        {/* CONTINUIDADE ESPIRITUAL - RETOMADA DINÂMICA */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="w-full"
        >
          <SpiritualContinuity data={nextUp} isLoading={loadingStats} profile={profile} />
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2xl md:gap-4xl">
          <div className="lg:col-span-8 space-y-20 md:space-y-32">
            {/* NÚCLEO SAGRADO - PORTAS PRINCIPAIS */}
            <section className="space-y-10 md:space-y-16">
              <div className="flex items-center gap-lg">
                <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.6em] text-primary/40 whitespace-nowrap">
                  Núcleo Sagrado
                </h2>
                <div className="h-[0.5px] flex-1 bg-gradient-to-r from-primary/[0.08] to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-xl w-full max-w-4xl">
                 <CathedraButton 
                    variant="outline" 
                    className="h-4xl rounded-[2.5rem] border-primary/[0.03] hover:bg-primary/[0.01] transition-all flex flex-col items-center justify-center gap-md group"
                    onClick={() => navigate(AppRoute.BIBLE)}
                 >
                    <Icons.Bible className="w-xl h-xl text-primary/20 group-hover:text-primary transition-all" strokeWidth={0.5} />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 group-hover:text-primary transition-all">Bíblia</span>
                 </CathedraButton>
                 <CathedraButton 
                    variant="outline" 
                    className="h-4xl rounded-[2.5rem] border-primary/[0.03] hover:bg-primary/[0.01] transition-all flex flex-col items-center justify-center gap-md group"
                    onClick={() => navigate(AppRoute.CATECHISM)}
                 >
                    <Icons.Catechism className="w-xl h-xl text-primary/20 group-hover:text-primary transition-all" strokeWidth={0.5} />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 group-hover:text-primary transition-all">Catecismo</span>
                 </CathedraButton>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-16">
            {/* FRASES DO DIA - CONTEMPLAÇÃO */}
            <div className="py-2xl px-xl text-center bg-primary/[0.01] rounded-[2rem] border border-primary/[0.03] transition-all hover:bg-primary/[0.02] duration-1000">
               <Icons.Quote className="w-lg h-lg text-primary/10 mx-auto mb-xl" />
               <p className="text-lg md:text-xl text-primary/40 font-serif italic leading-relaxed selection:bg-primary/5">
                {todayQuote}
              </p>
            </div>

            {/* EM BREVE - DISCRETO */}
            <section className="pt-2xl opacity-30 hover:opacity-100 transition-opacity duration-1000">
              <div className="flex items-center gap-lg mb-xl">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40">Futuro</span>
                <div className="h-[0.5px] flex-1 bg-gradient-to-r from-primary/[0.08] to-transparent" />
              </div>
              <div className="space-y-6">
                {[
                  { title: 'Jornadas de Fé', icon: <Icons.Journeys className="w-md h-md" /> },
                  { title: 'Comunidade Contemplativa', icon: <Icons.Users className="w-md h-md" /> },
                  { title: 'Dashboard do Peregrino', icon: <Icons.Activity className="w-md h-md" /> },
                ].map((item) => (
                  <div key={item.title} className="flex items-center gap-md group cursor-default">
                    <div className="text-primary/30 group-hover:text-primary/50 transition-colors">
                      {item.icon}
                    </div>
                    <h4 className="text-[10px] font-bold text-primary/30 uppercase tracking-widest group-hover:text-primary/50 transition-colors">{item.title}</h4>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </ContemplativeLayout>
  );
};

export default HojePage;