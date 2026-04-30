import React, { useState, useEffect, useContext, useMemo, useCallback, Suspense } from 'react';
// Logos AI removed

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { LangContext } from '@/contexts/LangContext';
import ProConversionBanner from './ProConversionBanner';
import { useSaintsToday, useOfficialSaint } from '@/hooks/useSaints';
import SaintOfTheDayCard from './SaintOfTheDayCard';
import SacredImage from './SacredImage';
import AudioContentPlayer from './AudioContentPlayer';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import { useQuery } from '@tanstack/react-query';
import { SaintCardSkeleton } from './SacredSkeleton';
import DevDataInspector from './DevDataInspector';

const LITURGICAL_QUOTES = [
  '"Sede misericordiosos como vosso Pai é misericordioso." — Lc 6,36',
  '"Eu sou o caminho, a verdade e a vida." — Jo 14,6',
  '"Vinde a mim todos vós que estais cansados." — Mt 11,28',
  '"Não tenhais medo, eu venci o mundo." — Jo 16,33',
  '"Amai-vos uns aos outros como eu vos amei." — Jo 15,12',
];

/* ═══ Journey Loading Hook ═══ */
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

      if (userLevel === 'iniciante' || moment === 'beginning' || knowledge === 'basic') {
        category = 'fundamentos';
      } else if (userLevel === 'avançado' || prayer === 'contemplative' || goal === 'transformation') {
        category = 'formacao';
      } else if (moment === 'struggling' || goal === 'peace') {
        category = 'mistico';
      } else if (goal === 'routine' || prayer === 'rarely' || prayer === 'sometimes') {
        category = 'rotina';
      }

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

/* ═══ Skeleton Components — themed Sacred ═══ */
const SaintSkeleton = SaintCardSkeleton;

const shimmerSkel = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-primary/5 before:to-transparent";

