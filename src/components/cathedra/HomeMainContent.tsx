import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';

import HomeMainDoors from './HomeMainDoors';
import RitualDoDia from './RitualDoDia';
import { ReadingProgressSection } from './ReadingProgressSection';
import { ComingSoonSection } from './ComingSoon';
import { Input } from '@/components/ui/input';
import { Sparkles, ArrowRight, MessageSquare, User } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { SpiritualContinuity } from './SpiritualContinuity';
import { CathedraButton } from './CathedraButton';
import { CathedraCard } from './CathedraCard';

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
    <div id="main-content" className="w-full max-w-[var(--layout-max-width)] mx-auto stack-rhythm-lg pb-10 md:pb-[32rem] px-[var(--space-mobile-padding)] md:px-14 lg:px-24 xl:px-32 outline-none flex flex-col items-center lg:items-stretch" tabIndex={-1}>
      {/* 2. CONTINUAR LEITURA - PERSONAL PROGRESS (MOVED TO TOP FOR PRIORITY) */}
      <section className="animate-in fade-in slide-in-from-top-8 duration-1000 delay-150 fill-mode-both w-full">
        <h2 className="sr-only">Sua Jornada de Leitura</h2>
        <SectionHeader 
          align="left"
          title="Sua Jornada" 
          subtitle="Continue de onde a alma parou."
          className="header-margin-rhythm"
        />
        <CathedraCard variant="outline" padding="none" className="p-2 md:p-12 border-primary/[0.005] bg-transparent">
          <ReadingProgressSection />
        </CathedraCard>
      </section>

      {/* 4. BIBLIOTECA - THE CORE SOURCES */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both w-full">
        <h2 className="sr-only">Fontes de Sabedoria</h2>
        <SectionHeader 
          title="Biblioteca Sagrada" 
          subtitle="Bíblia, Catecismo e Magistério."
          className="header-margin-rhythm"
        />
        <div className="p-0.5 md:p-20">
          <HomeMainDoors t={t} />
        </div>
      </section>

      {/* 1. RITUAL DO DIA */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-450 fill-mode-both w-full">
        <h2 className="sr-only">Ritual</h2>
        <CathedraCard padding="none" className="p-1 md:p-12 border-transparent shadow-none bg-transparent">
          <RitualDoDia />
        </CathedraCard>
      </section>

      {/* VISUAL PAUSE */}
      <div className="py-4 md:py-48 flex flex-col items-center gap-2 opacity-[0.02] select-none pointer-events-none">
        <Sparkles className="w-3 h-3 text-primary/10" strokeWidth={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-48 lg:gap-64 w-full">
        {/* 2. CONTINUAR LEITURA - PERSONAL PROGRESS */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both flex flex-col">
          <h2 className="sr-only">Sua Jornada de Leitura</h2>
          <SectionHeader 
            align="left"
            title="Sua Jornada" 
            subtitle="Onde a alma parou para contemplar."
            className="header-margin-rhythm"
          />
          <CathedraCard variant="outline" padding="none" className="flex-1 p-3 md:p-24 lg:p-32 border-primary/[0.002] bg-transparent">
            <ReadingProgressSection />
          </CathedraCard>
        </section>

        {/* 3. LOGOS IA - INTELLIGENT COMPANION */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both flex flex-col">
          <h2 className="sr-only">Logos IA</h2>
          <SectionHeader 
            align="left"
            title="Logos IA" 
            subtitle="Inteligência artificial a serviço da sua fé."
            className="header-margin-rhythm"
          />
          
          <CathedraCard
            ref={logosCardRef}
            variant="glass"
            padding="none"
            className="flex-1 p-3 md:p-8 flex flex-col items-center justify-center gap-4 md:gap-8 group border-primary/[0.005] shadow-none bg-transparent"
          >
            <div className="relative z-10 w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/[0.005] border border-primary/[0.01] flex items-center justify-center text-primary/30 group-hover:scale-105 group-hover:bg-primary/[0.01] transition-all duration-1000">
              <Sparkles className="w-5 h-5 md:w-8 md:h-8" strokeWidth={0.3} />
            </div>
            
            <div className="relative z-10 space-y-2 text-center">
              <h3 className="text-lg md:text-2xl font-display font-medium text-primary/70 tracking-tight">Logos IA</h3>
              <p className="hidden md:block text-xs text-muted-foreground/60 leading-relaxed font-serif italic max-w-[240px] mx-auto tracking-wide">
                "Buscai e encontrareis."
              </p>
            </div>

            <form onSubmit={handleLogosSearch} className="relative z-10 w-full max-w-md">
              <div className="relative group/input">
                <Input
                  ref={logosInputRef}
                  value={logosQuery}
                  onChange={(e) => setLogosQuery(e.target.value)}
                  placeholder="Pergunte sobre a fé..."
                  className="h-10 md:h-14 pl-10 md:pl-12 pr-10 md:pr-12 rounded-full border-primary/[0.05] bg-background/20 focus:bg-background/40 transition-all text-xs md:text-sm placeholder:text-muted-foreground/30 font-serif italic focus:ring-1 focus:ring-primary/10"
                  aria-label="Logos IA: Pergunte sobre a fé"
                />
                <MessageSquare className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-primary/40 transition-colors" />
                <button 
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary/5 text-primary/40 hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center group/btn outline-none"
                >
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </CathedraCard>
        </section>
      </div>

      {/* VISUAL PAUSE - SECONDARY CADENCE */}
      <div className="py-8 md:py-[32rem] flex justify-center opacity-[0.05]">
        <div className="w-12 md:w-32 h-px bg-gradient-to-r from-transparent via-primary/3 to-transparent" />
      </div>

      {/* 4. BIBLIOTECA - REMOVED FROM ORIGINAL POSITION (ALREADY MOVED UP) */}
      

      {/* 5. EM BREVE - FUTURE EXPANSIONS */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-600 fill-mode-both opacity-30 hover:opacity-100 transition-opacity duration-1500">
        <h2 className="sr-only">Futuras Expansões</h2>
        <SectionHeader 
          title="O Futuro" 
          subtitle="Novas salas sendo preparadas para o seu santuário."
          className="header-margin-rhythm"
        />
        <div className="px-0 md:px-4 grayscale opacity-60">
          <ComingSoonSection />
        </div>
      </section>
    </div>
  );
});

HomeMainContent.displayName = 'HomeMainContent';

export default HomeMainContent;