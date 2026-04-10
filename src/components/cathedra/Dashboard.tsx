import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SacredImage from './SacredImage';
import { Icons } from '@/constants';


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

const MAIN_DOORS = [
  {
    label: 'Bíblia',
    description: 'Sagrada Escritura',
    icon: Icons.Bible,
    route: AppRoute.BIBLE,
    gradient: 'from-primary/5 to-transparent',
    iconColor: 'text-primary',
    borderColor: 'border-border hover:border-secondary/50',
  },
  {
    label: 'Liturgia',
    description: 'Leituras do dia',
    icon: Icons.Liturgy,
    route: AppRoute.LITURGIA,
    gradient: 'from-primary/5 to-transparent',
    iconColor: 'text-primary',
    borderColor: 'border-border hover:border-secondary/50',
  },
  {
    label: 'Jornadas',
    description: 'Trilhas de formação',
    icon: Icons.Journeys,
    route: AppRoute.JORNADAS,
    gradient: 'from-primary/5 to-transparent',
    iconColor: 'text-primary',
    borderColor: 'border-border hover:border-secondary/50',
  },
  {
    label: 'Comunidade',
    description: 'Caminhe junto',
    icon: Icons.Community,
    route: AppRoute.COMMUNITY,
    gradient: 'from-primary/5 to-transparent',
    iconColor: 'text-primary',
    borderColor: 'border-border hover:border-secondary/50',
  },
];

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const goTo = useCallback((route: string) => navigate(route), [navigate]);

  const streak = profile?.streak || 0;
  const dailyQuote = QUOTES[Math.floor((Date.now() / 86400000)) % QUOTES.length];

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

  // Saint of the day
  const [saintOfDay, setSaintOfDay] = useState<any>(null);
  useEffect(() => {
    import('@/data/saints').then(m => {
      const today = new Date();
      const saint = m.SAINTS_DATA.find(s => s.feastMonth === today.getMonth() + 1 && s.feastDayNum === today.getDate()) || m.SAINTS_DATA[0];
      setSaintOfDay(saint);
    });
  }, []);

  // Weekly stats
  const [weeklyStats, setWeeklyStats] = useState({ chaptersRead: 0, journeySteps: 0 });
  useEffect(() => {
    if (!user) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const iso = weekAgo.toISOString();

    Promise.all([
      supabase.from('bible_chapters_read').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('read_at', iso),
      supabase.from('journey_progress').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('completed_at', iso),
    ]).then(([chapRes, jpRes]) => {
      setWeeklyStats({
        chaptersRead: chapRes.count || 0,
        journeySteps: jpRes.count || 0,
      });
    });
  }, [user]);

  return (
    <div className="w-full mx-auto space-y-12 md:space-y-16 py-6 md:py-10">

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
              <Icons.Saints className="w-16 h-16 md:w-20 md:h-20 text-secondary transition-all duration-700 group-hover:rotate-12" />
            </div>
          </motion.div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary opacity-80">
              Cathedra Digital
            </p>
            <h1 className="text-4xl md:text-6xl font-display font-black text-primary leading-tight tracking-tight">
              Pax et Bonum
            </h1>
          </div>

          {/* Streak & XP */}
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            {streak > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/10 border border-secondary/20 shadow-sm">
                <Icons.Zap className="w-4 h-4 text-secondary" />
                <span className="text-xs font-black text-primary uppercase tracking-wider">{streak} {streak === 1 ? 'dia' : 'dias'}</span>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {MAIN_DOORS.map((door) => {
            const Icon = door.icon;
            return (
              <button
                key={door.label}
                onClick={() => goTo(door.route)}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${door.gradient} ${door.borderColor} p-5 md:p-6 text-left transition-all hover:shadow-lg active:scale-[0.98]`}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                    <Icon className={`w-6 h-6 ${door.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{door.label}</h3>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{door.description}</p>
                  </div>
                </div>
                <ChevronRight className="absolute top-5 right-4 w-4 h-4 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors" />
              </button>
            );
          })}
        </div>
      </FadeUp>

      {/* ═══ STATS & JOURNEYS GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* ═══ WEEKLY SUMMARY ═══ */}
        <FadeUp delay={0.12}>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 h-full">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Resumo da Semana</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-4 rounded-xl bg-primary/[0.04] border border-primary/10">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{weeklyStats.chaptersRead}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-1 flex items-center justify-center gap-1">
                  <BookMarked className="w-3 h-3" /> Capítulos
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-primary/[0.04] border border-primary/10">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{streak}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-1 flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3" /> Streak
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-primary/[0.04] border border-primary/10">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{weeklyStats.journeySteps}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-1 flex items-center justify-center gap-1">
                  <Calendar className="w-3 h-3" /> Etapas
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
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Suas Jornadas</h2>
                <button onClick={() => goTo(AppRoute.JORNADAS)} className="text-xs text-primary hover:underline flex items-center gap-1">
                  Ver todas <ChevronRight className="w-3 h-3" />
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
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {j.icon === 'compass' ? <Icons.Compass className="w-5 h-5 text-primary" /> : 
                         j.icon === 'cross' ? <Icons.Cross className="w-5 h-5 text-primary" /> : 
                         j.icon === 'book-open' ? <Icons.BookOpen className="w-5 h-5 text-primary" /> : 
                         <Icons.Sparkles className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-sm font-semibold text-foreground truncate">{j.title}</p>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            className="h-full bg-primary rounded-full transition-all" 
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary shrink-0">{pct}%</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </FadeUp>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* ═══ SANTO DO DIA ═══ */}
        {saintOfDay && (
          <FadeUp delay={0.2}>
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm h-full group hover:shadow-md transition-all">
              <div className="flex h-full items-stretch">
                <div className="w-28 md:w-32 lg:w-40 flex-shrink-0 relative overflow-hidden">
                  <SacredImage src={saintOfDay.image || ''} alt={saintOfDay.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                </div>
                <div className="flex-1 p-5 md:p-6 flex flex-col justify-center space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-primary/10" /> Santo do Dia
                  </p>
                  <h3 className="text-base md:text-xl font-serif font-bold text-foreground leading-tight">{saintOfDay.name}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground font-serif italic line-clamp-3 leading-relaxed">"{saintOfDay.quotes[0]}"</p>
                  <button
                    onClick={() => goTo(AppRoute.SAINTS)}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:underline pt-2"
                  >
                    Conhecer <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </FadeUp>
        )}

        {/* ═══ PRO BANNER ═══ */}
        {!profile?.is_premium && (
          <FadeUp delay={0.25}>
            <button
              onClick={() => goTo(AppRoute.CHECKOUT)}
              className="w-full h-full group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/[0.02] to-transparent p-6 md:p-8 text-left transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 flex flex-col justify-center"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner">
                  <Zap className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-foreground text-base md:text-lg uppercase tracking-wider">Cathedra PRO</h3>
                    <span className="bg-primary text-primary-foreground text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Premium</span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    IA Teológica, trilhas exclusivas e modo offline para seu estudo diário.{' '}
                    <span className="text-primary font-bold whitespace-nowrap">R$ 15,92/mês</span>
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1 shrink-0" />
              </div>
            </button>
          </FadeUp>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
