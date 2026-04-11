import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Icons } from '../../constants';

interface CatechismPopoverProps {
  paragraph: number;
  onNavigate?: (paragraph: number) => void;
  variant?: 'default' | 'mini';
}

const CatechismPopover: React.FC<CatechismPopoverProps> = ({
  paragraph,
  onNavigate,
}) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchContent = async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('catechism-text', {
        body: { paragraph },
      });
      if (!error && data?.content) {
        setContent(data.content);
      } else {
        setContent(`Parágrafo §${paragraph} — conteúdo em breve.`);
      }
    } catch {
      setContent('Erro ao carregar parágrafo.');
    }
    setLoading(false);
    setFetched(true);
  };

  return (
    <HoverCard openDelay={100} closeDelay={200}>
      <HoverCardTrigger asChild>
        <button
          onClick={fetchContent}
          onMouseEnter={fetchContent}
          className="px-2.5 py-1 rounded-lg bg-card border border-border text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
        >
          §{paragraph}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        className="w-80 max-h-64 overflow-y-auto p-0 rounded-2xl border-primary/20"
      >
        <div className="p-3 border-b border-border bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.Cross className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-black uppercase tracking-wider text-primary">
              CIC §{paragraph}
            </span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate(paragraph)}
              className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              Abrir completo
              <Icons.ArrowDown className="w-3 h-3 -rotate-90" />
            </button>
          )}
        </div>
        <div className="p-3">
          {loading && (
            <div className="space-y-2 py-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-3 bg-muted rounded animate-pulse" style={{ width: `${50 + i * 15}%` }} />
              ))}
            </div>
          )}
          {!loading && fetched && content && (
            <p className="text-xs leading-relaxed text-foreground/90 font-serif">
              {content.length > 300 ? content.slice(0, 300) + '…' : content}
            </p>
          )}
          {!loading && fetched && !content && (
            <p className="text-xs text-muted-foreground italic">Texto não disponível.</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default CatechismPopover;
