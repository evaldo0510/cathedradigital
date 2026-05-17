import React, { useState, useCallback } from 'react';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

const BibleSearch: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const doSearch = useCallback(async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
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

  const goToVerse = (r: SearchResult) => {
    navigate(`/bible?book=${r.bookAbbrev}&ch=${r.chapter}`);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Buscar por palavra-chave nos versículos..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoFocus
          />
        </div>
        <button onClick={doSearch} disabled={loading || query.trim().length < 2}
          className="px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-bold disabled:opacity-40 hover:bg-primary hover:text-primary-foreground transition-all">
          {loading ? '...' : 'Buscar'}
        </button>
        <button onClick={onClose} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-all">
          <Icons.ArrowDown className="w-4 h-4 rotate-90 text-foreground" />
        </button>
      </div>

      {loading && (
        <div className="space-y-2 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8 italic">Nenhum versículo encontrado para "{query}".</p>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{results.length} resultados</p>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {results.map((r, i) => (
              <button key={i} onClick={() => goToVerse(r)}
                className="w-full text-left p-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">{r.bookAbbrev} {r.chapter},{r.verse}</span>
                  <span className="text-[9px] text-muted-foreground">— {r.bookName}</span>
                </div>
                <p className="text-sm text-foreground/80 font-serif line-clamp-2"
                  dangerouslySetInnerHTML={{
                    __html: r.text.replace(
                      new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                      '<mark class="bg-primary/20 text-primary font-bold rounded px-0.5">$1</mark>'
                    ),
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BibleSearch;
