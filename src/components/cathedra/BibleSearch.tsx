import { Button } from '@/components/ui/button';
import React, { useState, useCallback, useMemo } from 'react';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

interface SearchResult {
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

const RESULTS_PER_PAGE = 10;

const BibleSearch: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [visibleCount, setVisibleCount] = useState(RESULTS_PER_PAGE);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isBibleRoute = useMemo(() => pathname.startsWith('/bible'), [pathname]);

  const doSearch = useCallback(async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    setVisibleCount(RESULTS_PER_PAGE);
    try {
      const { data, error } = await supabase.functions.invoke('bible-search', {
        body: { query: query.trim() },
      });
      if (error) throw error;
      setResults(data?.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadMore = () => setVisibleCount(prev => prev + RESULTS_PER_PAGE);

  const goToVerse = (r: SearchResult) => {
    if (isBibleRoute) {
      navigate(`/bible?book=${r.bookAbbrev}&ch=${r.chapter}&v=${r.verse}`, { replace: true });
    } else {
      navigate(`/bible?book=${r.bookAbbrev}&ch=${r.chapter}&v=${r.verse}`);
    }
    onClose();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <label htmlFor="bible-search-input" className="sr-only">Buscar nos versículos</label>
          <Icons.Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20 group-focus-within:text-primary transition-all duration-700" strokeWidth={1.5} />
          <input
            id="bible-search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Buscar por palavra-chave ou tema..."
            className="w-full pl-14 pr-6 py-4 rounded-[2rem] border border-primary/[0.05] bg-primary/[0.01] text-foreground text-base focus:outline-none focus:ring-1 focus:ring-primary/10 transition-all duration-700 placeholder:text-primary/10 placeholder:italic"
            autoFocus
          />
        </div>
        <Button 
          onClick={doSearch} 
          disabled={loading || query.trim().length < 2}
          className="px-10 py-4 h-14 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.4em] disabled:opacity-20 hover:scale-105 transition-all duration-700 shadow-premium"
        >
          {loading ? '...' : 'Buscar'}
        </Button>
        <Button onClick={onClose} variant="ghost" className="h-14 w-14 rounded-full bg-primary/[0.02] border border-primary/5 hover:bg-primary/5 transition-all" aria-label="Fechar busca">
          <Icons.X className="w-4 h-4 text-primary/40" />
        </Button>
      </div>

      {loading && (
        <div className="space-y-2 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-premium animate-pulse" />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8 italic">Nenhum versículo encontrado para "{query}".</p>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-1">
          <p className="text-premium-tiny font-bold uppercase tracking-widest text-muted-foreground">{results.length} resultados</p>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
            {results.slice(0, visibleCount).map((r, i) => (
              <Button key={i} onClick={() => goToVerse(r)}
                className="w-full text-left p-8 rounded-[2.5rem] bg-card/20 backdrop-blur-sm border border-primary/[0.02] hover:border-primary/10 hover:bg-card hover:shadow-premium-hover transition-all duration-700 group h-auto block relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/60">{r.bookAbbrev} {r.chapter},{r.verse}</span>
                  <div className="w-1 h-1 rounded-full bg-primary/10" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">{r.bookName}</span>
                </div>
                <p className="text-base text-foreground/70 group-hover:text-foreground transition-colors duration-700 font-reader leading-relaxed">
                  {(() => {
                    const plain = (r.text || '').replace(/<[^>]+>/g, '');
                    if (!query) return plain;
                    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const parts = plain.split(new RegExp(`(${safe})`, 'gi'));
                    return parts.map((part, idx) =>
                      idx % 2 === 1 ? (
                        <mark key={idx} className="bg-primary/10 text-primary font-bold rounded-sm px-1 italic">{part}</mark>
                      ) : (
                        <span key={idx} className="opacity-80">{part}</span>
                      )
                    );
                  })()}
                </p>
              </Button>
            ))}
            {visibleCount < results.length && (
              <Button 
                onClick={loadMore}
                variant="ghost" 
                className="w-full text-xs font-bold uppercase tracking-widest text-primary/40 hover:text-primary py-6"
              >
                Carregar mais resultados
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BibleSearch;
