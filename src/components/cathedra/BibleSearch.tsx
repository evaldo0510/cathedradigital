import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SearchResult {
  bookId: number;
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

interface BibleSearchProps {
  onSelectResult: (bookAbbrev: string, chapter: number, verse: number) => void;
  onClose: () => void;
}

const BibleSearch: React.FC<BibleSearchProps> = ({ onSelectResult, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-search', {
        body: { query }
      });
      if (error) throw error;
      setResults(data.results || []);
      if (data.results?.length === 0) {
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
            placeholder="Buscar nas Escrituras..."
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                      {result.bookName} {result.chapter}:{result.verse}
                    </span>
                    <div className="flex-1 h-px bg-primary/5" />
                  </div>
                  <p className="font-serif text-[17px] leading-relaxed text-primary/70 group-active:text-primary transition-colors line-clamp-3">
                    {result.text}
                  </p>
                </motion.button>
              ))}
            </div>
          ) : !isLoading && query.length >= 2 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
              <Icons.Search className="w-12 h-12" />
              <p className="text-sm font-black uppercase tracking-widest italic">Pressione enter para buscar</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BibleSearch;
