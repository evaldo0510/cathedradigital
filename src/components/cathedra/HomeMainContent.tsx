import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';

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
    <div className="w-full space-y-16 md:space-y-24 outline-none flex flex-col items-center" tabIndex={-1}>
      {/* 1. CONTINUAR LEITURA - PRIMARY JOURNEY */}
      <section className="w-full max-w-4xl">
        <SpiritualContinuity />
      </section>

      {/* 2. NÚCLEO SAGRADO - CORE FOCUS */}
      <section className="w-full">
        <h2 className="sr-only">Núcleo Sagrado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 w-full max-w-4xl mx-auto">
          <CathedraCard 
            variant="interactive"
            className="group flex flex-col items-center gap-8 py-12"
            onClick={() => onNavigate(AppRoute.BIBLE)}
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-primary/20 group-hover:text-primary transition-all duration-1000 border border-primary/[0.05] bg-primary/[0.01] group-hover:bg-primary/[0.02] group-hover:scale-110">
              <Icons.Bible className="w-8 h-8 md:w-10 md:h-10" strokeWidth={0.3} />
            </div>
            <div className="space-y-3 text-center">
              <span className="block text-[11px] font-black uppercase tracking-[0.5em] text-primary/30 group-hover:text-primary transition-all duration-700">Bíblia</span>
              <span className="block text-[11px] text-muted-foreground/30 font-serif italic tracking-widest">A Palavra de Deus</span>
            </div>
          </CathedraCard>

          <CathedraCard 
            variant="interactive"
            className="group flex flex-col items-center gap-8 py-12"
            onClick={() => onNavigate(AppRoute.CATECHISM)}
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-primary/20 group-hover:text-primary transition-all duration-1000 border border-primary/[0.05] bg-primary/[0.01] group-hover:bg-primary/[0.02] group-hover:scale-110">
              <Icons.Catechism className="w-8 h-8 md:w-10 md:h-10" strokeWidth={0.3} />
            </div>
            <div className="space-y-3 text-center">
              <span className="block text-[11px] font-black uppercase tracking-[0.5em] text-primary/30 group-hover:text-primary transition-all duration-700">Catecismo</span>
              <span className="block text-[11px] text-muted-foreground/30 font-serif italic tracking-widest">Doutrina e Fé</span>
            </div>
          </CathedraCard>
        </div>

        <div className="flex justify-center mt-12">
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
      <section className="w-full max-w-2xl mx-auto">
        <CathedraCard
          ref={logosCardRef}
          variant="glass"
          padding="none"
          className="rounded-full p-2 border-primary/5"
        >
          <form onSubmit={handleLogosSearch} className="relative z-10 w-full">
            <div className="relative group/input">
              <Input
                ref={logosInputRef}
                value={logosQuery}
                onChange={(e) => setLogosQuery(e.target.value)}
                placeholder="Logos IA: Pergunte sobre a Fé..."
                className="h-16 md:h-20 pl-16 pr-20 rounded-full border-none bg-transparent transition-all duration-700 text-sm md:text-lg placeholder:text-muted-foreground/20 font-serif italic focus:ring-0 shadow-none"
                aria-label="Logos IA: Pergunte sobre a fé"
              />
              <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/10 group-focus-within/input:text-primary/30 transition-all duration-700" />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/[0.01] text-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-500 flex items-center justify-center group/btn outline-none"
              >
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover/btn:translate-x-1 transition-transform" />
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
          className="rounded-full border-primary/[0.02]"
          onClick={() => onNavigate(AppRoute.HOJE)}
        >
          <div className="flex items-center gap-6 px-10 py-5 group">
            <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
              <Icons.Sun className="w-5 h-5" strokeWidth={1} />
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