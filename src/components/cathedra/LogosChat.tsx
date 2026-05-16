import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, BookOpen, Quote, ChevronRight, Compass } from 'lucide-react';
import { Button } from '@/components/cathedra/Button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { callColloquium } from '@/services/aiService';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const TheologicalAwareText: React.FC<{
  text: string;
  onNavigateBible: (abbr: string, chapter: number) => void;
  onNavigateCatechism: (paragraph: number) => void;
}> = ({ text, onNavigateBible, onNavigateCatechism }) => {
  const segments = useMemo(() => parseTheologicalReferences(text), [text]);
  if (segments.length === 1 && segments[0].type === 'text') return <>{text}</>;
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'bibleRef' && seg.abbr) {
          return (
            <BibleVersePopover
              key={i}
              abbr={seg.abbr}
              chapter={seg.chapter!}
              verse={seg.verse}
              label={seg.value}
              onNavigate={onNavigateBible}
            />
          );
        }
        if (seg.type === 'catechismRef' && seg.paragraph) {
          return (
            <CatechismPopover
              key={i}
              paragraph={seg.paragraph}
              onNavigate={onNavigateCatechism}
            />
          );
        }
        return <React.Fragment key={i}>{seg.value}</React.Fragment>;
      })}
    </>
  );
};

const LogosChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bem-vindo ao Logos. Em que posso auxiliá-lo em sua caminhada espiritual hoje?',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleNavigateToBible = useCallback((abbr: string, chapter: number) => {
    navigate(`/bible?book=${abbr}&ch=${chapter}`);
  }, [navigate]);

  const handleNavigateToCatechism = useCallback((paragraph: number) => {
    navigate(`/catechism?p=${paragraph}`);
  }, [navigate]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      chatHistory.push({ role: 'user', content: userMessage.content });

      const response = await callColloquium(chatHistory, 'contemplative');

      if (response.content) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else if (response.error) {
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.error || 'Ocorreu um erro.',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Logos chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[250] pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - Ethereal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-background/20 backdrop-blur-md pointer-events-auto"
            />
            
            {/* Sidebar - Monastery Integrated */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 150 }}
              className="absolute top-0 right-0 h-full w-full sm:w-[480px] bg-background border-l border-primary/5 shadow-premium flex flex-col pointer-events-auto reading-monastery overflow-hidden"
            >
              {/* Refined Header */}
              <div className="p-10 border-b border-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-full bg-primary/[0.02] flex items-center justify-center border border-primary/10 animate-pulse-slow">
                    <Compass className="w-7 h-7 text-primary/60" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display text-primary tracking-tightest">Logos</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/20">Mestre de Sabedoria</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="rounded-full hover:bg-primary/5 text-primary/20 hover:text-primary transition-all"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Messages - Pure Typographic Flow */}
              <ScrollArea className="flex-1 px-10 pt-10 pb-20" ref={scrollRef}>
                <div className="space-y-20 max-w-md mx-auto">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-3 mb-6 opacity-30">
                          <span className="w-8 h-px bg-primary/40" />
                          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Reflexão</span>
                        </div>
                      )}
                      
                      <div
                        className={`font-serif leading-relaxed ${
                          msg.role === 'user'
                            ? 'text-xl text-primary/50 italic text-right'
                            : 'text-2xl text-primary border-l-4 border-secondary/10 pl-10 py-2'
                        }`}
                      >
                        <TheologicalAwareText 
                          text={msg.content} 
                          onNavigateBible={handleNavigateToBible}
                          onNavigateCatechism={handleNavigateToCatechism}
                        />
                      </div>
                      
                      {msg.role === 'user' && (
                        <div className="flex items-center gap-3 mt-6 opacity-20">
                          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Coração Humano</span>
                          <span className="w-8 h-px bg-primary/40" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-4 mb-6 opacity-20">
                        <Compass className="w-4 h-4 text-primary animate-spin-slow" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Logos medita...</span>
                      </div>
                      <div className="flex gap-2 ml-10">
                        <span className="w-1 h-1 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                        <span className="w-1 h-1 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} className="h-10" />
              </ScrollArea>

              {/* Input Area - Journal Feel */}
              <div className="p-10 border-t border-primary/5 bg-background/20 backdrop-blur-xl">
                <div className="relative group">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Abra seu coração ou tire uma dúvida..."
                    className="w-full bg-transparent border-b border-primary/10 py-6 pr-14 text-xl font-serif focus:outline-none focus:border-secondary/30 transition-all duration-700 resize-none placeholder:text-primary/10"
                    rows={1}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-0 bottom-6 p-3 text-primary/20 hover:text-secondary disabled:opacity-0 transition-all duration-700 hover:scale-110"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </div>
                <div className="mt-8 flex justify-between items-center opacity-10">
                  <p className="text-[10px] font-medium italic tracking-widest">Silêncio e Escuta</p>
                  <div className="flex gap-6">
                    <Scroll className="w-3.5 h-3.5" />
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Trigger - Integrated & Subtle */}
      {!isOpen && (
        <motion.button
          layoutId="logos-trigger"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-12 right-12 z-[200] flex items-center gap-6 pl-8 pr-6 py-4 bg-primary text-primary-foreground rounded-full shadow-premium pointer-events-auto group overflow-hidden border border-primary-foreground/5"
        >
          <div className="absolute inset-0 bg-secondary/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-1000" />
          <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.4em]">Logos</span>
          <div className="relative z-10 w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center group-hover:rotate-45 transition-transform duration-1000">
            <Compass className="w-5 h-5" />
          </div>
        </motion.button>
      )}
    </div>
  );
};

export default LogosChat;
