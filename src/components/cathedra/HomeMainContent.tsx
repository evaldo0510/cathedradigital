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
import { GuidedReadingFlow } from './GuidedReadingFlow';

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
    <div className="app-container stack-spacing pb-32">
      {/* RITUAL DO DIA - EXPERIÊNCIA DIÁRIA */}
      <section className="space-y-12 md:space-y-16">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap">
            Ritual do Dia
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        
        <RitualDoDia />
      </section>

      {/* CONTINUAR LEITURA */}
      <ReadingProgressSection />


      {/* NÚCLEO PRINCIPAL - ACESSO RÁPIDO */}
      <section className="space-y-12 md:space-y-16">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap">
            Biblioteca Digital
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        
        <HomeMainDoors t={t} />
      </section>


      {/* LOGOS IA INTEGRADA - ACESSO ÚNICO E MINIMALISTA */}
      <section className="space-y-12">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
            Logos IA
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        
        <HomeCard
          ref={logosCardRef}
          className="p-10 md:p-16 flex flex-col items-center gap-10 group relative overflow-hidden border-border/10 focus-within:ring-4 focus-within:ring-primary/5 focus-within:border-primary/20 transition-all shadow-premium hover:shadow-premium-hover outline-none bg-card"
        >
          <div className="relative z-10 w-16 h-16 rounded-premium bg-primary/[0.01] border border-border/10 flex items-center justify-center text-primary/30 group-hover:scale-105 transition-transform duration-1000">
            <Sparkles className="w-8 h-8" strokeWidth={0.5} />
          </div>
          
          <div className="relative z-10 space-y-3 text-center max-w-2xl">
            <h3 className="text-3xl font-display font-medium text-primary tracking-tight">Logos IA</h3>
            <p className="text-base text-muted-foreground/40 leading-relaxed font-serif italic max-w-md mx-auto">
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
                className="h-16 pl-14 pr-32 rounded-premium border-border/10 bg-background/30 focus:bg-background transition-all text-lg placeholder:text-muted-foreground/20 font-serif italic focus:ring-1 focus:ring-primary/5"
                aria-label="Logos IA: Pergunte sobre a fé"
              />
              <MessageSquare className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/10" />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 rounded-premium-sm bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.3em] hover:brightness-110 transition-all flex items-center gap-3 group/btn shadow-premium"
              >
                Consultar
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.4em] text-primary/10 px-2">
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
      <ComingSoonSection className="pt-24 md:pt-32 opacity-40 hover:opacity-100 transition-opacity duration-1000" />

    </div>
  );
};

export default HomeMainContent;