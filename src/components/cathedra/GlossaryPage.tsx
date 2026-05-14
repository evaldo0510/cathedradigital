import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { AppRoute } from '@/types';
import { Button } from '@/components/ui/button';
import { Compass, Heart, ArrowDown, Search, Sparkles, Book, BookOpen, Star, ChevronLeft, Share2, HelpCircle, ArrowRight, X } from 'lucide-react';

import { FuzzySearchInput } from './FuzzySearchInput';
import { SearchResultCard } from './SearchResultCard';
import AlphabetBar from './encyclopedia/AlphabetBar';

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

const slugify = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

const GlossaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { term: termSlug } = useParams();
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('cathedra_glossary_favorites') || '[]');
    } catch { return []; }
  });

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

  const selectedTerm = useMemo(() => {
    if (!termSlug) return null;
    return terms.find(t => slugify(t.term) === termSlug);
  }, [termSlug, terms]);

  useEffect(() => {
    localStorage.setItem('cathedra_glossary_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }, []);

  const clearFilters = useCallback(() => {
    setCategory('Todos');
    setSelectedLetter(null);
    setSearchQuery('');
  }, []);

  const hasActiveFilters = category !== 'Todos' || selectedLetter !== null || searchQuery !== '';

  const categories = useMemo(() => {
    const cats = new Set(terms.map(t => t.category).filter(Boolean));
    return ['Todos', 'Favoritos', ...Array.from(cats)];
  }, [terms]);

  const filtered = useMemo(() => {
    let base = searchResults ?? terms;
    
    if (category === 'Favoritos') {
      base = base.filter(t => favorites.includes(t.id));
    } else if (category !== 'Todos') {
      base = base.filter(d => d.category === category);
    }

    if (selectedLetter && !searchQuery) {
      base = base.filter(t => t.term.toUpperCase().startsWith(selectedLetter));
    }

    return base;
  }, [category, terms, searchResults, favorites, selectedLetter, searchQuery]);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const letterStatus = useMemo(() => {
    const status: Record<string, boolean> = {};
    alphabet.forEach(l => {
      status[l] = terms.some(t => t.term.toUpperCase().startsWith(l));
    });
    return status;
  }, [terms, alphabet]);

  const enrichedCount = useMemo(() => terms.filter(t => ENRICHMENTS[t.term]).length, [terms]);

  const renderDefinition = (text: string) => {
    // Basic term linker: find other terms in text and wrap in Links
    const sortedTerms = [...terms].sort((a, b) => b.term.length - a.term.length);
    let parts: (string | JSX.Element)[] = [text];

    sortedTerms.forEach(t => {
      if (t.term.length < 3) return; // Skip short words to avoid over-linking
      const regex = new RegExp(`\\b(${t.term})\\b`, 'gi');
      
      const newParts: (string | JSX.Element)[] = [];
      parts.forEach(part => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }

        const matches = part.split(regex);
        matches.forEach((m, i) => {
          if (i % 2 === 1) {
            newParts.push(
              <Link 
                key={`${t.id}-${i}`} 
                to={AppRoute.GLOSSARY_DETAIL.replace(':term', slugify(t.term))}
                className="text-primary font-bold hover:underline decoration-primary/30"
              >
                {m}
              </Link>
            );
          } else if (m) {
            newParts.push(m);
          }
        });
      });
      parts = newParts;
    });

    return parts;
  };

  const shareTerm = (term: GlossaryTerm) => {
    const url = `${window.location.origin}${AppRoute.GLOSSARY_DETAIL.replace(':term', slugify(term.term))}`;
    if (navigator.share) {
      navigator.share({
        title: `Glossário da Fé: ${term.term}`,
        text: term.definition,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  if (selectedTerm && termSlug) {
    const enrichment = ENRICHMENTS[selectedTerm.term];
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <SEOHead 
          title={`${selectedTerm.term} | Glossário da Fé`} 
          description={selectedTerm.definition} 
          path={AppRoute.GLOSSARY_DETAIL.replace(':term', termSlug)} 
        />
        
        <button 
          onClick={() => navigate(AppRoute.GLOSSARY)}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">Voltar ao Glossário</span>
        </button>

        <div className="premium-card p-0">
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2">
                {selectedTerm.category && (
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${CATEGORY_COLORS[selectedTerm.category] || 'bg-muted text-muted-foreground'}`}>
                    {selectedTerm.category}
                  </span>
                )}
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tight">{selectedTerm.term}</h1>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => shareTerm(selectedTerm)}
                  className="p-3 rounded-2xl bg-muted/50 text-muted-foreground hover:text-primary transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => toggleFavorite(selectedTerm.id)}
                  className={`p-3 rounded-2xl transition-all ${favorites.includes(selectedTerm.id) ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 'bg-muted/50 text-muted-foreground'}`}
                >
                  <Star className={`w-5 h-5 ${favorites.includes(selectedTerm.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">📘 Definição Completa</p>
              <div className="text-lg md:text-xl text-foreground/90 leading-relaxed font-serif whitespace-pre-line">
                {renderDefinition(selectedTerm.definition)}
              </div>
            </div>

            {enrichment && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="bg-primary/5 rounded-3xl p-6 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Reflexão Poética
                  </p>
                  <p className="text-foreground font-serif italic leading-relaxed text-sm">
                    {enrichment.padh}
                  </p>
                </div>

                <div className="bg-accent/10 rounded-3xl p-6 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent-foreground/70 flex items-center gap-2">
                    <HelpCircle className="w-3 h-3" /> Pergunta Interior
                  </p>
                  <p className="text-foreground font-bold text-base leading-snug">
                    {enrichment.question}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4 pt-6 border-t border-border">
              {enrichment?.relatedVerse && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-xl">
                  <Book className="w-4 h-4 text-primary" />
                  <span className="font-serif italic">Referência: {enrichment.relatedVerse}</span>
                </div>
              )}
              {selectedTerm.journey_id && (
                <Button 
                  onClick={() => navigate(`/jornadas/${selectedTerm.journey_id}`)}
                  className="bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest px-6 py-5 rounded-2xl"
                >
                  <Compass className="w-4 h-4 mr-2" /> Iniciar Jornada
                </Button>
              )}
              {enrichment?.relatedRoute && (
                <Button 
                  variant="outline"
                  onClick={() => navigate(enrichment.relatedRoute!)}
                  className="font-black uppercase text-[10px] tracking-widest px-6 py-5 rounded-2xl border-border"
                >
                  <Heart className="w-4 h-4 mr-2" /> {enrichment.relatedLabel || 'Aprofundar'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <SEOHead title="Glossário Teológico" description="Consulte o glossário de termos teológicos e católicos. Definições claras e acessíveis para aprofundar seus estudos." path="/glossary" keywords="glossário teológico, termos católicos, vocabulário religioso, teologia" breadcrumbs={[{ name: "Início", path: "/" }, { name: "Glossário", path: "/glossary" }]} />
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Lexicon Theologicum</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground">📘 Glossário da Fé</h1>
        <p className="text-muted-foreground font-serif italic max-w-xl mx-auto">
          "Nem toda palavra é só significado… algumas são portas."
        </p>
      </div>

      {/* Search */}
      <FuzzySearchInput
        className="max-w-md mx-auto"
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Digite uma palavra ou sentimento…"
        isSearching={isSearchPending}
      />

      {/* Alphabet Bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md py-4 -mx-4 px-4 shadow-sm border-b md:relative md:top-auto md:z-0 md:bg-transparent md:backdrop-blur-none md:py-0 md:mx-0 md:px-0 md:shadow-none md:border-none">
        <div className="space-y-4">
          <p className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em] text-center text-muted-foreground">Índice Alfabético</p>
          <AlphabetBar 
            alphabet={alphabet}
            selectedLetter={selectedLetter}
            letterStatus={letterStatus}
            onLetterClick={(l) => {
              if (l === '') {
                setSelectedLetter(null);
                return;
              }
              const nextLetter = selectedLetter === l ? null : l;
              setSelectedLetter(nextLetter);
              setSearchQuery('');
              if (nextLetter) setCategory('Todos');
            }}
          />
        </div>
      </div>

      {/* Category tabs */}
      {!loading && terms.length > 0 && (
        <div className="flex gap-2 justify-center flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                category === cat ? 'bg-foreground text-background shadow-lg' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}>
              {cat === 'Favoritos' && <Star className={`w-3 h-3 inline mr-1 ${favorites.length > 0 ? 'fill-current' : ''}`} />}
              {cat}
            </button>
          ))}
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-all flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Limpar Filtros
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      {!loading && !searchQuery && (
        <div className="flex justify-center gap-6 text-center">
          <div>
            <p className="text-2xl font-serif font-bold text-foreground">{filtered.length}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Termos</p>
          </div>
          <div>
            <p className="text-2xl font-serif font-bold text-foreground">{new Set(filtered.map(d => d.category)).size}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Categorias</p>
          </div>
          <div>
            <p className="text-2xl font-serif font-bold text-foreground">{enrichedCount}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Com reflexão</p>
          </div>
        </div>
      )}

      {/* Search results as SearchResultCards */}
      {searchQuery.trim().length >= 2 && searchResults && searchResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resultados da busca</p>
          <AnimatePresence mode="popLayout">
          {searchResults.map((term, i) => (
            <SearchResultCard
              key={term.id}
              title={term.term}
              subtitle={term.definition}
              score={term.similarityScore}
              icon={<BookOpen className="w-4 h-4" />}
              onClick={() => navigate(AppRoute.GLOSSARY_DETAIL.replace(':term', slugify(term.term)))}
              index={i}
            />
          ))}
          </AnimatePresence>
        </div>
      )}

      {/* Glossary list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          filtered.map(term => {
            const enrichment = ENRICHMENTS[term.term];
            const isFav = favorites.includes(term.id);

            return (
              <motion.div 
                layout
                key={term.id}
                className="premium-card p-0 h-full flex flex-col group"
              >
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {term.category && (
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${CATEGORY_COLORS[term.category] || 'bg-muted text-muted-foreground'}`}>
                          {term.category}
                        </span>
                      )}
                      {enrichment && (
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
                          <Sparkles className="w-2.5 h-2.5 inline mr-1" />
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(term.id); }}
                      className={`p-1.5 rounded-lg transition-colors ${isFav ? 'text-amber-500 bg-amber-50' : 'text-muted-foreground/40 hover:text-amber-500 hover:bg-muted'}`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{term.term}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mt-1 font-serif leading-relaxed">
                      {term.definition}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 mt-auto">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate(AppRoute.GLOSSARY_DETAIL.replace(':term', slugify(term.term)))}
                    className="w-full justify-between text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary"
                  >
                    Ver detalhes
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 bg-muted/20 rounded-3xl">
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-serif">Nenhum termo encontrado.</p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-black">Tente buscar por outro sentimento ou palavra.</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default GlossaryPage;