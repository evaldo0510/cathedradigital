import React, { useEffect, useRef, useState, type RefObject } from 'react';
import { Icons } from '@/constants';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';

interface MagisteriumSearchBarProps {
  containerRef: RefObject<HTMLElement | null>;
  contentVersion: unknown;
  open: boolean;
  onClose: () => void;
}

/**
 * STAB-004.3.2 — Barra de busca interna do documento do Magistério.
 * Debounce leve, contador, navegação prev/next, fechar com Esc.
 * Toda a lógica de highlight vive em `useDocumentSearch` (in-memory).
 */
const MagisteriumSearchBar: React.FC<MagisteriumSearchBarProps> = ({
  containerRef,
  contentVersion,
  open,
  onClose,
}) => {
  const [rawQuery, setRawQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(rawQuery), 120);
    return () => clearTimeout(t);
  }, [rawQuery]);

  // Zera busca ao trocar de documento
  useEffect(() => {
    setRawQuery('');
    setDebounced('');
  }, [contentVersion]);

  useEffect(() => {
    if (open) {
      // pequeno delay para o input existir no DOM
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const { total, current, goNext, goPrev } = useDocumentSearch(
    containerRef,
    open ? debounced : '',
    contentVersion,
  );

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) goPrev();
      else goNext();
    }
  };

  const clear = () => {
    setRawQuery('');
    setDebounced('');
    inputRef.current?.focus();
  };

  return (
    <div
      role="search"
      aria-label="Buscar neste documento"
      className="sticky top-[52px] z-30 mx-auto w-full max-w-[70ch] px-spacing-md md:px-spacing-0 mb-spacing-md"
    >
      <div className="flex items-center gap-spacing-2xs rounded-premium-full border border-primary/20 bg-background/95 backdrop-blur-md px-spacing-md py-spacing-2xs shadow-premium">
        <Icons.Search className="w-spacing-md h-spacing-md text-primary/60 shrink-0" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar neste documento"
          aria-label="Buscar neste documento"
          className="flex-1 bg-transparent border-0 outline-none text-premium-sm text-foreground placeholder:text-muted-foreground/60 min-w-0"
          autoComplete="off"
          spellCheck={false}
        />
        {debounced.length >= 2 && (
          <span
            aria-live="polite"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 whitespace-nowrap"
          >
            {total > 0 ? `${current} / ${total}` : '0 ocorrências'}
          </span>
        )}
        <div className="flex items-center gap-spacing-3xs">
          <button
            type="button"
            onClick={goPrev}
            disabled={total === 0}
            aria-label="Ocorrência anterior"
            className="p-spacing-2xs rounded-premium-full hover:bg-primary/10 text-primary/70 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icons.ChevronUp className="w-spacing-md h-spacing-md" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={total === 0}
            aria-label="Próxima ocorrência"
            className="p-spacing-2xs rounded-premium-full hover:bg-primary/10 text-primary/70 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icons.ChevronDown className="w-spacing-md h-spacing-md" aria-hidden="true" />
          </button>
          {rawQuery && (
            <button
              type="button"
              onClick={clear}
              aria-label="Limpar busca"
              className="p-spacing-2xs rounded-premium-full hover:bg-primary/10 text-primary/70"
            >
              <Icons.X className="w-spacing-md h-spacing-md" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar busca"
            className="ml-spacing-2xs p-spacing-2xs rounded-premium-full hover:bg-destructive/10 text-muted-foreground"
          >
            <Icons.X className="w-spacing-md h-spacing-md" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MagisteriumSearchBar;
