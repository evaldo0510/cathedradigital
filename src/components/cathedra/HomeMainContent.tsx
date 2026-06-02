import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';

import { Input } from '@/components/ui/input';

import { SectionHeader } from './SectionHeader';
import { SpiritualContinuity } from './SpiritualContinuity';
import { CathedraButton } from './CathedraButton';
import { CathedraCard } from './CathedraCard';
import { Icons } from '@/constants';


import { useAuth } from '@/hooks/useAuth';

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        if (logosCardRef.current) {
          logosCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          logosCardRef.current.classList.add('ring-4', 'ring-primary/20', 'scale-[1.01]');
          setTimeout(() => {
            logosCardRef.current?.classList.remove('ring-4', 'ring-primary/20', 'scale-[1.01]');
            logosInputRef.current?.focus();
          }, 400);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogosSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (logosQuery.trim()) {
      const savedMessages = localStorage.getItem('cathedra_logos_messages');
      const messages = savedMessages ? JSON.parse(savedMessages) : [];
      const newMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: logosQuery,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('cathedra_logos_messages', JSON.stringify([...messages, newMessage]));
      
      navigate(`${AppRoute.BUSCAR}?q=${encodeURIComponent(logosQuery)}`);
    }
  };

  return (
    <div className="w-full space-y-spacing-xl md:space-y-spacing-4xl outline-none flex flex-col items-center" tabIndex={-1}>
      {/* 1. CONTINUAR LEITURA - PRIMARY JOURNEY */}
      <section className="w-full">
        <SpiritualContinuity />
      </section>

      {/* 2. NÚCLEO SAGRADO - CORE FOCUS */}
      <section className="w-full">
        <h2 className="sr-only">Núcleo Sagrado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg md:gap-spacing-xl w-full mx-auto">
          <CathedraCard 
            variant="interactive"
            className="group flex flex-col items-center gap-spacing-xl py-spacing-2xl"
            onClick={() => onNavigate(AppRoute.BIBLE)}
          >
            <div className="w-spacing-3xl h-spacing-3xl md:w-spacing-3xl md:h-spacing-3xl rounded-premium-full flex items-center justify-center text-primary/20 group-hover:text-primary transition-all duration-1000 border border-primary/[0.05] bg-primary/[0.01] group-hover:bg-primary/[0.02] group-hover:scale-110">
              <Icons.Bible className="w-spacing-xl h-spacing-xl md:w-spacing-xl md:h-spacing-xl" strokeWidth={0.3} />
            </div>
            <div className="space-y-spacing-sm text-center">
              <span className="block text-[11px] font-black uppercase tracking-[0.5em] text-primary/30 group-hover:text-primary transition-all duration-700">Bíblia</span>
              <span className="block text-[11px] text-muted-foreground/30 font-serif italic tracking-widest">A Palavra de Deus</span>
            </div>
          </CathedraCard>

          <CathedraCard 
            variant="interactive"
            className="group flex flex-col items-center gap-spacing-xl py-spacing-2xl"
            onClick={() => onNavigate(AppRoute.CATECHISM)}
          >
            <div className="w-spacing-3xl h-spacing-3xl md:w-spacing-3xl md:h-spacing-3xl rounded-premium-full flex items-center justify-center text-primary/20 group-hover:text-primary transition-all duration-1000 border border-primary/[0.05] bg-primary/[0.01] group-hover:bg-primary/[0.02] group-hover:scale-110">
              <Icons.Catechism className="w-spacing-xl h-spacing-xl md:w-spacing-xl md:h-spacing-xl" strokeWidth={0.3} />
            </div>
            <div className="space-y-spacing-sm text-center">
              <span className="block text-[11px] font-black uppercase tracking-[0.5em] text-primary/30 group-hover:text-primary transition-all duration-700">Catecismo</span>
              <span className="block text-[11px] text-muted-foreground/30 font-serif italic tracking-widest">Doutrina e Fé</span>
            </div>
          </CathedraCard>
        </div>

        <div className="flex justify-center mt-spacing-2xl">
          <CathedraButton 
            variant="ghost" 
            className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/20 hover:text-primary transition-all"
            onClick={() => onNavigate(AppRoute.MAGISTERIUM)}
          >
            Acessar Magistério →
          </CathedraButton>
        </div>
      </section>

      {/* 3. LOGOS IA - SMART SEARCH */}
      <section className="w-full mx-auto">
        <CathedraCard
          ref={logosCardRef}
          variant="glass"
          padding="none"
          className="rounded-premium-full p-spacing-xs border-primary/5"
        >
          <form onSubmit={handleLogosSearch} className="relative z-10 w-full">
            <div className="relative group/input">
              <Input
                ref={logosInputRef}
                value={logosQuery}
                onChange={(e) => setLogosQuery(e.target.value)}
                placeholder="Logos IA: Pergunte sobre a Fé..."
                className="h-spacing-3xl md:h-spacing-3xl pl-spacing-3xl pr-spacing-3xl rounded-premium-full border-none bg-transparent transition-all duration-700 text-premium-sm md:text-premium-lg placeholder:text-muted-foreground/20 font-serif italic focus:ring-0 shadow-premium-none"
                aria-label="Logos IA: Pergunte sobre a fé"
              />
              <Icons.Search className="absolute left-spacing-lg top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-primary/10 group-focus-within/input:text-primary/30 transition-all duration-700" />
              <button 
                type="submit"
                className="absolute right-spacing-xs top-spacing-2xs/2 -translate-y-1/2 w-spacing-2xl h-spacing-2xl md:w-spacing-3xl md:h-spacing-3xl rounded-premium-full bg-primary/[0.01] text-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-500 flex items-center justify-center group/btn outline-none"
              >
                <Icons.ArrowRight className="w-spacing-md h-spacing-md md:w-spacing-lg md:h-spacing-lg group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </CathedraCard>
      </section>

      {/* 4. RITUAL RÁPIDO - COMPACT ACCESS */}
      <section className="w-full flex justify-center">
        <CathedraCard
          variant="interactive"
          padding="none"
          className="rounded-premium-full border-primary/[0.02]"
          onClick={() => onNavigate(AppRoute.HOJE)}
        >
          <div className="flex items-center gap-spacing-lg px-spacing-xl py-spacing-md group">
            <div className="w-spacing-xl h-spacing-xl rounded-premium-full bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
              <Icons.Sun className="w-spacing-md h-spacing-md" strokeWidth={1} />
            </div>
            <div className="text-left">
              <span className="block text-[8px] font-black uppercase tracking-[0.4em] text-primary/30 group-hover:text-primary transition-colors">Ritual do Dia</span>
              <span className="block text-[9px] text-muted-foreground/30 font-serif italic">Sanctificatio temporis</span>
            </div>
          </div>
        </CathedraCard>
      </section>
    </div>
  );
});

HomeMainContent.displayName = 'HomeMainContent';

export default HomeMainContent;