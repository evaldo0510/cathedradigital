/**
 * BibliotecaBuscaPage — Busca global full-text da Biblioteca Patrística.
 *
 * Rota: /biblioteca/escritos/busca?q=...&page=...
 *
 * Backend: RPC public.search_patristic_library (Postgres FTS português + ts_headline).
 * Cada hit devolve um snippet com <mark> já aplicado no server.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { EditorialHero } from '@/components/editorial';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import {
  searchPatristicLibrary,
  type PatristicSearchHit,
  type PatristicSearchResult,
} from '@/services/saintWorksService';
import {
  searchCollections,
  type CollectionSearchHit,
} from '@/features/collections/searchCollections';
import CollectionSearchCard from '@/features/collections/CollectionSearchCard';

const PAGE_SIZE = 10;

/** Constrói janela de páginas com elipses: 1 … 4 5 [6] 7 8 … 20. */
function buildPageWindow(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: Array<number | '…'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push('…');
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push('…');
  out.push(total);
  return out;
}

/** Sanitiza o snippet server-side (que só contém <mark>). */
const SNIPPET_CONFIG = { ALLOWED_TAGS: ['mark'], ALLOWED_ATTR: [] };
function sanitizeSnippet(html: string): string {
  return DOMPurify.sanitize(html, SNIPPET_CONFIG);
}

function hitHref(h: PatristicSearchHit): string {
  const base = `/biblioteca/escritos/${encodeURIComponent(h.saint_id)}/${encodeURIComponent(h.work_slug)}`;
  if (h.chapter_order != null) {
    return `${base}/capitulo/${h.chapter_order}?highlight=${encodeURIComponent(currentQuery ?? '')}`;
  }
  return base;
}

// Referência mutável para reuso dentro de hitHref (evita prop drilling em map)
let currentQuery: string | null = null;

const BibliotecaBuscaPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get('q') ?? '';
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);

  const [input, setInput] = useState(q);
  const [result, setResult] = useState<PatristicSearchResult | null>(null);
  const [collectionHits, setCollectionHits] = useState<CollectionSearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => setInput(q), [q]);
  currentQuery = q;

  useEffect(() => {
    let alive = true;
    if (q.trim().length < 2) {
      setResult(null);
      setCollectionHits([]);
      return;
    }
    setLoading(true);
    Promise.all([
      searchPatristicLibrary(q, page, PAGE_SIZE),
      // Coleções só na primeira página — resultado curto e curado.
      page === 1 ? searchCollections(q, 6) : Promise.resolve<CollectionSearchHit[]>([]),
    ])
      .then(([r, cols]) => {
        if (!alive) return;
        setResult(r);
        setCollectionHits(cols);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [q, page]);

  const totalPages = useMemo(() => {
    if (!result) return 0;
    return Math.ceil(result.total / PAGE_SIZE);
  }, [result]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed.length < 2) return;
    setParams({ q: trimmed, page: '1' });
  };

  const goPage = (next: number) => {
    if (next < 1 || (totalPages && next > totalPages)) return;
    setParams({ q, page: String(next) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="min-h-screen bg-background">
      <Helmet>
        <title>{q ? `“${q}” — Busca · Biblioteca Patrística` : 'Buscar na Biblioteca Patrística · Cathedra'}</title>
        <meta name="robots" content="noindex,follow" />
      </Helmet>

      <EditorialHero
        kicker="Cathedra · Biblioteca Viva"
        title="Buscar nos Escritos dos Santos"
        subtitle="Autor, obra ou palavras exatas dentro dos capítulos."
        parchment
        size="md"
      />

      <div className="max-w-3xl mx-auto px-spacing-md py-spacing-xl space-y-spacing-lg">
        <form onSubmit={submit} className="flex gap-spacing-xs">
          <div className="relative flex-1">
            <Icons.Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              aria-hidden
            />
            <input
              type="search"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex.: humildade, Trindade, Agostinho…"
              aria-label="Termo de busca"
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-premium text-premium-base focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button type="submit" size="lg" disabled={input.trim().length < 2}>
            Buscar
          </Button>
        </form>

        {loading && (
          <p className="text-center text-muted-foreground py-spacing-lg">Buscando…</p>
        )}

        {!loading &&
          q.trim().length >= 2 &&
          result &&
          result.hits.length === 0 &&
          collectionHits.length === 0 && (
            <div className="text-center py-spacing-2xl space-y-spacing-sm">
              <Icons.BookOpen className="w-10 h-10 mx-auto text-muted-foreground" aria-hidden />
              <p className="text-muted-foreground">
                Nenhum trecho ou coleção encontrado para <strong>“{q}”</strong>.
              </p>
              <Button variant="outline" onClick={() => navigate('/biblioteca/escritos')}>
                Voltar ao índice
              </Button>
            </div>
          )}

        {/* Coleções (só na página 1, acima dos trechos) */}
        {!loading && page === 1 && collectionHits.length > 0 && (
          <section aria-labelledby="col-search-heading" className="space-y-spacing-sm" data-testid="collections-search-section">
            <div className="flex items-baseline justify-between">
              <h2 id="col-search-heading" className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">
                Coleções encontradas · {collectionHits.length}
              </h2>
              <Link
                to="/acervo"
                className="text-premium-xs text-muted-foreground hover:text-primary underline underline-offset-4"
              >
                Ver todas
              </Link>
            </div>
            <div className="grid gap-spacing-sm md:grid-cols-2">
              {collectionHits.map((c) => (
                <CollectionSearchCard key={c.slug} hit={c} />
              ))}
            </div>
          </section>
        )}

        {!loading && result && result.hits.length > 0 && (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-spacing-xs text-premium-xs text-muted-foreground">
              <p>
                <strong className="text-foreground tabular-nums">{result.total}</strong>{' '}
                {result.total === 1 ? 'trecho encontrado' : 'trechos encontrados'}
                {totalPages > 1 && (
                  <>
                    {' '}· exibindo{' '}
                    <span className="tabular-nums">
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, result.total)}
                    </span>
                  </>
                )}
              </p>
              <p className="italic">Ordenado por relevância</p>
            </div>

            <ol className="space-y-spacing-md">
              {result.hits.map((h, i) => (
                <li
                  key={`${h.work_id}-${h.chapter_id ?? 'work'}-${i}`}
                  className="p-spacing-md bg-card border border-border rounded-premium hover:border-primary/40 transition-colors"
                >
                  <Link to={hitHref(h)} className="block group">
                    <p className="text-[10px] uppercase tracking-widest text-primary/70 font-bold mb-1">
                      {h.saint_name ?? h.saint_id}
                      {h.year_written ? ` · c. ${h.year_written}` : ''}
                    </p>
                    <h2 className="text-premium-md font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                      {h.work_title}
                      {h.chapter_title && (
                        <>
                          {' '}
                          <span className="text-muted-foreground font-normal">
                            · Cap. {h.chapter_order}: {h.chapter_title}
                          </span>
                        </>
                      )}
                    </h2>
                    <p
                      className="mt-spacing-xs text-premium-sm text-foreground/80 leading-relaxed [&_mark]:bg-primary/20 [&_mark]:text-foreground [&_mark]:rounded-sm [&_mark]:px-0.5"
                      dangerouslySetInnerHTML={{ __html: sanitizeSnippet(h.snippet ?? '') }}
                    />
                  </Link>
                </li>
              ))}
            </ol>

            {totalPages > 1 && (
              <nav
                className="flex flex-wrap items-center justify-between gap-spacing-xs pt-spacing-md"
                aria-label="Paginação de resultados"
              >
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goPage(1)}
                    disabled={page <= 1}
                    aria-label="Primeira página"
                  >
                    «
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goPage(page - 1)}
                    disabled={page <= 1}
                    className="gap-1"
                  >
                    <Icons.ArrowLeft className="w-4 h-4" aria-hidden /> Anterior
                  </Button>
                </div>

                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {buildPageWindow(page, totalPages).map((p, idx) =>
                    p === '…' ? (
                      <span
                        key={`gap-${idx}`}
                        className="px-1 text-muted-foreground text-premium-xs"
                        aria-hidden
                      >
                        …
                      </span>
                    ) : (
                      <Button
                        key={p}
                        variant={p === page ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => goPage(p)}
                        aria-current={p === page ? 'page' : undefined}
                        aria-label={`Ir para página ${p}`}
                        className="min-w-[2.25rem] tabular-nums"
                      >
                        {p}
                      </Button>
                    ),
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goPage(page + 1)}
                    disabled={page >= totalPages}
                    className="gap-1"
                  >
                    Próxima <Icons.ArrowRight className="w-4 h-4" aria-hidden />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goPage(totalPages)}
                    disabled={page >= totalPages}
                    aria-label="Última página"
                  >
                    »
                  </Button>
                </div>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default BibliotecaBuscaPage;
