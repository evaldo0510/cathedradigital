import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Icons } from '../../constants';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import { AppRoute } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Copy, Check, MessageSquare, Trash2, ChevronLeft, 
  Compass, Sparkles, BookOpen, ArrowRight, Shield,
  Search, Scroll, Quote, History, Plus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/cathedra/Button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ProConversionBanner from './ProConversionBanner';
import { toast } from 'sonner';
import { callColloquium } from '@/services/aiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

const SUGGESTIONS = [
  "Como a Eucaristia é prefigurada no Antigo Testamento?",
  "Explique a Santíssima Trindade segundo Santo Agostinho.",
  "O que o Catecismo ensina sobre a oração?",
  "Qual a relação entre fé e razão segundo São Tomás de Aquino?",
];

// ── Theological-aware text renderer ──
const TheologicalAwareText: React.FC<{
  text: string;
  onNavigateBible: (abbr: string, chapter: number) => void;
  onNavigateCatechism: (paragraph: number) => void;
}> = ({ text, onNavigateBible, onNavigateCatechism }) => {
  const segments = useMemo(() => parseTheologicalReferences(text), [text]);
  if (segments.length === 1 && segments[0].type === 'text') return <ReactMarkdown components={{
    p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
    strong: ({ children }) => <strong className="text-primary font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic opacity-90">{children}</em>,
  }}>{text}</ReactMarkdown>;
  
  return (
    <div className="space-y-4">
      {segments.map((seg, i) => {
        if (seg.type === 'bibleRef' && seg.abbr) {
          return <BibleVersePopover key={i} abbr={seg.abbr} chapter={seg.chapter!} verse={seg.verse} label={seg.value} onNavigate={onNavigateBible} />;
        }
        if (seg.type === 'catechismRef' && seg.paragraph) {
          return <CatechismPopover key={i} paragraph={seg.paragraph} onNavigate={onNavigateCatechism} />;
        }
        return <ReactMarkdown key={i} components={{
          p: ({ children }) => <span className="inline">{children}</span>,
          strong: ({ children }) => <strong className="text-primary font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic opacity-90">{children}</em>,
        }}>{seg.value}</ReactMarkdown>;
      })}
    </div>
  );
};

