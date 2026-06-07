import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';


import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SearchResult {
  bookId: number;
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  score?: number;
  relevance?: string;
  isBible?: boolean; // True for Bible results, false for Magisterium/Catechism
}


interface BibleSearchProps {
  onSelectResult: (bookAbbrev: string, chapter: number, verse: number) => void;
  onClose: () => void;
  initialTheme?: string | null;
}


const BibleSearch: React.FC<BibleSearchProps> = ({ onSelectResult, onClose, initialTheme }) => {
  const [query, setQuery] = useState(initialTheme || '');

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);


  useEffect(() => {
    if (initialTheme) {
      const mockEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSearch(mockEvent);
    }
  }, []);


  const handleSearch = async (e: React.FormEvent) => {


    e.preventDefault();
    if (query.trim().length < 2) return;

    setIsLoading(true);
    try {
      // Mock logic for "Theological Themes" with Relevance Score and Reason (Phase 3)
      const theologicalThemes: Record<string, { reason: string, score: number }> = {
        'eucaristia': { reason: 'Centralidade no discurso do Pão da Vida (Jo 6)', score: 98 },
        'criação': { reason: 'Fundamento ontológico nas Escrituras (Gn 1)', score: 95 },
        'trindade': { reason: 'Revelação progressiva da natureza divina', score: 92 },
        'graça': { reason: 'Doutrina da salvação paulina (Rm 5)', score: 88 }
      };
      
      const queryLower = query.toLowerCase();
      let matchedTheme = null;
      
      Object.keys(theologicalThemes).forEach(theme => {
        if (queryLower.includes(theme)) matchedTheme = { name: theme, ...theologicalThemes[theme] };
      });

      if (matchedTheme) {
        toast.success(`Tema Detectado: ${matchedTheme.name} (Score: ${matchedTheme.score})`);
      }

      const { data, error } = await supabase.functions.invoke('bible-search', {
        body: { query }
      });
      if (error) throw error;
      
      // Fetch advanced results from Magisterium/Catechism for unified search
      const { data: spiritualData } = await supabase
        .from('spiritual_contents')
        .select('*')
        .or(`content_text.ilike.%${query}%,title.ilike.%${query}%`)
        .limit(5);

      const spiritualResults = (spiritualData || []).map(s => {
        const metadata = s.metadata as any;
        return {
          bookAbbrev: s.type === 'bible' ? (metadata?.book_abbr || 'Bíb') : (s.type === 'catechism' ? 'CIC' : 'Mag'),
          bookName: s.title,
          chapter: metadata?.chapter || 0,
          verse: metadata?.verse || 0,
          text: s.content_text,
          score: 90,
          relevance: 'Conteúdo da Tradição',
          isBible: s.type === 'bible'
        };
      });

      // Combine and Sort by Relevance Score
      let combinedResults = [
        ...(data.results || []).map((r: any) => ({ ...r, isBible: true })),
        ...spiritualResults
      ];

          combinedResults = combinedResults.map((r: any) => ({
          ...r,
          relevance: r.relevance || matchedTheme.reason,
          score: r.score || (Math.floor(Math.random() * 20) + 70)
        }));
      
      const sortedResults = combinedResults.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
      
      setResults(sortedResults);
      if (sortedResults.length === 0) {
        toast.info('Nenhum resultado encontrado');
      }
    } catch (error: any) {
      toast.error('Erro na busca sagrada');
    } finally {
      setIsLoading(false);
    }
  };




  return (
    <div className="fixed inset-0 z-[100] bg-[#FAF9F6] flex flex-col">
      <header className="px-6 h-16 flex items-center gap-4 border-b border-primary/5">
        <button onClick={onClose} className="p-2 -ml-2 text-primary/40 active:text-secondary">
          <Icons.X className="w-6 h-6" />
        </button>
        <form onSubmit={handleSearch} className="flex-1">
          <input 
            autoFocus
            type="text" 
            placeholder="Pesquisar nas Escrituras..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-10 bg-transparent text-lg font-serif outline-none placeholder:text-primary/20"
          />
        </form>
        {isLoading && <Icons.Loader className="w-4 h-4 text-secondary animate-spin" />}
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
        <AnimatePresence mode="popLayout">
          {results.length > 0 ? (
            <div className="space-y-8">
              {results.map((result, idx) => (
                <motion.button
                  key={`${result.bookAbbrev}-${result.chapter}-${result.verse}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    setSelectedIndex(idx);
                    onSelectResult(result.bookAbbrev, result.chapter, result.verse);
                  }}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all space-y-2 group",
                    selectedIndex === idx ? "bg-white border-secondary shadow-sm ring-1 ring-secondary/20" : "bg-transparent border-primary/5 hover:border-primary/10"
                  )}
                >

                  <div className="flex items-center gap-2">
                    {/* Garantindo que o nome do livro seja exibido no vernáculo correto */}
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                      {result.bookName.replace('Tobit', 'Tobias').replace('Judith', 'Judite').replace('Wisdom', 'Sabedoria').replace('Sirach', 'Eclesiástico').replace('Baruch', 'Baruc')} {result.chapter}:{result.verse}
                    </span>
                    <div className="flex-1 h-px bg-primary/5" />
                    {result.score && (
                      <span className="text-[8px] font-black text-secondary px-1.5 py-0.5 bg-secondary/5 rounded-md border border-secondary/10">
                        {result.score}%
                      </span>
                    )}
                  </div>
                  {result.relevance && (
                    <p className="text-[10px] font-medium italic text-secondary/70">
                      Contexto: {result.relevance}
                    </p>
                  )}
                  <p className="font-serif text-[17px] leading-relaxed text-primary/70 group-active:text-primary transition-colors line-clamp-3">

                    {result.text}
                  </p>
                </motion.button>
              ))}
            </div>
          ) : !isLoading && query.length >= 2 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
              <Icons.Search className="w-12 h-12" />
              <p className="text-sm font-black uppercase tracking-widest italic">Pressione Enter para pesquisar</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BibleSearch;
