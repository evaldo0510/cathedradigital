import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface VerseNoteSupProps {
  index: number;
  label?: string;
  /** HTML extracted from the Bolls comment. Sanitizado antes de renderizar. */
  contentHtml?: string;
}

/**
 * Pequena nota inline (sobrescrita) das traduções tipo NAA.
 */
export function VerseNoteSup({ index, label, contentHtml }: VerseNoteSupProps) {
  const display = label || String(index);
  const safeHtml = useMemo(() => {
    if (!contentHtml) return '';
    return DOMPurify.sanitize(contentHtml, {
      ALLOWED_TAGS: ['a', 'b', 'i', 'em', 'strong', 'span', 'br', 'sup', 'sub'],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    });
  }, [contentHtml]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <sup
          role="button"
          aria-label={`Nota ${display} — abrir referência`}
          className="mx-0.5 inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full bg-secondary/15 text-secondary text-[10px] font-semibold leading-none cursor-pointer hover:bg-secondary/30 focus-visible:ring-2 focus-visible:ring-secondary/60 transition-colors align-super"
        >
          {display}
        </sup>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="max-w-[280px] text-[13px] leading-snug font-sans text-primary/90"
      >
        <div className="text-[10px] uppercase tracking-[0.18em] text-secondary mb-1.5 font-bold">
          Referência
        </div>
        {safeHtml ? (
          <div
            className="space-y-1 [&_a]:text-secondary [&_a]:underline [&_a]:underline-offset-2"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <div className="text-primary/60 italic">Sem detalhe disponível.</div>
        )}
      </PopoverContent>
    </Popover>
  );
}
