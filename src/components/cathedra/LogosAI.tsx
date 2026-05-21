import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { LogosChatSkeleton } from './SacredSkeleton';

interface LogosAIProps {
  context?: string;
  selectedText?: string;
  isOpen: boolean;
  onClose: () => void;
  type?: 'bible' | 'catechism' | 'magisterium';
  variant?: 'drawer' | 'integrated';
}


const LogosAI: React.FC<LogosAIProps> = ({ 
  context, 
  selectedText, 
  isOpen, 
  onClose, 
  type = 'bible',
  variant = 'drawer'
}) => {
  const { settings } = useReadingSettings();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  const springConfig = useMemo(() => {
    if (settings.reduceAnimations) {
      return { type: 'tween' as const, duration: 0.1 };
    }
    return { type: 'spring' as const, damping: 25, stiffness: 200 };
  }, [settings.reduceAnimations]);



  useEffect(() => {
    if (selectedText) {
      setQuery(`Explique o significado de: "${selectedText}"`);
    }
  }, [selectedText]);


  const handleQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMsg = query.trim();
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setQuery('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('logos-ai', {
        body: { 
          query: userMsg, 
          context, 
          selectedText,
          type,
          history: history.slice(-5) // Send last 5 messages for context
        }
      });

      if (error) throw error;
      
      const assistantMsg = data.text || 'Desculpe, não consegui processar sua pergunta agora.';
      setResponse(assistantMsg);
      
      // Simulate typing for premium feel
      setIsTyping(true);
      const words = assistantMsg.split(' ');
      let currentText = '';
      
      setHistory(prev => [...prev, { role: 'assistant', content: '' }]);
      
      for (let i = 0; i < words.length; i++) {
        currentText += (i === 0 ? '' : ' ') + words[i];
        const textToSet = currentText; // closure
        setHistory(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: textToSet };
          return next;
        });
        await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 40));
      }
      setIsTyping(false);
    } catch (err) {
      console.error('Logos IA Error:', err);
      toast.error('Erro ao conectar com Logos IA');
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'integrated') {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="my-12 overflow-hidden"
          >
            <div className="premium-card bg-primary/[0.01] border-primary/5 p-12 md:p-16 space-y-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-full bg-primary/[0.02] flex items-center justify-center text-primary/40">
                    <Icons.Sparkles className="w-6 h-6" strokeWidth={0.5} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">Logos IA</h4>
                    <p className="text-sm font-serif italic text-primary/60">Mentor Espiritual</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full text-muted-foreground/30 hover:text-primary">
                  <Icons.X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-10">
                {history.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-4`}>
                    <div className={`max-w-[85%] text-lg leading-relaxed ${
                      msg.role === 'user' 
                        ? 'text-primary/60 font-medium' 
                        : 'text-foreground/80 font-serif italic'
                    }`}>
                      {msg.role === 'assistant' && <span className="text-primary/10 mr-2 text-2xl font-serif">“</span>}
                      {msg.content}
                      {msg.role === 'assistant' && <span className="text-primary/10 ml-2 text-2xl font-serif">”</span>}
                    </div>
                  </div>
                ))}

                {(isLoading || isTyping) && (
                  <div className="flex justify-start">
                    <div className="flex gap-2 opacity-20">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleQuery} className="relative group max-w-2xl mx-auto pt-8 border-t border-primary/5">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Peça clareza ao Mentor..."
                  className="w-full bg-transparent border-none text-xl focus:ring-0 outline-none text-center font-serif italic placeholder:text-muted-foreground/10"
                />
                <div className="flex justify-center mt-6">
                  <Button 
                    type="submit" 
                    disabled={isLoading || isTyping || !query.trim()}
                    className="rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground h-12 px-8 text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                  >
                    Buscar Luz
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: settings.reduceAnimations ? 0.1 : 0.4 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[190]"
          />
          <motion.div
            initial={{ opacity: 0, x: settings.reduceAnimations ? 0 : 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: settings.reduceAnimations ? 0 : 400 }}
            transition={springConfig}

            className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-background border-l border-border/10 z-[200] shadow-2xl flex flex-col"
          >
            <div className="p-8 md:p-10 border-b border-border/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-premium bg-primary/[0.02] border border-border/10 flex items-center justify-center text-primary/30">
                  <Icons.Sparkles className="w-5 h-5" strokeWidth={0.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.4em] text-primary">Logos IA</h3>
                  <p className="text-[9px] text-muted-foreground/30 uppercase font-black tracking-widest mt-1">Mentor Espiritual</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-primary/[0.02] text-primary/10 hover:text-primary transition-colors">
                <Icons.X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 scrollbar-hide">
              {history.length === 0 && !selectedText && (
                <div className="text-center py-20 space-y-8">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/10 mx-auto animate-pulse" />
                  <p className="text-lg text-muted-foreground/40 font-serif italic leading-relaxed max-w-[280px] mx-auto">
                    "O silêncio é a primeira língua de Deus."<br/>
                    <span className="text-sm uppercase tracking-widest font-black mt-4 block">Como posso iluminar sua jornada?</span>
                  </p>
                </div>
              )}

              {history.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                  <div className={`max-w-[90%] p-8 md:p-10 rounded-premium-lg text-base leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground shadow-premium' 
                      : 'bg-card border border-border/5 font-serif italic text-foreground/80'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-primary/10 px-4">
                    {msg.role === 'user' ? 'Peregrino' : 'Logos'}
                  </span>
                </div>
              ))}

              {(isLoading || isTyping) && (
                <div className="flex justify-start animate-in fade-in duration-500">
                  <div className="bg-muted/10 p-6 rounded-premium-lg flex gap-3">
                    <div className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 md:p-10 border-t border-border/5 bg-background/30">
              <form onSubmit={handleQuery} className="relative group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Busque por luz e entendimento..."
                  className="w-full bg-transparent border-b border-border/10 py-5 px-0 text-lg focus:border-primary/40 outline-none transition-all placeholder:text-muted-foreground/20 font-serif italic"
                />
                <button 
                  type="submit"
                  disabled={isLoading || isTyping}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-primary hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
                >
                  <Icons.ArrowRight className="w-5 h-5" />
                </button>
              </form>
              <div className="mt-8">
                <p className="text-[8px] text-muted-foreground/20 uppercase tracking-[0.4em] text-center font-bold">
                  Sempre em comunhão com o Magistério
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LogosAI;
