import React, { useState, useEffect, useMemo } from 'react';
import { useRenderPerf } from '@/hooks/useRenderPerf';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { LogosChatSkeleton } from './SacredSkeleton';
import { CathedraCard } from './CathedraCard';
import { CathedraButton } from './CathedraButton';
import { useVisualViewport } from '@/hooks/useVisualViewport';

interface LogosAIProps {
  context?: string;
  selectedText?: string;
  initialQuery?: string;
  isOpen: boolean;
  onClose: () => void;
  type?: 'bible' | 'catechism' | 'magisterium' | 'journey';
  variant?: 'drawer' | 'integrated';
  journeyId?: string;
}

const LogosAI: React.FC<LogosAIProps> = ({ 
  context, 
  selectedText, 
  initialQuery,
  isOpen, 
  onClose, 
  type = 'bible',
  variant = 'drawer',
  journeyId
}) => {
  useRenderPerf('LogosAI', 15);
  const { settings } = useReadingSettings();
  const viewportHeight = useVisualViewport();
  const [density, setDensity] = useState<'subtle' | 'normal' | 'deep'>(() => {
    return (localStorage.getItem('cathedra-relatio-density') as any) || 'normal';
  });
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const lastLoadedContextRef = React.useRef<string | undefined>(undefined);
  const [visibleMessages, setVisibleMessages] = useState(10); // Simple pagination
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Sync history when context changes for persistence per reading section
  useEffect(() => {
    // Cancel any pending requests when moving to a new section or when silence is enabled
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (isLoading) setIsLoading(false);
    if (isTyping) setIsTyping(false);

    if (settings.totalSilence) {
      if (history.length > 0) setHistory([]);
      lastLoadedContextRef.current = undefined;
      return;
    }

    if (variant === 'integrated' && context) {
      const saved = localStorage.getItem(`logos_history_${context}`);
      const loadedHistory = saved ? JSON.parse(saved) : [];
      setHistory(loadedHistory);
      lastLoadedContextRef.current = context;
    } else {
      if (history.length > 0) setHistory([]);
      lastLoadedContextRef.current = undefined;
    }
  }, [context, variant, settings.totalSilence]);

  useEffect(() => {
    // Only save if history belongs to the context we think we have loaded and silence is NOT active
    if (!settings.totalSilence && variant === 'integrated' && context && context === lastLoadedContextRef.current) {
      if (history.length > 0) {
        localStorage.setItem(`logos_history_${context}`, JSON.stringify(history));
      } else {
        localStorage.removeItem(`logos_history_${context}`);
      }
    }
  }, [history, context, variant, settings.totalSilence]);

  useEffect(() => {
    if (history.length) scrollToBottom();
  }, [history.length, isTyping, isLoading]);

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

  const handleQuery = React.useCallback(async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    if (settings.totalSilence) {
      toast.error("O Modo Silêncio Total está ativo", {
        description: "Desative-o nas configurações para interagir com a Logos IA."
      });
      return;
    }
    const finalQuery = customQuery || query;
    if (!finalQuery.trim() || isLoading) return;

    const userMsg = finalQuery.trim();
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setQuery('');
    setIsLoading(true);
    
    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const { data, error } = await supabase.functions.invoke('logos-ai', {
        body: { 
          query: userMsg, 
          context, 
          selectedText,
          type,
          journeyId,
          history: history.slice(-5) // Send last 5 messages for context
        },
        headers: {
          'x-abort-signal': 'true'
        }
      });

      if (error) throw error;
      
      const assistantMsg = data.text || 'Desculpe, não consegui processar sua pergunta agora.';
      
      setIsTyping(true);
      const words = assistantMsg.split(' ');
      let currentText = '';
      
      setHistory(prev => [...prev, { role: 'assistant', content: '' }]);
      
      for (let i = 0; i < words.length; i++) {
        if (abortControllerRef.current?.signal.aborted) break;
        currentText += (i === 0 ? '' : ' ') + words[i];
        const textToSet = currentText;
        setHistory(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: textToSet };
          return next;
        });
        await new Promise(resolve => setTimeout(resolve, 15 + Math.random() * 20));
      }
      setIsTyping(false);
    } catch (err: any) {
      if (err.name === 'AbortError' || (err.message && err.message.includes('abort'))) {
        console.log('Logos IA request aborted');
        return;
      }
      console.error('Logos IA Error:', err);
      toast.error('Erro ao conectar com Logos IA');
    } finally {
      setIsLoading(false);
    }
  }, [query, isLoading, history, context, selectedText, type, settings.totalSilence]);

  const clearHistory = React.useCallback((skipConfirm = false) => {
    if (history.length === 0) return;
    
    if (!skipConfirm) {
      const confirmed = window.confirm("Deseja redefinir o silêncio e limpar o histórico desta seção?");
      if (!confirmed) return;
    }

    setHistory([]);
    if (context) {
      localStorage.removeItem(`logos_history_${context}`);
    }

    if (!skipConfirm) {
      toast.success("Histórico da Logos IA redefinido", {
        description: "O silêncio foi restaurado nesta seção."
      });
    }
  }, [context, history.length]);

  useEffect(() => {
    const handleReset = () => clearHistory(true);
    const handleDensityChange = () => {
      const newDensity = localStorage.getItem('cathedra-relatio-density') as any;
      if (newDensity) setDensity(newDensity);
    };

    window.addEventListener('reset-logos-history', handleReset);
    window.addEventListener('cathedra-relatio-density-changed', handleDensityChange);
    return () => {
      window.removeEventListener('reset-logos-history', handleReset);
      window.removeEventListener('cathedra-relatio-density-changed', handleDensityChange);
    };
  }, [clearHistory]);

  const exportHistory = React.useCallback(() => {
    if (history.length === 0) return;
    
    const exportData = {
      metadata: {
        section_id: context || 'global',
        section_type: type,
        timestamp: new Date().toISOString(),
        total_messages: history.length,
        app: 'Cathedra Digital'
      },
      history: history.map((msg, index) => ({
        ...msg,
        index,
        timestamp: new Date().toISOString()
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `logos_ia_history_${context || 'geral'}_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    toast.success("Histórico exportado com sucesso");
  }, [history, context, type]);

  useEffect(() => {
    if (initialQuery && isOpen && history.length === 0 && !settings.totalSilence) {
      handleQuery(undefined, initialQuery);
    }
  }, [initialQuery, isOpen, history.length, handleQuery, settings.totalSilence]);

  if (variant === 'integrated') {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="my-spacing-3xl overflow-hidden"
          >
            <CathedraCard padding="none" className="bg-card/40 backdrop-blur-3xl border-primary/[0.05] p-spacing-lg md:p-spacing-2xl lg:p-spacing-3xl space-y-spacing-md md:space-y-spacing-xl relative overflow-hidden shadow-premium rounded-[3rem] w-full">
              <div className="absolute top-spacing-0 left-0 w-full h-spacing-2xs bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
              
              <div className="absolute top-spacing-md right-spacing-md md:top-spacing-lg md:right-spacing-lg flex items-center gap-spacing-xs">
                {history.length > 0 && (
                  <>
                    <CathedraButton 
                      variant="ghost" 
                      size="sm"
                      onClick={exportHistory} 
                      className="rounded-premium-full text-primary/60 hover:text-primary transition-colors h-spacing-xl w-spacing-xl px-spacing-0"
                      title="Exportar histórico"
                      icon={<Icons.Download className="w-spacing-sm h-spacing-sm" />}
                    />
                    <CathedraButton 
                      variant="ghost" 
                      size="sm"
                      onClick={() => clearHistory()} 
                      className="rounded-premium-full text-primary/60 hover:text-primary transition-colors h-spacing-xl w-spacing-xl px-spacing-0"
                      title="Limpar histórico"
                      icon={<Icons.RotateCcw className="w-spacing-sm h-spacing-sm" />}
                    />
                  </>
                )}
                <CathedraButton variant="ghost" size="sm" onClick={onClose} className="rounded-premium-full text-primary/60 hover:text-primary transition-colors h-spacing-xl w-spacing-xl px-spacing-0" icon={<Icons.X className="w-spacing-sm h-spacing-sm" />} />
              </div>

              <div className="flex items-center justify-between mb-spacing-lg md:mb-spacing-xl opacity-30">
                <div className="flex items-center gap-spacing-sm md:gap-spacing-md">
                  <div className="w-spacing-xl h-spacing-xl rounded-premium-full bg-primary/[0.02] flex items-center justify-center text-primary/40 border border-primary/[0.05]">
                    <Icons.Sparkles className="w-spacing-sm h-spacing-sm" strokeWidth={0.5} />
                  </div>
                  <div>
                    <h4 className="text-[8px] font-black uppercase tracking-[0.6em] text-primary/40">Logos IA</h4>
                  </div>
                </div>
                
                <div className="flex items-center gap-spacing-2xs">
                  <div className={`w-spacing-2xs h-spacing-2xs rounded-premium-full ${
                    settings.totalSilence ? 'bg-red-400' : (history.length > 0 ? 'bg-secondary animate-pulse' : 'bg-primary/20')
                  }`} />
                  <span className="text-[6px] font-black uppercase tracking-widest text-primary/60">
                    {settings.totalSilence ? 'Silêncio' : (history.length > 0 ? 'Ativo' : 'Puro')}
                  </span>
                </div>
              </div>

              <div className="space-y-spacing-md md:space-y-spacing-xl w-full">
                {history.length > visibleMessages && (
                  <div className="flex justify-center pb-spacing-xs">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setVisibleMessages(prev => prev + 10)}
                      className="text-[8px] font-black uppercase tracking-widest text-primary/60 hover:text-primary"
                    >
                      Ver registros anteriores
                    </Button>
                  </div>
                )}
                {history.slice(-visibleMessages).map((msg, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.2, delay: i * 0.1 }}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-spacing-sm`}
                  >
                    <div className={`max-w-full text-premium-sm md:text-premium-lg leading-[1.7] md:leading-[1.8] tracking-wide ${
                      msg.role === 'user' 
                        ? 'text-primary/60 font-serif italic border-r border-primary/10 pr-spacing-md md:pr-spacing-lg text-right' 
                        : 'text-foreground/80 font-serif font-light'
                    }`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-spacing-xs mb-spacing-sm md:mb-spacing-md opacity-20">
                          <div className="w-spacing-md h-px bg-primary" />
                          <span className="text-[7px] font-black uppercase tracking-[0.4em]">Logos</span>
                        </div>
                      )}
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {(isLoading || isTyping) && (
                  <div className="flex justify-start w-full">
                    <div className="w-full space-y-spacing-md">
                      {isLoading && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="w-full space-y-spacing-sm py-spacing-md"
                        >
                          <div className="h-spacing-md bg-primary/5 rounded-premium-full w-3/4 animate-pulse" />
                          <div className="h-spacing-md bg-primary/5 rounded-premium-full w-1/2 animate-pulse" />
                        </motion.div>
                      )}
                      {isTyping && (
                        <div className="flex gap-spacing-sm opacity-10 py-spacing-md">
                          {[0, 1, 2].map((i) => (
                            <motion.div 
                              key={i}
                              animate={{ opacity: [0.2, 0.5, 0.2], y: [0, -2, 0] }}
                              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                              className="w-spacing-2xs h-spacing-2xs bg-primary rounded-premium-full" 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="w-full pt-spacing-lg md:pt-spacing-xl border-t border-primary/5">
                <form onSubmit={handleQuery} className="relative group flex items-center justify-center">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={settings.totalSilence ? "Silêncio Total Ativo..." : "Reflexão..."}
                    disabled={settings.totalSilence}
                    className="w-full bg-transparent border-none text-premium-sm md:text-premium-lg focus:ring-0 outline-none text-center font-serif italic placeholder:text-muted-foreground/30 py-spacing-sm md:py-spacing-md transition-all text-primary"
                  />
                  <button 
                    type="submit" 
                    disabled={isLoading || isTyping || !query.trim() || settings.totalSilence}
                    className="absolute right-0 text-primary/60 hover:text-primary transition-all disabled:opacity-0 p-spacing-xs"
                  >
                    <Icons.ArrowRight className="w-spacing-md h-spacing-md stroke-[1]" />
                  </button>
                </form>
                <div className="flex flex-col items-center gap-spacing-xs mt-spacing-lg">
                  <div className="w-spacing-3xs h-spacing-3xs bg-primary/10 rounded-premium-full" />
                  <p className="text-[7px] text-center text-primary/40 uppercase tracking-[0.5em] font-black">
                    {settings.totalSilence ? "O silêncio é a oração perfeita" : "Silêncio é entendimento"}
                  </p>
                </div>
              </div>
              </CathedraCard>
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
            className="fixed inset-0 bg-background/60 backdrop-blur-xl z-[190]"
          />
          <motion.div
            initial={{ opacity: 0, x: settings.reduceAnimations ? 0 : 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: settings.reduceAnimations ? 0 : 400 }}
            transition={springConfig}
            className="fixed right-0 inset-y-0 w-full sm:w-[500px] bg-background border-l border-border/10 z-[200] shadow-premium flex flex-col"
            style={{ height: viewportHeight ? `${viewportHeight}px` : '100dvh' }}
          >
            <div className="p-spacing-lg md:p-spacing-xl border-b border-border/5 flex items-center justify-between">
              <div className="flex items-center gap-spacing-md">
                <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/[0.02] border border-border/10 flex items-center justify-center text-primary/60">
                  <Icons.Sparkles className="w-spacing-md h-spacing-md" strokeWidth={0.5} />
                </div>
                <div>
                  <h3 className="text-premium-sm font-bold uppercase tracking-[0.4em] text-primary">Logos IA</h3>
                  <p className="text-[9px] text-muted-foreground/60 uppercase font-black tracking-widest mt-spacing-2xs">Mentor Espiritual</p>
                </div>
              </div>
              <div className="flex items-center gap-spacing-xs">
                {history.length > 0 && (
                  <>
                    <CathedraButton 
                      variant="ghost" 
                      size="sm" 
                      onClick={exportHistory} 
                      className="rounded-premium-full hover:bg-primary/[0.02] text-primary/60 hover:text-primary transition-colors h-spacing-xl w-spacing-xl px-spacing-0"
                      title="Exportar histórico"
                      icon={<Icons.Download className="w-spacing-md h-spacing-md" />}
                    />
                    <CathedraButton 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => clearHistory()} 
                      className="rounded-premium-full hover:bg-primary/[0.02] text-primary/60 hover:text-primary transition-colors h-spacing-xl w-spacing-xl px-spacing-0"
                      title="Limpar histórico"
                      icon={<Icons.RotateCcw className="w-spacing-md h-spacing-md" />}
                    />
                  </>
                )}
                <CathedraButton variant="ghost" size="sm" onClick={onClose} className="rounded-premium-full hover:bg-primary/[0.02] text-primary/60 hover:text-primary transition-colors h-spacing-xl w-spacing-xl px-spacing-0" icon={<Icons.X className="w-spacing-md h-spacing-md" />} />
              </div>
            </div>

            <div className="px-spacing-lg md:px-spacing-xl py-spacing-sm bg-primary/[0.02] border-b border-border/5 flex items-center justify-between">
              <div className="flex items-center gap-spacing-xs">
                <div className={`w-spacing-2xs h-spacing-2xs rounded-premium-full ${
                  settings.totalSilence ? 'bg-red-400' : (history.length > 0 ? 'bg-secondary animate-pulse' : 'bg-primary/20')
                }`} />
                <span className="text-[7px] font-black uppercase tracking-widest text-primary/60">
                  {settings.totalSilence ? 'Modo Silêncio Total' : (history.length > 0 ? 'Registro de Alma Ativo' : 'Estado de Escuta')}
                </span>
              </div>
              <p className="text-[7px] text-muted-foreground/60 uppercase font-black tracking-widest italic">
                {context || 'Santuário Universal'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-spacing-lg md:p-spacing-xl space-y-spacing-xl md:space-y-spacing-xl scrollbar-hide">
              {history.length === 0 && !selectedText && (
                <div className="text-center py-spacing-3xl space-y-spacing-xl">
                  <div className="w-spacing-2xs h-spacing-2xs rounded-premium-full bg-primary/10 mx-auto animate-pulse" />
                  <p className="text-premium-lg text-muted-foreground/40 font-serif italic leading-relaxed max-w-[280px] mx-auto">
                    {settings.totalSilence 
                      ? '"No silêncio, Deus fala ao coração."' 
                      : '"O silêncio é a primeira língua de Deus."'}
                    <br/>
                    <span className="text-premium-sm uppercase tracking-widest font-black mt-spacing-md block">
                      {settings.totalSilence ? 'Modo Silêncio Ativo' : 'Como posso iluminar sua jornada?'}
                    </span>
                  </p>
                </div>
              )}

              {history.length > visibleMessages && (
                <div className="flex justify-center pb-spacing-xl">
                  <CathedraButton 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setVisibleMessages(prev => prev + 10)}
                    className="text-[9px] font-black uppercase tracking-widest text-primary/60 hover:text-primary h-auto py-spacing-xs"
                  >
                    Ver histórico anterior
                  </CathedraButton>
                </div>
              )}
              {history.slice(-visibleMessages).map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-spacing-sm animate-in fade-in slide-in-from-bottom-spacing-xs duration-500`}>
                  <div className={`max-w-[90%] p-spacing-lg md:p-spacing-xl rounded-premium-lg text-premium-sm md:text-premium-base leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground shadow-premium' 
                      : 'bg-card border border-border/5 font-serif italic text-foreground/80'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-primary/60 px-spacing-md">
                    {msg.role === 'user' ? 'Peregrino' : 'Logos'}
                  </span>
                </div>
              ))}

              {(isLoading || isTyping) && (
                <div className="flex justify-start animate-in fade-in duration-500">
                  <div className="bg-muted/10 p-spacing-md md:p-spacing-lg rounded-premium-lg flex gap-spacing-sm">
                    <div className="w-spacing-2xs h-spacing-2xs bg-primary/20 rounded-premium-full animate-bounce" />
                    <div className="w-spacing-2xs h-spacing-2xs bg-primary/20 rounded-premium-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-spacing-2xs h-spacing-2xs bg-primary/20 rounded-premium-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-spacing-lg md:p-spacing-xl border-t border-border/5 bg-background/30">
              <form onSubmit={handleQuery} className="relative group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={settings.totalSilence ? "Silêncio Total Ativo..." : "Busque por luz e entendimento..."}
                  disabled={settings.totalSilence}
                  className="w-full bg-transparent border-b border-border/10 py-spacing-md px-spacing-0 text-premium-base md:text-premium-lg focus:border-primary/40 outline-none transition-all placeholder:text-muted-foreground/60 font-serif italic"
                />
                <button 
                  type="submit"
                  disabled={isLoading || isTyping || settings.totalSilence}
                  className="absolute right-0 top-spacing-2xs/2 -translate-y-1/2 w-spacing-xl h-spacing-xl rounded-premium-full flex items-center justify-center text-primary hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
                >
                  <Icons.ArrowRight className="w-spacing-md h-spacing-md" />
                </button>
              </form>
              <div className="mt-spacing-xl">
                <p className="text-[8px] text-muted-foreground/60 uppercase tracking-[0.4em] text-center font-bold">
                  {settings.totalSilence ? "Silêncio em Adoração" : "Sempre em comunhão com o Magistério"}
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