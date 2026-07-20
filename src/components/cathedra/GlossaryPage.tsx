/**
 * GlossaryPage — Índice editorial do Léxico Teológico (SEG-2 Onda 2).
 *
 * Rota: /glossario
 *
 * Enciclopédia católica viva no padrão Logos 2030:
 *  - Hero editorial
 *  - Busca instantânea (fuzzy pg_trgm + unaccent)
 *  - Índice A–Z sticky para navegação rápida
 *  - Filtro por categorias editoriais
 *  - Grid de verbetes como cartões que abrem a página definitiva
 *    do verbete (/glossario/:slug) — sem expansão inline.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import {
  EditorialShell,
  EditorialHero,
  EditorialDivider,
} from '@/components/editorial';
import {
  EditorialKicker,
  EditorialEmptyState,
} from '@/components/editorial/primitives';
import {
  getRosaryReturn,
  clearRosaryReturn,
  formatElapsedShort,
  ROSARY_MODE_LABEL,
  type RosaryReturnContext,
} from '@/lib/rosaryReturnContext';
import { cn } from '@/lib/utils';

export function slugifyTerm(term: string): string {
  return term
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface GlossaryTerm {
  id: string;
  slug: string | null;
  term: string;
  short_definition: string | null;
  definition: string;
  category: string | null;
  status: string | null;
  similarityScore?: number;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function firstLetter(term: string): string {
  const clean = term.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const ch = (clean[0] ?? '').toUpperCase();
  return /[A-Z]/.test(ch) ? ch : '#';
}

const GlossaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(() => searchParams.get('category') || 'Todos');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [rosaryReturn, setRosaryReturn] = useState<RosaryReturnContext | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Se a rota veio como /glossario/:slug (legado), redireciona para a página definitiva.
  useEffect(() => {
    if (slug) navigate(`/glossario/${slug}`, { replace: true });
  }, [slug, navigate]);

  useEffect(() => {
    setRosaryReturn(getRosaryReturn());
  }, []);

  const handleReturnToRosary = () => {
    clearRosaryReturn();
    setRosaryReturn(null);
    navigate('/rosary#preparation');
  };

  const { results: searchResults, isPending: isSearchPending } = useFuzzySearch<GlossaryTerm>({
    rpc: 'search_glossary_fuzzy',
    query: searchQuery,
    primaryField: 'term',
    secondaryField: 'definition',
    secondaryWeight: 0.5,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('glossary')
        .select('id, slug, term, short_definition, definition, category, status')
        .order('term', { ascending: true });
      if (cancelled) return;
      if (error) console.error('Erro ao carregar glossário:', error);
      setTerms((data as GlossaryTerm[]) || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(terms.map((t) => t.category).filter(Boolean) as string[]);
    return ['Todos', ...Array.from(cats).sort((a, b) => a.localeCompare(b, 'pt'))];
  }, [terms]);

  const filtered = useMemo(() => {
    const base = searchQuery.trim().length >= 2 && searchResults ? searchResults : terms;
    return category === 'Todos' ? base : base.filter((t) => t.category === category);
  }, [terms, searchResults, searchQuery, category]);

  // Agrupamento A–Z (só quando não há busca ativa)
  const grouped = useMemo(() => {
    const map = new Map<string, GlossaryTerm[]>();
    for (const t of filtered) {
      const letter = firstLetter(t.term);
      const arr = map.get(letter) ?? [];
      arr.push(t);
      map.set(letter, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, 'pt'));
  }, [filtered]);

  const availableLetters = useMemo(() => new Set(grouped.map(([l]) => l)), [grouped]);

  // Sincroniza URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (searchQuery.trim()) next.set('q', searchQuery.trim());
    else next.delete('q');
    if (category !== 'Todos') next.set('category', category);
    else next.delete('category');
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, category]);

  const isSearching = searchQuery.trim().length >= 2;

  return (
    <>
      <SEOHead
        title="Léxico Teológico"
        description="Enciclopédia católica viva: definições editoriais, contexto histórico, Escritura, Catecismo, Magistério, Santos e Liturgia interconectados no Nexus."
        path="/glossario"
        keywords="glossário teológico, léxico católico, enciclopédia teológica, definições católicas"
        breadcrumbs={[{ name: 'Início', path: '/' }, { name: 'Léxico', path: '/glossario' }]}
      />

      <EditorialShell>
        {/* Sessão do Rosário — retomar */}
        {rosaryReturn && (
          <div
            role="region"
            aria-label="Retomar sessão do Rosário"
            aria-live="polite"
            className="sticky top-2 z-30 mx-auto max-w-3xl my-6 rounded-[var(--stitch-radius-xl)] border border-stitch-secondary/40 bg-stitch-surface-container-lowest/95 backdrop-blur p-4 flex items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.22em] text-stitch-secondary/80">
                Sessão em andamento
              </p>
              <p className="font-stitch-serif text-stitch-body-sm text-stitch-on-background truncate">
                {rosaryReturn.setName} · {rosaryReturn.mysteryLabel} · modo{' '}
                <strong>{ROSARY_MODE_LABEL[rosaryReturn.mode]}</strong> ·{' '}
                {formatElapsedShort(rosaryReturn.elapsedMs)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReturnToRosary}
              className="shrink-0 px-4 py-2 border border-stitch-secondary text-stitch-secondary uppercase tracking-[0.24em] font-stitch-label text-stitch-label-sm hover:bg-stitch-secondary/10 transition"
            >
              Voltar ao Rosário
            </button>
          </div>
        )}

        <EditorialHero
          meta="Enciclopédia católica viva"
          kicker="Lexicon Theologicum"
          title="Palavras que revelam"
          subtitle="Cada verbete é uma porta: Escritura, Tradição, Magistério, Liturgia e Santos se encontram em torno de um conceito para conduzir o estudo, a contemplação e a vida."
          size="lg"
          parchment
        />

        {/* Busca instantânea */}
        <div className="max-w-2xl mx-auto px-4 -mt-4 mb-10">
          <label htmlFor="glossary-search" className="sr-only">
            Buscar verbete
          </label>
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stitch-on-surface-variant"
              aria-hidden="true"
            />
            <input
              id="glossary-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite uma palavra ou conceito…"
              className={cn(
                'w-full pl-12 pr-12 py-4 rounded-full',
                'bg-stitch-surface-container-lowest border border-stitch-outline-variant/60',
                'font-stitch-serif text-stitch-body text-stitch-on-background',
                'placeholder:text-stitch-on-surface-variant/70',
                'focus-visible:outline-none focus-visible:border-stitch-secondary focus-visible:ring-2 focus-visible:ring-stitch-secondary/30',
              )}
            />
            {isSearchPending && (
              <span className="absolute right-5 top-1/2 -translate-y-1/2 font-stitch-label text-stitch-label-sm uppercase tracking-[0.22em] text-stitch-secondary">
                buscando…
              </span>
            )}
          </div>
        </div>

        {/* Categorias editoriais */}
        {!loading && categories.length > 1 && (
          <div className="max-w-5xl mx-auto px-4 mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => {
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    aria-pressed={active}
                    className={cn(
                      'px-4 py-2 rounded-full border font-stitch-label text-stitch-label-sm uppercase tracking-[0.22em] transition-colors',
                      active
                        ? 'border-stitch-secondary bg-stitch-secondary text-stitch-on-secondary'
                        : 'border-stitch-outline-variant/50 text-stitch-on-surface-variant hover:border-stitch-secondary hover:text-stitch-secondary',
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Índice A–Z (só quando não há busca) */}
        {!isSearching && !loading && (
          <nav
            aria-label="Índice A–Z"
            className="sticky top-16 z-20 bg-stitch-background/90 backdrop-blur border-y border-stitch-outline-variant/30 py-3 mb-10"
          >
            <ol className="flex flex-wrap justify-center gap-x-2 gap-y-1 max-w-5xl mx-auto px-4">
              {ALPHABET.map((letter) => {
                const enabled = availableLetters.has(letter);
                return (
                  <li key={letter}>
                    {enabled ? (
                      <a
                        href={`#letra-${letter}`}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full font-stitch-label text-stitch-label-sm uppercase text-stitch-secondary hover:bg-stitch-secondary/10 transition-colors"
                        aria-label={`Ir para letra ${letter}`}
                      >
                        {letter}
                      </a>
                    ) : (
                      <span
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full font-stitch-label text-stitch-label-sm uppercase text-stitch-on-surface-variant/40"
                        aria-disabled="true"
                      >
                        {letter}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        {/* Estatísticas */}
        {!loading && (
          <div className="max-w-4xl mx-auto px-4 mb-10">
            <EditorialDivider variant="gold-fade" className="mb-6" />
            <dl className="grid grid-cols-3 gap-6 text-center font-stitch-label text-stitch-label-sm uppercase tracking-[0.22em] text-stitch-on-surface-variant">
              <div>
                <dt className="text-stitch-secondary/70">Verbetes</dt>
                <dd className="mt-1 font-stitch-display text-stitch-display-sm text-stitch-on-background">
                  {filtered.length}
                </dd>
              </div>
              <div>
                <dt className="text-stitch-secondary/70">Categorias</dt>
                <dd className="mt-1 font-stitch-display text-stitch-display-sm text-stitch-on-background">
                  {categories.length - 1}
                </dd>
              </div>
              <div>
                <dt className="text-stitch-secondary/70">Publicados</dt>
                <dd className="mt-1 font-stitch-display text-stitch-display-sm text-stitch-on-background">
                  {terms.filter((t) => t.status === 'published').length}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Conteúdo */}
        <div ref={listRef} className="max-w-5xl mx-auto px-4 pb-24">
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="h-10 w-10 border-2 border-stitch-secondary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EditorialEmptyState
              kicker={isSearching ? 'Nenhum resultado' : 'Léxico vazio'}
              title={
                isSearching
                  ? `Nenhum verbete encontrado para "${searchQuery}".`
                  : 'Nenhum verbete disponível ainda.'
              }
              description={
                isSearching
                  ? 'Experimente outro termo ou remova o filtro de categoria.'
                  : 'Novos verbetes serão publicados em breve.'
              }
            />
          ) : isSearching ? (
            // Resultados de busca em lista contínua
            <ul className="grid gap-4 md:grid-cols-2">
              {filtered.map((t) => (
                <TermCard key={t.id} term={t} highlight={searchQuery} />
              ))}
            </ul>
          ) : (
            // Agrupamento A–Z
            <div className="space-y-16">
              {grouped.map(([letter, items]) => (
                <section key={letter} id={`letra-${letter}`} className="scroll-mt-32">
                  <header className="flex items-baseline gap-6 mb-8">
                    <span
                      aria-hidden="true"
                      className="font-stitch-display text-stitch-display-lg text-stitch-secondary leading-none"
                    >
                      {letter}
                    </span>
                    <EditorialKicker>
                      {items.length} {items.length === 1 ? 'verbete' : 'verbetes'}
                    </EditorialKicker>
                    <div className="flex-1 h-px bg-stitch-outline-variant/40" />
                  </header>
                  <ul className="grid gap-4 md:grid-cols-2">
                    {items.map((t) => (
                      <TermCard key={t.id} term={t} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </EditorialShell>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Card do verbete                                                     */
/* ------------------------------------------------------------------ */

const TermCard: React.FC<{ term: GlossaryTerm; highlight?: string }> = ({ term, highlight }) => {
  const to = term.slug ? `/glossario/${term.slug}` : `/glossario/${slugifyTerm(term.term)}`;
  const summary = term.short_definition?.trim() || term.definition.slice(0, 160);

  return (
    <li>
      <Link
        to={to}
        className={cn(
          'group block h-full p-6 rounded-[var(--stitch-radius-xl)]',
          'bg-stitch-surface-container-lowest border border-stitch-outline-variant/40',
          'hover:border-stitch-secondary/60 focus-visible:border-stitch-secondary',
          'focus-visible:outline-none transition-colors',
        )}
      >
        {term.category && (
          <span className="font-stitch-label text-stitch-label-sm uppercase tracking-[0.22em] text-stitch-secondary block mb-2">
            {term.category}
          </span>
        )}
        <h3 className="font-stitch-display text-stitch-headline-sm text-stitch-on-background group-hover:text-stitch-secondary transition-colors">
          {highlight ? (
            <HighlightedText text={term.term} query={highlight} />
          ) : (
            term.term
          )}
        </h3>
        <p className="mt-3 font-stitch-serif text-stitch-body-sm text-stitch-on-surface-variant line-clamp-3">
          {summary}
        </p>
        <span
          aria-hidden="true"
          className="mt-4 inline-flex items-center gap-2 font-stitch-label text-stitch-label-sm uppercase tracking-[0.24em] text-stitch-secondary group-hover:tracking-[0.28em] transition-[letter-spacing]"
        >
          Abrir verbete →
        </span>
      </Link>
    </li>
  );
};

const HighlightedText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-stitch-secondary/20 text-inherit rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
};

export default GlossaryPage;
