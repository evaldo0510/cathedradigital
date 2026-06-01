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

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProConversionBanner from './ProConversionBanner';
import { toast } from 'sonner';
import { callColloquium } from '@/services/aiService';
import SEOHead from '@/components/SEOHead';
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
    <Button onClick={handleCopy} className="mt-spacing-xs inline-flex items-center gap-spacing-2xs text-premium-xs text-muted-foreground hover:text-primary transition-colors">
      {copied ? <Icons.Check className="w-spacing-sm h-spacing-sm" /> : <Icons.Copy className="w-spacing-sm h-spacing-sm" />}
      {copied ? 'Copiado' : 'Copiar'}
    </Button>
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
      const result = await callColloquium(allMessages, currentMode, (content) => {
        assistantContent = content;
        
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
      });

      if (result.error) {
        if (result.limit_reached) navigate('/pricing');
        throw new Error(result.error);
      }

      // Background save to DB to keep UI responsive
      if (convId && user) {
        const finalMessages = [...allMessages, { role: 'assistant' as const, content: assistantContent }];
        saveMessages(convId, finalMessages).catch(e => console.error('BG Save failed:', e));
      }
    } catch (e: any) {
      console.error('Study mode error:', e);
      if (e.message?.includes('402') || e.message?.includes('esgotados')) {
        window.dispatchEvent(new CustomEvent('ai-status-error', { 
          detail: { type: 'credits_exhausted' } 
        }));
      } else if (e.message?.includes('429')) {
        window.dispatchEvent(new CustomEvent('ai-status-error', { 
          detail: { type: 'rate_limited' } 
        }));
      }
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-spacing-2xl max-w-spacing-2xl mx-auto py-spacing-2xl">
      <SEOHead 
        title="Logos IA | Inteligência Teológica Minimalista" 
        description="Consulte a Logos IA para resumos teológicos, conexões bíblicas e suporte espiritual baseado na Tradição e no Magistério da Igreja Católica." 
        path="/estudo"
        image="https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-logos.png"
        keywords="logos ia, inteligência artificial católica, estudo bíblico ia, catecismo ia, teologia católica digital"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Logos IA", path: "/estudo" }
        ]}
      />
      <div className="w-spacing-4xl h-spacing-4xl rounded-premium bg-primary/10 flex items-center justify-center border border-primary/20">
        <Icons.Shield className="w-spacing-2xl h-spacing-2xl text-primary" />
      </div>
      
      <div className="space-y-spacing-md">
        <h1 className="text-premium-3xl md:text-premium-5xl font-serif font-black text-primary">Estudo e Verdade</h1>
        <p className="text-premium-lg text-muted-foreground font-serif italic">
          "Para garantir a integridade absoluta da doutrina e a soberania da sua experiência espiritual, a Cathedra Digital optou por não utilizar serviços de Inteligência Artificial."
        </p>
      </div>

      <div className="bg-card border border-border p-spacing-xl rounded-[2.5rem] shadow-premium-md space-y-spacing-lg">
        <p className="text-premium-sm text-foreground/80 leading-relaxed">
          O <strong>Modo Estudo</strong> está sendo reformulado para focar exclusivamente em <strong>Curadoria Humana</strong> e <strong>Fontes Oficiais</strong> da Igreja, permitindo que você navegue pela Tradição e pelo Magistério com total segurança.
        </p>
        <div className="flex flex-col sm:flex-row gap-spacing-md justify-center">
          <Button 
            className="rounded-premium-full h-spacing-2xl px-spacing-xl font-black uppercase text-premium-xs tracking-widest"
            onClick={() => navigate(AppRoute.CATECHISM)}
          >
            Explorar Catecismo
          </Button>
          <Button 
            variant="outline"
            className="rounded-premium-full h-spacing-2xl px-spacing-xl font-black uppercase text-premium-xs tracking-widest border-primary/20 text-primary"
            onClick={() => navigate(AppRoute.TRANSPARENCY)}
          >
            Saiba Mais
          </Button>
        </div>
      </div>

      <div className="pt-spacing-xl border-t border-border w-full grid grid-cols-1 md:grid-cols-3 gap-spacing-lg">
        {[
          { label: 'Integridade', desc: 'Conteúdo validado por humanos.' },
          { label: 'Offline', desc: 'Funciona sem APIs externas.' },
          { label: 'Fidelidade', desc: 'Fiel ao Magistério Vivo.' }
        ].map(item => (
          <div key={item.label} className="space-y-spacing-2xs">
            <h4 className="text-premium-xs font-black uppercase tracking-widest text-primary">{item.label}</h4>
            <p className="text-premium-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyMode;

