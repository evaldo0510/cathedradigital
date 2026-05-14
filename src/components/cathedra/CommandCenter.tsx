import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Compass, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchUnified, BaseContent } from '@/services/conteudoService';
import { useNavigate } from 'react-router-dom';

const CommandCenter: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BaseContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const handleSearch = (val: string, pageNum: number = 0) => {
    setQuery(val);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.length < 3) {
      setResults([]);
      setHasMore(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setPage(pageNum);
      setLoading(true);

      try {
        const { data } = await searchUnified(
          val, 
          undefined, 
          pageNum, 
          10, 
          abortControllerRef.current.signal
        );
        
        if (pageNum === 0) {
          setResults(data);
        } else {
          setResults(prev => [...prev, ...data]);
        }
        
        setHasMore(data.length === 10);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Search failed:', err);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const loadMore = async () => {
    setLoading(true);
    const nextP = page + 1;
    setPage(nextP);
    try {
      const { data } = await searchUnified(query, undefined, nextP, 10);
      setResults(prev => [...prev, ...data]);
      setHasMore(data.length === 10);
    } catch (err) {
      console.error('Load more failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <Input 
          className="pl-12 h-16 text-lg rounded-3xl border-border/50 bg-background/50 backdrop-blur-sm shadow-xl focus-visible:ring-primary/20"
          placeholder="Busque por temas, parágrafos ou versículos..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {loading && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Resultados em Destaque</h3>
          <div className="space-y-3">
            {results.map((res) => (
              <Card 
                key={res.id} 
                className="group hover:border-primary/50 transition-all cursor-pointer overflow-hidden bg-card/40 backdrop-blur-md"
                onClick={() => navigate(res.route)}
              >
                <CardContent className="p-4 flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    {res.type === 'catechism' ? <BookOpen className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">{res.type}</span>
                      <div className="flex gap-1">
                        {res.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[9px] h-4">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <h4 className="text-base font-serif font-bold truncate">{res.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">{res.summary || res.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {hasMore && results.length > 0 && !loading && (
              <Button 
                variant="ghost" 
                className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100"
                onClick={loadMore}
              >
                Carregar mais resultados
              </Button>
            )}
            {query.length >= 3 && results.length === 0 && !loading && (
              <div className="p-12 text-center border border-dashed rounded-3xl opacity-50">
                <p className="text-sm">Nenhum resultado encontrado para "{query}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tags Globais</h3>
            <div className="flex flex-wrap gap-2">
              {['Eucaristia', 'Confissão', 'Oração', 'Dogma', 'Graça', 'Santos'].map(tag => (
                <button key={tag} className="px-3 py-1.5 rounded-xl bg-muted/50 text-xs font-medium hover:bg-primary hover:text-white transition-all">
                  #{tag}
                </button>
              ))}
            </div>
          </section>

          <Card className="bg-primary/5 border-primary/10 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-serif flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary" /> Trilhas de Estudo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Navegue por coleções curadas de conteúdo organizadas por temas fundamentais da fé.
              </p>
              <Button size="sm" variant="outline" className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary">
                Ver Todas as Trilhas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;