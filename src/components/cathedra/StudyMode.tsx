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
import { Copy, Check, Plus, MessageSquare, Trash2, ChevronLeft, Compass, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProConversionBanner from './ProConversionBanner';
import { toast } from 'sonner';
import logosAvatarImg from '@/assets/logos-avatar.png';
import logosAquinasImg from '@/assets/logos-aquinas.png';
import logosColloquiumImg from '@/assets/logos-colloquium.png';

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
  if (segments.length === 1 && segments[0].type === 'text') return <>{text}</>;
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'bibleRef' && seg.abbr) {
          return <BibleVersePopover key={i} abbr={seg.abbr} chapter={seg.chapter!} verse={seg.verse} label={seg.value} onNavigate={onNavigateBible} />;
        }
        if (seg.type === 'catechismRef' && seg.paragraph) {
          return <CatechismPopover key={i} paragraph={seg.paragraph} onNavigate={onNavigateCatechism} />;
        }
        return <React.Fragment key={i}>{seg.value}</React.Fragment>;
      })}
    </>
  );
};

// ── Copy button ──
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };
  return (
    <button onClick={handleCopy} className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
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
      base.unshift("O que a Bíblia diz sobre o descanso da alma?");
    } else if (profile === 'ansioso_buscador') {
      base.unshift("Como o perdão de Deus pode me libertar da culpa?");
      base.unshift("Explique a misericórdia divina para quem falhou.");
    } else if (profile === 'sedento_de_sentido') {
      base.unshift("Qual o propósito da vida segundo Santo Agostinho?");
      base.unshift("Como descobrir minha vocação e missão?");
    } else if (profile === 'firme_aprofundando') {
      base.unshift("Explique a oração contemplativa de Santa Teresa.");
      base.unshift("Quais são as etapas da vida espiritual (vias)?");
    } else if (profile === 'ardente_missionario') {
      base.unshift("Como manter o fervor apostólico no deserto?");
      base.unshift("Explique o papel do Espírito Santo na missão.");
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
        .limit(50);
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

  const markdownComponents = useMemo(() => {
    const renderChildren = (children: React.ReactNode) =>
      React.Children.map(children, (child) =>
        typeof child === 'string' ? (
          <TheologicalAwareText text={child} onNavigateBible={handleNavigateToBible} onNavigateCatechism={handleNavigateToCatechism} />
        ) : child
      );
    return {
      p: ({ children, ...props }: any) => <p {...props}>{renderChildren(children)}</p>,
      li: ({ children, ...props }: any) => <li {...props}>{renderChildren(children)}</li>,
      strong: ({ children, ...props }: any) => <strong {...props}>{renderChildren(children)}</strong>,
      em: ({ children, ...props }: any) => <em {...props}>{renderChildren(children)}</em>,
    };
  }, [handleNavigateToBible, handleNavigateToCatechism]);

  // ── Persistence helpers ──
  const saveMessages = useCallback(async (conversationId: string, newMessages: Message[]) => {
    if (!user) return;
    // Save only the last two messages (user + assistant)
    const toSave = newMessages.slice(-2);
    for (const msg of toSave) {
      await supabase.from('colloquium_messages').insert({
        conversation_id: conversationId,
        role: msg.role,
        content: msg.content,
      });
    }
    // Update conversation title from first user message
    if (newMessages.filter(m => m.role === 'user').length === 1) {
      const title = newMessages[0].content.slice(0, 80);
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

    let assistantContent = '';
    let convId = activeConversationId;

    // Create conversation if needed
    if (!convId && user) {
      convId = await createConversation();
    }

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/colloquium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, mode: currentMode }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Erro na conexão' }));
        if (err.limit_reached) {
          toast.error('Limite diário atingido! Assine o PRO para mensagens ilimitadas.');
          navigate('/pricing');
          throw new Error(err.error);
        }
        throw new Error(err.error || `Erro ${resp.status}`);
      }
      if (!resp.body) throw new Error('Sem resposta do servidor');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const upsertAssistant = (content: string) => {
        // Look for metadata line: [RECOMMENDATION:{"category":...}]
        const metadataMatch = content.match(/\[RECOMMENDATION:({.*})\]$/);
        let displayContent = content;
        if (metadataMatch) {
          try {
            const meta = JSON.parse(metadataMatch[1]);
            setLastMetadata(meta);
            // Remove metadata from display content if it's the last line
            displayContent = content.replace(/\[RECOMMENDATION:({.*})\]$/, '').trim();
          } catch (e) { console.error('Meta parse error:', e); }
        }

        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: displayContent } : m);
          }
          return [...prev, { role: 'assistant', content: displayContent }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) { assistantContent += delta; upsertAssistant(assistantContent); }
          } catch { /* partial */ }
        }
      }

      // Background save to DB to keep UI responsive
      if (convId && user) {
        const finalMessages = [...allMessages, { role: 'assistant' as const, content: assistantContent }];
        saveMessages(convId, finalMessages).catch(e => console.error('BG Save failed:', e));
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${e.message || 'Erro ao consultar a IA. Tente novamente.'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };
  // Handle initial topic from URL or state
  useEffect(() => {
    if (initialTopicProcessed.current) return;
    
    const searchParams = new URLSearchParams(location.search);
    const topic = searchParams.get('topic') || (location.state as any)?.topic;
    
    if (topic && !messages.length && !isLoading) {
      initialTopicProcessed.current = true;
      const initialPrompt = `Gostaria de aprofundar meu estudo sobre o tema: "${topic}". Poderia me dar uma explicação teológica detalhada, conexões bíblicas e como aplicar isso na minha vida de fé?`;
      sendMessage(initialPrompt);
    }
  }, [location.search, location.state, messages.length, isLoading]);

  return (
    <div className="flex h-[calc(100vh-12rem)] max-w-5xl mx-auto gap-0">
      {/* Sidebar - conversation history */}
      {user && (
        <div className={`${showSidebar ? 'w-64 border-r border-border' : 'w-0'} transition-all overflow-hidden shrink-0 flex flex-col bg-card/50`}>
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Histórico</span>
            <button onClick={startNewConversation} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="Nova conversa">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-primary/5 transition-colors ${activeConversationId === conv.id ? 'bg-primary/10 border-l-2 border-primary' : ''}`}
                onClick={() => { setActiveConversationId(conv.id); setShowSidebar(false); }}
              >
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">{conv.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center p-4">Nenhuma conversa salva</p>
            )}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="text-center space-y-3 pb-6 border-b border-border relative">
          {user && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="absolute left-0 top-0 p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
              title="Histórico de conversas"
            >
              {showSidebar ? <ChevronLeft className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </button>
          )}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
              {currentMode === 'aquinas' ? 'IARA — Modo Aquino' : 'Logos IA'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            {currentMode === 'aquinas' ? 'Domínio Intelectual' : 'Inteligência Exegética'}
          </h1>
          <p className="text-muted-foreground font-serif italic">
            {currentMode === 'aquinas' 
              ? 'Razão, lógica e fé aplicadas à sua alma.' 
              : 'Conecte séculos de sabedoria católica em segundos.'}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-6 px-2">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-8">
              <Icons.Feather className="w-16 h-16 text-primary/30" />
              <p className="text-muted-foreground font-serif italic text-center">
                {diagnosis?.spiritual_profile ? "O Logos preparou algumas reflexões para o seu momento:" : "O que sua alma busca hoje?"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                {dynamicSuggestions.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    className="text-left p-4 rounded-2xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all text-sm text-foreground">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden border border-secondary/30 shadow-md mt-1">
                  <img src={currentMode === 'aquinas' ? logosAquinasImg : logosColloquiumImg} alt="Logos" className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                msg.role === 'user'
                  ? 'bg-foreground text-background rounded-br-md'
                  : 'bg-card border border-border rounded-bl-md'
              }`}>
                {msg.role === 'assistant' ? (
                  <>
                    <div className="prose prose-sm dark:prose-invert max-w-none font-serif">
                      <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                    </div>
                    <CopyButton text={msg.content} />
                  </>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* New A-Z / Theme Suggestion */}
          {!isLoading && lastMetadata && lastMetadata.theme && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 border border-primary/10 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-primary tracking-tight">Explorar tema: {lastMetadata.theme}</h3>
                </div>
                <Badge variant="outline" className="bg-background/50 text-[9px] uppercase tracking-widest px-2 py-0.5 border-primary/20">A–Z da Fé</Badge>
              </div>

              {lastMetadata.az_terms && lastMetadata.az_terms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {lastMetadata.az_terms.map((term: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => navigate(`${AppRoute.AZ_FAITH}?q=${encodeURIComponent(term)}`)}
                      className="px-3 py-1.5 bg-card hover:bg-primary/10 border border-border hover:border-primary/30 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 group"
                    >
                      {term}
                      <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              <Button
                variant="default"
                size="sm"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-[0.2em] h-10 rounded-xl flex items-center justify-center gap-2"
                onClick={() => navigate(AppRoute.AZ_FAITH)}
              >
                Ver glossário completo <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          )}

          {/* Natural conversion: Logos deep response */}
          {!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
            messages[messages.length - 1].content.length > 400 || messages.filter(m => m.role === 'assistant').length >= 2
          ) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-2"
            >
              <ProConversionBanner context="logos" />
            </motion.div>
          )}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start gap-3">
              {/* Pulsing Logos avatar */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="shrink-0 w-8 h-8 rounded-full overflow-hidden border border-secondary/30 shadow-md mt-1"
              >
                <img src={currentMode === 'aquinas' ? logosAquinasImg : logosColloquiumImg} alt="Logos pensando..." className="w-full h-full object-cover" />
              </motion.div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground italic ml-1">Logos meditando...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border pt-4 px-2">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Faça sua pergunta teológica..."
              rows={1}
              className="flex-1 resize-none rounded-2xl border border-border bg-card px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 custom-scrollbar"
              style={{ maxHeight: '120px', minHeight: '48px' }}
              onInput={e => { const t = e.currentTarget; t.style.height = '48px'; t.style.height = t.scrollHeight + 'px'; }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="p-3.5 bg-foreground text-background rounded-2xl hover:bg-primary hover:text-foreground transition-all disabled:opacity-30 shrink-0"
            >
              <Icons.Search className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2 font-serif italic">
            Colloquium usa IA para auxiliar seus estudos. Sempre consulte fontes oficiais do Magistério.
          </p>
        </div>

        {/* CTA: Continue to Jornadas */}
        {messages.length >= 4 && (
          <div className="pt-4 border-t border-border mt-4">
            <button
              onClick={() => navigate(AppRoute.JORNADAS)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10"
            >
              <Compass className="w-4 h-4" /> Iniciar uma Jornada de Fé
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMode;
