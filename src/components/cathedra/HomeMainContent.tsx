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
      {/* 1. CONTINUAR LEITURA - HIGH PRIORITY JOURNEY */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both w-full">
        <h2 className="sr-only">Sua Jornada de Leitura</h2>
        <SectionHeader 
          title="Sua Jornada" 
          subtitle="Onde a alma parou para contemplar."
          className="header-margin-rhythm"
        />
        <div className="w-full max-w-4xl mx-auto">
          <ReadingProgressSection />
        </div>
      </section>

      {/* 2. PORTAL SAGRADO - CORE MODULES */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both w-full">
        <h2 className="sr-only">Biblioteca Sagrada</h2>
        <SectionHeader 
          title="Biblioteca Sagrada" 
          subtitle="Bíblia, Catecismo e Magistério."
          className="header-margin-rhythm"
        />
        <HomeMainDoors t={t} />
      </section>

      {/* 3. RITUAL DO DIA */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-450 fill-mode-both w-full">
        <h2 className="sr-only">Ritual do Dia</h2>
        <SectionHeader 
          title="Ritual do Dia" 
          subtitle="A oração que santifica o tempo."
          className="header-margin-rhythm"
        />
        <RitualDoDia />
      </section>

      {/* 4. LOGOS IA - INTELLIGENT COMPANION */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-600 fill-mode-both w-full max-w-4xl mx-auto">
        <h2 className="sr-only">Logos IA</h2>
        <SectionHeader 
          title="Logos IA" 
          subtitle="Inteligência artificial a serviço da sua fé."
          className="header-margin-rhythm"
        />
        
        <CathedraCard
          ref={logosCardRef}
          variant="glass"
          padding="none"
          className="flex flex-col items-center justify-center gap-6 group border-none shadow-none bg-primary/[0.01] rounded-[2rem] p-8 md:p-12"
        >
          <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/[0.02] border border-primary/[0.05] flex items-center justify-center text-primary/40 group-hover:scale-105 group-hover:bg-primary/[0.05] transition-all duration-1000">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8" strokeWidth={0.5} />
          </div>
          
          <form onSubmit={handleLogosSearch} className="relative z-10 w-full max-w-2xl">
            <div className="relative group/input">
              <Input
                ref={logosInputRef}
                value={logosQuery}
                onChange={(e) => setLogosQuery(e.target.value)}
                placeholder="Pergunte sobre a fé..."
                className="h-14 md:h-20 pl-14 md:pl-16 pr-14 md:pr-16 rounded-full border-primary/[0.1] bg-background/40 focus:bg-background/80 transition-all text-sm md:text-base placeholder:text-muted-foreground/30 font-serif italic focus:ring-1 focus:ring-primary/20 shadow-sm"
                aria-label="Logos IA: Pergunte sobre a fé"
              />
              <MessageSquare className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40 transition-colors" />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-16 md:h-16 rounded-full bg-primary/10 text-primary/60 hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center group/btn outline-none"
              >
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </CathedraCard>
      </section>

      {/* 5. SPIRITUAL CONTINUITY & FAVORITES (PLACEHOLDER FOR MORE) */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-750 fill-mode-both w-full">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <CathedraButton 
              variant="outline" 
              className="h-24 md:h-32 rounded-[2rem] border-primary/[0.05] hover:bg-primary/[0.02] flex flex-col items-center justify-center gap-2"
              onClick={() => navigate(AppRoute.FAVORITES)}
            >
              <Icons.Heart className="w-5 h-5 text-primary/40" strokeWidth={1} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Favoritos</span>
            </CathedraButton>

            <CathedraButton 
              variant="outline" 
              className="h-24 md:h-32 rounded-[2rem] border-primary/[0.05] hover:bg-primary/[0.02] flex flex-col items-center justify-center gap-2"
              onClick={() => navigate('/settings')}
            >
              <Icons.Settings className="w-5 h-5 text-primary/40" strokeWidth={1} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Configurações</span>
            </CathedraButton>
         </div>
      </section>

      {/* 6. EM BREVE - FUTURE EXPANSIONS */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-900 fill-mode-both opacity-40 hover:opacity-100 transition-opacity duration-1500 w-full">
        <h2 className="sr-only">Futuras Expansões</h2>
        <SectionHeader 
          title="Biblioteca" 
          subtitle="Documentos e fontes secundárias."
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