import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Icons } from '../../constants';
import { MAGISTERIUM_URLS } from '@/data/magisterium-urls';
import { useNavigate } from 'react-router-dom';


interface MagisteriumPopoverProps {
  documentName: string;
  label: string;
  onNavigate?: (search: string) => void;
}

const MagisteriumPopover: React.FC<MagisteriumPopoverProps> = ({
  documentName,
  label,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const [excerpt, setExcerpt] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchExcerpt = async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const url = MAGISTERIUM_URLS[documentName];
      if (!url) {
        setExcerpt(`Documento "${documentName}" — texto integral disponível no Magistério.`);
        setTitle(documentName);
        setLoading(false);
        setFetched(true);
        return;
      }

      const { data, error } = await supabase.functions.invoke('vatican-document', {
        body: { url },
      });

      if (!error && data?.text) {
        setTitle(data.title || documentName);
        // Show first ~400 chars as preview
        const text = data.text as string;
        setExcerpt(text.length > 400 ? text.slice(0, 400) + '…' : text);
      } else {
        setExcerpt(`Documento "${documentName}" — texto integral disponível no Magistério.`);
        setTitle(documentName);
      }
    } catch {
      setExcerpt('Erro ao carregar documento.');
      setTitle(documentName);
    }
    setLoading(false);
    setFetched(true);
  };

  return (
    <HoverCard openDelay={100} closeDelay={200}>
      <HoverCardTrigger asChild>
        <Button
          onMouseEnter={fetchExcerpt}
          className="inline-flex items-center gap-spacing-2xs px-spacing-xs py-spacing-2xs rounded-premium-full bg-emerald-50 border border-emerald-200 text-premium-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/50 transition-all"
        >
          <Icons.Globe className="w-spacing-sm h-spacing-sm" />
          {label}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        className="w-spacing-4xl max-h-spacing-4xl overflow-y-auto p-spacing-0 rounded-premium-full border-emerald-200 dark:border-emerald-800"
      >
        <div className="p-spacing-sm border-b border-border bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-between">
          <div className="flex items-center gap-spacing-xs min-w-0">
            <Icons.Globe className="w-spacing-sm h-spacing-sm text-primary dark:text-emerald-400 shrink-0" />
            <span className="text-premium-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 truncate">
              {title || label}
            </span>
          </div>
          <Button
            onClick={() => {
              if (onNavigate) onNavigate(documentName);
              else navigate(`/magisterium/${documentName}`);
            }}
            className="text-premium-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-spacing-2xs shrink-0 ml-spacing-xs"
          >
            Abrir completo
            <Icons.ArrowDown className="w-spacing-sm h-spacing-sm -rotate-90" />
          </Button>
        </div>
        <div className="p-spacing-sm">
          {loading && (
            <div className="space-y-spacing-xs py-spacing-xs">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-spacing-sm bg-muted rounded animate-pulse" style={{ width: `${50 + i * 15}%` }} />
              ))}
            </div>
          )}
          {!loading && fetched && excerpt && (
            <p className="text-premium-xs leading-relaxed text-foreground/90 font-serif whitespace-pre-line">
              {excerpt}
            </p>
          )}
          {!loading && fetched && !excerpt && (
            <p className="text-premium-xs text-muted-foreground italic">Texto não disponível.</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default MagisteriumPopover;