const StudyMode: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [lastMetadata, setLastMetadata] = useState<any>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [diagnosis, setDiagnosis] = useState<any>(null);
  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from('user_sensitive_data')
      .select('diagnosis_result')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.diagnosis_result) setDiagnosis(data.diagnosis_result);
      });
  }, [user]);

  const profile = diagnosis?.spiritual_profile;

  const dynamicSuggestions = useMemo(() => {
    const base = [...SUGGESTIONS];
    if (profile === 'ferido_em_busca') {
      base.unshift("Como encontrar paz em meio à ansiedade?");
    } else if (profile === 'ansioso_buscador') {
      base.unshift("Como o perdão de Deus pode me libertar da culpa?");
    } else if (profile === 'sedento_de_sentido') {
      base.unshift("Qual o propósito da vida segundo Santo Agostinho?");
    }
    return base.slice(0, 4);
  }, [profile]);

  const initialMode = (location.state as any)?.mode || null;
  const [currentMode, setCurrentMode] = useState<string | null>(initialMode);
  const initialTopicProcessed = useRef(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations list
  useEffect(() => {
    if (!user) return;
    const loadConversations = async () => {
      const { data } = await supabase
        .from('colloquium_conversations')
        .select('id, title, updated_at')
        .order('updated_at', { ascending: false })
        .limit(20);
      if (data) setConversations(data);
    };
    loadConversations();
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConversationId) { setMessages([]); return; }
    const loadMessages = async () => {
      const { data } = await supabase
        .from('colloquium_messages')
        .select('role, content')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data as Message[]);
    };
    loadMessages();
  }, [activeConversationId]);

  const handleNavigateToBible = useCallback((abbr: string, chapter: number) => {
    navigate(`/bible?book=${abbr}&ch=${chapter}`);
  }, [navigate]);

  const handleNavigateToCatechism = useCallback((paragraph: number) => {
    navigate(`/catechism?p=${paragraph}`);
  }, [navigate]);

  // ── Persistence helpers ──
  const saveMessages = useCallback(async (conversationId: string, newMessages: Message[]) => {
    if (!user) return;
    const toSave = newMessages.slice(-2);
    for (const msg of toSave) {
      await supabase.from('colloquium_messages').insert({
        conversation_id: conversationId,
        role: msg.role,
        content: msg.content,
      });
    }
    if (newMessages.filter(m => m.role === 'user').length === 1) {
      const title = newMessages[0].content.slice(0, 60);
      await supabase.from('colloquium_conversations').update({ title }).eq('id', conversationId);
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, title } : c));
    }
  }, [user]);

  const createConversation = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('colloquium_conversations')
      .insert({ user_id: user.id, title: 'Nova conversa' })
      .select('id, title, updated_at')
      .single();
    if (error || !data) return null;
    setConversations(prev => [data, ...prev]);
    setActiveConversationId(data.id);
    return data.id;
  }, [user]);

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setShowSidebar(false);
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from('colloquium_conversations').delete().eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [activeConversationId]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setLastMetadata(null);
    const userMsg: Message = { role: 'user', content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    let convId = activeConversationId;
    if (!convId && user) {
      convId = await createConversation();
    }

    try {
      const response = await callColloquium(allMessages, currentMode);
      
      if (response.content) {
        const assistantMsg: Message = { role: 'assistant', content: response.content };
        setMessages(prev => [...prev, assistantMsg]);
        
        if (convId && user) {
          saveMessages(convId, [...allMessages, assistantMsg]).catch(e => console.error('Save failed:', e));
        }
      } else if (response.error) {
        throw new Error(response.error);
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao consultar o Logos.');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, não consegui processar sua reflexão no momento. Tente novamente em breve.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  useEffect(() => {
    if (initialTopicProcessed.current) return;
    const searchParams = new URLSearchParams(location.search);
    const topic = searchParams.get('topic') || (location.state as any)?.topic;
    if (topic && !messages.length && !isLoading) {
      initialTopicProcessed.current = true;
      sendMessage(`Gostaria de aprofundar meu estudo sobre: "${topic}".`);
    }
  }, [location.search, location.state, messages.length, isLoading]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-background">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: History */}
        <aside className={`w-80 border-r border-primary/5 bg-background/50 backdrop-blur-xl hidden lg:flex flex-col ${showSidebar ? 'fixed inset-0 z-50 flex' : ''}`}>
          <div className="p-8 border-b border-primary/5 flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Memória de Diálogos</h2>
            <Button variant="ghost" size="icon" onClick={startNewConversation} className="rounded-full hover:bg-primary/5">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => { setActiveConversationId(conv.id); setShowSidebar(false); }}
                  className={`w-full text-left p-4 rounded-premium-sm transition-all group relative ${activeConversationId === conv.id ? 'bg-primary/5 text-primary' : 'hover:bg-primary/5 text-muted-foreground'}`}
                >
                  <p className="text-sm font-monastery truncate pr-8">{conv.title}</p>
                  <p className="text-[9px] uppercase tracking-widest opacity-40 mt-1">{new Date(conv.updated_at).toLocaleDateString()}</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-background reading-sepia">
          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto px-8 py-16 space-y-20">
              {messages.length === 0 ? (
                <div className="space-y-16 text-center py-20">
                  <div className="w-24 h-24 rounded-full bg-primary/[0.02] mx-auto flex items-center justify-center border border-primary/10 animate-pulse-slow">
                    <Compass className="w-12 h-12 text-primary" />
                  </div>
                  <div className="space-y-6">
                    <h1 className="text-5xl font-display text-primary tracking-tightest">Mosteiro Digital</h1>
                    <p className="text-xl text-primary/40 font-serif italic max-w-lg mx-auto leading-relaxed">
                      "No silêncio do coração, a Verdade se revela." <br />
                      Diálogos guiados pela Tradição e Sabedoria.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                    {dynamicSuggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="p-6 text-left rounded-premium-sm border border-primary/5 hover:border-primary/20 bg-background/50 hover:bg-primary/5 transition-all group"
                      >
                        <p className="text-sm font-monastery text-primary/80 leading-relaxed">{s}</p>
                        <ArrowRight className="w-4 h-4 mt-4 text-primary/20 group-hover:text-primary/60 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                          <Compass className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary/30">Reflexão do Logos</span>
                      </div>
                    )}
                    
                    <div className={`max-w-2xl font-serif leading-relaxed ${
                      msg.role === 'user' 
                        ? 'text-xl text-primary/60 italic text-right' 
                        : 'text-2xl text-primary border-l-4 border-secondary/20 pl-10 py-4 mb-16'
                    }`}>
                      <TheologicalAwareText 
                        text={msg.content} 
                        onNavigateBible={handleNavigateToBible} 
                        onNavigateCatechism={handleNavigateToCatechism} 
                      />
                    </div>
                  </motion.div>
                ))
              )}
              {isLoading && (
                <div className="flex flex-col items-start space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                      <Compass className="w-4 h-4 text-primary animate-spin-slow" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30 animate-pulse">Consultando a Tradição...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Persistent Input Bar */}
          <div className="p-8 bg-background/50 backdrop-blur-xl border-t border-border/10">
            <div className="max-w-3xl mx-auto">
              <div className="relative group">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Inicie um diálogo sobre a fé..."
                  className="w-full bg-transparent border-b border-primary/10 py-6 pr-16 text-xl font-monastery focus:outline-none focus:border-primary/40 transition-colors resize-none placeholder:text-primary/20"
                  rows={1}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-0 bottom-6 p-2 text-primary/40 hover:text-primary disabled:opacity-0 transition-all"
                >
                  <ArrowRight className="w-8 h-8" />
                </button>
              </div>
              <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-primary/20">
                <div className="flex gap-8">
                  <span className="flex items-center gap-2"><Scroll className="w-3 h-3" /> Magistério Vivo</span>
                  <span className="flex items-center gap-2"><BookOpen className="w-3 h-3" /> Sagradas Escrituras</span>
                </div>
                <span className="italic">Modo Contemplativo Ativo</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudyMode;
