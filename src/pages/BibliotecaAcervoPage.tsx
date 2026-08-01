/**
 * BibliotecaAcervoPage — página dedicada de cada Coleção/Acervo.
 *
 * Rota: `/biblioteca/acervo/:slug`
 * Slugs: sagrada-escritura | catecismo | magisterio | santos-padres
 *
 * Contém:
 *  • Hero com imagem editorial (SafeImage, lazy + fallback)
 *  • Descrição completa e temas relacionados
 *  • Filtros (tipo/categoria + nível de formação) e ordenação
 *  • Lista paginada de itens vinda do adapter oficial da Biblioteca
 *  • Acessibilidade: alt, aria-label, focus visíveis, teclado
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
} from 'lucide-react';
import { MobileTopBar } from '@/components/mobile/MobileTopBar';
import { SafeImage } from '@/components/library/SafeImage';
import { LibraryCard, LIBRARY_ADAPTERS } from '@/modules/biblioteca';
import type { LibraryItem } from '@/modules/biblioteca';
import { LIBRARY_ACERVO_BY_SLUG } from '@/config/libraryAcervos';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

type SortKey = 'title-asc' | 'title-desc' | 'recent';
type LevelKey = 'all' | 'fundamental' | 'intermediate' | 'advanced';

const LEVEL_LABEL: Record<Exclude<LevelKey, 'all'>, string> = {
  fundamental: 'Fundamental',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

/** Heurística de nível de formação por item.
 *  Prioriza `readingMinutes`; cai para o padrão do módulo. */
function inferLevel(item: LibraryItem): Exclude<LevelKey, 'all'> {
  if (typeof item.readingMinutes === 'number' && item.readingMinutes > 0) {
    if (item.readingMinutes <= 5) return 'fundamental';
    if (item.readingMinutes <= 15) return 'intermediate';
    return 'advanced';
  }
  switch (item.module) {
    case 'bible':
    case 'prayers':
    case 'saints':
      return 'fundamental';
    case 'glossary':
    case 'catechism':
    case 'liturgy':
    case 'collections':
    case 'journeys':
      return 'intermediate';
    case 'magisterium':
    case 'patristics':
      return 'advanced';
    default:
      return 'intermediate';
  }
}

const BibliotecaAcervoPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const acervo = LIBRARY_ACERVO_BY_SLUG.get(slug);

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<string>('all');
  const [level, setLevel] = useState<LevelKey>('all');
  const [sort, setSort] = useState<SortKey>('title-asc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!acervo) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    LIBRARY_ADAPTERS[acervo.module]
      .list({ limit: 200, offset: 0 })
      .then((res) => {
        if (!cancelled) setItems(res);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err?.message ?? 'Falha ao carregar o acervo.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [acervo]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.category && set.add(i.category));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let out = items;
    if (category !== 'all') out = out.filter((i) => i.category === category);
    if (level !== 'all') out = out.filter((i) => inferLevel(i) === level);
    out = [...out].sort((a, b) => {
      if (sort === 'title-asc') return a.title.localeCompare(b.title, 'pt-BR');
      if (sort === 'title-desc') return b.title.localeCompare(a.title, 'pt-BR');
      const at = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const bt = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      return bt - at;
    });
    return out;
  }, [items, category, level, sort]);

  useEffect(() => {
    setPage(1);
  }, [category, level, sort, slug]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (!acervo) {
    return <Navigate to="/biblioteca" replace />;
  }

  return (
    <div
      className="min-h-screen w-full bg-stitch-background text-stitch-on-background"
      style={{
        backgroundImage:
          'url("https://www.transparenttextures.com/patterns/p6.png")',
      }}
    >
      <Helmet>
        <title>{`${acervo.title} — Biblioteca | Cathedra`}</title>
        <meta name="description" content={acervo.shortDescription} />
        <meta property="og:title" content={`${acervo.title} — Biblioteca`} />
        <link
          rel="canonical"
          href={`https://cathedradigital.com.br/biblioteca/acervo/${acervo.slug}`}
        />
      </Helmet>

      <MobileTopBar kicker="Biblioteca" title={acervo.title} transparent />

      <section
        id="conteudo"
        className="mx-auto w-full max-w-[1120px] px-5 pb-[calc(var(--stitch-mobile-bottomnav-h)+var(--stitch-mobile-safe-bottom)+2rem)] pt-6 md:px-16 md:pt-12 md:pb-16 animate-fade-in"
      >
        {/* Voltar */}
        <Link
          to="/biblioteca"
          className="mb-6 inline-flex items-center gap-2 rounded-md px-2 py-1 font-stitch-body text-[13px] text-stitch-on-surface-variant transition-colors hover:text-stitch-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary focus-visible:ring-offset-2"
          aria-label="Voltar para a Biblioteca"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Biblioteca
        </Link>

        {/* Hero editorial */}
        <section className="grid gap-8 border-b border-stitch-secondary/10 pb-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
          <SafeImage
            src={acervo.image}
            alt={`Ilustração editorial: ${acervo.title}`}
            fallbackLabel={acervo.title}
            aspect="aspect-[4/3]"
            wrapperClassName="rounded-lg border border-stitch-outline-variant/30 shadow-md"
            width={800}
            height={600}
          />
          <div>
            <span className="mb-2 block font-stitch-body text-[12px] font-bold uppercase tracking-[0.32em] text-stitch-secondary">
              Acervo
            </span>
            <h1 className="font-stitch-display text-[32px] italic leading-[40px] text-stitch-primary md:text-[44px] md:leading-[52px] md:tracking-[-0.02em]">
              {acervo.title}
            </h1>
            <p className="mt-2 font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant">
              {acervo.meta}
            </p>
            <p className="mt-4 font-stitch-body text-[17px] leading-[28px] text-stitch-on-surface-variant">
              {acervo.longDescription}
            </p>
          </div>
        </section>

        {/* Temas relacionados */}
        <section className="pt-8" aria-labelledby="temas-heading">
          <h2
            id="temas-heading"
            className="mb-3 font-stitch-display text-[18px] font-semibold text-stitch-primary"
          >
            Temas relacionados
          </h2>
          <ul className="flex flex-wrap gap-2">
            {acervo.themes.map((t) => (
              <li key={t.label}>
                <Link
                  to={`/biblioteca?q=${encodeURIComponent(t.query)}`}
                  aria-label={`Buscar em toda a Biblioteca por ${t.label}`}
                  className="inline-flex items-center rounded-full border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest px-3 py-1 font-stitch-body text-[13px] text-stitch-primary transition-colors hover:border-stitch-secondary/60 hover:text-stitch-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary focus-visible:ring-offset-2"
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Filtros */}
        <section
          className="mt-10 rounded-lg border border-stitch-outline-variant/30 bg-stitch-surface-container-lowest p-4 md:p-5"
          aria-labelledby="filtros-heading"
        >
          <div className="mb-3 flex items-center gap-2">
            <Filter
              className="h-4 w-4 text-stitch-secondary"
              aria-hidden
            />
            <h2
              id="filtros-heading"
              className="font-stitch-display text-[15px] font-semibold text-stitch-primary"
            >
              Refinar resultados
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Tipo/categoria */}
            <label className="flex flex-col gap-1">
              <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.12em] text-stitch-on-surface-variant">
                Tipo
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 rounded-md border border-stitch-outline-variant/40 bg-stitch-background px-3 font-stitch-body text-[14px] text-stitch-primary focus:border-stitch-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary focus-visible:ring-offset-2"
              >
                <option value="all">Todos</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            {/* Nível de formação */}
            <label className="flex flex-col gap-1">
              <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.12em] text-stitch-on-surface-variant">
                Nível de formação
              </span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as LevelKey)}
                className="h-10 rounded-md border border-stitch-outline-variant/40 bg-stitch-background px-3 font-stitch-body text-[14px] text-stitch-primary focus:border-stitch-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary focus-visible:ring-offset-2"
              >
                <option value="all">Todos</option>
                {(Object.keys(LEVEL_LABEL) as Array<keyof typeof LEVEL_LABEL>).map(
                  (k) => (
                    <option key={k} value={k}>
                      {LEVEL_LABEL[k]}
                    </option>
                  ),
                )}
              </select>
            </label>

            {/* Ordenação */}
            <label className="flex flex-col gap-1">
              <span className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.12em] text-stitch-on-surface-variant">
                Ordenar
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-10 rounded-md border border-stitch-outline-variant/40 bg-stitch-background px-3 font-stitch-body text-[14px] text-stitch-primary focus:border-stitch-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary focus-visible:ring-offset-2"
              >
                <option value="title-asc">Título (A → Z)</option>
                <option value="title-desc">Título (Z → A)</option>
                <option value="recent">Mais recentes</option>
              </select>
            </label>
          </div>

          <p
            className="mt-3 font-stitch-body text-[12px] text-stitch-on-surface-variant"
            aria-live="polite"
          >
            {loading
              ? 'Carregando itens…'
              : `${filtered.length} resultado${filtered.length === 1 ? '' : 's'}`}
          </p>
        </section>

        {/* Lista */}
        <section className="mt-8" aria-labelledby="itens-heading">
          <h2 id="itens-heading" className="sr-only">
            Itens do acervo
          </h2>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-stitch-on-surface-variant">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              <span className="font-stitch-body text-[14px]">Carregando…</span>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-destructive"
            >
              {error}
            </div>
          ) : pageItems.length === 0 ? (
            <div className="rounded-md border border-stitch-outline-variant/30 bg-stitch-surface-container-lowest p-6 text-center font-stitch-body text-[14px] text-stitch-on-surface-variant">
              Nenhum item corresponde aos filtros escolhidos.
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {pageItems.map((item) => (
                <li key={`${item.module}-${item.id}`}>
                  <LibraryCard item={item} density="balanced" />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Paginação */}
        {!loading && !error && totalPages > 1 ? (
          <nav
            aria-label="Paginação do acervo"
            className="mt-10 flex items-center justify-between"
          >
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Página anterior"
              className={cn(
                'inline-flex items-center gap-2 rounded-md border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest px-3 py-2 font-stitch-body text-[13px] text-stitch-primary transition-colors',
                'hover:border-stitch-secondary/60 hover:text-stitch-secondary',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-40',
              )}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Anterior
            </button>

            <span
              className="font-stitch-body text-[12px] font-bold uppercase tracking-[0.15em] text-stitch-on-surface-variant"
              aria-live="polite"
            >
              Página {currentPage} de {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Próxima página"
              className={cn(
                'inline-flex items-center gap-2 rounded-md border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest px-3 py-2 font-stitch-body text-[13px] text-stitch-primary transition-colors',
                'hover:border-stitch-secondary/60 hover:text-stitch-secondary',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-40',
              )}
            >
              Próxima
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </nav>
        ) : null}

        {/* Rodapé de navegação */}
        <div className="mt-12 border-t border-stitch-secondary/10 pt-6">
          <Link
            to="/biblioteca"
            className="inline-flex items-center gap-2 font-stitch-body text-[13px] font-bold uppercase tracking-[0.15em] text-stitch-secondary transition-colors hover:text-stitch-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-stitch-secondary focus-visible:ring-offset-2"
          >
            Explorar outros acervos
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default BibliotecaAcervoPage;
