import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
}

const GlossaryPage: React.FC = () => {
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
        d.definition.toLowerCase().includes(q)
      );
    }
    return list;
  }, [category, searchQuery, terms]);

  const CATEGORY_COLORS: Record<string, string> = {
    'Eucaristia': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'Teologia Sistemática': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    'Igreja': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    'Sacramentos': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'Teologia da Graça': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.BookOpen className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Lexicon Theologicum</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Glossário de Termos Teológicos</h1>
        <p className="text-muted-foreground font-serif italic max-w-xl mx-auto">
          Definições precisas dos principais conceitos e termos da sagrada teologia católica.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto relative">
        <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar termo ou definição..."
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
        </div>
      )}

      {/* Glossary list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          filtered.map(term => (
            <div key={term.id}
              className="bg-card border border-border rounded-2xl overflow-hidden transition-all hover:border-primary/30">
              <button
                onClick={() => setExpandedId(expandedId === term.id ? null : term.id)}
                className="w-full text-left p-6 flex items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {term.category && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${CATEGORY_COLORS[term.category] || 'bg-muted text-muted-foreground'}`}>
                        {term.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-foreground">{term.term}</h3>
                  {expandedId !== term.id && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{term.definition}</p>
                  )}
                </div>
                <Icons.ArrowDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expandedId === term.id ? 'rotate-180' : ''}`} />
              </button>
              {expandedId === term.id && (
                <div className="px-6 pb-6 pt-4 border-t border-border">
                  <p className="text-foreground/90 leading-relaxed font-serif">{term.definition}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-muted/20 rounded-2xl">
            <p className="text-muted-foreground">Nenhum termo encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlossaryPage;