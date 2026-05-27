import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { HomeCard } from './HomeCard';
import HomeMainDoors from './HomeMainDoors';
import RitualDoDia from './RitualDoDia';
import { ReadingProgressSection } from './ReadingProgressSection';
import { ComingSoonSection } from './ComingSoon';
import { Input } from '@/components/ui/input';
import { Sparkles, ArrowRight, MessageSquare } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

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
    <div className="w-full max-w-6xl mx-auto space-y-48 md:space-y-64 pb-72 px-6 md:px-12">
      {/* 1. RITUAL DO DIA - THE HEART OF THE EXPERIENCE */}
      <section className="animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-both">
        <SectionHeader 
          title="Ritual do Dia" 
          subtitle="Um momento de pausa e conexão espiritual no coração do seu dia."
          className="mb-20 md:mb-24"
        />
        <div className="bg-card/5 backdrop-blur-sm rounded-[3.5rem] p-4 md:p-8 border border-primary/[0.03] shadow-premium-sm ring-1 ring-primary/[0.01]">
          <RitualDoDia />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 md:gap-40">
        {/* 2. CONTINUAR LEITURA - PERSONAL PROGRESS */}
        <section className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 fill-mode-both flex flex-col">
          <SectionHeader 
            align="left"
            title="Sua Jornada" 
            subtitle="Onde a alma parou para contemplar."
            className="mb-14"
          />
          <div className="flex-1 bg-card/5 backdrop-blur-sm rounded-[2.5rem] p-10 border border-primary/[0.03] hover:bg-card/[0.08] transition-all duration-700 shadow-premium-sm ring-1 ring-primary/[0.01]">
            <ReadingProgressSection />
          </div>
        </section>

        {/* 3. LOGOS IA - INTELLIGENT COMPANION */}
        <section className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both flex flex-col">
          <SectionHeader 
            align="left"
            title="Logos IA" 
            subtitle="Inteligência artificial a serviço da sua fé."
            className="mb-14"
          />
          
          <HomeCard
            ref={logosCardRef}
            className="flex-1 p-10 md:p-14 flex flex-col items-center justify-center gap-12 group relative overflow-hidden border-primary/[0.03] bg-card/5 backdrop-blur-md transition-all duration-1000 rounded-[2.5rem] shadow-premium-sm ring-1 ring-primary/[0.01]"
          >
            <div className="relative z-10 w-16 h-16 rounded-full bg-primary/[0.02] border border-primary/5 flex items-center justify-center text-primary/20 group-hover:scale-110 group-hover:bg-primary/[0.05] group-hover:text-primary/40 transition-all duration-1000">
              <Sparkles className="w-8 h-8" strokeWidth={0.5} />
            </div>
            
            <div className="relative z-10 space-y-5 text-center">
              <h3 className="text-3xl font-display font-medium text-primary/70 tracking-tight">Logos</h3>
              <p className="text-sm text-muted-foreground/30 leading-relaxed font-serif italic max-w-[240px] mx-auto tracking-wide">
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
                  className="h-16 pl-14 pr-14 rounded-full border-primary/5 bg-background/20 focus:bg-background/40 transition-all text-lg placeholder:text-muted-foreground/20 font-serif italic focus:ring-1 focus:ring-primary/10"
                  aria-label="Logos IA: Pergunte sobre a fé"
                />
                <MessageSquare className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/10 group-hover/input:text-primary/20 transition-colors" />
                <button 
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-primary/5 text-primary/40 hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center group/btn focus:ring-1 focus:ring-primary/20 outline-none"
                >
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </HomeCard>
        </section>
      </div>

      {/* 4. BIBLIOTECA - THE CORE SOURCES */}
      <section className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400 fill-mode-both">
        <SectionHeader 
          title="Biblioteca Sagrada" 
          subtitle="As fontes imutáveis da Sabedoria e da Tradição."
          className="mb-20 md:mb-24"
        />
        <div className="bg-card/5 backdrop-blur-sm rounded-[3.5rem] p-4 md:p-14 border border-primary/[0.03] shadow-premium-sm ring-1 ring-primary/[0.01]">
          <HomeMainDoors t={t} />
        </div>
      </section>

      {/* 5. EM BREVE - FUTURE EXPANSIONS */}
      <section className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 fill-mode-both opacity-40 hover:opacity-100 transition-opacity duration-1000">
        <SectionHeader 
          title="O Futuro" 
          subtitle="Novas salas sendo preparadas para o seu santuário."
          className="mb-20"
        />
        <div className="px-4">
          <ComingSoonSection />
        </div>
      </section>
    </div>
  );
});

HomeMainContent.displayName = 'HomeMainContent';

export default HomeMainContent;