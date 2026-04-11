import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SacredImage from './SacredImage';
import { Icons } from '@/constants';
import { useLang } from '@/hooks/useLang';

interface DashboardProps {
  user: User | null;
}

const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    className={className}
  >
    {children}
  </motion.div>
);

const QUOTES = [
  { text: '"Tarde te amei, beleza tão antiga e tão nova."', author: 'Santo Agostinho' },
  { text: '"Nada te perturbe, nada te espante. Só Deus basta."', author: 'Santa Teresa de Ávila' },
  { text: '"Fazei tudo por amor. Nada por força."', author: 'São Francisco de Sales' },
  { text: '"A oração é a elevação da alma a Deus."', author: 'São João Damasceno' },
  { text: '"Sê quem Deus quis que fosses e incendiarás o mundo."', author: 'Santa Catarina de Sena' },
  { text: '"Onde não há amor, ponha amor e recolherás amor."', author: 'São João da Cruz' },
  { text: '"Tudo posso naquele que me fortalece."', author: 'Filipenses 4,13' },
];

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useLang();
  const goTo = useCallback((route: string) => navigate(route), [navigate]);

  const streak = profile?.streak || 0;
  const dailyQuote = QUOTES[Math.floor((Date.now() / 86400000)) % QUOTES.length];

  const MAIN_DOORS = [
    {
      label: t('bible'),
      description: t('bible_sub'),
      icon: Icons.Bible,
      route: AppRoute.BIBLE,
      gradient: 'from-primary/5 to-transparent',
      iconColor: 'text-primary',
      borderColor: 'border-border hover:border-secondary/50',
    },
    {
      label: t('liturgy'),
      description: t('liturgy_sub') || 'Leituras do dia',
      icon: Icons.Liturgy,
      route: AppRoute.LITURGIA,
      gradient: 'from-primary/5 to-transparent',
      iconColor: 'text-primary',
      borderColor: 'border-border hover:border-secondary/50',
    },
    {
      label: t('journeys'),
      description: t('journeys_sub') || 'Trilhas de formação',
      icon: Icons.Journeys,
      route: AppRoute.JORNADAS,
      gradient: 'from-primary/5 to-transparent',
      iconColor: 'text-primary',
      borderColor: 'border-border hover:border-secondary/50',
    },
    {
      label: t('community'),
      description: t('community_sub'),
      icon: Icons.Community,
      route: AppRoute.COMMUNITY,
      gradient: 'from-primary/5 to-transparent',
      iconColor: 'text-primary',
      borderColor: 'border-border hover:border-secondary/50',
    },
  ];

  // Active journeys
  const [activeJourneys, setActiveJourneys] = useState<{ id: string; title: string; icon: string; totalSteps: number; completedSteps: number }[]>([]);
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: progress } = await supabase.from('journey_progress').select('journey_id, step_id').eq('user_id', user.id);
      if (!progress?.length) return;
      const journeyIds = [...new Set(progress.map(p => p.journey_id))];
      const { data: journeys } = await supabase.from('journeys').select('id, title, icon').in('id', journeyIds);
      if (!journeys) return;
      const { data: steps } = await supabase.from('journey_steps').select('id, journey_id').in('journey_id', journeyIds);
      const stepsByJourney: Record<string, number> = {};
      steps?.forEach(s => { stepsByJourney[s.journey_id] = (stepsByJourney[s.journey_id] || 0) + 1; });
      const completedByJourney: Record<string, number> = {};
      progress.forEach(p => { completedByJourney[p.journey_id] = (completedByJourney[p.journey_id] || 0) + 1; });
      setActiveJourneys(journeys.map(j => ({
        id: j.id, title: j.title, icon: j.icon,
        totalSteps: stepsByJourney[j.id] || 0,
        completedSteps: completedByJourney[j.id] || 0,
      })));
    };
    load();
  }, [user]);

  // Saints of the day
  const [saintsToday, setSaintsToday] = useState<any[]>([]);
  useEffect(() => {
    import('@/data/saints').then(m => {
      const today = new Date();
      const matched = m.SAINTS_DATA.filter(s => s.feastMonth === today.getMonth() + 1 && s.feastDayNum === today.getDate());
      setSaintsToday(matched.length > 0 ? matched : [m.SAINTS_DATA[0]]);
    });
  }, []);

  // Weekly stats
  const [weeklyStats, setWeeklyStats] = useState({ chaptersRead: 0, journeySteps: 0, catechismParagraphs: 0 });
  const [nextUp, setNextUp] = useState<{ type: 'bible' | 'catechism' | 'journey'; label: string; route: string; subtitle: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadNextUp = async () => {
      // Get last Bible chapter read
      const { data: lastBible } = await supabase
        .from('bible_chapters_read')
        .select('book_abbr, chapter')
        .eq('user_id', user.id)
        .order('read_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get last Catechism paragraph read
      const { data: lastCatechism } = await supabase
        .from('catechism_paragraphs_read')
        .select('paragraph')
        .eq('user_id', user.id)
        .order('read_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get last Journey step completed
      const { data: lastJourney } = await supabase
        .from('journey_progress')
        .select('journey_id, step_id')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastJourney) {
        const { data: steps } = await supabase.from('journey_steps').select('id, title').eq('journey_id', lastJourney.journey_id).order('step_order', { ascending: true });
        const currentIndex = steps?.findIndex(s => s.id === lastJourney.step_id) ?? -1;
        if (steps && currentIndex !== -1 && currentIndex < steps.length - 1) {
          const next = steps[currentIndex + 1];
          setNextUp({ type: 'journey', label: next.title, route: `/jornadas/${lastJourney.journey_id}/step?step=${next.id}`, subtitle: 'Próxima Etapa da Jornada' });
          return;
        }
      }

      if (lastBible) {
        setNextUp({ type: 'bible', label: `${lastBible.book_abbr} ${lastBible.chapter + 1}`, route: `/bible?book=${lastBible.book_abbr}&ch=${lastBible.chapter + 1}`, subtitle: 'Continuar Leitura da Bíblia' });
        return;
      }

      if (lastCatechism) {
        setNextUp({ type: 'catechism', label: `§${lastCatechism.paragraph + 1}`, route: `/catechism?p=${lastCatechism.paragraph + 1}`, subtitle: 'Continuar Estudo do Catecismo' });
        return;
      }
    };
    loadNextUp();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const iso = weekAgo.toISOString();

    Promise.all([
      supabase.from('bible_chapters_read').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('read_at', iso),
      supabase.from('journey_progress').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('completed_at', iso),
      supabase.from('catechism_paragraphs_read').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('read_at', iso),
    ]).then(([chapRes, jpRes, catRes]) => {
      setWeeklyStats({
        chaptersRead: chapRes.count || 0,
        journeySteps: jpRes.count || 0,
        catechismParagraphs: catRes.count || 0,
      });
    });
  }, [user]);

  return (
    <div className="content-section py-6 md:py-10">

      {/* ═══ HEADER ═══ */}
      <FadeUp>
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="flex justify-center"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-secondary/10 blur-3xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <Icons.Saints className="w-12 h-12 md:w-16 md:h-16 text-secondary transition-all duration-700 group-hover:rotate-12" />
            </div>
          </motion.div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary opacity-80">
              Cathedra {t('digital')}
            </p>
            <h1 className="text-4xl md:text-6xl font-display font-black text-primary leading-tight tracking-tight">
              {profile?.name ? `${t('salve')}, ${profile.name.split(' ')[0]}!` : t('pax_et_bonum')}
            </h1>
          </div>

          {/* Streak & XP */}
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            {streak > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/10 border border-secondary/20 shadow-sm">
                <Icons.Zap className="w-4 h-4 text-secondary" />
                <span className="text-xs font-black text-primary uppercase tracking-wider">{streak} {streak === 1 ? t('day') : t('days')}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/5 border border-border shadow-sm">
              <Icons.Star className="w-4 h-4 text-primary" />
              <span className="text-xs font-black text-primary uppercase tracking-wider">{profile?.xp || 0} XP</span>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* ═══ DAILY QUOTE ═══ */}
      <FadeUp delay={0.1}>
        <div className="text-center py-8 border-y border-border/60 space-y-3">
          <p className="text-lg md:text-xl font-serif italic text-primary leading-relaxed max-w-lg mx-auto">
            {dailyQuote.text}
          </p>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary opacity-80">
            — {dailyQuote.author}
          </p>
        </div>
      </FadeUp>

      {/* ═══ 4 MAIN DOORS ═══ */}
      <FadeUp delay={0.1}>
        <div className="responsive-grid">
          {MAIN_DOORS.map((door) => {
            const Icon = door.icon;
            return (
              <button
                key={door.label}
                onClick={() => goTo(door.route)}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${door.gradient} ${door.borderColor} p-5 md:p-6 text-left transition-all hover:shadow-lg active:scale-[0.98]`}
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                    <Icon className={`w-5 h-5 ${door.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{door.label}</h3>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{door.description}</p>
                  </div>
                </div>
                <Icons.ChevronRight className="absolute top-5 right-4 w-4 h-4 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors" />
              </button>
            );
          })}
        </div>
      </FadeUp>

      {/* ═══ WHATSAPP RELEASE ═══ */}
      <FadeUp delay={0.105}>
        <div 
          onClick={() => navigate(AppRoute.PROFILE)}
          className="p-4 rounded-3xl border border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Icons.Whatsapp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">{t('whatsapp_released')}</p>
                <div className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-wider">{t('new')}</div>
              </div>
              <h3 className="text-sm font-bold text-foreground leading-tight">{t('whatsapp_sub')}</h3>
            </div>
          </div>
          <Icons.ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
        </div>
      </FadeUp>

      {/* ═══ NEXT UP ═══ */}
      {nextUp && (
        <FadeUp delay={0.11}>
          <div 
            onClick={() => goTo(nextUp.route)}
            className="p-5 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background cursor-pointer hover:border-primary/40 transition-all shadow-sm hover:shadow-md flex items-center justify-between group"
          >
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                {nextUp.type === 'bible' ? <Icons.Bible className="w-6 h-6" /> : 
                 nextUp.type === 'catechism' ? <Icons.Cross className="w-6 h-6" /> : 
                 <Icons.Flame className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{nextUp.subtitle}</p>
                <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{nextUp.label}</h3>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <Icons.ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </FadeUp>
      )}

      {/* ═══ STATS & JOURNEYS GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
        {/* ═══ WEEKLY SUMMARY ═══ */}
        <FadeUp delay={0.12}>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 h-full">
            <div className="flex items-center gap-2">
              <Icons.Activity className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">{t('weekly_summary')}</h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-3 rounded-xl bg-primary/[0.04] border border-primary/10">
                <p className="text-xl md:text-2xl font-bold text-foreground">{weeklyStats.chaptersRead}</p>
                <p className="text-[9px] text-muted-foreground font-medium mt-1 flex flex-col items-center">
                  <Icons.Bookmark className="w-3 h-3 mb-1" /> {t('bible')}
                </p>
              </div>
              <div className="text-center p-3 rounded-xl bg-primary/[0.04] border border-primary/10">
                <p className="text-xl md:text-2xl font-bold text-foreground">{weeklyStats.catechismParagraphs}</p>
                <p className="text-[9px] text-muted-foreground font-medium mt-1 flex flex-col items-center">
                  <Icons.Cross className="w-3 h-3 mb-1" /> CIC
                </p>
              </div>
              <div className="text-center p-3 rounded-xl bg-primary/[0.04] border border-primary/10">
                <p className="text-xl md:text-2xl font-bold text-foreground">{streak}</p>
                <p className="text-[9px] text-muted-foreground font-medium mt-1 flex flex-col items-center">
                  <Icons.Flame className="w-3 h-3 mb-1" /> {t('streak')}
                </p>
              </div>
              <div className="text-center p-3 rounded-xl bg-primary/[0.04] border border-primary/10">
                <p className="text-xl md:text-2xl font-bold text-foreground">{weeklyStats.journeySteps}</p>
                <p className="text-[9px] text-muted-foreground font-medium mt-1 flex flex-col items-center">
                  <Icons.Calendar className="w-3 h-3 mb-1" /> {t('journeys')}
                </p>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* ═══ ACTIVE JOURNEYS ═══ */}
        {activeJourneys.length > 0 && (
          <FadeUp delay={0.15}>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 h-full">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">{t('your_journeys')}</h2>
                <button onClick={() => goTo(AppRoute.JORNADAS)} className="text-xs text-primary hover:underline flex items-center gap-1">
                  {t('view_all')} <Icons.ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-3">
                {activeJourneys.slice(0, 2).map((j) => {
                  const pct = j.totalSteps > 0 ? Math.round((j.completedSteps / j.totalSteps) * 100) : 0;
                  return (
                    <button
                      key={j.id}
                      onClick={() => goTo(`/jornadas/${j.id}`)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-primary/[0.03] border border-primary/10 hover:border-primary/30 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-primary shadow-sm">
                        <Icons.Compass className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-foreground">{j.title}</p>
                        <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-[10px] font-black text-primary">{pct}%</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </FadeUp>
        )}
      </div>

      {/* ═══ SAINTS ═══ */}
      <FadeUp delay={0.2}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {saintsToday.slice(0, 3).map((saint, i) => (
            <div key={i} className="group relative overflow-hidden rounded-2xl aspect-[4/5] bg-card border border-border shadow-sm">
              <SacredImage 
                src={saint.image} 
                alt={saint.name} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5 w-full">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-1">{saint.title}</p>
                <h3 className="text-lg font-bold text-white leading-tight">{saint.name}</h3>
                <p className="text-[10px] text-white/60 mt-2 line-clamp-2 leading-relaxed">{saint.description}</p>
              </div>
            </div>
          ))}
        </div>
      </FadeUp>
    </div>
  );
};

export default Dashboard;
