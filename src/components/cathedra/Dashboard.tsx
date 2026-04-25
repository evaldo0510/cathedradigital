import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Icons } from '@/constants';
import { useLang } from '@/hooks/useLang';
import RitualDoDia from './RitualDoDia';
import NexusBubbles from './NexusBubbles';
import SpiritualQuiz, { PROFILES, type ProfileId } from './SpiritualQuiz';
import ProShowcase from './ProShowcase';
import QuickDonation from './QuickDonation';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardSkeleton } from './DashboardSkeleton';


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

  const { spiritualProfile, activeJourneys, nextUp, weeklyStats, isLoading } = useDashboardData(user);

  const streak = profile?.streak || 0;
  const hour = new Date().getHours();
  const greeting = useMemo(() => {
    if (hour < 12) return t('good_morning') || 'Bom dia';
    if (hour < 18) return t('good_afternoon') || 'Boa tarde';
    return t('good_evening') || 'Boa noite';
  }, [hour, t]);
  
  const dailyQuote = QUOTES[Math.floor((Date.now() / 86400000)) % QUOTES.length];
  const spProfile = spiritualProfile ? PROFILES[spiritualProfile as ProfileId] : null;

  const MAIN_DOORS = useMemo(() => [
    {
      label: t('bible'),
      description: t('bible_sub'),
      icon: Icons.Bible,
      route: (nextUp as any)?.lastBible 
        ? `${AppRoute.BIBLE}?book=${(nextUp as any).lastBible.book_abbr}&ch=${(nextUp as any).lastBible.chapter}` 
        : AppRoute.BIBLE,
      gradient: 'from-primary/5 to-transparent',
      iconColor: 'text-primary',
      borderColor: 'border-border hover:border-secondary/50',
      suggested: spiritualProfile === 'ferido_em_busca' || spiritualProfile === 'sedento_de_sentido',
    },
    {
      label: 'Santos',
      description: 'Vidas e ensinamentos dos heróis da fé',
      icon: Icons.Saints,
      route: AppRoute.SAINTS,
      gradient: 'from-secondary/5 to-transparent',
      iconColor: 'text-secondary',
      borderColor: 'border-border hover:border-secondary/50',
      suggested: true,
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
  ], [nextUp, t, spiritualProfile]);

  if (isLoading && !spiritualProfile && activeJourneys.length === 0) {
    return <DashboardSkeleton />;
  }


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
              {profile?.name ? `${greeting}, ${profile.name.split(' ')[0]}!` : t('pax_et_bonum')}
            </h1>
            {spProfile && (
              <p className="text-sm text-muted-foreground italic font-serif mt-1">{spProfile.greeting}</p>
            )}
          </div>

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

      {/* ═══ GUIDE LINK ═══ */}
      <FadeUp delay={0.02}>
        <div 
          onClick={() => goTo(AppRoute.MODULES_GUIDE)}
          className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors group focus-visible:ring-2 focus-visible:ring-primary outline-none"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && goTo(AppRoute.MODULES_GUIDE)}
          aria-label="Abrir guia dos módulos"

        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Icons.HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-tight">Guia dos Módulos</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Entenda como navegar e usar a plataforma</p>
            </div>
          </div>
          <Icons.ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
        </div>
      </FadeUp>

      {/* ═══ MAIN DOORS 🚪 ═══ */}
      <FadeUp delay={0.05}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MAIN_DOORS.map((door, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => goTo(door.route)}
              className={`relative overflow-hidden p-5 rounded-3xl border ${door.borderColor} bg-gradient-to-br ${door.gradient} backdrop-blur-sm cursor-pointer transition-all shadow-sm hover:shadow-xl group focus-visible:ring-2 focus-visible:ring-primary outline-none`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && goTo(door.route)}
              aria-label={`Abrir ${door.label}`}

            >
              {door.suggested && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-[8px] font-black uppercase tracking-tighter shadow-sm animate-pulse">
                  <Icons.Star className="w-2 h-2 fill-current" /> Sugerido
                </div>
              )}
              <div className={`w-12 h-12 rounded-2xl bg-background flex items-center justify-center ${door.iconColor} group-hover:scale-110 transition-transform mb-4 shadow-md border border-border/50`}>
                <door.icon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{door.label}</h3>
                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight opacity-80">{door.description}</p>
              </div>
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Icons.ChevronRight className="w-4 h-4 text-primary/40" />
              </div>
            </motion.div>
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
            className="p-5 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background cursor-pointer hover:border-primary/40 transition-all shadow-sm hover:shadow-md flex items-center justify-between group focus-visible:ring-2 focus-visible:ring-primary outline-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && goTo(nextUp.route)}
            aria-label={`Continuar jornada: ${nextUp.label}`}

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

      {/* ═══ 3. QUIZ ESPIRITUAL (SE NÃO TIVER PERFIL) ═══ */}
      {!spiritualProfile && (
        <FadeUp delay={0.15}>
          <SpiritualQuiz />
        </FadeUp>
      )}

      {/* ═══ 4. NEXUS BUBBLES ═══ */}
      <FadeUp delay={0.2}>
        <NexusBubbles />
      </FadeUp>

      {/* ═══ 5. PRO SHOWCASE ═══ */}
      {!profile?.is_premium && (
        <FadeUp delay={0.25}>
          <ProShowcase />
        </FadeUp>
      )}

      </div>

      {/* ═══ SIDEBAR DESKTOP (STATS & INFO) ═══ */}
      <aside className="desktop-aside space-y-6 hidden xl:block">
        <div className="desktop-card space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary opacity-80">Estatísticas Semanais</h3>
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
        
        {/* Quick Donation */}
        <FadeUp delay={0.3}>
          <QuickDonation />
        </FadeUp>

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
