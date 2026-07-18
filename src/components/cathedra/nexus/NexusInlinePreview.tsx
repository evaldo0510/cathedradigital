import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchCatechismParagraph } from '@/hooks/useCatechismParagraph';
import { BOOK_NAME_BY_ABBR } from '@/lib/bibleCanon';
import { type TagContent } from '@/lib/nexusContent';

const MAX_CHARS = 420;

interface Props {
  item: TagContent;
  openHref: string | null;
  onOpen: (href: string) => void;
  ctaLabel: string;
}

type Fetched = { text: string; source?: string } | null;

const truncate = (s: string, n = MAX_CHARS) => {
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length > n ? clean.slice(0, n).trimEnd() + '…' : clean;
};

const bibleQuery = (item: TagContent) => {
  const meta = item.metadata ?? {};
  const abbr = meta.book as string | undefined;
  const chapter = meta.chapter ? Number(meta.chapter) : undefined;
  const verse = meta.verse ? Number(meta.verse) : undefined;
  return { abbr, chapter, verse, enabled: !!abbr && Number.isFinite(chapter) };
};

async function fetchInline(item: TagContent): Promise<Fetched> {
  switch (item.type) {
    case 'bible': {
      const { abbr, chapter, verse, enabled } = bibleQuery(item);
      if (!enabled) return null;
      const { data, error } = await supabase.functions.invoke('bible-text', {
        body: { abbrev: abbr, chapter },
      });
      if (error) throw error;
      const verses: { number: number; text: string }[] = Array.isArray(data?.verses) ? data.verses : [];
      if (verses.length === 0) return null;
      const book = (typeof data?.book === 'string' && data.book) || BOOK_NAME_BY_ABBR[abbr!] || abbr!;
      if (verse) {
        const idx = verses.findIndex(v => Number(v.number) === verse);
        if (idx !== -1) {
          const slice = verses.slice(Math.max(0, idx - 0), Math.min(verses.length, idx + 2));
          return {
            text: slice.map(v => `${v.number} ${v.text}`).join(' '),
            source: `${book} ${chapter},${verse}`,
          };
        }
      }
      const slice = verses.slice(0, 3);
      return {
        text: slice.map(v => `${v.number} ${v.text}`).join(' '),
        source: `${book} ${chapter}`,
      };
    }
    case 'catechism': {
      const meta = item.metadata ?? {};
      const p = Number(meta.paragraph ?? meta.number);
      if (!Number.isFinite(p)) return null;
      const para = await fetchCatechismParagraph(p);
      const text = para.content || para.explicacao || '';
      if (!text) return null;
      return { text, source: `CIC §${p}` };
    }
    case 'saint': {
      const meta = item.metadata ?? {};
      const ident = (meta.slug ?? meta.id ?? item.id) as string | undefined;
      if (!ident) return null;
      // tenta por slug e por id
      const { data } = await supabase
        .from('saints')
        .select('name,bio,full_bio')
        .or(`id.eq.${ident},name.ilike.${ident}`)
        .limit(1);
      const row = Array.isArray(data) && data[0];
      if (!row) return null;
      const text = row.bio || row.full_bio || '';
      if (!text) return null;
      return { text, source: row.name };
    }
    case 'magisterium': {
      // Magistério: se veio content_text já usamos; senão busca em spiritual_contents
      const { data } = await supabase
        .from('spiritual_contents')
        .select('content_text,title')
        .eq('id', item.id)
        .limit(1);
      const row = Array.isArray(data) && data[0];
      const text = row?.content_text || '';
      if (!text) return null;
      return { text, source: row?.title || item.title };
    }
    default:
      return null;
  }
}

const NexusInlinePreview: React.FC<Props> = ({ item, openHref, onOpen, ctaLabel }) => {
  const [expanded, setExpanded] = useState(false);

  const hasSeed = !!item.content_text;
  const shouldFetch = !hasSeed && ['bible', 'catechism', 'saint', 'magisterium'].includes(item.type);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['nexus-inline', item.type, item.id, item.metadata?.paragraph, item.metadata?.book, item.metadata?.chapter, item.metadata?.verse],
    queryFn: () => fetchInline(item),
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const previewText = useMemo(() => {
    if (hasSeed) return item.content_text as string;
    return data?.text ?? '';
  }, [hasSeed, item.content_text, data]);

  const displayed = expanded ? previewText : truncate(previewText);
  const canExpand = previewText.length > MAX_CHARS;

  return (
    <div>
      {isLoading && (
        <p className="font-serif italic text-primary/40 text-sm mb-spacing-md" aria-busy>
          Carregando trecho…
        </p>
      )}

      {!isLoading && previewText && (
        <p
          className="font-serif italic text-primary/75 text-base leading-relaxed mb-spacing-sm whitespace-pre-line"
          data-testid="nexus-inline-preview"
        >
          {displayed}
          {canExpand && (
            <>
              {' '}
              <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                className="not-italic text-[11px] uppercase tracking-[0.2em] text-secondary hover:text-primary underline decoration-dotted underline-offset-4"
              >
                {expanded ? 'menos' : 'ler mais'}
              </button>
            </>
          )}
        </p>
      )}

      {!isLoading && !previewText && isError && (
        <p className="text-sm text-primary/40 italic mb-spacing-sm">
          Não foi possível carregar o trecho agora.
        </p>
      )}

      {!isLoading && !previewText && !isError && shouldFetch && (
        <p className="text-sm text-primary/40 italic mb-spacing-sm">
          Trecho indisponível — abra no módulo para ler a passagem completa.
        </p>
      )}

      {openHref && (
        <button
          type="button"
          data-testid="nexus-open-module"
          data-nexus-type={item.type}
          onClick={() => onOpen(openHref)}
          className="text-[11px] uppercase tracking-[0.28em] text-primary/70 border-b border-primary/40 pb-[3px] hover:text-secondary hover:border-secondary transition-colors min-h-11"
        >
          {ctaLabel} no módulo →
        </button>
      )}
    </div>
  );
};

export default NexusInlinePreview;
