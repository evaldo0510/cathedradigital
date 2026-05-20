import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LogosAIProps {
  context?: string;
  selectedText?: string;
  isOpen: boolean;
  onClose: () => void;
  type?: 'bible' | 'catechism' | 'magisterium';
}

const LogosAI: React.FC<LogosAIProps> = ({ context, selectedText, isOpen, onClose, type = 'bible' }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

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
      setHistory(prev => [...prev, { role: 'assistant', content: assistantMsg }]);
    } catch (err) {
      console.error('Logos IA Error:', err);
      toast.error('Erro ao conectar com Logos IA');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-card border-l border-border z-[200] shadow-2xl flex flex-col"
        >
          <div className="p-6 border-b border-border flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Icons.Search className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Logos IA</h3>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Sabedoria Contextual</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <Icons.ArrowDown className="w-4 h-4 rotate-[-90deg]" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {history.length === 0 && !selectedText && (
              <div className="text-center py-12 space-y-4">
                <Icons.Sparkles className="w-12 h-12 text-primary/20 mx-auto" />
                <p className="text-sm text-muted-foreground font-serif italic">
                  "No princípio era o Verbo..."<br/>
                  Como posso ajudar na sua contemplação hoje?
                </p>
              </div>
            )}

            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-premium text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white' 
                    : 'bg-muted border border-border/40 font-serif'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted p-4 rounded-premium flex gap-2">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border bg-muted/30">
            <form onSubmit={handleQuery} className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pergunte sobre o texto..."
                className="w-full bg-card border border-border rounded-full py-3 px-5 pr-12 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
              >
                <Icons.ArrowDown className="w-4 h-4 rotate-[-90deg]" />
              </button>
            </form>
            <p className="text-[10px] text-center mt-4 text-muted-foreground uppercase tracking-widest">
              Logos IA pode cometer erros. Consulte sempre o Magistério.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LogosAI;
