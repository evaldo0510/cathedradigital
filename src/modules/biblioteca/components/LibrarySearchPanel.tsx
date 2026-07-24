/**
 * Sprint B.1 · Onda B.1.3 — Painel de Busca Instantânea da Biblioteca.
 *
 * Bloco autocontido, plugável em qualquer página (Biblioteca Home, Átrio,
 * Catequese-K). Encapsula:
 *   - input com debounce (via `useLibrarySearch`)
 *   - filtros por módulo (`LibraryFilters`) com contagens vivas
 *   - lista unificada (`LibraryResultRow`), agrupada por tipo quando "Todos"
 *   - histórico local (últimas buscas)
 *   - estados: vazio / carregando / erro / sem resultados
 *
 * Sem cards paralelos, sem tokens de skin — tudo em tokens semânticos.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LIBRARY_MODULE_META, LIBRARY_MODULE_ORDER } from '../search/moduleMeta';
import type { LibraryResult } from '../search/types';
import type { LibraryModule } from '../types';
import { useLibrarySearch } from '../hooks/useLibrarySearch';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { LibraryFilters } from './LibraryFilters';
import LibraryResultRow from './LibraryResultRow';

export interface LibrarySearchPanelProps {
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  /** Se true, mostra tabela de módulos + títulos por bucket. Default true. */
  groupByModule?: boolean;
  /** Se true, sincroniza `?q=` na URL. Default true. */
  syncUrl?: boolean;
}

export function LibrarySearchPanel({
  placeholder = 'Buscar em toda a Biblioteca (ex.: Trindade, Eucaristia, Agostinho)…',
  autoFocus,
  className,
  groupByModule = true,
  syncUrl = true,
}: LibrarySearchPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = syncUrl ? (searchParams.get('q') ?? '') : '';
  const [query, setQuery] = useState(urlQuery);
  const [active, setActive] = useState<LibraryModule[]>([]);
  const { searches, rememberSearch, rememberOpen, clearSearches } = useSearchHistory();
  const sectionRef = useRef<HTMLElement>(null);
  const lastUrlQuery = useRef(urlQuery);

  // URL → estado (permite entrar direto via `?q=` ou vindo dos temas)
  useEffect(() => {
    if (!syncUrl) return;
    if (urlQuery !== lastUrlQuery.current) {
      lastUrlQuery.current = urlQuery;
      setQuery(urlQuery);
      if (urlQuery.length >= 2) {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [urlQuery, syncUrl]);

  // Estado → URL (com debounce leve para não poluir o histórico)
  useEffect(() => {
    if (!syncUrl) return;
    const t = window.setTimeout(() => {
      const trimmed = query.trim();
      const current = searchParams.get('q') ?? '';
      if (trimmed === current) return;
      const next = new URLSearchParams(searchParams);
      if (trimmed.length >= 2) next.set('q', trimmed);
      else next.delete('q');
      lastUrlQuery.current = trimmed;
      setSearchParams(next, { replace: true });
    }, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, syncUrl]);

  const types = active.length === 0 ? 'all' : active;
  const { data, isFetching, error, debouncedQuery } = useLibrarySearch({
    query,
    types,
    perModule: 6,
    withNexus: true,
  });

  const grouped = useMemo(() => {
    if (!data || !groupByModule) return null;
    const map = new Map<LibraryModule, LibraryResult[]>();
    for (const r of data.results) {
      const list = map.get(r.type) ?? [];
      list.push(r);
      map.set(r.type, list);
    }
    return LIBRARY_MODULE_ORDER
      .map((mod) => ({ mod, items: map.get(mod) ?? [] }))
      .filter((g) => g.items.length > 0);
  }, [data, groupByModule]);

  const handleOpen = (r: LibraryResult) => {
    rememberSearch(debouncedQuery);
    rememberOpen({ type: r.type, title: r.title, href: r.href });
  };

  const showHistory = query.trim().length < 2 && searches.length > 0;
  const showEmpty = !!data && data.totalFound === 0 && debouncedQuery.length >= 2;

  return (
    <section
      ref={sectionRef}
      className={cn('rounded-xl border border-border bg-card p-4 md:p-6 scroll-mt-24', className)}
      aria-label="Busca da Biblioteca"
    >
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="h-11 pl-9 pr-10 text-base"
          aria-label="Consulta"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="mt-3">
        <LibraryFilters
          active={active}
          onChange={setActive}
          counts={data?.countsByType}
        />
      </div>

      {isFetching ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Buscando…
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Falha ao consultar a Biblioteca. Tente novamente em instantes.
        </p>
      ) : null}

      {showHistory ? (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Buscas recentes
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearches}
              className="h-6 px-2 text-xs text-muted-foreground"
            >
              Limpar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searches.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground hover:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {showEmpty ? (
        <p className="mt-6 rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Nada encontrado para <strong className="text-foreground">"{debouncedQuery}"</strong>.
          Tente outra palavra ou remova filtros.
        </p>
      ) : null}

      {data && data.totalFound > 0 ? (
        <div className="mt-6 space-y-6">
          <p className="text-xs text-muted-foreground">
            {data.totalFound} resultado{data.totalFound === 1 ? '' : 's'} em {data.durationMs}ms
          </p>

          {grouped ? (
            grouped.map(({ mod, items }) => {
              const meta = LIBRARY_MODULE_META[mod];
              const Icon = meta.icon;
              return (
                <div key={mod}>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Icon className="h-4 w-4 text-primary" aria-hidden />
                    {meta.label}
                    <span className="text-xs font-normal text-muted-foreground">({items.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {items.map((r) => (
                      <LibraryResultRow key={`${r.type}:${r.id}`} result={r} onOpen={handleOpen} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="space-y-2">
              {data.results.map((r) => (
                <LibraryResultRow key={`${r.type}:${r.id}`} result={r} onOpen={handleOpen} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default LibrarySearchPanel;
