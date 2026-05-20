import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { HomeCard } from './HomeCard';
import HomeMainDoors from './HomeMainDoors';
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
    <div className="app-container stack-spacing pb-32">
      {/* NÚCLEO PRINCIPAL - ACESSO RÁPIDO */}
      <section className="space-y-12 md:space-y-16">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap">
            Portais da Sabedoria
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
          className="p-8 md:p-12 lg:p-16 flex flex-col items-center gap-10 group relative overflow-hidden border-border/10 focus-within:border-primary/20 transition-all shadow-premium hover:shadow-premium-hover outline-none"

        >
          <div className="relative z-10 w-16 h-16 rounded-premium bg-primary/[0.02] border border-border/10 flex items-center justify-center text-primary/40 group-hover:scale-105 transition-transform duration-700">
            <Sparkles className="w-8 h-8" strokeWidth={1} />
          </div>
          
          <div className="relative z-10 space-y-3 text-center max-w-2xl">
            <h3 className="text-2xl font-display font-medium text-primary tracking-tight">Mestre Contemplativo</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-serif italic max-w-md mx-auto">
              "A inteligência a serviço da fé."
            </p>
          </div>

          <form onSubmit={handleLogosSearch} className="relative z-10 w-full max-w-xl">
            <div className="relative group/input">
              <Input
                ref={logosInputRef}
                value={logosQuery}
                onChange={(e) => setLogosQuery(e.target.value)}
                placeholder="Pergunte sobre a fé..."
                className="h-14 pl-12 pr-28 rounded-premium border-border/20 bg-background/50 focus:bg-background transition-all text-base placeholder:text-muted-foreground/30 font-serif italic focus:ring-1 focus:ring-primary/10"
                aria-label="Logos IA: Pergunte sobre a fé"
              />
              <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-premium-sm bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2 group/btn shadow-premium"
              >
                Consultar
                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="mt-4 flex justify-center">
              <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-primary/20 px-2">
                <kbd className="px-1.5 py-0.5 rounded bg-muted/50 border border-border/40">Alt</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted/50 border border-border/40">L</kbd>
                <span className="ml-1">Atalho rápido</span>
              </div>
            </div>
          </form>
        </HomeCard>
      </section>

      {/* EM BREVE */}
      <ComingSoonSection className="pt-16 md:pt-24" />

    </div>
  );
};

export default HomeMainContent;