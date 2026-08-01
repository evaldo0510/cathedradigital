/**
 * BibliotecaCatolicaAcervoPage — Acervo unificado com busca e filtros.
 *
 * Sprint Biblioteca Católica · Onda 1.
 * Usa a RPC `search_library_items` (FTS + filtros) sobre a view unificada.
 * Cobre Escritos, Padres, Doutores, Clássicos e Magistério.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { EditorialHero, EditorialCard } from '@/components/editorial';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '../../constants';
import { searchLibrary } from '@/services/libraryService';
import type {
  LibraryItem,
  LibraryKind,
  LibraryAccessType,
  LibraryFichaCompleteness,
} from '@/types/library';
import { LIBRARY_KIND_LABELS } from '@/types/library';

const PAGE_SIZE = 24;

const KIND_OPTIONS: Array<{ value: LibraryKind | 'all'; label: string }> = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'saint_work', label: LIBRARY_KIND_LABELS.saint_work },
  { value: 'patristic', label: LIBRARY_KIND_LABELS.patristic },
  { value: 'doctor', label: LIBRARY_KIND_LABELS.doctor },
  { value: 'classic', label: LIBRARY_KIND_LABELS.classic },
  { value: 'magisterium', label: LIBRARY_KIND_LABELS.magisterium },
];

const ACCESS_OPTIONS: Array<{ value: LibraryAccessType | 'all'; label: string }> = [
  { value: 'all', label: 'Todos os acessos' },
  { value: 'internal', label: 'Leitor interno' },
  { value: 'external', label: 'Fonte externa' },
  { value: 'summary_only', label: 'Somente ficha' },
];

const COMPLETENESS_OPTIONS: Array<{ value: LibraryFichaCompleteness | 'all'; label: string }> = [
  { value: 'all', label: 'Toda completude' },
  { value: 'complete', label: 'Ficha completa' },
  { value: 'minimal', label: 'Ficha mínima' },
];

const BibliotecaCatolicaAcervoPage: React.FC = () => {
  const [params, setParams] = useSearchParams();

  const kindParam = (params.get('kind') ?? 'all') as LibraryKind | 'all';
  const accessParam = (params.get('access') ?? 'all') as LibraryAccessType | 'all';
  const completenessParam = (params.get('ficha') ?? 'all') as
    | LibraryFichaCompleteness
    | 'all';
  const queryParam = params.get('q') ?? '';
  const pageParam = Math.max(1, Number(params.get('p') ?? 1));

  const [queryInput, setQueryInput] = useState(queryParam);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza input com URL (quando alteram via navegação)
  useEffect(() => {
    setQueryInput(queryParam);
  }, [queryParam]);

  // Busca
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    searchLibrary({
      query: queryParam,
      kinds: kindParam !== 'all' ? [kindParam] : undefined,
      access: accessParam !== 'all' ? accessParam : null,
      completeness: completenessParam !== 'all' ? [completenessParam] : undefined,
      limit: PAGE_SIZE,
      offset: (pageParam - 1) * PAGE_SIZE,
    })
      .then((res) => {
        if (!alive) return;
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : 'Erro desconhecido';
        setError(msg);
        setItems([]);
        setTotal(0);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [queryParam, kindParam, accessParam, completenessParam, pageParam]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all' || value === '') next.delete(key);
    else next.set(key, value);
    // Reset da paginação ao mudar filtros
    if (key !== 'p') next.delete('p');
    setParams(next, { replace: true });
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', queryInput.trim() || null);
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );

  return (
    <section className="min-h-screen bg-background" data-space="biblioteca">
      <Helmet>
        <title>Acervo — Biblioteca Católica · Cathedra</title>
        <meta
          name="description"
          content="Explore o acervo unificado da Biblioteca Católica: Escritos dos Santos, Padres, Doutores, Clássicos e Magistério. Busca por título, autor ou tema."
        />
        <link
          rel="canonical"
          href="https://cathedradigital.com.br/biblioteca/catolica/acervo"
        />
      </Helmet>

      <EditorialHero
        kicker="Biblioteca Católica"
        title="Acervo"
        subtitle="Busque por título, autor ou tema em toda a Tradição."
        parchment
        size="md"
      />

      <div className="max-w-6xl mx-auto px-spacing-md py-spacing-lg space-y-spacing-lg">
        {/* Barra de busca + filtros */}
        <section aria-label="Filtros e busca" className="space-y-spacing-sm">
          <form onSubmit={submitSearch} className="flex gap-spacing-2xs">
            <div className="flex-1">
              <Label htmlFor="q" className="sr-only">Buscar</Label>
              <Input
                id="q"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Buscar por título, autor, obra ou tema…"
                autoComplete="off"
              />
            </div>
            <Button type="submit" className="gap-spacing-2xs">
              <Icons.Search className="w-4 h-4" aria-hidden />
              <span className="hidden sm:inline">Buscar</span>
            </Button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-spacing-sm">
            <div>
              <Label className="text-premium-xs">Tipo</Label>
              <Select
                value={kindParam}
                onValueChange={(v) => updateParam('kind', v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-premium-xs">Acesso</Label>
              <Select
                value={accessParam}
                onValueChange={(v) => updateParam('access', v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCESS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-premium-xs">Ficha editorial</Label>
              <Select
                value={completenessParam}
                onValueChange={(v) => updateParam('ficha', v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPLETENESS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Resultados */}
        <section aria-live="polite" className="space-y-spacing-md">
          <div className="flex items-baseline justify-between border-b border-border/50 pb-spacing-2xs">
            <p className="text-premium-xs text-muted-foreground">
              {loading
                ? 'Carregando…'
                : total === 0
                  ? 'Nenhuma obra encontrada.'
                  : `${total} ${total === 1 ? 'obra' : 'obras'}${queryParam ? ` para "${queryParam}"` : ''}`}
            </p>
            {totalPages > 1 && (
              <p className="text-premium-xs text-muted-foreground">
                Página {pageParam} de {totalPages}
              </p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="p-spacing-sm rounded border border-destructive/40 bg-destructive/5 text-premium-sm text-destructive"
            >
              Erro ao carregar o acervo: {error}
            </div>
          )}

          {!error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-md">
              {items.map((item) => (
                <Link
                  key={`${item.library_kind}-${item.id}`}
                  to={item.href}
                  aria-label={`Abrir ${item.title} de ${item.author_label}`}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                >
                  <EditorialCard
                    kicker={
                      <span className="inline-flex items-center gap-1">
                        {LIBRARY_KIND_LABELS[item.library_kind]}
                        {item.year ? ` · c. ${item.year}` : ''}
                      </span>
                    }
                    title={item.title}
                    meta={
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span>{item.author_label}</span>
                        {item.access_type === 'external' && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-semibold uppercase">
                            <Icons.ExternalLink className="w-3 h-3" aria-hidden />
                            Externa
                          </span>
                        )}
                        {item.ficha_completeness === 'complete' && (
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold uppercase">
                            Ficha completa
                          </span>
                        )}
                      </span>
                    }
                    description={item.synopsis ?? undefined}
                    className="h-full transition-transform hover:-translate-y-0.5"
                  />
                </Link>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <nav
              aria-label="Paginação do acervo"
              className="flex justify-center gap-spacing-2xs pt-spacing-md"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={pageParam <= 1}
                onClick={() => updateParam('p', String(pageParam - 1))}
              >
                ← Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pageParam >= totalPages}
                onClick={() => updateParam('p', String(pageParam + 1))}
              >
                Próxima →
              </Button>
            </nav>
          )}
        </section>
      </div>
    </section>
  );
};

export default BibliotecaCatolicaAcervoPage;
