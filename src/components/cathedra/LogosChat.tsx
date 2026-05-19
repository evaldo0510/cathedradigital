import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, BookOpen, Quote, ChevronRight, Compass, Scroll, Download, Target, Feather, Shield, Heart, Eye, ArrowDown, Lock } from 'lucide-react';
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
  showDetails?: boolean;
  isMobile?: boolean;
}> = ({ text, onNavigateBible, onNavigateCatechism, isContemplative, onReferenceClick, showDetails = true, isMobile }) => {
  const processedText = useMemo(() => {
    if (showDetails) return text;
    // Simple logic to hide "extra" sections: split by double newline and filter out sections starting with ## or ---
    const lines = text.split('\n');
    let essential = [];
    let skipping = false;
    for (const line of lines) {
      if (line.startsWith('##') || line.startsWith('---') || line.includes('Meditação') || line.includes('Aprofundamento')) {
        skipping = true;
      }
      if (!skipping) {
        essential.push(line);
      }
    }
    return essential.join('\n').trim();
  }, [text, showDetails]);

  const segments = useMemo(() => parseTheologicalReferences(processedText), [processedText]);
  if (segments.length === 1 && segments[0].type === 'text') return <>{processedText}</>;
  return (
    <div className={cn("inline-block", isContemplative && "leading-[2.2] tracking-wide", isMobile && !isContemplative && "leading-relaxed")}>
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

const LogosChat = ({ isPage = false }: { isPage?: boolean }) => {
  const [isOpen, setIsOpen] = useState(isPage);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'mock-1',
      role: 'assistant',
      content: 'Paz e bem. Sou IARA (Inteligência Artificial de Reflexão Aplicada), sua guia de sabedoria. Como posso iluminar seu entendimento hoje?',
      timestamp: new Date()
    },
    {
      id: 'mock-2',
      role: 'user',
      content: 'Gostaria de entender melhor o conceito de Graça Santificante.',
      timestamp: new Date()
    },
    {
      id: 'mock-3',
      role: 'assistant',
      content: 'A Graça Santificante é um dom gratuito que Deus nos faz de sua vida, infundida pelo Espírito Santo em nossa alma para curá-la do pecado e santificá-la. Como ensina o Catecismo (§1999), ela é uma disposição estável e sobrenatural que aperfeiçoa a alma para torná-la capaz de viver com Deus.',
      timestamp: new Date()
    }
  ]);
  const [hasRitualPassed, setHasRitualPassed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [tone, setTone] = useState<LogosTone>('contemplative');
  const [isContemplative, setIsContemplative] = useState(false);
  const [showExtraDetails, setShowExtraDetails] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [intention, setInputIntention] = useState('');
  const [refModal, setRefModal] = useState<{ isOpen: boolean; type: 'bible' | 'catechism'; params: any }>({
    isOpen: false,
    type: 'bible',
    params: {}
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const inputTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the close button or first element when opening
      setTimeout(() => closeBtnRef.current?.focus(), 100);
    } else {
      // Return focus to trigger when closing
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
      }

      // Alt + T to cycle tones
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        const tones: LogosTone[] = ['contemplative', 'poetic', 'doctrinal', 'brief'];
        const nextIndex = (tones.indexOf(tone) + 1) % tones.length;
        setTone(tones[nextIndex]);
        toast.info(`Tom alterado para: ${tones[nextIndex]}`);
      }

      // Alt + 1-4 for specific tones
      if (e.altKey && !isNaN(parseInt(e.key))) {
        const num = parseInt(e.key);
        const tones: LogosTone[] = ['contemplative', 'poetic', 'doctrinal', 'brief'];
        if (num >= 1 && num <= tones.length) {
          e.preventDefault();
          setTone(tones[num - 1]);
          toast.info(`Tom alterado para: ${tones[num - 1]}`);
        }
      }

      // Trap focus
      if (e.key === 'Tab') {
        const focusableElements = document.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const modalElements = Array.from(focusableElements).filter(el => 
          document.querySelector('.reading-monastery')?.contains(el)
        );
        
        if (modalElements.length > 0) {
          const first = modalElements[0] as HTMLElement;
          const last = modalElements[modalElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, tone]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages, isLoading, hasRitualPassed, isOpen, autoScroll]);

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

        // Command parsing for IARA
        const commandMatch = response.content.match(/\{"command":\s*"NAVIGATE",\s*"target":\s*"(PORTAL|ESTÚDIO|ESTELA)"\}/i);
        if (commandMatch) {
          const target = commandMatch[1].toUpperCase();
          let path = '';
          if (target === 'PORTAL') path = '/sanctuarium';
          else if (target === 'ESTÚDIO') path = '/lectio';
          else if (target === 'ESTELA') path = '/diagnostico';
          
          if (path) {
            toast.info(`IARA: Encaminhando para ${target}...`, {
              icon: <Compass className="w-4 h-4 animate-spin" />,
              duration: 3000
            });
            setTimeout(() => {
              navigate(path);
              setIsOpen(false);
            }, 2000);
          }
        }

        setMessages((prev) => [...prev, assistantMessage]);
        
        // Auto-save to spiritual journal as a dedicated reflection
        if (user) {
          await supabase.from('user_notes').insert({
            user_id: user.id,
            content_type: 'logos_reflection',
            content_id: `logos_${Date.now()}`,
            note_text: assistantMessage.content,
            metadata: { 
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
    <div className={cn(
      isPage ? "relative h-screen w-full" : "fixed inset-y-0 right-0 z-[250] pointer-events-none flex flex-col justify-end overflow-hidden sm:overflow-visible",
      isOpen || isPage ? "w-full sm:w-auto" : "w-0"
    )}>
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
              initial={isPage ? { opacity: 0 } : { x: '100%' }}
              animate={isPage ? { opacity: 1 } : { x: 0 }}
              exit={isPage ? { opacity: 0 } : { x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 150 }}
              className={cn(
                "h-[100dvh] bg-background border-l border-primary/5 shadow-premium flex flex-col reading-monastery overflow-hidden max-w-full",
                isPage ? "w-full" : "absolute top-0 right-0 w-full sm:w-[520px] sm:rounded-l-[24px] pointer-events-auto"
              )}
            >
              {/* Refined Header */}
              <div className="p-4 sm:p-8 border-b border-primary/5 flex items-center justify-between flex-shrink-0 bg-background/40 backdrop-blur-md">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/[0.03] flex items-center justify-center border border-primary/10 transition-all duration-1000">
                    <Compass className="w-5 h-5 sm:w-7 sm:h-7 text-primary/40" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl sm:text-2xl font-display text-primary tracking-tightest truncate">Logos</h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/20 truncate">Mestre de Sabedoria</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon-xs" 
                    onClick={handleExportPDF}
                    className="rounded-full hover:bg-primary/5 text-primary/20 hover:text-primary transition-all"
                    title="Exportar PDF"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  
                  <div className="h-6 w-px bg-primary/5 mx-1 hidden sm:block" />

                  <Button 
                    variant="ghost" 
                    size="icon-xs" 
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={cn(
                      "rounded-full hover:bg-primary/5 transition-all",
                      autoScroll ? "text-secondary bg-secondary/10" : "text-primary/20"
                    )}
                    title={autoScroll ? "Pausar Auto-scroll" : "Manter Auto-scroll"}
                    aria-label={autoScroll ? "Pausar rolagem automática" : "Ativar rolagem automática"}
                  >
                    {autoScroll ? <ArrowDown className="w-4 h-4 animate-bounce" /> : <Lock className="w-4 h-4" />}
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="icon-xs" 
                    onClick={() => setShowExtraDetails(!showExtraDetails)}
                    className={cn(
                      "rounded-full hover:bg-primary/5 transition-all",
                      !showExtraDetails ? "text-primary bg-primary/10" : "text-primary/20"
                    )}
                    title={showExtraDetails ? "Ocultar Detalhes" : "Mostrar Detalhes"}
                  >
                    <Eye className={cn("w-4 h-4 sm:w-5 sm:h-5", !showExtraDetails && "opacity-50")} />
                  </Button>

                  <Button 
                    ref={closeBtnRef}
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsOpen(false)}
                    className="rounded-full hover:bg-primary/5 text-primary/20 hover:text-primary transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none"
                    aria-label="Fechar Logos (ESC)"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                </div>
              </div>

              {/* Messages - Pure Typographic Flow */}
              <ScrollArea className="flex-1 px-4 sm:px-10 pt-4 sm:pt-10 pb-20 overscroll-contain no-scrollbar scroll-smooth" ref={scrollRef}>
                <div className={cn("space-y-10 sm:space-y-16 max-w-md mx-auto transition-all duration-1000", isContemplative && "space-y-20 sm:space-y-28 scale-[1.01]")}>
                  {!hasRitualPassed && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-12 sm:py-20 text-center space-y-8 sm:space-y-12 px-4 sm:px-6"
                    >
                      <div className="space-y-6">
                        <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-secondary/20 mx-auto" />
                        <h4 className="text-3xl font-display text-primary/80">Silencie o Coração</h4>
                        <p className="text-lg text-primary/40 font-serif italic leading-relaxed">
                          Antes de iniciarmos, ofereça sua intenção ou uma breve oração ao Senhor.
                        </p>
                      </div>
                      <div className="relative group max-w-sm mx-auto w-full px-4 sm:px-0">
                        <textarea
                          value={intention}
                          onChange={(e) => setInputIntention(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (intention.trim()) startWithRitual();
                            }
                          }}
                          placeholder="Minha intenção hoje é..."
                          className="w-full bg-transparent border-b border-primary/10 py-4 sm:py-6 text-lg sm:text-xl font-serif focus:outline-none focus:border-secondary/30 transition-all duration-1000 resize-none placeholder:text-primary/10 text-center min-h-[60px] sm:min-h-[80px]"
                          rows={1}
                        />
                        <button
                          onClick={startWithRitual}
                          disabled={!intention.trim()}
                          className="mt-8 sm:mt-12 btn-premium-primary w-full sm:w-auto mx-auto"
                        >
                          Iniciar Diálogo
                        </button>
                      </div>
                    </motion.div>
                  )}
                  
                  {hasRitualPassed && messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`font-serif leading-relaxed ${
                          msg.role === 'user'
                            ? 'text-base sm:text-lg text-primary/40 italic text-right mb-2'
                            : 'text-lg sm:text-xl text-primary border-l-[2px] border-secondary/10 pl-6 sm:pl-8 py-1 mb-8'
                        }`}
                      >
                        <TheologicalAwareText 
                          text={msg.content} 
                          onNavigateBible={handleNavigateToBible}
                          onNavigateCatechism={handleNavigateToCatechism}
                          isContemplative={isContemplative}
                          onReferenceClick={(type, params) => setRefModal({ isOpen: true, type, params })}
                          showDetails={showExtraDetails}
                          isMobile={window.innerWidth < 640}
                        />
                        {msg.role === 'assistant' && msg.content.includes('\n') && (
                          <div className="mt-4 flex gap-1 items-center opacity-20 hover:opacity-100 transition-opacity">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary/60" />
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary/30" />
                          </div>
                        )}
                      </div>
                      <div className="h-8" />
                    </div>
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
              <div className="p-4 sm:p-10 border-t border-primary/5 bg-background/40 backdrop-blur-md flex-shrink-0">
                <div className="max-w-md mx-auto relative group">
                  <textarea
                    ref={inputTextAreaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={hasRitualPassed ? "Digite sua dúvida ou reflexão..." : "Sua intenção para este diálogo..."}
                    className="w-full bg-primary/[0.03] border border-primary/10 rounded-[28px] pl-6 pr-16 py-4 sm:py-5 text-sm sm:text-base text-primary placeholder:text-primary/20 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary/30 transition-all resize-none min-h-[56px] max-h-32"
                    rows={1}
                  />
                  <Button
                    onClick={hasRitualPassed ? handleSend : startWithRitual}
                    disabled={(!hasRitualPassed && !intention.trim()) || (hasRitualPassed && (!input.trim() || isLoading))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 p-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform active:scale-90"
                    size="icon"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </Button>
                </div>
                <div className="mt-4 flex items-center justify-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2">
                  {(['contemplative', 'poetic', 'doctrinal', 'brief'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={cn(
                        "text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap px-3 py-1.5 rounded-full border",
                        tone === t 
                          ? "text-secondary border-secondary/30 bg-secondary/5 shadow-sm" 
                          : "text-primary/20 border-transparent hover:text-primary/40"
                      )}
                    >
                      {t === 'contemplative' ? 'Contemplativo' : t === 'poetic' ? 'Poético' : t === 'doctrinal' ? 'Doutrinal' : 'Breve'}
                    </button>
                  ))}
                </div>
              </div>
              
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
      {!isOpen && !isPage && (
        <motion.button
          ref={triggerRef}
          layoutId="logos-trigger"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-12 right-12 z-[200] w-14 h-14 bg-rose-900 text-white rounded-full shadow-premium pointer-events-auto flex items-center justify-center group overflow-hidden border border-white/5 focus-visible:ring-2 focus-visible:ring-rose-900 focus-visible:ring-offset-2 outline-none"
          aria-label="Abrir Logos (Ctrl+L)"
          aria-haspopup="true"
        >
          <div className="absolute inset-0 bg-secondary/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-1000" />
          <Compass className="relative z-10 w-6 h-6 group-hover:rotate-12 transition-transform duration-1000" />
        </motion.button>
      )}
      {/* Reference Modal */}
      <ReferenceModal
        isOpen={refModal.isOpen}
        onClose={() => setRefModal(prev => ({ ...prev, isOpen: false }))}
        initialType={refModal.type}
        initialParams={refModal.params}
      />
    </div>
  );
};

export default LogosChat;
