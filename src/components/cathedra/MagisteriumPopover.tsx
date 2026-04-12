import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Icons } from '../../constants';

/** Maps document search terms to Vatican.va URLs (Portuguese) */
const DOCUMENT_URLS: Record<string, string> = {
  'Dei Filius': 'https://www.vatican.va/archive/hist_councils/i-vatican-council/documents/vat-i_const_18700424_dei-filius_la.html',
  'Ineffabilis Deus': 'https://www.vatican.va/content/pius-ix/la/documents/bulla-ineffabilis-deus-8-decembris-1854.html',
  'Munificentissimus Deus': 'https://www.vatican.va/content/pius-xii/pt/apost_constitutions/documents/hf_p-xii_apc_19501101_munificentissimus-deus.html',
  'Pastor Aeternus': 'https://www.vatican.va/archive/hist_councils/i-vatican-council/documents/vat-i_const_18700718_pastor-aeternus_la.html',
  'Mystici Corporis': 'https://www.vatican.va/content/pius-xii/pt/encyclicals/documents/hf_p-xii_enc_29061943_mystici-corporis-christi.html',
  'Benedictus Deus': 'https://www.vatican.va/content/benedict-xii/la/documents/constitutio-dogmatica-benedictus-deus-29-ian-1336.html',
  'Credo Niceno': 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19641121_lumen-gentium_po.html',
  'Dei Verbum': 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19651118_dei-verbum_po.html',
  'Decreto Sacrosanctis Trento': 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19631204_sacrosanctum-concilium_po.html',
};

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
  const [excerpt, setExcerpt] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchExcerpt = async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const url = DOCUMENT_URLS[documentName];
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
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onNavigate) {
              onNavigate(documentName);
            } else {
              fetchExcerpt();
            }
          }}
          onMouseEnter={fetchExcerpt}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/50 transition-all"
        >
          <Icons.Globe className="w-3 h-3" />
          {label}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        className="w-80 max-h-64 overflow-y-auto p-0 rounded-2xl border-emerald-200 dark:border-emerald-800"
      >
        <div className="p-3 border-b border-border bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Icons.Globe className="w-3.5 h-3.5 text-primary dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 truncate">
              {title || label}
            </span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate(documentName)}
              className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 shrink-0 ml-2"
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
          {!loading && fetched && excerpt && (
            <p className="text-xs leading-relaxed text-foreground/90 font-serif whitespace-pre-line">
              {excerpt}
            </p>
          )}
          {!loading && fetched && !excerpt && (
            <p className="text-xs text-muted-foreground italic">Texto não disponível.</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default MagisteriumPopover;
