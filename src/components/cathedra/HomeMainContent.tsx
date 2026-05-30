import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';

import HomeMainDoors from './HomeMainDoors';
import RitualDoDia from './RitualDoDia';
import { ReadingProgressSection } from './ReadingProgressSection';
import { ComingSoonSection } from './ComingSoon';
import { Input } from '@/components/ui/input';
import { Sparkles, ArrowRight, MessageSquare, User, Settings, Heart } from 'lucide-react';
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
    <div id="main-content" className="w-full max-w-[var(--layout-max-width)] mx-auto space-y-12 md:space-y-24 pb-16 md:pb-32 px-[var(--space-mobile-padding)] md:px-14 lg:px-24 xl:px-32 outline-none flex flex-col items-center lg:items-stretch" tabIndex={-1}>
      {/* 1. CONTINUAR LEITURA - PRIMARY JOURNEY */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both w-full">
        <div className="w-full max-w-4xl mx-auto">
          <SpiritualContinuity />
        </div>
      </section>

      {/* 2. NÚCLEO SAGRADO - CORE FOCUS */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both w-full py-12">
        <h2 className="sr-only">Núcleo Sagrado</h2>
        <div className="flex flex-col items-center gap-16 md:gap-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 w-full max-w-5xl mx-auto">
            <CathedraButton 
              variant="outline" 
              className="group h-auto p-12 md:p-16 rounded-[3rem] border-primary/[0.03] hover:border-primary/20 hover:bg-primary/[0.01] transition-all duration-1000 flex flex-col items-center gap-8 shadow-none"
              onClick={() => onNavigate(AppRoute.BIBLE)}
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-primary/20 group-hover:text-primary transition-all duration-1000 border border-primary/[0.05] bg-primary/[0.01]">
                <Icons.Bible className="w-10 h-10 md:w-12 md:h-12" strokeWidth={0.5} />
              </div>
              <div className="space-y-3">
                <span className="block text-[11px] font-black uppercase tracking-[0.5em] text-primary/30 group-hover:text-primary transition-colors">Bíblia</span>
                <span className="block text-xs text-muted-foreground/30 font-serif italic italic">A Palavra de Deus</span>
              </div>
            </CathedraButton>

            <CathedraButton 
              variant="outline" 
              className="group h-auto p-12 md:p-16 rounded-[3rem] border-primary/[0.03] hover:border-primary/20 hover:bg-primary/[0.01] transition-all duration-1000 flex flex-col items-center gap-8 shadow-none"
              onClick={() => onNavigate(AppRoute.CATECHISM)}
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-primary/20 group-hover:text-primary transition-all duration-1000 border border-primary/[0.05] bg-primary/[0.01]">
                <Icons.Catechism className="w-10 h-10 md:w-12 md:h-12" strokeWidth={0.5} />
              </div>
              <div className="space-y-3">
                <span className="block text-[11px] font-black uppercase tracking-[0.5em] text-primary/30 group-hover:text-primary transition-colors">Catecismo</span>
                <span className="block text-xs text-muted-foreground/30 font-serif italic italic">Doutrina e Fé</span>
              </div>
            </CathedraButton>
          </div>

          <CathedraButton 
            variant="ghost" 
            className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/20 hover:text-primary transition-all"
            onClick={() => onNavigate(AppRoute.MAGISTERIUM)}
          >
            Acessar Magistério →
          </CathedraButton>
        </div>
      </section>

      {/* 3. LOGOS IA - SMART SEARCH */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both w-full max-w-3xl mx-auto py-12">
        <CathedraCard
          ref={logosCardRef}
          variant="glass"
          padding="none"
          className="flex flex-col items-center justify-center gap-6 group border-none shadow-none bg-primary/[0.005] rounded-[2.5rem] p-10 md:p-16"
        >
          <form onSubmit={handleLogosSearch} className="relative z-10 w-full">
            <div className="relative group/input">
              <Input
                ref={logosInputRef}
                value={logosQuery}
                onChange={(e) => setLogosQuery(e.target.value)}
                placeholder="Busca Inteligente Logos..."
                className="h-16 md:h-20 pl-16 pr-20 rounded-full border-primary/[0.05] bg-background/20 focus:bg-background/80 transition-all text-sm md:text-base placeholder:text-muted-foreground/20 font-serif italic focus:ring-1 focus:ring-primary/10 shadow-sm"
                aria-label="Logos IA: Pergunte sobre a fé"
              />
              <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/20 transition-colors" />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/[0.03] text-primary/30 hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center group/btn outline-none"
              >
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </CathedraCard>
      </section>

      {/* 4. RITUAL RÁPIDO - COMPACT ACCESS */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700 fill-mode-both w-full flex justify-center py-12">
        <CathedraButton 
          variant="ghost" 
          className="group flex items-center gap-4 px-12 py-8 rounded-full border border-primary/[0.02] hover:bg-primary/[0.01] transition-all"
          onClick={() => onNavigate(AppRoute.HOJE)}
        >
          <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
            <Icons.Sun className="w-5 h-5" strokeWidth={1} />
          </div>
          <div className="text-left">
            <span className="block text-[9px] font-black uppercase tracking-[0.4em] text-primary/30 group-hover:text-primary transition-colors">Ritual do Dia</span>
            <span className="block text-[10px] text-muted-foreground/30 font-serif italic">Sanctificatio temporis</span>
          </div>
        </CathedraButton>
      </section>
    </div>
  );
});

HomeMainContent.displayName = 'HomeMainContent';

export default HomeMainContent;