const JourneySkeleton = () => (
  <div className={`p-6 rounded-3xl border border-border bg-card ${shimmerSkel}`}>
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
  const { t } = useContext(LangContext);
  const [journalText, setJournalText] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);
  const [todayQuote] = useState(() => LITURGICAL_QUOTES[new Date().getDate() % LITURGICAL_QUOTES.length]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);


  const { data: allSaintsToday = [], isLoading: loadingSaints } = useSaintsToday();
  const { data: officialSaint, isLoading: loadingOfficial } = useOfficialSaint();
  const { data: activeJourneyData, isLoading: loadingJourney } = useActiveJourney(user?.id);
  const activeJourney = activeJourneyData?.journey || null;
  const journeyStep = activeJourneyData?.nextStep || null;
  const journeyProgress = activeJourneyData?.progress || { completed: 0, total: 0 };
  
  const { data: recommendedJourney } = useRecommendedJourney(
    user?.id, profile, userLevel, !!activeJourney
  );

  const saveJournal = useCallback(async () => {
    if (!user || !journalText.trim()) return;
    try {
      await supabase.from('spiritual_journal').insert([{
        user_id: user.id,
        content: journalText.trim(),
        entry_date: new Date().toISOString().split('T')[0],
      }]);
      
      setJournalSaved(true);
      setTimeout(() => setJournalSaved(false), 3000);
      toast.success('Sua reflexão foi salva no seu diário espiritual.');
    } catch (err) {
      console.error('Failed to save journal:', err);
      toast.error('Erro ao salvar diário');
    }
  }, [user, journalText]);


  const dailySections = useMemo(() => [
    {
      title: 'Liturgia',
      icon: <Icons.Calendar className="w-5 h-5" />,
      route: `${AppRoute.LITURGIA}?tab=liturgia`,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Oração',
      icon: <Icons.Volume2 className="w-5 h-5" />,
      route: AppRoute.ORACAO,
      color: 'bg-accent/10 text-accent',
    },
    {
      title: 'Bíblia',
      icon: <Icons.Bible className="w-5 h-5" />,
      route: AppRoute.BIBLE,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Rosário',
      icon: <Icons.Heart className="w-5 h-5" />,
      route: AppRoute.ROSARY,
      color: 'bg-accent/10 text-accent',
    },
    {
      title: 'Confissão',
      icon: <Icons.Flame className="w-5 h-5" />,
      route: AppRoute.POENITENTIA,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Catecismo',
      icon: <Icons.Catechism className="w-5 h-5" />,
      route: AppRoute.CATECHISM,
      color: 'bg-accent/10 text-accent',
    },
  ], []);

  return (
    <div className="desktop-layout pt-6 md:pt-12">
      <SEOHead 
        title="Hoje - Sua Jornada Espiritual" 
        description="Acompanhe sua caminhada de fé diária com a liturgia, vida dos santos e direção espiritual personalizada."
        path="/hoje"
      />
      
      {/* Dev Mode Data Inspector */}
      {import.meta.env.DEV && (
        <DevDataInspector 
          data={{
            officialSaint,
            allSaintsToday,
            activeJourney,
            profile: profile?._sensitive
          }}
        />
      )}
      {/* ═══ MAIN COLUMN ═══ */}
      <div className="desktop-main space-y-12 max-w-2xl mx-auto lg:max-w-none lg:mx-0">
      {/* Header - Centralized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8"
      >
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground leading-tight">
            Sua jornada espiritual <br />
            <span className="text-primary italic">guiada pela Sabedoria.</span>
          </h1>
          
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto italic font-serif">
            "O que Deus colocou no seu coração hoje? Compartilhe suas dúvidas ou orações e guarde-as em seu diário espiritual."
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            size="lg" 
            className="h-16 px-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest shadow-2xl shadow-primary/20 group rounded-full text-base transition-all hover:scale-105 active:scale-95 border-b-4 border-primary-foreground/20"
            onClick={() => {
              const journalElement = document.getElementById('spiritual-journal');
              journalElement?.scrollIntoView({ behavior: 'smooth' });
              const textarea = document.querySelector('textarea');
              textarea?.focus();
            }}
          >
            <Icons.PenLine className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
            Escreva sua reflexão
          </Button>

          <Button 
            size="lg" 
            variant="outline" 
            className="h-16 px-12 rounded-full text-base font-bold uppercase tracking-widest border-2 hover:bg-secondary/50 transition-all"
            onClick={() => navigate(AppRoute.CERTAMEN)}
          >
            <Icons.Trophy className="w-5 h-5 mr-3" />
            Quiz da Fé
          </Button>
        </div>
      </motion.div>


      {/* Main Content Sections */}
      <div className="pt-8 space-y-10">
        
        {/* Santo do Dia */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-px w-6 bg-primary/30" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">
              Santo do Dia
            </h3>
            {activeJourney && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider border border-primary/20 ml-auto">
                <Icons.Star className="w-2.5 h-2.5 fill-primary" />
                Especial para sua jornada
              </div>
            )}
          </div>

          <SaintOfTheDayCard />
        </motion.section>

        {/* Continuar Jornada */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-3">
            <div className="h-px w-6 bg-muted-foreground/30" />
            Continuar Jornada
          </h2>
          
          {loadingJourney ? (
            <JourneySkeleton />
          ) : activeJourney ? (
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                if (journeyStep) {
                  navigate(`/jornadas/${activeJourney.id}/step?step=${journeyStep.id}`);
                } else {
                  navigate(`/jornadas/${activeJourney.id}/complete`);
                }
              }}
              className="group cursor-pointer p-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent hover:border-primary/40 transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                  <Icons.Flame className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground">{activeJourney.title}</h3>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000 ease-out" 
                        style={{ width: `${journeyProgress.total > 0 ? (journeyProgress.completed / journeyProgress.total) * 100 : 0}%` }} 
                      />
                    </div>
                    <span className="text-[11px] font-black text-primary uppercase tabular-nums">
                      {journeyProgress.completed}/{journeyProgress.total}
                    </span>
                  </div>
                </div>
                <Icons.ChevronRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ) : recommendedJourney ? (
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(`/jornadas/${recommendedJourney.id}`)}
              className="group cursor-pointer p-6 rounded-3xl border border-border bg-muted/20 hover:border-primary/20 transition-all shadow-sm"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                  <Icons.Compass className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground">{recommendedJourney.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Sugerido especialmente para seu perfil</p>
                </div>
                <Icons.ChevronRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(AppRoute.JORNADAS)}
              className="group cursor-pointer p-6 rounded-3xl border border-border bg-muted/20 hover:border-primary/20 transition-all shadow-sm"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                  <Icons.Route className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground">Iniciar uma Jornada</h3>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Descubra o caminho ideal para o seu momento espiritual</p>
                </div>
                <Icons.ChevronRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          )}
        </section>

