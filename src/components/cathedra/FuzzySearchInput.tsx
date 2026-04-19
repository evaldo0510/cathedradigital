/**
 * FuzzySearchInput — shared search input used by Saints, Glossary,
 * Community and Themes pages.
 *
 * Encapsulates the four UI primitives that those modules duplicated:
 *   1. The leading search icon.
 *   2. The text input (controlled).
 *   3. A trailing clear button (X) that appears once the user types.
 *   4. A "Buscando…" indicator shown while the debounce timer is pending
 *      or a fuzzy-search RPC is in flight.
 *
 * The component is purely presentational: it does not manage debounce or
 * RPC state itself. Pair it with `useFuzzySearch` (or any debounced source
 * of truth) and feed the resulting `isPending` flag into `isSearching`.
 *
 * Example:
 *   const { isPending } = useFuzzySearch({ rpc: 'search_saints_fuzzy', query, ... });
 *   <FuzzySearchInput
 *     value={query}
 *     onChange={setQuery}
 *     placeholder="Buscar santo…"
 *     isSearching={isPending}
 *   />
 */
import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FuzzySearchInputProps {
  /** Current input value (controlled). */
  value: string;
  /** Called with the next raw input value. */
  onChange: (next: string) => void;
  /** Placeholder copy. */
  placeholder?: string;
  /**
   * When true, renders the small "Buscando…" indicator below the input.
   * Wire this to `useFuzzySearch().isPending` (or your own debounce flag).
   */
  isSearching?: boolean;
  /** Minimum length required before showing the "Buscando…" hint. Defaults to 2. */
  minLength?: number;
  /** Visual size preset. `md` is the default; `lg` matches the Saints search hero. */
  size?: 'md' | 'lg';
  /** aria-label for the input (defaults to the placeholder). */
  ariaLabel?: string;
  /** Optional extra classes for the wrapper (e.g. `max-w-2xl mx-auto`). */
  className?: string;
  /** Optional id for the input element. */
  inputId?: string;
}

const SIZE_TOKENS: Record<NonNullable<FuzzySearchInputProps['size']>, {
  input: string;
  icon: string;
  iconWrap: string;
  clearWrap: string;
}> = {
  md: {
    input: 'pl-11 pr-10 py-3 text-sm rounded-2xl',
    icon: 'w-4 h-4',
    iconWrap: 'left-4',
    clearWrap: 'right-3',
  },
  lg: {
    input: 'pl-14 pr-14 py-5 text-base rounded-full shadow-sm',
    icon: 'w-5 h-5',
    iconWrap: 'left-6',
    clearWrap: 'right-6',
  },
};

export const FuzzySearchInput: React.FC<FuzzySearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Buscar…',
  isSearching = false,
  minLength = 2,
  size = 'md',
  ariaLabel,
  className,
  inputId,
}) => {
  const tokens = SIZE_TOKENS[size];
  const showHint = isSearching && value.trim().length >= minLength;

  return (
    <div className={cn('relative', className)}>
      <Search
        className={cn(
          'absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none',
          tokens.icon,
          tokens.iconWrap,
        )}
        aria-hidden="true"
      />
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          'w-full bg-card border border-border text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all',
          tokens.input,
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpar busca"
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors',
            tokens.clearWrap,
          )}
        >
          <X className={tokens.icon} />
        </button>
      )}
      {showHint && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Buscando…
        </div>
      )}
    </div>
  );
};

export default FuzzySearchInput;
