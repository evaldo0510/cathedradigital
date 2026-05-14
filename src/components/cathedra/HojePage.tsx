import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { LangContext } from '@/contexts/LangContext';
import { useSaintsToday, useOfficialSaint } from '@/hooks/useSaints';
import RitualDoDia from './RitualDoDia';
import NexusBubbles from './NexusBubbles';
import HomeMainDoors from './HomeMainDoors';
import { useDashboardData } from '@/hooks/useDashboardData';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import { useQuery } from '@tanstack/react-query';
import { DashboardSkeleton } from './DashboardSkeleton';
import DevDataInspector from './DevDataInspector';
import { ProfileId } from './SpiritualQuiz';

const LITURGICAL_QUOTES = [
  '"Sede misericordiosos como vosso Pai é misericordioso." — Lc 6,36',
  '"Eu sou o caminho, a verdade e a vida." — Jo 14,6',
  '"Vinde a mim todos vós que estais cansados." — Mt 11,28',
  '"Não tenhais medo, eu venci o mundo." — Jo 16,33',
  '"Amai-vos uns aos outros como eu vos amei." — Jo 15,12',
];

const JourneySkeleton = () => (
  <div className="premium-card p-6 relative before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-primary/5 before:to-transparent shadow-sm">
    <div className="flex items-center gap-5">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Icons.Compass className="w-6 h-6 text-primary/20" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="h-3 bg-muted/50 rounded-full w-24" />
        <div className="h-4 bg-muted/60 rounded-full w-2/3" />
        <div className="h-2 bg-muted/40 rounded-full w-full" />
      </div>
    </div>
  </div>
);

const HojePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, userLevel } = useAuth();
  const { lang } = useContext(LangContext);
  const { data: allSaintsToday = [] } = useSaintsToday();
  const { data: officialSaint } = useOfficialSaint();
  
  const { spiritualProfile, nextUp, activeJourneys, isLoading: loadingStats } = useDashboardData(user as any);

  const activeJourney = activeJourneys?.[0] || null;
  const journeyProgress = activeJourney ? { completed: activeJourney.completedSteps, total: activeJourney.totalSteps } : { completed: 0, total: 0 };
  
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

  const hour = new Date().getHours();
  const greeting = useMemo(() => {
    if (hour < 12) return lang === 'pt' ? 'Bom dia' : 'Good morning';
    if (hour < 18) return lang === 'pt' ? 'Boa tarde' : 'Good afternoon';
    return lang === 'pt' ? 'Boa noite' : 'Good evening';
  }, [hour, lang]);

  const dailySections = useMemo(() => [
    { title: 'Ritual do dia', icon: <Icons.Calendar className="w-5 h-5" />, route: `${AppRoute.LITURGIA}?tab=liturgia`, color: 'bg-primary/10 text-primary' },
    { title: 'Temas principais', icon: <span className="text-xl">🫧</span>, route: AppRoute.TEMAS, color: 'bg-accent/10 text-accent' },
    { title: 'Catecismo Interativo', icon: <span className="text-xl">📘</span>, route: AppRoute.CATECHISM, color: 'bg-primary/5 text-primary border border-primary/20' },
    { title: 'Trilhas guiadas', icon: <span className="text-xl">🧭</span>, route: AppRoute.JORNADAS, color: 'bg-accent/10 text-accent' },
    { title: 'Logos recomenda', icon: <span className="text-xl">🧠</span>, route: AppRoute.STUDY_MODE, color: 'bg-primary/10 text-primary' },
    { title: 'Favoritos', icon: <span className="text-xl">❤️</span>, route: AppRoute.FAVORITES, color: 'bg-accent/10 text-accent' },
  ], []);

  return (
    <div className="desktop-layout pt-6 md:pt-20 pb-24">
      {loadingStats && <DashboardSkeleton />}
      <SEOHead 
        title="Cathedra Digital — Nem toda prisão é visível" 
        description="Explore o Catecismo, a Bíblia e jornadas espirituais para uma vida de liberdade e verdade. A sabedoria da Igreja Católica ao seu alcance." 
        path="/hoje" 
      />
      {import.meta.env.DEV && <DevDataInspector data={{ officialSaint, allSaintsToday, activeJourney, profile: profile?._sensitive }} />}
      <div className="desktop-main space-y-20 max-w-2xl mx-auto lg:max-w-none lg:mx-0">
        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center space-y-8 md:space-y-10 pt-4 md:pt-0"
        >
          <div className="space-y-6 md:space-y-8">

            <motion.p 
              initial={{ opacity: 0, letterSpacing: "0.2em" }}
              animate={{ opacity: 1, letterSpacing: "0.4em" }}
              transition={{ duration: 1.2, delay: 0.4 }}
              className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-primary/60"
            >
              {greeting}, {profile?.name?.split(' ')[0] || 'fiel'}
            </motion.p>
            <h1 className="text-5xl md:text-9xl font-serif text-foreground leading-[1] tracking-tight">
              "Nem toda prisão <br /><span className="text-primary italic font-medium">é visível."</span>
            </h1>
          </div>
          <div className="flex items-center justify-center gap-6 flex-wrap pt-4">
             {(profile?.streak || 0) > 0 && (
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 px-6 py-3 rounded-[1.5rem] bg-primary/5 border border-primary/10 shadow-sm backdrop-blur-sm"
              >
                <Icons.Zap className="w-5 h-5 text-primary" />
                <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">{profile?.streak} {profile?.streak === 1 ? 'Dia' : 'Dias'}</span>
              </motion.div>
            )}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 px-6 py-3 rounded-[1.5rem] bg-card/50 border border-border shadow-sm backdrop-blur-sm"
            >
              <Icons.Star className="w-5 h-5 text-primary" />
              <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">{profile?.xp || 0} XP</span>
            </motion.div>
          </div>
        </motion.div>

        <section className="space-y-6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 flex items-center gap-4 px-2">
            <div className="h-px w-10 bg-primary/20" /> Continuar jornada
          </h2>
          {nextUp ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(nextUp.route);
                }
              }}
              onClick={() => navigate(nextUp.route)}
              className="premium-card p-8 md:p-12 cursor-pointer hover:shadow-[0_20px_50px_rgba(var(--primary),0.1)] transition-all duration-700 flex flex-col md:flex-row md:items-center justify-between group shadow-xl gap-8"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  {nextUp.type === 'bible' ? <Icons.Bible className="w-8 h-8" /> : 
                   nextUp.type === 'catechism' ? <Icons.Catechism className="w-8 h-8" /> : 
                   <Icons.Flame className="w-8 h-8" />}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">{nextUp.subtitle}</p>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors duration-500">{nextUp.label}</h3>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 self-end md:self-center">
                <Icons.ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>

            </motion.div>
          ) : (
            <p className="text-sm text-muted-foreground italic px-6 font-serif">Inicie uma leitura para retomar aqui.</p>
          )}
        </section>

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
          
          <section className="space-y-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 flex items-center gap-4 px-2">
              <div className="h-px w-10 bg-primary/20" /> Itinerarium Mentis
            </h2>
            {loadingStats ? <JourneySkeleton /> : activeJourney ? (
              <motion.div 
                whileHover={{ y: -8 }} 
                className="premium-card group cursor-pointer p-8 shadow-sm"
                onClick={() => navigate(`/jornadas/${activeJourney.id}`)} 
              >
                <div className="flex items-center gap-6">
                  <div className="premium-icon-box"><Icons.Flame className="w-6 h-6" /></div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{activeJourney.title}</h3>
                      <p className="text-[10px] uppercase font-black tracking-widest text-primary/60 mt-1">Sua Jornada Ativa</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden p-[2px]">
                        <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--primary),0.3)]" style={{ width: `${journeyProgress.total > 0 ? (journeyProgress.completed / journeyProgress.total) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs font-black text-primary uppercase tabular-nums tracking-widest">{journeyProgress.completed}/{journeyProgress.total}</span>
                    </div>
                  </div>
                  <Icons.ChevronRight className="w-7 h-7 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                </div>
              </motion.div>
            ) : recommendedJourney ? (
              <motion.div 
                whileHover={{ y: -8 }} 
                onClick={() => navigate(`/jornadas/${recommendedJourney.id}`)} 
                className="premium-card group cursor-pointer p-8 shadow-sm"
              >
                <div className="flex items-center gap-6">
                  <div className="premium-icon-box"><Icons.Compass className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{recommendedJourney.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium font-serif italic">Sugerido especialmente para seu perfil espiritual</p>
                  </div>
                  <Icons.ChevronRight className="w-7 h-7 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                </div>
              </motion.div>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => navigate(AppRoute.JORNADAS)} 
                className="w-full h-24 rounded-[2rem] border-dashed border-2 hover:bg-primary/5 group"
              >
                <div className="flex items-center gap-4">
                  <Icons.Route className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-bold">Descobrir minha próxima Jornada</span>
                </div>
              </Button>
            )}
          </section>

          <section className="space-y-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 flex items-center gap-4 px-2">
              <div className="h-px w-10 bg-primary/20" /> Acesso Rápido
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {dailySections.map((section) => (
                <motion.div 
                  key={section.title} 
                  whileHover={{ y: -8, scale: 1.02 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => navigate(section.route)} 
                  className="premium-card group cursor-pointer p-6 shadow-sm text-center space-y-4 rounded-3xl"
                >
                  <div className="premium-icon-box mx-auto group-hover:scale-110 transition-transform duration-500">
                    {section.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors block leading-tight">
                    {section.title}
                  </span>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HojePage;
