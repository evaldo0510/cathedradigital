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
    <div className="space-y-md">
      <div className="flex items-center gap-xs">
        <div className="relative flex-1">
          <label htmlFor="bible-search-input" className="sr-only">Buscar nos versículos</label>
          <Icons.Search className="absolute left-lg top-2xs/2 -translate-y-1/2 w-md h-md text-primary/10 group-focus-within:text-primary/30 transition-all duration-700" />
          <input
            id="bible-search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Buscar na Palavra..."
            className="w-full pl-2xl pr-md h-2xl rounded-full border border-primary/[0.03] bg-transparent text-foreground text-sm font-serif italic placeholder:text-muted-foreground/20 focus:outline-none focus:bg-primary/[0.01] transition-all duration-700"
            autoFocus
          />
        </div>
        <Button onClick={doSearch} disabled={loading || query.trim().length < 2}
          className="px-lg py-sm rounded-full bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 hover:bg-primary/90 transition-all">
          {loading ? '...' : 'Buscar'}
        </Button>
        <Button onClick={onClose} variant="ghost" className="p-sm rounded-full bg-primary/[0.03] border border-primary/10 hover:bg-primary/5 transition-all" aria-label="Fechar busca">
          <Icons.ArrowDown className="w-md h-md rotate-90 text-primary/60" />
        </Button>
      </div>

      {loading && (
        <div className="space-y-xs py-md">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3xl bg-muted rounded-premium animate-pulse" />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-xl italic">Nenhum versículo encontrado para "{query}".</p>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2xs">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{results.length} resultados</p>
          <div className="space-y-xs max-h-[60vh] overflow-y-auto">
            {results.slice(0, visibleCount).map((r, i) => (
              <Button key={i} onClick={() => goToVerse(r)}
                className="w-full text-left p-md rounded-premium bg-transparent border-none hover:bg-primary/[0.02] active:scale-[0.98] transition-all group h-auto block">
                <div className="flex items-center gap-xs mb-2xs">
                  <span className="text-xs font-black uppercase tracking-widest text-primary">{r.bookAbbrev} {r.chapter},{r.verse}</span>
                  <span className="text-xs text-muted-foreground">— {r.bookName}</span>
                </div>
                <p className="text-sm text-foreground/80 font-serif line-clamp-2">
                  {(() => {
                    const plain = (r.text || '').replace(/<[^>]+>/g, '');
                    if (!query) return plain;
                    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const parts = plain.split(new RegExp(`(${safe})`, 'gi'));
                    return parts.map((part, idx) =>
                      idx % 2 === 1 ? (
                        <mark key={idx} className="bg-primary/20 text-primary font-bold rounded px-3xs">{part}</mark>
                      ) : (
                        <span key={idx}>{part}</span>
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
                className="w-full text-xs font-bold uppercase tracking-widest text-primary/40 hover:text-primary py-lg"
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
