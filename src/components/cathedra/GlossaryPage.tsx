import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import { AppRoute } from '@/types';

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  journey_id?: string;
}

/* ── PCH enrichment for featured terms ── */
interface TermEnrichment {
  pch: string;
  question: string;
  relatedVerse?: string;
  relatedRoute?: string;
  relatedLabel?: string;
}

const ENRICHMENTS: Record<string, TermEnrichment> = {
  'Graça': {
    pch: '"Não é algo que você conquista…\né algo que te encontra quando você para de fugir."',
    question: 'Onde você ainda acha que precisa merecer?',
    relatedVerse: 'Ef 2,8',
    relatedRoute: AppRoute.LECTIO_DIVINA,
    relatedLabel: 'Viver essa Palavra',
  },
  'Pecado': {
    pch: '"Nem sempre é erro…\nàs vezes é distância."',
    question: 'Onde você se afastou de si mesmo?',
    relatedVerse: 'Rm 3,23',
    relatedRoute: AppRoute.POENITENTIA,
    relatedLabel: 'Exame de Consciência',
  },
  'Fé': {
    pch: '"Fé não é enxergar…\né continuar mesmo sem mapa."',
    question: 'O que você só vai entender depois de confiar?',
    relatedVerse: 'Hb 11,1',
    relatedRoute: AppRoute.LECTIO_DIVINA,
    relatedLabel: 'Viver essa Palavra',
  },
  'Transubstanciação': {
    pch: '"A aparência permanece…\nmas a essência já é outra.\nAssim como você, quando decide mudar por dentro."',
    question: 'O que em você parece o mesmo, mas já mudou?',
    relatedVerse: 'Lc 22,19',
    relatedRoute: AppRoute.MISSAL,
    relatedLabel: 'Entender a Missa',
  },
  'Escatologia': {
    pch: '"O fim não é destruição…\né o momento em que tudo finalmente faz sentido."',
    question: 'Se hoje fosse o último dia, o que você faria diferente?',
    relatedRoute: AppRoute.CATECHISM,
    relatedLabel: 'Ver no Catecismo',
  },
  'Eclesiologia': {
    pch: '"A Igreja não é o prédio…\né o povo que se encontra para não caminhar sozinho."',
    question: 'Onde você encontra pertencimento?',
    relatedRoute: AppRoute.COMMUNITY,
    relatedLabel: 'Comunidade',
  },
  'Soteriologia': {
    pch: '"Salvação não é fuga…\né voltar pra casa depois de tanto tempo perdido."',
    question: 'De que você precisa ser salvo hoje?',
    relatedVerse: 'Jo 3,16',
    relatedRoute: AppRoute.LECTIO_DIVINA,
    relatedLabel: 'Viver essa Palavra',
  },
  'Mariologia': {
    pch: '"Ela não pediu para ser escolhida…\nmas disse sim quando foi."',
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
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const categories = useMemo(() => {
    const cats = new Set(terms.map(t => t.category).filter(Boolean));
    return ['Todos', ...Array.from(cats)];
  }, [terms]);

  const filtered = useMemo(() => {
    let list = terms;
    if (category !== 'Todos') list = list.filter(d => d.category === category);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d =>
        d.term.toLowerCase().includes(q) ||
        d.definition.toLowerCase().includes(q) ||
        (ENRICHMENTS[d.term]?.pch?.toLowerCase().includes(q)) ||
        (ENRICHMENTS[d.term]?.question?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [category, searchQuery, terms]);

  const enrichedCount = useMemo(() => terms.filter(t => ENRICHMENTS[t.term]).length, [terms]);

  return (
    <>
    <SEOHead title="Glossário Teológico" description="Consulte o glossário de termos teológicos e católicos. Definições claras e acessíveis para aprofundar seus estudos." path="/glossary" keywords="glossário teológico, termos católicos, vocabulário religioso, teologia" breadcrumbs={[{ name: "Início", path: "/" }, { name: "Glossário", path: "/glossary" }]} />
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.BookOpen className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Lexicon Theologicum</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">📘 Palavras que Revelam</h1>
        <p className="text-muted-foreground font-serif italic max-w-xl mx-auto">
          "Nem toda palavra é só significado… algumas são portas."
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto relative">
        <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Digite uma palavra ou sentimento…"
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Category tabs */}
      {!loading && terms.length > 0 && (
        <div className="flex gap-2 justify-center flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                category === cat ? 'bg-foreground text-background shadow-lg' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      {!loading && (
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

      {/* Glossary list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          filtered.map(term => {
            const enrichment = ENRICHMENTS[term.term];
            const isExpanded = expandedId === term.id;

            return (
              <div key={term.id}
                className={`bg-card border rounded-2xl overflow-hidden transition-all ${
                  isExpanded ? 'border-primary/40 shadow-lg' : 'border-border hover:border-primary/30'
                }`}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : term.id)}
                  className="w-full text-left p-6 flex items-start gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {term.category && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${CATEGORY_COLORS[term.category] || 'bg-muted text-muted-foreground'}`}>
                          {term.category}
                        </span>
                      )}
                      {enrichment && (
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
                          <Icons.Sparkles className="w-2.5 h-2.5 inline mr-1" /> Com reflexão
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-foreground">{term.term}</h3>
                    {!isExpanded && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{term.definition}</p>
                    )}
                  </div>
                  <Icons.ArrowDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 space-y-4 border-t border-border pt-4">
                    {/* Layer 1: Simple definition */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">📘 Definição</p>
                      <p className="text-foreground/90 leading-relaxed font-serif">{term.definition}</p>
                    </div>

                    {enrichment && (
                      <>
                        {/* Layer 2: PCH */}
                        <div className="bg-primary/5 rounded-2xl p-5 text-center space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">🧠 Reflexão Poética</p>
                          <p className="text-foreground font-serif italic leading-relaxed whitespace-pre-line text-sm">{enrichment.pch}</p>
                        </div>

                        {/* Layer 3: Inner question */}
                        <div className="bg-accent/30 rounded-2xl p-5 text-center space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-accent-foreground/70">❓ Pergunta Interior</p>
                          <p className="text-foreground font-bold text-base">{enrichment.question}</p>
                        </div>

                        {/* Related verse */}
                        {enrichment.relatedVerse && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icons.Book className="w-4 h-4 text-primary" />
                            <span className="font-serif italic">Referência: {enrichment.relatedVerse}</span>
                          </div>
                        )}

                        {/* CTA */}
                        {enrichment.relatedRoute && (
                          <button
                            onClick={() => navigate(enrichment.relatedRoute!)}
                            className="w-full py-3.5 rounded-2xl bg-foreground text-background font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2 group"
                          >
                            <Icons.Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            {enrichment.relatedLabel || 'Aprofundar'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-muted/20 rounded-2xl">
            <Icons.Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum termo encontrado.</p>
            <p className="text-xs text-muted-foreground mt-1">Tente buscar por outro sentimento ou palavra.</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default GlossaryPage;
