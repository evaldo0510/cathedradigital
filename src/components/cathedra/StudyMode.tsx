import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Icons } from '../../constants';
import BibleVersePopover from './BibleVersePopover';
import { parseBibleReferences } from '@/lib/bibleRefParser';
import { useNavigate } from 'react-router-dom';


interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  "Como a Eucaristia é prefigurada no Antigo Testamento?",
  "Explique a Santíssima Trindade segundo Santo Agostinho.",
  "O que o Catecismo ensina sobre a oração?",
  "Qual a relação entre fé e razão segundo São Tomás de Aquino?",
];

// Custom renderer that parses Bible references in text nodes
const BibleAwareText: React.FC<{ text: string; onNavigate: (abbr: string, chapter: number) => void }> = ({ text, onNavigate }) => {
  const segments = useMemo(() => parseBibleReferences(text), [text]);
  
  if (segments.length === 1 && segments[0].type === 'text') {
    return <>{text}</>;
  }

  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'bibleRef' && seg.abbr ? (
          <BibleVersePopover
            key={i}
            abbr={seg.abbr}
            chapter={seg.chapter!}
            verse={seg.verse}
            label={seg.value}
            onNavigate={onNavigate}
          />
        ) : (
          <React.Fragment key={i}>{seg.value}</React.Fragment>
        )
      )}
    </>
  );
};

const StudyMode: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNavigateToBible = useCallback((abbr: string, chapter: number) => {
    navigate(`/bible?book=${abbr}&ch=${chapter}`);
  }, [navigate]);

  // Custom markdown components that parse Bible references in text
  const markdownComponents = useMemo(() => ({
    p: ({ children, ...props }: any) => (
      <p {...props}>
        {React.Children.map(children, (child) =>
          typeof child === 'string' ? (
            <BibleAwareText text={child} onNavigate={handleNavigateToBible} />
          ) : child
        )}
      </p>
    ),
    li: ({ children, ...props }: any) => (
      <li {...props}>
        {React.Children.map(children, (child) =>
          typeof child === 'string' ? (
            <BibleAwareText text={child} onNavigate={handleNavigateToBible} />
          ) : child
        )}
      </li>
    ),
    strong: ({ children, ...props }: any) => (
      <strong {...props}>
        {React.Children.map(children, (child) =>
          typeof child === 'string' ? (
            <BibleAwareText text={child} onNavigate={handleNavigateToBible} />
          ) : child
        )}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em {...props}>
        {React.Children.map(children, (child) =>
          typeof child === 'string' ? (
            <BibleAwareText text={child} onNavigate={handleNavigateToBible} />
          ) : child
        )}
      </em>
    ),
  }), [handleNavigateToBible]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/colloquium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Erro na conexão' }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error('Sem resposta do servidor');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const upsertAssistant = (content: string) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
          }
          return [...prev, { role: 'assistant', content }];
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
            if (delta) {
              assistantContent += delta;
              upsertAssistant(assistantContent);
            }
          } catch { /* partial JSON, wait */ }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${e.message || 'Erro ao consultar a IA. Tente novamente.'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3 pb-6 border-b border-border">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Colloquium IA</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Inteligência Exegética</h1>
        <p className="text-muted-foreground font-serif italic">Conecte séculos de sabedoria católica em segundos.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <Icons.Feather className="w-16 h-16 text-primary/30" />
            <p className="text-muted-foreground font-serif italic text-center">O que sua alma busca hoje?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)}
                  className="text-left p-4 rounded-2xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all text-sm text-foreground">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
              msg.role === 'user'
                ? 'bg-foreground text-background rounded-br-md'
                : 'bg-card border border-border rounded-bl-md'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none font-serif">
                  <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-5 py-4">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border pt-4">
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
    </div>
  );
};

export default StudyMode;
