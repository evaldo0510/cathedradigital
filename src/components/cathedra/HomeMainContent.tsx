import React, { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';
import { Icons } from '@/constants';
import { HomeCard } from './HomeCard';
import { HomeButton } from './HomeButton';
import RitualDoDia from './RitualDoDia';
import HomeMainDoors from './HomeMainDoors';
import { SectionSkeleton } from './HomeSkeletons';
import { ComingSoonSection } from './ComingSoon';
import { VisualSilenceControls } from './VisualSilenceControls';
import { Input } from '@/components/ui/input';
import { Sparkles, ArrowRight, MessageSquare, History, BookOpen } from 'lucide-react';
import { DAILY_VERSES, DAILY_REFLECTIONS } from '@/data/dailyRitual';


interface HomeMainContentProps {
  user: any;
  profile: any;
  onNavigate: (route: string) => void;
  t: (key: string) => string;
}

const HomeMainContent: React.FC<HomeMainContentProps> = ({ user, profile, onNavigate, t }) => {
  const navigate = useNavigate();
  const [logosQuery, setLogosQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const savedMessages = localStorage.getItem('cathedra_logos_messages');
    if (savedMessages) {
      const messages = JSON.parse(savedMessages);
      // Get unique user messages, last 5
      const userQuestions = messages
        .filter((m: any) => m.role === 'user')
        .map((m: any) => m.content)
        .reverse();
      const uniqueQuestions = Array.from(new Set(userQuestions)).slice(0, 5) as string[];
      setHistory(uniqueQuestions);
    }
  }, []);

  const dayOfYear = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  }, []);

  const handleLogosSearch = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = customQuery || logosQuery;
    
    if (queryToUse.trim()) {
      let finalQuery = queryToUse;
      
      // Contextual summarization logic
      if (queryToUse === 'Resumir leitura atual') {
        const verse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
        const reflection = DAILY_REFLECTIONS[dayOfYear % DAILY_REFLECTIONS.length];
        finalQuery = `Por favor, faça um resumo espiritual e contextual deste versículo e reflexão de hoje: "${verse.text}" (${verse.ref}). Reflexão: "${reflection}"`;
      }

      // Save to local chat history so it appears in the chat bubble too
      const savedMessages = localStorage.getItem('cathedra_logos_messages');
      const messages = savedMessages ? JSON.parse(savedMessages) : [];
      const newMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: finalQuery,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('cathedra_logos_messages', JSON.stringify([...messages, newMessage]));
      
      navigate(`${AppRoute.BUSCAR}?q=${encodeURIComponent(finalQuery)}`);
    }
  };


  return (
    <div className="app-container stack-spacing pb-64">
      {/* SILÊNCIO VISUAL - CONTROLES */}
      <section className="space-y-10">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap">
            Atmosfera Contemplativa
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        
        <VisualSilenceControls />
      </section>

      {/* NÚCLEO PRINCIPAL - ACESSO RÁPIDO */}
      <section className="space-y-16">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap">
            Portais da Sabedoria
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        
        <HomeMainDoors t={t} />
      </section>

      {/* RITUAL DO DIA - NÚCLEO DE LEITURA/CONTEMPLAÇÃO */}
      <section className="space-y-12">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
            Ritual do Dia
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        <div className="max-w-4xl mx-auto w-full">
          <RitualDoDia />
        </div>
      </section>

      {/* LOGOS IA INTEGRADA */}
      <section className="space-y-12">
        <div className="flex items-center gap-10">
          <div className="h-px flex-1 bg-border/30" />
          <h2 className="text-premium-tiny font-bold uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">
            Logos IA
          </h2>
          <div className="h-px flex-1 bg-border/30" />
        </div>
        
        <HomeCard
          className="p-8 md:p-16 lg:p-20 flex flex-col items-center gap-12 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.01] to-transparent pointer-events-none" />
          
          <div className="relative z-10 w-20 h-20 rounded-2xl bg-primary/[0.03] border border-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-700 shadow-premium">
            <Sparkles className="w-10 h-10" strokeWidth={1.5} />
          </div>
          
          <div className="relative z-10 space-y-4 text-center max-w-2xl">
            <h3 className="text-3xl font-display font-medium text-primary tracking-tight">Mestre Contemplativo</h3>
            <p className="text-lg text-primary/60 leading-relaxed font-serif italic">
              "A inteligência a serviço da fé, guiada pela Tradição viva da Igreja."
            </p>
          </div>

          <form onSubmit={handleLogosSearch} className="relative z-10 w-full max-w-xl">
            <div className="relative group/input">
              <Input
                value={logosQuery}
                onChange={(e) => setLogosQuery(e.target.value)}
                placeholder="Pergunte sobre a Bíblia, Santos ou Teologia..."
                className="h-16 pl-14 pr-32 rounded-2xl border-primary/10 bg-primary/[0.02] focus:bg-white transition-all text-lg placeholder:text-muted-foreground/30 font-serif italic"
              />
              <MessageSquare className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30" />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors flex items-center gap-2 group/btn"
              >
                Perguntar
                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="mt-8 space-y-6 w-full">
              {history.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-primary/30 px-2">
                    <History className="w-3 h-3" strokeWidth={1.5} />
                    Consultas Recentes
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleLogosSearch(undefined, item)}
                        className="text-[10px] font-medium text-primary/50 hover:text-primary transition-all px-4 py-2 bg-primary/[0.03] border border-primary/5 rounded-xl hover:bg-white hover:shadow-sm"
                      >
                        {item.length > 35 ? item.slice(0, 35) + '...' : item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-primary/30 px-2">
                  <BookOpen className="w-3 h-3" strokeWidth={1.5} />
                  Sugestões de Contemplação
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Resumir leitura atual', 'Quem foi São Bento?', 'O que é a Graça?'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleLogosSearch(undefined, suggestion)}
                      className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-colors px-3 py-1.5 border border-border/20 rounded-full hover:border-primary/20"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </HomeCard>

      </section>

      {/* EM BREVE */}
      <ComingSoonSection className="pt-24" />

      {/* FOOTER QUOTE */}
      <div className="pt-32 text-center opacity-20 hover:opacity-40 transition-opacity duration-1000">
        <p className="text-sm font-serif italic max-w-sm mx-auto leading-relaxed">
          "A beleza salvará o mundo." — Dostoievski
        </p>
      </div>
    </div>
  );
};

export default HomeMainContent;