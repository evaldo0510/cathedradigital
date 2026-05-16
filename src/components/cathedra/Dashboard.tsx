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
import QuickDonation from './QuickDonation';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardSkeleton } from './DashboardSkeleton';
import { HomeCard } from './HomeCard';
import { HomeButton } from './HomeButton';
import { CathedraIcon, IconSizePreset } from './CathedraIcon';

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
      label: t('saints_label'),
      description: t('saints_desc') || 'Vidas e ensinamentos dos heróis da fé',
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
    {
      label: t('catechism'),
      description: t('catechism_sub') || 'Doutrina e ensinamentos da Igreja',
      icon: Icons.Catechism,
      route: AppRoute.CATECHISM,
      gradient: 'from-secondary/5 to-transparent',
      iconColor: 'text-secondary',
      borderColor: 'border-border hover:border-secondary/50',
      suggested: true,
    },
  ], [nextUp, t, spiritualProfile]);

  if (isLoading && !spiritualProfile && activeJourneys.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="app-container desktop-layout py-20 md:py-32">
      <div className="desktop-main stack-spacing">
      <FadeUp>
        <div className="text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="flex justify-center"
          >
            <div className="relative">
              <Icons.Logo className="w-16 h-16 text-primary" variant="blue" />
            </div>
          </motion.div>
          <div className="space-y-6">
            <p className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-secondary/60">
              Cathedra {t('digital')}
            </p>
            <h1 className="text-6xl md:text-8xl font-display font-medium text-primary leading-[1] tracking-tighter">
              {profile?.name ? `${greeting}, ${profile.name.split(' ')[0]}` : t('pax_et_bonum')}
            </h1>
            {spProfile && (
              <p className="text-xl text-primary/40 italic font-serif mt-6 opacity-70 max-w-2xl mx-auto leading-relaxed">{spProfile.greeting}</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap pt-8">
            {streak > 0 && (
              <div className="flex items-center gap-3 px-6 sm:px-8 py-4 rounded-full bg-secondary/[0.03] border border-secondary/20 shadow-premium transition-all hover:bg-secondary/[0.06] hover:-translate-y-1">
                <Icons.Zap size={16} className="text-secondary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{streak} {streak === 1 ? t('day') : t('days')}</span>
              </div>
            )}
            <div className="flex items-center gap-3 px-6 sm:px-8 py-4 rounded-full bg-primary/[0.03] border border-border/40 shadow-premium transition-all hover:bg-primary/[0.06] hover:-translate-y-1">
              <Icons.Star size={16} className="text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{profile?.xp || 0} XP</span>
            </div>
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.05}>
        <HomeCard 
          onClick={() => goTo(AppRoute.MODULES_GUIDE)}
          className="p-6 flex items-center justify-between cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label="Ver Guia dos Módulos"
          onKeyDown={(e) => e.key === 'Enter' && goTo(AppRoute.MODULES_GUIDE)}
        >
          <div className="flex items-center gap-5">
            <CathedraIcon icon={Icons.HelpCircle} size={IconSizePreset.ACTION} variant="primary" />
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">Guia dos Módulos</p>
              <p className="text-premium-tiny text-muted-foreground mt-1 opacity-70 group-hover:opacity-100 transition-opacity">Entenda como navegar e usar a plataforma</p>
            </div>
          </div>
          <Icons.ChevronRight className="w-5 h-5 text-primary/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </HomeCard>
      </FadeUp>

      <FadeUp delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {MAIN_DOORS.map((door, idx) => (
            <HomeCard
              key={idx}
              onClick={() => goTo(door.route)}
              role="button"
              tabIndex={0}
              aria-label={`Abrir ${door.label}`}
              onKeyDown={(e) => e.key === 'Enter' && goTo(door.route)}
              className="relative overflow-hidden p-8 cursor-pointer group flex flex-col items-center text-center gap-5"
            >
              {door.suggested && (
                <div className="absolute top-4 right-4 flex items-center gap-1 p-1.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 shadow-sm">
                  <Icons.Star size={12} className="fill-current" />
                </div>
              )}
              <CathedraIcon icon={door.icon} size={IconSizePreset.CARD_HEADER} variant={door.iconColor.includes('secondary') ? 'secondary' : 'primary'} />
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-[0.25em] group-hover:text-primary transition-colors">{door.label}</h3>
                <p className="text-premium-tiny text-muted-foreground line-clamp-2 leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity px-1">{door.description}</p>
              </div>
            </HomeCard>
          ))}
        </div>
      </FadeUp>

      <FadeUp delay={0.15}>
        <div className="max-w-4xl mx-auto w-full">
          <RitualDoDia />
        </div>
      </FadeUp>

      {nextUp && (
        <FadeUp delay={0.18}>
          <HomeCard 
            onClick={() => goTo(nextUp.route)}
            className="p-8 cursor-pointer flex items-center justify-between group"
            role="button"
            tabIndex={0}
            aria-label={`Continuar ${nextUp.label}`}
            onKeyDown={(e) => e.key === 'Enter' && goTo(nextUp.route)}
          >
            <div className="flex items-center gap-6">
              <CathedraIcon 
                icon={nextUp.type === 'bible' ? Icons.Bible : nextUp.type === 'catechism' ? Icons.Cross : Icons.Flame} 
                size={IconSizePreset.CARD_HEADER} 
                variant="primary" 
              />
              <div className="text-left space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary/60">{nextUp.subtitle}</p>
                <h3 className="text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{nextUp.label}</h3>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border border-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-soft">
              <Icons.ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </HomeCard>
        </FadeUp>
      )}

      {!spiritualProfile && (
        <FadeUp delay={0.15}>
          <SpiritualQuiz />
        </FadeUp>
      )}

      <FadeUp delay={0.2}>
        <NexusBubbles profileId={spiritualProfile as ProfileId} />
      </FadeUp>

      </div>

      <aside className="desktop-aside space-y-6 hidden xl:block">
        <div className="desktop-card space-y-6">
          <h3 className="text-premium-tiny font-bold uppercase tracking-[0.3em] text-secondary opacity-60">Estatísticas Semanais</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-medium text-primary tracking-tighter">{weeklyStats.chaptersRead}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('bible')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-medium text-primary tracking-tighter">{weeklyStats.catechismParagraphs}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CIC</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-medium text-primary tracking-tighter">{weeklyStats.journeySteps}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('journeys')}</p>
            </div>
          </div>
        </div>
        
        <FadeUp delay={0.3}>
          <QuickDonation />
        </FadeUp>

        <div className="desktop-card space-y-6 border-secondary/10 bg-secondary/[0.02]">
          <div className="w-10 h-0.5 bg-secondary/30 rounded-full" />
          <p className="text-lg font-serif italic text-primary/90 leading-relaxed">
            {dailyQuote.text}
          </p>
          <p className="text-premium-tiny font-bold uppercase tracking-[0.3em] text-secondary/80">
            — {dailyQuote.author}
          </p>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;
