import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SacredImage from './SacredImage';
import { Icons } from '@/constants';
import { useLang } from '@/hooks/useLang';
import RitualDoDia from './RitualDoDia';
import NexusBubbles from './NexusBubbles';
import SpiritualQuiz, { PROFILES, type ProfileId } from './SpiritualQuiz';
import ProShowcase from './ProShowcase';
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

  // Spiritual profile from quiz
  const [spiritualProfile, setSpiritualProfile] = useState<ProfileId | null>(null);
  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from('user_sensitive_data')
      .select('diagnosis_result')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        const sp = data?.diagnosis_result?.spiritual_profile;
        if (sp && PROFILES[sp as ProfileId]) setSpiritualProfile(sp as ProfileId);
      });
  }, [user]);

  const spProfile = spiritualProfile ? PROFILES[spiritualProfile] : null;

  const MAIN_DOORS = [
    {
      label: t('bible'),
      description: t('bible_sub'),
      icon: Icons.Bible,
      route: AppRoute.BIBLE,
      gradient: 'from-primary/5 to-transparent',
      iconColor: 'text-primary',
      borderColor: 'border-border hover:border-secondary/50',
      suggested: spiritualProfile === 'ferido_em_busca' || spiritualProfile === 'sedento_de_sentido',
    },
    {
      label: t('liturgy'),
      description: t('liturgy_sub') || 'Leituras do dia',
      icon: Icons.Liturgy,
      route: AppRoute.LITURGIA,
      gradient: 'from-primary/5 to-transparent',
      iconColor: 'text-primary',
      borderColor: 'border-border hover:border-secondary/50',
      suggested: spiritualProfile === 'ansioso_buscador',
    },
    {
      label: t('journeys'),
      description: t('journeys_sub') || 'Trilhas de formação',
      icon: Icons.Journeys,
      route: AppRoute.JORNADAS,
      gradient: 'from-primary/5 to-transparent',
      iconColor: 'text-primary',
      borderColor: 'border-border hover:border-secondary/50',
      suggested: spiritualProfile === 'firme_aprofundando',
    },
    {
      label: t('community'),
      description: t('community_sub'),
      icon: Icons.Community,
      route: AppRoute.COMMUNITY,
      gradient: 'from-primary/5 to-transparent',
      iconColor: 'text-primary',
      borderColor: 'border-border hover:border-secondary/50',
      suggested: spiritualProfile === 'ardente_missionario',
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
    <div className="desktop-layout py-6 md:py-10">
      <div className="desktop-main content-section">

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
            {spProfile && (
              <p className="text-sm text-muted-foreground italic font-serif mt-1">{spProfile.greeting}</p>
            )}
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

      {/* ═══ MAIN DOORS 🚪 ═══ */}
      <FadeUp delay={0.05}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MAIN_DOORS.map((door, idx) => (
            <div
              key={idx}
              onClick={() => goTo(door.route)}
              className={`relative overflow-hidden p-5 rounded-3xl border ${door.borderColor} bg-gradient-to-br ${door.gradient} cursor-pointer transition-all shadow-sm hover:shadow-md group`}
            >
              {door.suggested && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[8px] font-black uppercase tracking-tighter animate-pulse">
                  <Icons.Star className="w-2 h-2 fill-current" /> Sugerido
                </div>
              )}
              <div className={`w-10 h-10 rounded-xl bg-background flex items-center justify-center ${door.iconColor} group-hover:scale-110 transition-transform mb-3 shadow-sm`}>
                <door.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground leading-tight">{door.label}</h3>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{door.description}</p>
              </div>
            </div>
          ))}
        </div>
      </FadeUp>

      {/* ═══ 1. RITUAL DO DIA ⭐ ═══ */}
      <FadeUp delay={0.1}>
        <RitualDoDia />
      </FadeUp>

      {/* ═══ 2. CONTINUAR JORNADA ═══ */}
      {nextUp && (
        <FadeUp delay={0.12}>
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

      {activeJourneys.length > 0 && (
        <FadeUp delay={0.13}>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
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

      {/* ═══ 3. QUIZ ESPIRITUAL 🧠 ═══ */}
      <FadeUp delay={0.14}>
        <SpiritualQuiz />
      </FadeUp>

      {/* ═══ 4. TEMAS (BOLHAS) ═══ */}
      <FadeUp delay={0.15}>
        <NexusBubbles />
      </FadeUp>

      {/* ═══ 5. LOGOS (IA) — personalizado pelo quiz ═══ */}
      <FadeUp delay={0.16}>
        <div
          onClick={() => goTo('/study')}
          className="relative overflow-hidden rounded-3xl border border-secondary/20 bg-gradient-to-br from-secondary/5 via-card to-primary/5 p-6 cursor-pointer hover:border-secondary/40 transition-all shadow-sm hover:shadow-lg group"
        >
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-secondary/15 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
              <Icons.Brain className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Logos IA · Mestre Contemplativo</p>
              </div>
              <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-secondary transition-colors">
                {spProfile ? `Reflita sobre: ${spProfile.theme}` : 'Pergunte qualquer coisa sobre a Fé'}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">
                {spProfile ? spProfile.direction.label : 'Respostas fundamentadas no Magistério, Bíblia e Tradição'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border border-secondary/20 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all shrink-0">
              <Icons.ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </FadeUp>

      {/* ═══ 6. PRO 🔒 ═══ */}
      <FadeUp delay={0.18}>
        <ProShowcase />
      </FadeUp>

      {/* ═══ WEEKLY STATS ═══ */}
      <FadeUp delay={0.2}>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
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

      </div>{/* end desktop-main */}

      {/* ═══ DESKTOP RIGHT PANEL ═══ */}
      <aside className="desktop-aside">
        {/* Progress / Stats */}
        <div className="desktop-card space-y-4">
          <div className="flex items-center gap-2">
            <Icons.Activity className="w-4 h-4 text-primary" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Progresso</h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.Flame className="w-4 h-4 text-secondary" />
              <span className="text-xs font-bold text-foreground">{t('streak')}</span>
            </div>
            <span className="text-lg font-black text-primary">{streak} {streak === 1 ? t('day') : t('days')}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.Star className="w-4 h-4 text-secondary" />
              <span className="text-xs font-bold text-foreground">XP</span>
            </div>
            <span className="text-lg font-black text-primary">{profile?.xp || 0}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-primary/[0.04]">
              <p className="text-lg font-bold text-foreground">{weeklyStats.chaptersRead}</p>
              <p className="text-[8px] text-muted-foreground font-medium">{t('bible')}</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/[0.04]">
              <p className="text-lg font-bold text-foreground">{weeklyStats.catechismParagraphs}</p>
              <p className="text-[8px] text-muted-foreground font-medium">CIC</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/[0.04]">
              <p className="text-lg font-bold text-foreground">{weeklyStats.journeySteps}</p>
              <p className="text-[8px] text-muted-foreground font-medium">{t('journeys')}</p>
            </div>
          </div>
          {activeJourneys.length > 0 && (
            <>
              <div className="h-px bg-border" />
              <div className="space-y-2">
                {activeJourneys.slice(0, 2).map((j) => {
                  const pct = j.totalSteps > 0 ? Math.round((j.completedSteps / j.totalSteps) * 100) : 0;
                  return (
                    <button
                      key={j.id}
                      onClick={() => goTo(`/jornadas/${j.id}`)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-primary/[0.03] border border-primary/10 hover:border-primary/30 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-foreground truncate">{j.title}</p>
                        <div className="mt-1.5 h-1 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-primary">{pct}%</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Logos (IA) Suggestion */}
        <div
          onClick={() => goTo('/study')}
          className="desktop-card cursor-pointer hover:border-secondary/40 transition-all group space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
              <Icons.Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary">Colloquium</p>
              <p className="text-xs font-bold text-foreground group-hover:text-secondary transition-colors">IA Teológica</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">Pergunte qualquer coisa sobre a Fé católica</p>
        </div>

        {/* PRO */}
        {!profile?.is_premium && (
          <div
            onClick={() => goTo(AppRoute.PRICING)}
            className="desktop-card cursor-pointer border-secondary/30 hover:border-secondary/50 bg-gradient-to-br from-secondary/5 via-card to-primary/5 transition-all group space-y-3"
          >
            <div className="flex items-center gap-2">
              <Icons.Lock className="w-4 h-4 text-secondary" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary">Cathedra PRO</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">Desbloqueie jornadas, IA Logos, reflexões profundas e muito mais.</p>
            <div className="flex items-center gap-1 text-xs font-bold text-secondary group-hover:underline">
              Conhecer <Icons.ChevronRight className="w-3 h-3" />
            </div>
          </div>
        )}

        {/* Daily Quote */}
        <div className="desktop-card space-y-3">
          <p className="text-sm font-serif italic text-foreground leading-relaxed">
            {dailyQuote.text}
          </p>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">
            — {dailyQuote.author}
          </p>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;
