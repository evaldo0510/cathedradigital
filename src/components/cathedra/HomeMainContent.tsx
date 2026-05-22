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
      // Shortcut Alt+L for Logos IA
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
      // Save to local chat history
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
    <div className="w-full max-w-5xl mx-auto space-y-48 md:space-y-64 pb-64 px-6">
      {/* 1. RITUAL DO DIA */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
        <SectionHeader 
          title="Ritual do Dia" 
          subtitle="Um momento de pausa e conexão espiritual."
        />
        <RitualDoDia />
      </section>

      {/* 2. CONTINUAR LEITURA */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
        <ReadingProgressSection />
      </section>

      {/* 3, 4, 5. BIBLIOTECA (BÍBLIA, CATECISMO, MAGISTÉRIO) */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
        <SectionHeader 
          title="Biblioteca" 
          subtitle="As fontes da Sabedoria e da Tradição."
        />
        <HomeMainDoors t={t} />
      </section>

      {/* 6. LOGOS IA */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400 fill-mode-both">
        <SectionHeader 
          title="Logos IA" 
          subtitle="Inteligência artificial a serviço da fé."
        />
        
        <HomeCard
          ref={logosCardRef}
          className="p-16 md:p-32 flex flex-col items-center gap-16 group relative overflow-hidden border-border/5 bg-card/10 backdrop-blur-md transition-all duration-1000 rounded-premium-lg shadow-premium"
        >
          <div className="relative z-10 w-24 h-24 rounded-full bg-primary/[0.02] border border-primary/10 flex items-center justify-center text-primary/20 group-hover:scale-110 transition-transform duration-1000">
            <Sparkles className="w-12 h-12" strokeWidth={0.5} />
          </div>
          
          <div className="relative z-10 space-y-6 text-center max-w-2xl">
            <h3 className="text-5xl font-display font-medium text-primary tracking-tight">Logos</h3>
            <p className="text-xl text-muted-foreground/30 leading-relaxed font-serif italic max-w-md mx-auto">
              "Buscai e encontrareis, batei e abrir-se-vos-á."
            </p>
          </div>

          <form onSubmit={handleLogosSearch} className="relative z-10 w-full max-w-xl">
            <div className="relative group/input">
              <Input
                ref={logosInputRef}
                value={logosQuery}
                onChange={(e) => setLogosQuery(e.target.value)}
                placeholder="Busque por luz e entendimento..."
                className="h-24 pl-20 pr-40 rounded-full border-border/10 bg-background/30 focus:bg-background transition-all text-2xl placeholder:text-muted-foreground/10 font-serif italic focus:ring-1 focus:ring-primary/5 shadow-premium"
                aria-label="Logos IA: Pergunte sobre a fé"
              />
              <MessageSquare className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-primary/10" />
              <button 
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 px-10 py-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.3em] hover:brightness-110 transition-all flex items-center gap-4 group/btn shadow-premium"
              >
                Consultar
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </HomeCard>
      </section>

      {/* 7. EM BREVE */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
        <SectionHeader 
          title="Em Breve" 
          subtitle="Novas salas para o seu santuário digital."
        />
        <div className="opacity-40 hover:opacity-100 transition-opacity duration-1000">
          <ComingSoonSection />
        </div>
      </section>
    </div>
  );
});
HomeMainContent.displayName = 'HomeMainContent';

export default HomeMainContent;