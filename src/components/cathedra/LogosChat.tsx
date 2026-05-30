import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Book, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const LogosChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { settings } = useReadingSettings();
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('cathedra_logos_messages');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Enforce limit on load
      const limited = parsed.slice(-settings.logosHistoryLimit);
      return limited.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    }
    return [
      {
        id: '1',
        role: 'assistant',
        content: 'Bem-vindo ao Logos IA. Em que posso auxiliá-lo em sua oração ou reflexão hoje?',
        timestamp: new Date(),
      },
    ];
  });

  useEffect(() => {
    const limitedMessages = messages.slice(-settings.logosHistoryLimit);
    localStorage.setItem('cathedra_logos_messages', JSON.stringify(limitedMessages));
  }, [messages, settings.logosHistoryLimit]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulating AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Refletindo sobre "${userMessage.content}": "Buscai primeiro o Reino de Deus e a sua justiça, e todas estas coisas vos serão acrescentadas" (Mt 6,33). Que esta palavra ilumine seu coração. Como posso ajudar mais?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-spacing-4xl right-spacing-md lg:bottom-spacing-4xl lg:right-spacing-lg z-[210]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-spacing-3xl right-0 w-[350px] sm:w-[400px] h-[500px] bg-card border border-border shadow-premium-hover rounded-full flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-spacing-md border-b border-border bg-background flex items-center justify-between">
              <div className="flex items-center gap-spacing-xs">
                <div className="w-spacing-xl h-spacing-xl rounded-premium bg-secondary flex items-center justify-center">
                  <Sparkles className="w-spacing-md h-spacing-md text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-serif text-primary">Logos IA</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Assistente Espiritual</p>
                </div>
              </div>
              <Button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-spacing-md h-spacing-md" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-spacing-md" ref={scrollRef}>
              <div className="space-y-spacing-md">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-spacing-md py-spacing-xs rounded-full text-sm font-serif ${
                        msg.role === 'user'
                          ? 'bg-secondary text-primary'
                          : 'bg-muted/50 border border-border text-foreground italic'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted/30 px-spacing-md py-spacing-xs rounded-premium flex gap-spacing-2xs items-center">
                      <span className="w-spacing-2xs h-spacing-2xs bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-spacing-2xs h-spacing-2xs bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-spacing-2xs h-spacing-2xs bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-spacing-md border-t border-border">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Peça uma oração ou reflexão..."
                  className="w-full pl-spacing-md pr-spacing-2xl py-spacing-sm rounded-full border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-secondary/50 font-serif"
                />
                <Button
                  onClick={handleSend}
                  className="absolute right-spacing-xs top-spacing-2xs/2 -translate-y-1/2 w-spacing-xl h-spacing-xl rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  <Send className="w-spacing-md h-spacing-md" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-spacing-xs p-spacing-sm lg:px-spacing-md lg:py-spacing-sm bg-primary text-primary-foreground rounded-full shadow-premium font-black uppercase tracking-widest text-xs min-w-0"
      >
        <Sparkles className="w-spacing-md h-spacing-md shrink-0" />
        <span className="hidden lg:inline">{isOpen ? 'Fechar' : 'Conversar com Logos'}</span>
      </motion.button>
    </div>
  );
};

export default LogosChat;