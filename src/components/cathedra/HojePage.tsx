import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/constants';
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
import SEOHead from '@/components/SEOHead';
import { useQuery } from '@tanstack/react-query';
import { DashboardSkeleton } from './DashboardSkeleton';
import DevDataInspector from './DevDataInspector';
import { ProfileId } from './SpiritualQuiz';

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
    { title: 'Ritual do dia', icon: <Icons.Calendar className="w-5 h-5" />, route: `${AppRoute.LITURGIA}?tab=liturgia` },
    { title: 'Temas principais', icon: <span className="text-xl">🫧</span>, route: AppRoute.TEMAS },
    { title: 'Catecismo Interativo', icon: <span className="text-xl">📘</span>, route: AppRoute.CATECHISM },
    { title: 'Trilhas guiadas', icon: <span className="text-xl">🧭</span>, route: AppRoute.JORNADAS },
    { title: 'Logos recomenda', icon: <span className="text-xl">🧠</span>, route: AppRoute.STUDY_MODE },
    { title: 'Favoritos', icon: <span className="text-xl">❤️</span>, route: AppRoute.FAVORITES },
  ], []);

  return (
    <div className="desktop-layout pt-0 md:pt-10 lg:pt-20 pb-24 relative">
      {loadingStats && (
        <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center">
          <DashboardSkeleton />
        </div>
      )}
      <SEOHead 
        title="Cathedra Digital — Nem toda prisão é visível" 
        description="Explore o Catecismo, a Bíblia e jornadas espirituais para uma vida de liberdade e verdade. A sabedoria da Igreja Católica ao seu alcance." 
        path="/hoje" 
      />
      {import.meta.env.DEV && <DevDataInspector data={{ officialSaint, allSaintsToday, activeJourney, profile: profile?._sensitive }} />}
      
      <div className="desktop-main space-y-20 max-w-2xl mx-auto lg:max-w-none lg:mx-0">
        <div className="text-center space-y-12">
          <div className="space-y-6">
            <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-primary/60">
              {greeting}, {profile?.name?.split(' ')[0] || 'fiel'}
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-9xl font-serif text-foreground leading-[1] tracking-tight">
              "Nem toda prisão <br /><span className="text-primary italic font-medium">é visível."</span>
            </h1>
          </div>
          
          <div className="flex items-center justify-center gap-4 flex-wrap">
             {(profile?.streak || 0) > 0 && (
              <div className="premium-card p-3 md:p-4 rounded-3xl flex items-center gap-3 backdrop-blur-sm shadow-sm">
                <Icons.Zap className="w-5 h-5 text-primary" />
                <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">{profile?.streak} {profile?.streak === 1 ? 'Dia' : 'Dias'}</span>
              </div>
            )}
            <div className="premium-card p-3 md:p-4 rounded-3xl flex items-center gap-3 backdrop-blur-sm shadow-sm">
              <Icons.Star className="w-5 h-5 text-primary" />
              <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">{profile?.xp || 0} XP</span>
            </div>
          </div>
        </div>

        <section className="space-y-6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 flex items-center gap-4 px-2">
            <div className="h-px w-10 bg-primary/20" /> Continuar jornada
          </h2>
          {nextUp ? (
            <div 
              tabIndex={0}
              role="button"
              onClick={() => navigate(nextUp.route)}
              className="premium-card p-8 md:p-12 cursor-pointer transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between group gap-8 border-primary/20"
            >
              <div className="flex items-center gap-6">
                <div className="premium-icon-box">
                  {nextUp.type === 'bible' ? <Icons.Bible className="w-6 h-6" /> : 
                   nextUp.type === 'catechism' ? <Icons.Catechism className="w-6 h-6" /> : 
                   <Icons.Flame className="w-6 h-6" />}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">{nextUp.subtitle}</p>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{nextUp.label}</h3>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all self-end md:self-center">
                <Icons.ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
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
            {activeJourney ? (
              <div 
                className="premium-card group cursor-pointer p-8 shadow-sm border-primary/20"
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
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${journeyProgress.total > 0 ? (journeyProgress.completed / journeyProgress.total) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs font-black text-primary uppercase tabular-nums tracking-widest">{journeyProgress.completed}/{journeyProgress.total}</span>
                    </div>
                  </div>
                  <Icons.ChevronRight className="w-7 h-7 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                </div>
              </div>
            ) : recommendedJourney ? (
              <div 
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
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => navigate(AppRoute.JORNADAS)} 
                className="w-full h-24 rounded-[2rem] border-dashed border-2 hover:bg-primary/5"
              >
                <div className="flex items-center gap-4">
                  <Icons.Route className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm font-bold">Descobrir minha próxima Jornada</span>
                </div>
              </Button>
            )}
          </section>

          <section className="space-y-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 flex items-center gap-4 px-2">
              <div className="h-px w-10 bg-primary/20" /> Acesso Rápido
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {dailySections.map((section) => (
                <div 
                  key={section.title} 
                  onClick={() => navigate(section.route)} 
                  className="premium-card group cursor-pointer p-6 shadow-sm text-center space-y-4 rounded-3xl"
                >
                  <div className="premium-icon-box mx-auto group-hover:scale-105 transition-transform duration-500">
                    {section.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors block leading-tight">
                    {section.title}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HojePage;
