import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Icons } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { SpiritualContinuity } from './SpiritualContinuity';
import { CathedraCard } from './CathedraCard';
import { CathedraButton } from './CathedraButton';
import { useSaintsToday } from '@/hooks/useSaints';

interface HomeMainContentProps {
  user: any;
  profile: any;
  onNavigate: (route: string) => void;
  t: (key: string) => string;
}

const HomeMainContent: React.FC<HomeMainContentProps> = React.memo(({ user, profile, onNavigate, t }) => {
  const navigate = useNavigate();
  const [logosQuery, setLogosQuery] = useState('');
  const logosInputRef = useRef<HTMLInputElement>(null);
  const logosCardRef = useRef<HTMLDivElement>(null);
  const { data: saintsToday } = useSaintsToday();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const handleLogosSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = logosQuery.trim();
    if (!query) return;
    navigate(`/buscar?q=${encodeURIComponent(query)}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className="w-full space-y-spacing-2xl md:space-y-spacing-4xl flex flex-col items-center" 
    >
      {/* 1. SAUDAÇÃO PERSONALIZADA (Monastery Style) */}
      <header className="w-full text-center space-y-spacing-xs py-spacing-md">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">
          Mosteiro Digital
        </p>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary">
          {greeting}, {profile?.name?.split(' ')[0] || 'Peregrino'}.
        </h1>
        {saintsToday && saintsToday.length > 0 && (
          <p className="text-premium-sm text-muted-foreground italic font-serif">
            Hoje a Igreja celebra: <span className="text-primary/70">{saintsToday[0].name}</span>
          </p>
        )}
      </header>

      {/* 2. BUSCA INTELIGENTE (Cérebro do Cathedra) */}
      <section className="w-full max-w-2xl">
        <CathedraCard
          ref={logosCardRef}
          variant="glass"
          padding="none"
          className="rounded-premium-full p-spacing-xs border-primary/5 shadow-premium-sm"
        >
          <form onSubmit={handleLogosSearch} className="w-full">
            <div className="relative group/input">
              <Input
                ref={logosInputRef}
                value={logosQuery}
                onChange={(e) => setLogosQuery(e.target.value)}
                placeholder="Logos: Bíblia, Santos, Doutrina..."
                className="h-spacing-3xl pl-spacing-3xl pr-spacing-3xl rounded-premium-full border-none bg-transparent text-premium-md placeholder:text-muted-foreground/30 font-serif italic focus:ring-0 shadow-none"
              />
              <Icons.Search className="absolute left-spacing-lg top-1/2 -translate-y-1/2 w-spacing-md h-spacing-md text-primary/20 group-focus-within/input:text-primary/40 transition-colors" />
            </div>
          </form>
        </CathedraCard>
      </section>

      {/* 3. CONTINUIDADE ESPIRITUAL */}
      <section className="w-full">
        <SpiritualContinuity profile={profile} />
      </section>

      {/* 4. AÇÕES MONÁSTICAS (Rituais Rápidos) */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-spacing-md">
        <CathedraCard 
          variant="interactive"
          className="flex flex-col items-center text-center p-spacing-xl group"
          onClick={() => onNavigate('/rezar')}
        >
          <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 mb-spacing-md">
            <Icons.PrayingHands className="w-6 h-6" />
          </div>
          <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/40 mb-1">Reze Agora</h2>
          <span className="text-premium-xs text-muted-foreground italic font-serif">Sanctificatio</span>
        </CathedraCard>

        <CathedraCard 
          variant="interactive"
          className="flex flex-col items-center text-center p-spacing-xl group"
          onClick={() => onNavigate('/biblia')}
        >
          <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 mb-spacing-md">
            <Icons.Clock className="w-6 h-6" />
          </div>
          <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/40 mb-1">5 Minutos</h2>
          <span className="text-premium-xs text-muted-foreground italic font-serif">Lectio Brevis</span>
        </CathedraCard>

        <CathedraCard 
          variant="interactive"
          className="flex flex-col items-center text-center p-spacing-xl group"
          onClick={() => onNavigate('/contemplatio')}
        >
          <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 mb-spacing-md">
            <Icons.Mountain className="w-6 h-6" />
          </div>
          <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/40 mb-1">Silêncio</h2>
          <span className="text-premium-xs text-muted-foreground italic font-serif">Silentium</span>
        </CathedraCard>
      </section>

      {/* 5. NÚCLEO SAGRADO (Acesso Direto) */}
      <section className="w-full pt-spacing-xl border-t border-primary/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-spacing-sm">
          {[
            { label: 'Bíblia', route: AppRoute.BIBLE, icon: Icons.Bible },
            { label: 'Catecismo', route: AppRoute.CATECHISM, icon: Icons.Catechism },
            { label: 'Biblioteca', route: '/acervo', icon: Icons.Library },
            { label: 'Jornadas', route: AppRoute.JORNADAS, icon: Icons.Route },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate(item.route)}
              className="flex flex-col items-center gap-2 p-4 rounded-premium hover:bg-primary/5 transition-colors group"
            >
              <item.icon className="w-5 h-5 text-primary/20 group-hover:text-primary transition-colors" />
              <h3 className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/30 group-hover:text-primary/60">{item.label}</h3>
            </button>
          ))}
        </div>
      </section>
    </motion.div>
  );
});

HomeMainContent.displayName = 'HomeMainContent';

export default HomeMainContent;
