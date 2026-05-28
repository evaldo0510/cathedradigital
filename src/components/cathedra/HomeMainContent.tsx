import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { HomeCard } from './HomeCard';
import HomeMainDoors from './HomeMainDoors';
import RitualDoDia from './RitualDoDia';
import { ReadingProgressSection } from './ReadingProgressSection';
import { ComingSoonSection } from './ComingSoon';
import { Input } from '@/components/ui/input';
import { Sparkles, ArrowRight, MessageSquare, User } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { SpiritualContinuity } from './SpiritualContinuity';
import { Button } from '@/components/ui/button';

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
    <div id="main-content" className="w-full max-w-[var(--layout-max-width)] mx-auto space-y-64 md:space-y-80 lg:space-y-96 pb-80 md:pb-[32rem] px-6 md:px-14 lg:px-24 xl:px-32 outline-none flex flex-col items-center sm:items-stretch" tabIndex={-1}>
      {/* 0. SPIRITUAL CONTINUITY - WELCOME BACK */}
      <section className="animate-in fade-in slide-in-from-top-8 duration-1000">
        <SpiritualContinuity 
          profile={profile} 
        />
        <div className="flex justify-center -mt-10 mb-20">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/spiritual-profile')}
            className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/20 hover:text-primary transition-all duration-700"
          >
            <User className="w-3 h-3 mr-2" />
            Ver Perfil Espiritual
          </Button>
        </div>
      </section>

      {/* 1. RITUAL DO DIA - THE HEART OF THE EXPERIENCE */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
        <h2 className="sr-only">Destaques e Ritual</h2>
        <SectionHeader 
          title="Ritual do Dia" 
          subtitle="Um momento de pausa e conexão espiritual no coração do seu dia."
          className="mb-24 md:mb-40"
        />
        <div className="premium-card p-10 sm:p-24 md:p-32 lg:p-40">
          <RitualDoDia />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 sm:gap-32 md:gap-48 lg:gap-64">
        {/* 2. CONTINUAR LEITURA - PERSONAL PROGRESS */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both flex flex-col">
          <h2 className="sr-only">Sua Jornada de Leitura</h2>
          <SectionHeader 
            align="left"
            title="Sua Jornada" 
            subtitle="Onde a alma parou para contemplar."
            className="mb-12 md:mb-20"
          />
          <div className="flex-1 premium-card-interactive p-10 sm:p-20 md:p-24 lg:p-32">
            <ReadingProgressSection />
          </div>
        </section>

        {/* 3. LOGOS IA - INTELLIGENT COMPANION */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both flex flex-col">
          <h2 className="sr-only">Logos IA</h2>
          <SectionHeader 
            align="left"
            title="Logos IA" 
            subtitle="Inteligência artificial a serviço da sua fé."
            className="mb-12 md:mb-20"
          />
          
          <HomeCard
            ref={logosCardRef}
            className="flex-1 p-10 md:p-24 lg:p-32 flex flex-col items-center justify-center gap-14 md:gap-16 group"
          >
            <div className="relative z-10 w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/[0.01] border border-primary/[0.03] flex items-center justify-center text-primary/10 group-hover:scale-105 group-hover:bg-primary/[0.03] group-hover:text-primary/30 transition-all duration-1000">
              <Sparkles className="w-6 h-6 md:w-8 md:h-8" strokeWidth={0.5} />
            </div>
            
            <div className="relative z-10 space-y-5 text-center">
              <h3 className="text-2xl md:text-3xl font-display font-medium text-primary/70 tracking-tight">Logos</h3>
              <p className="text-xs md:text-sm text-muted-foreground/20 leading-relaxed font-serif italic max-w-[200px] md:max-w-[240px] mx-auto tracking-wide">
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
                  className="h-14 md:h-16 pl-12 md:pl-14 pr-12 md:pr-14 rounded-full border-primary/5 bg-background/20 focus:bg-background/40 transition-all text-base md:text-lg placeholder:text-muted-foreground/30 font-serif italic focus:ring-1 focus:ring-primary/20"
                  aria-label="Logos IA: Pergunte sobre a fé"
                />
                <MessageSquare className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-primary/10 group-hover/input:text-primary/20 transition-colors" />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 rounded-full bg-primary/5 text-primary/40 hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center group/btn focus:ring-1 focus:ring-primary/20 outline-none"
                >
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </HomeCard>
        </section>
      </div>

      {/* 4. BIBLIOTECA - THE CORE SOURCES */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-450 fill-mode-both">
        <h2 className="sr-only">Fontes de Sabedoria</h2>
        <SectionHeader 
          title="Biblioteca Sagrada" 
          subtitle="As fontes imutáveis da Sabedoria e da Tradição."
          className="mb-24 md:mb-40"
        />
        <div className="premium-card p-10 sm:p-24 md:p-40 lg:p-64">
          <HomeMainDoors t={t} />
        </div>
      </section>

      {/* 5. EM BREVE - FUTURE EXPANSIONS */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-600 fill-mode-both opacity-40 hover:opacity-100 transition-opacity duration-1000">
        <h2 className="sr-only">Futuras Expansões</h2>
        <SectionHeader 
          title="O Futuro" 
          subtitle="Novas salas sendo preparadas para o seu santuário."
          className="mb-12 md:mb-20"
        />
        <div className="px-2 md:px-4">
          <ComingSoonSection />
        </div>
      </section>
    </div>
  );
});

HomeMainContent.displayName = 'HomeMainContent';

export default HomeMainContent;