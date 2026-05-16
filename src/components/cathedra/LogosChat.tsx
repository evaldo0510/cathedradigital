import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, BookOpen, Quote, ChevronRight, Compass, Scroll, Download, Target, Feather, Shield, Heart } from 'lucide-react';
import { Button } from '@/components/cathedra/Button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { callColloquium } from '@/services/aiService';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

import { ReferenceModal } from './ReferenceModal';

const TheologicalAwareText: React.FC<{
  text: string;
  onNavigateBible: (abbr: string, chapter: number) => void;
  onNavigateCatechism: (paragraph: number) => void;
  isContemplative?: boolean;
  onReferenceClick?: (type: 'bible' | 'catechism', params: any) => void;
}> = ({ text, onNavigateBible, onNavigateCatechism, isContemplative, onReferenceClick }) => {
  const segments = useMemo(() => parseTheologicalReferences(text), [text]);
  if (segments.length === 1 && segments[0].type === 'text') return <>{text}</>;
  return (
    <div className={cn("inline-block", isContemplative && "leading-[2.2] tracking-wide")}>
      {segments.map((seg, i) => {
        if (seg.type === 'bibleRef' && seg.abbr) {
          return (
            <button
              key={i}
              onClick={() => onReferenceClick?.('bible', { abbr: seg.abbr, chapter: seg.chapter, verse: seg.verse })}
              className="inline-flex items-center gap-1 font-serif text-[15px] font-bold text-secondary/80 hover:text-secondary border-b border-secondary/10 hover:border-secondary transition-all px-0.5 leading-none mx-0.5"
            >
              {seg.value}
            </button>
          );
        }
        if (seg.type === 'catechismRef' && seg.paragraph) {
          return (
            <button
              key={i}
              onClick={() => onReferenceClick?.('catechism', { paragraph: seg.paragraph })}
              className="inline-flex items-center gap-1 font-serif text-[15px] font-bold text-secondary/80 hover:text-secondary border-b border-secondary/10 hover:border-secondary transition-all px-0.5 leading-none mx-0.5"
            >
              §{seg.paragraph}
            </button>
          );
        }
        return <React.Fragment key={i}>{seg.value}</React.Fragment>;
      })}
    </div>
  );
};

type LogosTone = 'contemplative' | 'poetic' | 'doctrinal' | 'brief';

const LogosChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tone, setTone] = useState<LogosTone>('contemplative');
  const [isContemplative, setIsContemplative] = useState(false);
  const [hasRitualPassed, setHasRitualPassed] = useState(false);
  const [intention, setInputIntention] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, hasRitualPassed]);

  const handleNavigateToBible = useCallback((abbr: string, chapter: number) => {
    navigate(`/bible?book=${abbr}&ch=${chapter}`);
  }, [navigate]);

  const handleNavigateToCatechism = useCallback((paragraph: number) => {
    navigate(`/catechism?p=${paragraph}`);
  }, [navigate]);

  const startWithRitual = async () => {
    if (!intention.trim()) return;
    
    setHasRitualPassed(true);
    const welcomeMsg: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `Paz e bem. Recebo sua intenção: "${intention}". Em que posso auxiliá-lo em sua caminhada espiritual hoje?`,
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
    
    // Auto-save intention if needed
    if (user) {
      const { data: conv } = await supabase
        .from('colloquium_conversations')
        .insert({ user_id: user.id, title: `Diálogo: ${intention.slice(0, 30)}...` })
        .select('id')
        .single();
        
      if (conv) {
        await supabase.from('colloquium_messages').insert({
          conversation_id: conv.id,
          role: 'assistant',
          content: welcomeMsg.content
        });
      }
    }
  };

  const handleExportPDF = () => {
    if (messages.length === 0) return;
    
    const doc = new jsPDF();
    const title = `Diálogo Espiritual - ${new Date().toLocaleDateString()}`;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text('Cathedra Digital', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text(title, 105, 30, { align: 'center' });
    
    let y = 50;
    doc.setFontSize(12);
    doc.setFont('times', 'normal');
    
    messages.forEach((msg) => {
      const role = msg.role === 'user' ? 'Você' : 'Logos';
      const lines = doc.splitTextToSize(`${role}: ${msg.content}`, 170);
      
      if (y + lines.length * 7 > 280) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont('times', 'bold');
      doc.text(`${role}:`, 20, y);
      doc.setFont('times', 'normal');
      doc.text(lines.map((l: string) => l.replace(`${role}: `, '')), 20, y + 6);
      
      y += lines.length * 7 + 10;
    });
    
    doc.save(`logos-reflexao-${Date.now()}.pdf`);
    toast.success('PDF exportado com sucesso.');
  };

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

      const response = await callColloquium(chatHistory, tone);

      if (response.content) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // Auto-save to spiritual journal if user is logged in
        if (user) {
          await supabase.from('user_history').insert({
            user_id: user.id,
            title: 'Reflexão com Logos',
            route: '/logos',
            metadata: { 
              reflection: assistantMessage.content,
              prompt: userMessage.content,
              tone,
              timestamp: new Date().toISOString()
            }
          });
        }
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
                  <div className="w-14 h-14 rounded-full bg-primary/[0.03] flex items-center justify-center border border-primary/10 transition-all duration-1000">
                    <Compass className="w-7 h-7 text-primary/40" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display text-primary tracking-tightest">Logos</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/20">Mestre de Sabedoria</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleExportPDF}
                    className="rounded-full hover:bg-primary/5 text-primary/20 hover:text-primary transition-all"
                    title="Exportar PDF"
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsContemplative(!isContemplative)}
                    className={cn(
                      "rounded-full hover:bg-primary/5 transition-all",
                      isContemplative ? "text-primary bg-primary/10" : "text-primary/20"
                    )}
                    title="Modo Contemplativo"
                  >
                    <Target className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsOpen(false)}
                    className="rounded-full hover:bg-primary/5 text-primary/20 hover:text-primary transition-all"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </div>

              {/* Messages - Pure Typographic Flow */}
              <ScrollArea className="flex-1 px-10 pt-10 pb-20" ref={scrollRef}>
                <div className={cn("space-y-20 max-w-md mx-auto transition-all duration-1000", isContemplative && "space-y-32 scale-[1.02]")}>
                  {!hasRitualPassed && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-20 text-center space-y-12"
                    >
                      <div className="space-y-6">
                        <Heart className="w-12 h-12 text-secondary/20 mx-auto" />
                        <h4 className="text-3xl font-display text-primary/80">Silencie o Coração</h4>
                        <p className="text-lg text-primary/40 font-serif italic leading-relaxed">
                          Antes de iniciarmos, ofereça sua intenção ou uma breve oração ao Senhor.
                        </p>
                      </div>
                      <div className="relative group max-w-sm mx-auto">
                        <textarea
                          value={intention}
                          onChange={(e) => setInputIntention(e.target.value)}
                          placeholder="Minha intenção hoje é..."
                          className="w-full bg-transparent border-b border-primary/10 py-6 text-xl font-serif focus:outline-none focus:border-secondary/30 transition-all duration-1000 resize-none placeholder:text-primary/5 text-center"
                          rows={1}
                        />
                        <button
                          onClick={startWithRitual}
                          disabled={!intention.trim()}
                          className="mt-12 px-12 py-4 bg-primary text-primary-foreground rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-premium hover:scale-105 transition-all disabled:opacity-0"
                        >
                          Iniciar Diálogo
                        </button>
                      </div>
                    </motion.div>
                  )}
                  
                  {hasRitualPassed && messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      
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
                          isContemplative={isContemplative}
                        />
                      </div>
                      
                      {/* Silent marker */}
                      <div className="h-4" />
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

              {/* Input Area - Integrated Journal Feel */}
              {hasRitualPassed && (
                <div className="p-10 border-t border-primary/5 bg-background/40 backdrop-blur-2xl">
                  {/* Tone Selector */}
                  <div className="flex items-center justify-center gap-6 mb-8 opacity-40 hover:opacity-100 transition-opacity">
                    {(['contemplative', 'poetic', 'doctrinal', 'brief'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={cn(
                          "text-[9px] font-black uppercase tracking-[0.3em] transition-all pb-1 border-b-2",
                          tone === t ? "text-primary border-secondary" : "text-primary/20 border-transparent"
                        )}
                      >
                        {t === 'contemplative' && <Target className="w-3 h-3 mb-1 mx-auto" />}
                        {t === 'poetic' && <Feather className="w-3 h-3 mb-1 mx-auto" />}
                        {t === 'doctrinal' && <Shield className="w-3 h-3 mb-1 mx-auto" />}
                        {t === 'brief' && <Quote className="w-3 h-3 mb-1 mx-auto" />}
                        {t}
                      </button>
                    ))}
                  </div>

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
                      placeholder="Abra seu coração..."
                      className="w-full bg-transparent py-6 pr-14 text-xl font-serif focus:outline-none transition-all duration-1000 resize-none placeholder:text-primary/5 border-none"
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
                </div>
              )}
              
              <div className="p-10 pt-0 bg-background/40 backdrop-blur-2xl">
                <div className="flex justify-between items-center opacity-[0.03]">
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
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-12 right-12 z-[200] w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-premium pointer-events-auto flex items-center justify-center group overflow-hidden border border-primary-foreground/5"
        >
          <div className="absolute inset-0 bg-secondary/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-1000" />
          <Compass className="relative z-10 w-6 h-6 group-hover:rotate-12 transition-transform duration-1000" />
        </motion.button>
      )}
    </div>
  );
};

export default LogosChat;