{/* Simplified Hoje Experience */}


        {/* Acesso Rápido */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-3">
            <div className="h-px w-6 bg-muted-foreground/30" />
            Acesso Rápido
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            {dailySections.map((section) => (
              <motion.div
                key={section.title}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(section.route)}
                className="group cursor-pointer p-4 rounded-2xl border border-border bg-background hover:border-primary/30 hover:bg-primary/5 transition-all text-center space-y-3"
              >
                <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center ${section.color} group-hover:scale-110 transition-transform`}>
                  {section.icon}
                </div>
                <h3 className="font-bold text-[11px] text-foreground leading-tight uppercase tracking-wider">{section.title}</h3>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Spiritual Journal Area */}
      <div id="spiritual-journal" className="pt-12 scroll-mt-24 space-y-6">


        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative space-y-4"
        >
          <div className="flex flex-wrap gap-2 mb-2">
            {[
              { label: 'Gratidão', icon: '🙏', text: 'Hoje sou grato por...' },
              { label: 'Pedido', icon: '🤲', text: 'Peço a Deus por...' },
              { label: 'Dúvida', icon: '🤔', text: 'Tenho uma dúvida sobre...' },
              { label: 'Reflexão', icon: '📖', text: 'Refletindo sobre a liturgia de hoje...' }
            ].map((prompt) => (
              <Button
                key={prompt.label}
                variant="outline"
                size="sm"
                className="rounded-full text-[10px] font-bold uppercase tracking-widest h-8 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
                onClick={() => setJournalText(prev => prev ? `${prev}\n\n${prompt.text}` : prompt.text)}
              >
                <span className="mr-1.5">{prompt.icon}</span> {prompt.label}
              </Button>
            ))}
          </div>

          <div className="relative">
            <Textarea
              placeholder="O que Deus colocou no seu coração hoje?"
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              className="min-h-[160px] md:min-h-[200px] p-6 rounded-3xl border-border bg-muted/20 focus:bg-background transition-all text-base font-serif italic resize-none shadow-inner"
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-4">
              {journalSaved && (
                <span className="text-[10px] font-black uppercase text-green-600 animate-in fade-in zoom-in">✓ Salvo</span>
              )}
              <Button 
                size="sm" 
                onClick={saveJournal} 
                disabled={!journalText.trim() || isAnalyzing}
                className="rounded-full px-6 font-black uppercase text-[10px] tracking-widest h-9"
              >
                {isAnalyzing ? <Icons.Loader className="w-4 h-4 animate-spin" /> : 'Refletir com Logos'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Simplified Footer Info */}
      <div className="pt-12 border-t border-border/50 text-center pb-24 space-y-6">
        <p className="text-[11px] text-muted-foreground font-serif italic leading-relaxed px-12 max-w-md mx-auto">
          "{todayQuote}"
        </p>
        <div className="flex justify-center gap-6">
          <button onClick={() => navigate(AppRoute.DIAGNOSTICO)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            Diagnóstico
          </button>
          <button onClick={() => navigate(AppRoute.JORNADAS)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            Ver Tudo
          </button>
        </div>
      </div>

      </div>{/* end desktop-main */}

      {/* ═══ DESKTOP RIGHT PANEL ═══ */}
      <aside className="desktop-aside">
        {/* Acesso Rápido - Sidebar version */}
        <div className="desktop-card space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Acesso Rápido</h3>
          <div className="space-y-2">
            {dailySections.map((section) => (
              <button
                key={section.title}
                onClick={() => navigate(section.route)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${section.color} group-hover:scale-110 transition-transform`}>
                  {section.icon}
                </div>
                <span className="text-sm font-semibold text-foreground">{section.title}</span>
                <Icons.ChevronRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* Streak & Stats Card */}
        <div className="desktop-card space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sua Semana</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 rounded-xl bg-primary/[0.04] border border-primary/10">
              <p className="text-2xl font-bold text-foreground">{profile?.streak || 0}</p>
              <p className="text-[9px] text-muted-foreground font-medium mt-1">
                <Icons.Flame className="w-3 h-3 inline mr-1" />{t('streak')}
              </p>
            </div>
            <div className="text-center p-3 rounded-xl bg-primary/[0.04] border border-primary/10">
              <p className="text-2xl font-bold text-foreground">{profile?.xp || 0}</p>
              <p className="text-[9px] text-muted-foreground font-medium mt-1">
                <Icons.Star className="w-3 h-3 inline mr-1" />XP
              </p>
            </div>
          </div>
        </div>

        {/* Daily Quote */}
        <div className="desktop-card space-y-3">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Palavra do Dia</h3>
          <p className="text-sm font-serif italic text-foreground leading-relaxed">
            "{todayQuote}"
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="desktop-card space-y-3">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Explorar</h3>
          <div className="space-y-1.5">
            {[
              { label: 'A-Z da Fé', route: AppRoute.AZ_FAITH, icon: <Icons.AZ className="w-4 h-4" /> },
              { label: 'Jornadas', route: AppRoute.JORNADAS, icon: <Icons.Route className="w-4 h-4" /> },
              { label: 'Comunidade', route: AppRoute.COMMUNITY, icon: <Icons.Users className="w-4 h-4" /> },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.route)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all text-left group"
              >
                <span className="text-muted-foreground group-hover:text-primary transition-colors">{item.icon}</span>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default HojePage;
