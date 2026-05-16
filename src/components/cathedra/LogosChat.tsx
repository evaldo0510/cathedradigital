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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-background/40 backdrop-blur-sm pointer-events-auto"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-full sm:w-[450px] bg-background border-l border-border/50 shadow-premium flex flex-col pointer-events-auto reading-sepia"
            >
              {/* Header */}
              <div className="p-8 border-b border-border/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                    <Compass className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display text-primary tracking-tight">Logos</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Mestre Contemplativo</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="rounded-full hover:bg-primary/5"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-8" ref={scrollRef}>
                <div className="space-y-12 max-w-sm mx-auto">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-6 h-px bg-primary/20" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/30">Reflexão</span>
                        </div>
                      )}
                      
                      <div
                        className={`font-monastery leading-relaxed ${
                          msg.role === 'user'
                            ? 'text-lg text-primary/80 italic text-right'
                            : 'text-xl text-primary border-l-2 border-primary/10 pl-6 py-2'
                        }`}
                      >
                        <TheologicalAwareText 
                          text={msg.content} 
                          onNavigateBible={handleNavigateToBible}
                          onNavigateCatechism={handleNavigateToCatechism}
                        />
                      </div>
                      
                      {msg.role === 'user' && (
                        <div className="flex items-center gap-2 mt-4">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/30">Seu pensamento</span>
                          <span className="w-6 h-px bg-primary/20" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-6 h-px bg-primary/20" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/30 animate-pulse">Logos está refletindo...</span>
                      </div>
                      <div className="flex gap-1.5 ml-6">
                        <span className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-8 border-t border-border/10 bg-background/50 backdrop-blur-md">
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
                    placeholder="Sua reflexão ou dúvida..."
                    className="w-full bg-transparent border-b border-primary/10 py-4 pr-12 text-lg font-monastery focus:outline-none focus:border-primary/40 transition-colors resize-none placeholder:text-primary/20"
                    rows={1}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-0 bottom-4 p-2 text-primary/40 hover:text-primary disabled:opacity-0 transition-all"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-[9px] font-medium text-primary/30 italic">Pressione Enter para enviar sua reflexão</p>
                  <div className="flex gap-4">
                    <BookOpen className="w-3 h-3 text-primary/20" />
                    <Quote className="w-3 h-3 text-primary/20" />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Trigger - Refined */}
      {!isOpen && (
        <motion.button
          layoutId="logos-trigger"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-[200] flex items-center gap-4 pl-6 pr-4 py-3 bg-primary text-primary-foreground rounded-full shadow-premium pointer-events-auto group overflow-hidden"
        >
          <div className="absolute inset-0 bg-secondary/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
          <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em]">Dialogar com Logos</span>
          <div className="relative z-10 w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
        </motion.button>
      )}
    </div>
  );
};

export default LogosChat;
