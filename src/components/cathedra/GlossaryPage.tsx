import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { AppRoute } from '@/types';
import { Button } from '@/components/ui/button';
import { highlightText } from '@/lib/highlightText';


import { RelevanceBadge } from './RelevanceBadge';
import { FuzzySearchInput } from './FuzzySearchInput';
import { SearchResultCard } from './SearchResultCard';
import {
  getRosaryReturn,
  clearRosaryReturn,
  formatElapsedShort,
  ROSARY_MODE_LABEL,
  type RosaryReturnContext,
} from '@/lib/rosaryReturnContext';

type SortMode = 'relevance' | 'alpha-asc' | 'alpha-desc';


const LAST_TERM_STORAGE_KEY = 'cathedra:glossary:last-term';

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
  term: string;
  definition: string;
  category: string;
  journey_id?: string;
  similarityScore?: number;
}

/* ── P.A.D.H. enrichment for featured terms ── */
interface TermEnrichment {
  padh: string;
  question: string;
  relatedVerse?: string;
  relatedRoute?: string;
  relatedLabel?: string;
}

const ENRICHMENTS: Record<string, TermEnrichment> = {
  'Graça': {
    padh: '"Não é algo que você conquista…\né algo que te encontra quando você para de fugir."',
    question: 'Onde você ainda acha que precisa merecer?',
    relatedVerse: 'Ef 2,8',
    relatedRoute: AppRoute.LECTIO_DIVINA,
    relatedLabel: 'Viver essa Palavra',
  },
  'Pecado': {
    padh: '"Nem sempre é erro…\nàs vezes é distância."',
    question: 'Onde você se afastou de si mesmo?',
    relatedVerse: 'Rm 3,23',
    relatedRoute: AppRoute.POENITENTIA,
    relatedLabel: 'Exame de Consciência',
  },
  'Fé': {
    padh: '"Fé não é enxergar…\né continuar mesmo sem mapa."',
    question: 'O que você só vai entender depois de confiar?',
    relatedVerse: 'Hb 11,1',
    relatedRoute: AppRoute.LECTIO_DIVINA,
    relatedLabel: 'Viver essa Palavra',
  },
  'Transubstanciação': {
    padh: '"A aparência permanece…\nmas a essência já é outra.\nAssim como você, quando decide mudar por dentro."',
    question: 'O que em você parece o mesmo, mas já mudou?',
    relatedVerse: 'Lc 22,19',
    relatedRoute: AppRoute.MISSAL,
    relatedLabel: 'Entender a Missa',
  },
  'Escatologia': {
    padh: '"O fim não é destruição…\né o momento em que tudo finalmente faz sentido."',
    question: 'Se hoje fosse o último dia, o que você faria diferente?',
    relatedRoute: AppRoute.CATECHISM,
    relatedLabel: 'Ver no Catecismo',
  },
  'Eclesiologia': {
    padh: '"A Igreja não é o prédio…\né o povo que se encontra para não caminhar sozinho."',
    question: 'Onde você encontra pertencimento?',
    relatedRoute: AppRoute.COMMUNITY,
    relatedLabel: 'Comunidade',
  },
  'Soteriologia': {
    padh: '"Salvação não é fuga…\né voltar pra casa depois de tanto tempo perdido."',
    question: 'De que você precisa ser salvo hoje?',
    relatedVerse: 'Jo 3,16',
    relatedRoute: AppRoute.LECTIO_DIVINA,
    relatedLabel: 'Viver essa Palavra',
  },
  'Mariologia': {
    padh: '"Ela não pediu para ser escolhida…\nmas disse sim quando foi."',
    question: 'Qual "sim" você está adiando?',
    relatedVerse: 'Lc 1,38',
    relatedRoute: AppRoute.ROSARY,
    relatedLabel: 'Rezar o Rosário',
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  'Eucaristia': 'bg-secondary text-amber-800 dark:bg-amber-900/30 dark:text-secondary',
  'Teologia Sistemática': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'Igreja': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Sacramentos': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Teologia da Graça': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
};

const GlossaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(() => searchParams.get('category') || 'Todos');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [sortMode, setSortMode] = useState<SortMode>(
    () => (searchParams.get('sort') as SortMode) || 'relevance',
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rosaryReturn, setRosaryReturn] = useState<RosaryReturnContext | null>(null);


  // Detecta se o usuário veio de uma sessão ativa do Rosário.
  useEffect(() => {
    setRosaryReturn(getRosaryReturn());
  }, []);

  const handleReturnToRosary = () => {
    clearRosaryReturn();
    setRosaryReturn(null);
    // Hash sinaliza para o /rosary mover o foco ao cabeçalho da preparação,
    // preservando o fluxo de teclado após uma navegação SPA.
    navigate('/rosary#preparation');
  };

  // Server-side fuzzy search (pg_trgm + unaccent) via shared hook.
  const { results: searchResults, isPending: isSearchPending } = useFuzzySearch<GlossaryTerm>({
    rpc: 'search_glossary_fuzzy',
    query: searchQuery,
    primaryField: 'term',
    secondaryField: 'definition',
    secondaryWeight: 0.5,
  });

  useEffect(() => {
    const fetchTerms = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('glossary')
        .select('*')
        .order('term', { ascending: true });

      if (error) {
        console.error('Error fetching glossary:', error);
      } else {
        setTerms(data || []);
      }
      setLoading(false);
    };

    fetchTerms();
  }, []);

  // Resolve slug from URL → abre o termo correspondente.
  // Fallback: sem slug, restaura o último termo aberto (continuidade salva).
  useEffect(() => {
    if (loading || terms.length === 0) return;

    if (slug) {
      const match = terms.find(t => slugifyTerm(t.term) === slug);
      if (match) {
        setExpandedId(match.id);
        try {
          localStorage.setItem(LAST_TERM_STORAGE_KEY, slug);
        } catch { /* storage indisponível */ }
      }
      return;
    }

    // Sem slug: tenta restaurar o último termo.
    try {
      const lastSlug = localStorage.getItem(LAST_TERM_STORAGE_KEY);
      if (lastSlug) {
        const match = terms.find(t => slugifyTerm(t.term) === lastSlug);
        if (match) setExpandedId(match.id);
      }
    } catch { /* storage indisponível */ }
  }, [slug, loading, terms]);

  // Ao expandir manualmente, persiste como último termo e atualiza URL.
  useEffect(() => {
    if (!expandedId) return;
    const term = terms.find(t => t.id === expandedId);
    if (!term) return;
    const termSlug = slugifyTerm(term.term);
    try {
      localStorage.setItem(LAST_TERM_STORAGE_KEY, termSlug);
    } catch { /* storage indisponível */ }
    // Atualiza URL sem recarregar (só se diferente).
    if (slug !== termSlug) {
      window.history.replaceState(null, '', `/glossario/${termSlug}`);
    }

    const el = document.getElementById(`term-${expandedId}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [expandedId, terms, slug]);

  const categories = useMemo(() => {

    const cats = new Set(terms.map(t => t.category).filter(Boolean));
    return ['Todos', ...Array.from(cats)];
  }, [terms]);

  const filtered = useMemo(() => {
    // Quando o usuário busca, o RPC já devolve por relevância.
    const base = searchResults ?? terms;
    const byCategory = category === 'Todos' ? base : base.filter(d => d.category === category);
    if (sortMode === 'alpha-asc') {
      return [...byCategory].sort((a, b) => a.term.localeCompare(b.term, 'pt'));
    }
    if (sortMode === 'alpha-desc') {
      return [...byCategory].sort((a, b) => b.term.localeCompare(a.term, 'pt'));
    }
    // 'relevance': mantém a ordem de searchResults; para o catálogo (sem busca),
    // relevância cai para ordem natural (alfabética do fetch).
    return byCategory;
  }, [category, terms, searchResults, sortMode]);

  // Sincroniza filtros com a URL para deep-linking (?q=, ?category=, ?sort=).
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const setOrDel = (key: string, val: string, def: string) => {
      if (val && val !== def) next.set(key, val);
      else next.delete(key);
    };
    setOrDel('q', searchQuery.trim(), '');
    setOrDel('category', category, 'Todos');
    setOrDel('sort', sortMode, 'relevance');
    // Evita ciclos: só grava se mudou
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, category, sortMode]);


  const enrichedCount = useMemo(() => terms.filter(t => ENRICHMENTS[t.term]).length, [terms]);

  return (
    <>
    <SEOHead title="Glossário Teológico" description="Consulte o glossário de termos teológicos e católicos. Definições claras e acessíveis para aprofundar seus estudos." path="/glossary" keywords="glossário teológico, termos católicos, vocabulário religioso, teologia" breadcrumbs={[{ name: "Início", path: "/" }, { name: "Glossário", path: "/glossary" }]} />
    <div className="max-w-5xl mx-auto space-y-spacing-xl">
      {/* Voltar ao Rosário — restaura mistério, dezena e tempo (persistidos no /rosary). */}
      {rosaryReturn && (
        <div
          role="region"
          aria-label="Retomar sessão do Rosário"
          aria-live="polite"
          className="sticky top-2 z-30 mx-auto max-w-3xl rounded-premium border border-secondary/40 bg-card/95 backdrop-blur shadow-premium p-spacing-sm flex items-center gap-spacing-sm"
          data-testid="rosary-return-region"
        >
          <Icons.ArrowLeft className="w-5 h-5 text-secondary shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-secondary/80">
              Sessão em andamento
            </p>
            <p
              id="rosary-return-summary"
              className="text-premium-sm text-foreground font-serif truncate"
            >
              {rosaryReturn.setName} · {rosaryReturn.mysteryLabel} · modo{' '}
              <strong className="font-serif font-bold">
                {ROSARY_MODE_LABEL[rosaryReturn.mode]}
              </strong>{' '}
              · {formatElapsedShort(rosaryReturn.elapsedMs)} rezados
            </p>
          </div>
          <Button
            type="button"
            onClick={handleReturnToRosary}
            data-testid="rosary-return-button"
            data-mode={rosaryReturn.mode}
            className="min-h-11 rounded-premium-full bg-secondary text-secondary-foreground font-black uppercase text-premium-xs tracking-widest px-spacing-md hover:bg-secondary/90 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`Voltar ao Rosário — retomar ${rosaryReturn.setName}, ${rosaryReturn.mysteryLabel}, modo ${ROSARY_MODE_LABEL[rosaryReturn.mode]}, ${formatElapsedShort(rosaryReturn.elapsedMs)} já rezados`}
            aria-describedby="rosary-return-summary"
          >
            Voltar ao Rosário
          </Button>
        </div>
      )}
      {/* Header */}
      <div className="text-center space-y-spacing-sm">
        <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 rounded-premium">
          <Icons.BookOpen className="w-spacing-md h-spacing-md text-primary" />
          <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">Lexicon Theologicum</span>
        </div>
        <h1 className="text-premium-3xl md:text-premium-5xl font-serif font-bold text-foreground">📘 Palavras que Revelam</h1>
        <p className="text-muted-foreground font-serif italic max-w-spacing-xl mx-auto">
          "Nem toda palavra é só significado… algumas são portas."
        </p>
      </div>

      {/* Icons.Search */}
      <FuzzySearchInput
        className="max-w-spacing-md mx-auto"
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Digite uma palavra ou sentimento…"
        isSearching={isSearchPending}
      />

      {/* Category tabs + Sort */}
      {!loading && terms.length > 0 && (
        <div className="space-y-spacing-xs">
          <div className="flex gap-spacing-xs justify-center flex-wrap">
            {categories.map(cat => (
              <Button key={cat} onClick={() => setCategory(cat)}
                aria-pressed={category === cat}
                className={`px-spacing-md py-spacing-xs rounded-premium-full text-premium-xs font-black uppercase tracking-widest transition-all ${
                  category === cat ? 'bg-foreground text-background shadow-premium' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}>
                {cat}
              </Button>
            ))}
          </div>
          <div className="flex justify-center items-center gap-spacing-xs">
            <label htmlFor="glossary-sort" className="text-premium-xs uppercase tracking-widest text-muted-foreground">
              Ordenar
            </label>
            <select
              id="glossary-sort"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-card border border-border rounded-premium px-spacing-sm py-spacing-2xs text-premium-xs font-bold uppercase tracking-widest text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <option value="relevance">Relevância</option>
              <option value="alpha-asc">A → Z</option>
              <option value="alpha-desc">Z → A</option>
            </select>
          </div>
        </div>
      )}


      {/* Stats */}
      {!loading && (
        <div className="flex justify-center gap-spacing-lg text-center">
          <div>
            <p className="text-premium-2xl font-serif font-bold text-foreground">{filtered.length}</p>
            <p className="text-premium-xs uppercase tracking-widest text-muted-foreground">Termos</p>
          </div>
          <div>
            <p className="text-premium-2xl font-serif font-bold text-foreground">{new Set(filtered.map(d => d.category)).size}</p>
            <p className="text-premium-xs uppercase tracking-widest text-muted-foreground">Categorias</p>
          </div>
          <div>
            <p className="text-premium-2xl font-serif font-bold text-foreground">{enrichedCount}</p>
            <p className="text-premium-xs uppercase tracking-widest text-muted-foreground">Com reflexão</p>
          </div>
        </div>
      )}

      {/* Icons.Search results as SearchResultCards */}
      {searchQuery.trim().length >= 2 && searchResults && searchResults.length > 0 && (
        <div className="space-y-spacing-xs">
          <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Resultados da busca</p>
          <AnimatePresence mode="popLayout">
          {searchResults.map((term, i) => (
            <SearchResultCard
              key={term.id}
              title={term.term}
              subtitle={term.definition}
              score={term.similarityScore}
              icon={<Icons.BookOpen className="w-spacing-md h-spacing-md" />}
              onClick={() => setExpandedId(expandedId === term.id ? null : term.id)}
              index={i}
            />
          ))}
          </AnimatePresence>
        </div>
      )}

      {/* Glossary list */}
      <div className="space-y-spacing-sm">
        {loading ? (
          <div className="flex justify-center py-spacing-2xl">
            <div className="w-spacing-xl h-spacing-xl border-2 border-secondary border-t-transparent rounded-premium animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          filtered.map(term => {
            const enrichment = ENRICHMENTS[term.term];
            const isExpanded = expandedId === term.id;

            return (
              <div key={term.id} id={`term-${term.id}`}
                className={`bg-card border rounded-premium-full overflow-hidden transition-all ${
                  isExpanded ? 'border-primary/40 shadow-premium' : 'border-border hover:border-primary/30'
                }`}>
                <Button
                  onClick={() => setExpandedId(isExpanded ? null : term.id)}
                  className="w-full text-left p-spacing-lg flex items-start gap-spacing-md"
                >
                  <div className="flex-1 min-w-spacing-0">
                    <div className="flex items-center gap-spacing-xs mb-spacing-2xs flex-wrap">
                      {term.category && (
                        <span className={`px-spacing-xs py-spacing-3xs rounded-premium-full text-premium-xs font-black uppercase tracking-widest ${CATEGORY_COLORS[term.category] || 'bg-muted text-muted-foreground'}`}>
                          {term.category}
                        </span>
                      )}
                      {enrichment && (
                        <span className="px-spacing-xs py-spacing-3xs rounded-premium-full text-premium-xs font-bold bg-primary/10 text-primary uppercase tracking-wider">
                          <Icons.Sparkles className="w-spacing-xs h-spacing-xs inline mr-spacing-2xs" /> Com reflexão
                        </span>
                      )}
                    </div>
                    <h3 className="text-premium-base font-bold text-foreground">{term.term}</h3>
                    {!isExpanded && (
                      <p className="text-premium-sm text-muted-foreground line-clamp-spacing-2xs mt-spacing-2xs">{term.definition}</p>
                    )}
                  </div>
                  <Icons.ArrowDown className={`w-spacing-md h-spacing-md text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>

                {isExpanded && (
                  <div className="px-spacing-lg pb-spacing-lg space-y-spacing-md border-t border-border pt-spacing-md">
                    {/* Layer 1: Simple definition */}
                    <div className="space-y-spacing-2xs">
                      <p className="text-premium-xs font-black uppercase tracking-widest text-primary">📘 Definição</p>
                      <p className="text-foreground/90 leading-relaxed font-serif">{term.definition}</p>
                    </div>

                    {enrichment && (
                      <>
                        {/* Layer 2: P.A.D.H. */}
                        <div className="bg-primary/5 rounded-premium p-spacing-md text-center space-y-spacing-xs">
                          <p className="text-premium-xs font-black uppercase tracking-widest text-primary/70">🧠 Reflexão Poética</p>
                          <p className="text-foreground font-serif italic leading-relaxed whitespace-pre-line text-premium-sm">{enrichment.padh}</p>
                        </div>

                        {/* Layer 3: Inner question */}
                        <div className="bg-accent/30 rounded-premium p-spacing-md text-center space-y-spacing-xs">
                          <p className="text-premium-xs font-black uppercase tracking-widest text-accent-foreground/70">❓ Pergunta Interior</p>
                          <p className="text-foreground font-bold text-premium-base">{enrichment.question}</p>
                        </div>

                        {/* Related verse */}
                        {enrichment.relatedVerse && (
                          <div className="flex items-center gap-spacing-xs text-premium-sm text-muted-foreground">
                            <Icons.Book className="w-spacing-md h-spacing-md text-primary" />
                            <span className="font-serif italic">Referência: {enrichment.relatedVerse}</span>
                          </div>
                        )}

                        {/* Journey Icons.Link */}
                        {term.journey_id && (
                          <div className="bg-primary/10 border border-primary/20 rounded-premium p-spacing-md space-y-spacing-sm">
                            <div className="flex items-center gap-spacing-xs">
                              <Icons.Compass className="w-spacing-md h-spacing-md text-primary" />
                              <p className="text-premium-xs font-bold text-primary uppercase tracking-widest">Jornada Prática</p>
                            </div>
                            <p className="text-premium-xs text-foreground/80 leading-relaxed">
                              Transforme este conhecimento em hábito com uma jornada curta de 3 a 7 dias.
                            </p>
                            <Button 
                              onClick={() => navigate(`/jornadas/${term.journey_id}`)}
                              className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase text-premium-xs tracking-widest py-spacing-md"
                            >
                              Iniciar Jornada Prática
                            </Button>
                          </div>
                        )}

                        {/* CTA */}
                        {enrichment.relatedRoute && (
                          <Button
                            onClick={() => navigate(enrichment.relatedRoute!)}
                            className="w-full py-spacing-sm rounded-premium-full bg-foreground text-background font-black uppercase text-premium-xs tracking-[0.2em] shadow-premium hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-spacing-xs group"
                          >
                            <Icons.Heart className="w-spacing-md h-spacing-md group-hover:scale-110 transition-transform" />
                            {enrichment.relatedLabel || 'Aprofundar'}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-spacing-2xl bg-muted/20 rounded-premium">
            <Icons.Search className="w-spacing-xl h-spacing-xl text-muted-foreground mx-auto mb-spacing-sm" />
            <p className="text-muted-foreground">Nenhum termo encontrado.</p>
            <p className="text-premium-xs text-muted-foreground mt-spacing-2xs">Tente buscar por outro sentimento ou palavra.</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default GlossaryPage;
