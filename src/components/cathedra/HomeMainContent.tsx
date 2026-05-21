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


interface HomeMainContentProps {
  user: any;
  profile: any;
  onNavigate: (route: string) => void;
  t: (key: string) => string;
}

const HomeMainContent: React.FC<HomeMainContentProps> = ({ user, profile, onNavigate, t }) => {
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
    <div className="w-full max-w-5xl mx-auto space-y-32 md:space-y-48 pb-64 px-6">
      {/* RITUAL DO DIA - EXPERIÊNCIA DIÁRIA */}
      <section className="space-y-16 animate-in fade-in duration-700 delay-100 fill-mode-both">
        <div className="flex flex-col items-center gap-6">
          <div className="w-px h-12 bg-primary/10" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.8em] text-primary/30 whitespace-nowrap">
            Ritual do Dia
          </h2>
        </div>
        
        <RitualDoDia />
      </section>

      {/* CONTINUAR LEITURA */}
      <section className="animate-in fade-in duration-700 delay-200 fill-mode-both">
        <ReadingProgressSection />
      </section>

      {/* NÚCLEO PRINCIPAL - BIBLIOTECA ESPIRITUAL */}
      <section className="space-y-20 animate-in fade-in duration-700 delay-300 fill-mode-both">
        <div className="flex flex-col items-center gap-6">
          <div className="w-px h-12 bg-primary/10" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.8em] text-primary/30 whitespace-nowrap">
            Biblioteca Digital
          </h2>
        </div>
        
        <HomeMainDoors t={t} />
      </section>

      {/* LOGOS IA INTEGRADA */}
      <section className="space-y-16 animate-in fade-in duration-700 delay-400 fill-mode-both">
        <div className="flex flex-col items-center gap-6">
          <div className="w-px h-12 bg-primary/10" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.8em] text-primary/30 whitespace-nowrap">
            Logos IA
          </h2>
        </div>
        
        <HomeCard
          ref={logosCardRef}
          className="p-12 md:p-24 flex flex-col items-center gap-12 group relative overflow-hidden border-border/5 shadow-premium hover:shadow-premium-hover transition-all duration-700 bg-card/30 backdrop-blur-sm"
        >
          <div className="relative z-10 w-20 h-20 rounded-full bg-primary/[0.02] border border-primary/10 flex items-center justify-center text-primary/20 group-hover:scale-105 transition-transform duration-700">
            <Sparkles className="w-10 h-10" strokeWidth={0.5} />
          </div>
          
          <div className="relative z-10 space-y-4 text-center max-w-2xl">
            <h3 className="text-4xl font-display font-medium text-primary tracking-tight">Logos</h3>
            <p className="text-lg text-muted-foreground/40 leading-relaxed font-serif italic max-w-md mx-auto">
              "A inteligência a serviço da contemplação."
            </p>
          </div>

          <form onSubmit={handleLogosSearch} className="relative z-10 w-full max-w-xl">
            <div className="relative group/input">
              <Input
                ref={logosInputRef}
                value={logosQuery}
                onChange={(e) => setLogosQuery(e.target.value)}
                placeholder="Busque por luz e entendimento..."
                className="h-20 pl-16 pr-36 rounded-full border-border/10 bg-background/50 focus:bg-background transition-all text-xl placeholder:text-muted-foreground/20 font-serif italic focus:ring-1 focus:ring-primary/5"
                aria-label="Logos IA: Pergunte sobre a fé"
              />
              <MessageSquare className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/10" />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.3em] hover:brightness-110 transition-all flex items-center gap-3 group/btn shadow-premium"
              >
                Consultar
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="mt-8 flex justify-center opacity-20 hover:opacity-100 transition-opacity duration-700">
              <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.4em] text-primary/40">
                <kbd className="px-2 py-1 rounded bg-muted/30 border border-border/10">Alt</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 rounded bg-muted/30 border border-border/10">L</kbd>
                <span className="ml-2">Atalho para o Logos</span>
              </div>
            </div>
          </form>
        </HomeCard>
      </section>

      {/* EM BREVE */}
      <section className="animate-in fade-in duration-700 delay-500 fill-mode-both">
        <ComingSoonSection className="opacity-40 hover:opacity-100 transition-opacity duration-1000" />
      </section>
    </div>
  );
};

export default HomeMainContent;