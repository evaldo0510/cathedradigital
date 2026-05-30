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
import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardSkeleton } from './DashboardSkeleton';
import { CathedraCard } from './CathedraCard';
import { SpiritualContinuity } from './SpiritualContinuity';

interface DashboardProps {
  user: User | null;
}

const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useLang();
  const goTo = useCallback((route: string) => navigate(route), [navigate]);

  const { spiritualProfile, isLoading } = useDashboardData(user);

  if (isLoading && !spiritualProfile) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="app-container py-xl md:py-4xl max-w-4xl mx-auto">
      <div className="stack-spacing-lg">
        
        {/* Welcome Section - Reduced Height */}
        <FadeUp>
          <header className="text-center space-y-4 mb-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/30">
              Cathedra Digital
            </p>
            <h1 className="text-3xl md:text-6xl font-display font-light text-primary tracking-tight">
              {profile?.name ? `Salve, ${profile.name.split(' ')[0]}` : t('pax_et_bonum')}
            </h1>
          </header>
        </FadeUp>

        {/* Essential Continuity */}
        <FadeUp delay={0.1}>
          <SpiritualContinuity profile={profile} />
        </FadeUp>

        {/* Heart of the Experience: Daily Ritual */}
        <FadeUp delay={0.2}>
          <section className="space-y-8">
            <div className="flex items-center gap-md opacity-20 px-md">
              <div className="h-px flex-1 bg-primary/20" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Ritual do Dia</span>
              <div className="h-px flex-1 bg-primary/20" />
            </div>
            <RitualDoDia />
          </section>
        </FadeUp>

        {/* Sacred Library Access - Simplified Doors */}
        <FadeUp delay={0.3}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md mt-2xl">
            {[
              { label: t('bible'), icon: Icons.Bible, route: AppRoute.BIBLE },
              { label: t('catechism'), icon: Icons.Catechism, route: AppRoute.CATECHISM },
              { label: 'Magistério', icon: Icons.ScrollText, route: AppRoute.MAGISTERIUM },
              { label: 'Logos IA', icon: Icons.Sparkles, route: '/logos' },
            ].map((item) => (
              <CathedraCard
                key={item.label}
                variant="interactive"
                padding="sm"
                onClick={() => goTo(item.route)}
                className="flex flex-col items-center justify-center gap-md py-xl group border-primary/[0.02] bg-primary/[0.005]"
              >
                <item.icon className="w-lg h-lg text-primary/20 group-hover:text-primary/60 transition-colors" strokeWidth={1} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40 group-hover:text-primary transition-colors">
                  {item.label}
                </span>
              </CathedraCard>
            ))}
          </div>
        </FadeUp>

        {/* Secondary Content - Subdued */}
        <FadeUp delay={0.4}>
          <div className="opacity-40 hover:opacity-100 transition-opacity duration-1000">
            <NexusBubbles profileId={spiritualProfile as ProfileId} />
          </div>
        </FadeUp>

        {!spiritualProfile && (
          <FadeUp delay={0.5}>
            <SpiritualQuiz />
          </FadeUp>
        )}
      </div>
    </div>
  );
};

export default Dashboard;