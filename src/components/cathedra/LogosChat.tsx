import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Book, Sparkles } from 'lucide-react';
import { Button   } from '@/components/cathedra/Button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const LogosChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bem-vindo ao Logos IA. Em que posso auxiliá-lo em sua oração ou reflexão hoje?',
      timestamp: new Date(),
    },
  ]);
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
    <div className="fixed bottom-36 right-4 lg:bottom-24 lg:right-6 z-[210]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] h-[500px] bg-card border border-border shadow-premium rounded-premium flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-background flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-premium-sm bg-secondary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-serif text-primary">Logos IA</h3>
                  <p className="text-premium-tiny text-muted-foreground uppercase tracking-widest font-black">Assistente Espiritual</p>
                </div>
              </div>
              <Button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-premium-sm text-sm font-serif ${
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
                    <div className="bg-muted/30 px-4 py-2 rounded-premium-sm flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Peça uma oração ou reflexão..."
                  className="w-full pl-4 pr-12 py-3 rounded-full border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-secondary/50 font-serif"
                />
                <Button
                  onClick={handleSend}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  <Send className="w-4 h-4" />
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
        id="logos-chat-trigger"
        aria-label="Conversar com Logos IA"
        className="flex items-center justify-center gap-2 p-3 lg:px-5 lg:py-3 bg-primary text-primary-foreground rounded-full shadow-lg font-black uppercase tracking-widest text-premium-tiny min-w-0"
      >
        <Sparkles className="w-4 h-4 shrink-0" />
        <span className="hidden lg:inline">{isOpen ? 'Fechar' : 'Conversar com Logos'}</span>
      </motion.button>
    </div>
  );
};

export default LogosChat;
