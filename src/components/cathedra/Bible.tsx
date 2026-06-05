import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { useLang } from '@/hooks/useLang';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRenderPerf } from '@/hooks/useRenderPerf';
import { isLegitimateClick } from '@/lib/navigation-utils';
import { BIBLE_DATA, BibleBook } from '@/data/bible-books';
import BibleDictionaryPopover from './BibleDictionaryPopover';
import ReadingSettingsPopover from './ReadingSettingsPopover';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { useAuth } from '@/hooks/useAuth';
import { BibleSkeleton } from './RouteSkeletons';

const Bible: React.FC = () => {
  const { lang } = useLang();
  useRenderPerf('Sacra Biblia Mobile', 15);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings } = useReadingSettings();
  const { user } = useAuth();
  const { saveLastRead } = useReadingMarks();

  const [viewMode, setViewMode] = useState<'home' | 'chapters' | 'reading'>('home');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sincronizar com URL para permitir back button funcional
  useEffect(() => {
    const bookAbbr = searchParams.get('book');
    const chapter = searchParams.get('ch');

    if (bookAbbr && chapter) {
      const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
      const book = allBooks.find(b => b.abbr === bookAbbr);
      if (book) {
        setSelectedBook(book);
        setSelectedChapter(parseInt(chapter));
        setViewMode('reading');
        fetchVerses(bookAbbr, parseInt(chapter));
      }
    } else if (bookAbbr) {
      const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
      const book = allBooks.find(b => b.abbr === bookAbbr);
      if (book) {
        setSelectedBook(book);
        setViewMode('chapters');
      }
    } else {
      setViewMode('home');
    }
  }, [searchParams]);

  const fetchVerses = async (abbr: string, chapter: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-text', {
        body: { book: abbr, chapter }
      });
      if (error) throw error;
      setVerses(data.verses.map((v: any) => ({ ...v, chapter })));
    } catch (error: any) {
      toast.error('Erro ao carregar texto sagrado');
    } finally {
      setIsLoading(false);
    }
  };

  const selectBook = (book: BibleBook) => {
    setSelectedBook(book);
    navigate(`/bible?book=${book.abbr}`);
  };

  const selectChapter = (ch: number) => {
    setSelectedChapter(ch);
    navigate(`/bible?book=${selectedBook!.abbr}&ch=${ch}`);
  };

  const nextChapter = useCallback(() => {
    if (!selectedBook) return;
    if (selectedChapter < selectedBook.chapters) {
      selectChapter(selectedChapter + 1);
    }
  }, [selectedBook, selectedChapter]);

  const prevChapter = useCallback(() => {
    if (selectedChapter > 1) {
      selectChapter(selectedChapter - 1);
    }
  }, [selectedChapter]);

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 80;
    if (info.offset.x < -threshold) nextChapter();
    else if (info.offset.x > threshold) prevChapter();
  };

  const dictionaryTerms = ['Deus', 'Jesus', 'Cristo', 'Senhor', 'Espírito', 'Jerusalém', 'Israel', 'Moisés', 'Abraão', 'Aliança', 'Graça', 'Pecado', 'Salvação', 'Reino', 'Evangelho'];

  const wrapWithDictionary = (text: string) => {
    const parts = text.split(new RegExp(`(${dictionaryTerms.join('|')})`, 'gi'));
    return parts.map((part, i) => {
      if (dictionaryTerms.some(term => term.toLowerCase() === part.toLowerCase())) {
        return <BibleDictionaryPopover key={i} term={part}>{part}</BibleDictionaryPopover>;
      }
      return part;
    });
  };

  // Filtragem de livros para pesquisa
  const filteredBooks = useMemo(() => {
    if (!searchQuery) return BIBLE_DATA;
    const result: any = {};
    Object.entries(BIBLE_DATA).forEach(([testament, categories]) => {
      const filteredCategories = categories.map(cat => ({
        ...cat,
        books: cat.books.filter(b => 
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          b.abbr.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.books.length > 0);
      if (filteredCategories.length > 0) result[testament] = filteredCategories;
    });
    return result;
  }, [searchQuery]);

  return (
    <div className={cn("relative min-h-screen bg-background text-primary selection:bg-secondary/20", settings.immersiveMode && "bg-background")}>
      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </Helmet>

      <AnimatePresence mode="wait">
        {viewMode === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-6 pt-12 pb-24 max-w-lg mx-auto"
          >
            {/* Acima da dobra: Pesquisa, Continuar Leitura, Leitura do Dia */}
            <div className="space-y-8 mb-12">
              <header className="text-center space-y-2">
                <h1 className="font-display text-3xl tracking-widest uppercase text-primary/80">Bíblia Sagrada</h1>
                <p className="font-serif italic text-primary/40 text-sm">Sacra Biblia</p>
              </header>

              <div className="relative group">
                <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                <input 
                  type="text" 
                  placeholder="Pesquisar livro ou versículo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-primary/5 border-none rounded-2xl text-sm focus:ring-1 focus:ring-secondary/30 transition-all outline-none"
                />
              </div>

              <div className="space-y-4">
                <button className="w-full p-5 bg-secondary/5 border border-secondary/10 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Icons.Bookmark className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Continuar leitura</span>
                      <h3 className="font-serif font-bold text-lg text-primary/80">João 6,35</h3>
                    </div>
                  </div>
                  <Icons.ChevronRight className="w-5 h-5 text-secondary/30" />
                </button>

                <button className="w-full p-5 bg-primary/5 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icons.Sun className="w-5 h-5 text-primary/40" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">Leitura do dia</span>
                      <h3 className="font-serif font-bold text-lg text-primary/80">Mateus 5,1-12</h3>
                    </div>
                  </div>
                  <Icons.ChevronRight className="w-5 h-5 text-primary/20" />
                </button>
              </div>
            </div>

            {/* Listas Verticais de Livros */}
            <div className="space-y-10">
              {Object.entries(filteredBooks).map(([testament, categories]: any) => (
                <div key={testament} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary/70">{testament}</h2>
                    <div className="h-px flex-1 bg-secondary/10" />
                  </div>
                  
                  {categories.map((cat: any) => (
                    <div key={cat.name} className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary/25 ml-4">{cat.name}</span>
                      <div className="space-y-0.5">
                        {cat.books.map((book: BibleBook) => (
                          <button 
                            key={book.abbr}
                            onClick={() => selectBook(book)}
                            className="w-full h-14 px-4 rounded-xl flex items-center justify-between hover:bg-primary/5 active:bg-primary/5 transition-colors group"
                          >
                            <span className="font-serif text-base text-primary/70 group-hover:text-primary transition-colors">{book.name}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/20 group-hover:text-secondary/60 transition-colors">{book.abbr}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {viewMode === 'chapters' && selectedBook && (
          <motion.div 
            key="chapters"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-6 pt-12 pb-24 max-w-lg mx-auto"
          >
            <button 
              onClick={() => navigate('/bible')}
              className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-secondary transition-colors"
            >
              <Icons.ChevronLeft className="w-4 h-4" /> Voltar para a Bíblia
            </button>

            <header className="mb-12 text-center space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-secondary/40">Selecione o Capítulo</span>
              <h1 className="font-display text-4xl text-primary/80 tracking-tight">{selectedBook.name}</h1>
            </header>

            <div className="space-y-1 border-t border-primary/5 pt-4">
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
                <button 
                  key={ch}
                  onClick={() => selectChapter(ch)}
                  className="w-full h-16 px-6 rounded-2xl flex items-center justify-between hover:bg-primary/5 active:bg-primary/5 transition-all group"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-display text-2xl text-primary/20 group-hover:text-secondary transition-colors">{ch}</span>
                    <span className="font-serif italic text-primary/50 text-sm">
                      {selectedBook.chapterTitles?.[ch] || `Capítulo ${ch}`}
                    </span>
                  </div>
                  <Icons.ChevronRight className="w-5 h-5 text-primary/10 group-hover:text-secondary/40 transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {viewMode === 'reading' && selectedBook && (
          <motion.div 
            key="reading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen"
          >
            {/* Header de Leitura Mobile */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-primary/5 px-6 h-16 flex items-center justify-between">
              <button onClick={() => navigate(`/bible?book=${selectedBook.abbr}`)} className="p-2 -ml-2 text-primary/40">
                <Icons.ChevronLeft className="w-6 h-6" />
              </button>
              <div className="text-center">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/80">{selectedBook.name} {selectedChapter}</h2>
                <p className="text-[8px] font-serif italic text-primary/40">{selectedBook.chapterTitles?.[selectedChapter] || `Capítulo ${selectedChapter}`}</p>
              </div>
              <ReadingSettingsPopover />
            </header>

            <motion.div 
              className="px-6 py-12 pb-32 max-w-prose mx-auto overflow-x-hidden touch-pan-y"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
            >
              {isLoading ? <BibleSkeleton /> : (
                <div className="space-y-10">
                  {/* Título Estilizado no Início do Capítulo */}
                  <div className="flex flex-col items-center mb-16 text-center opacity-40">
                    <Icons.Logo className="w-12 h-12 mb-6" />
                    <span className="text-[8px] font-black uppercase tracking-[0.6em] mb-2 italic">Incipit</span>
                    <h3 className="text-3xl font-display font-light uppercase tracking-[0.3em] italic">{selectedBook.name} {selectedChapter}</h3>
                    <div className="w-12 h-px bg-primary/20 mt-6" />
                  </div>

                  {verses.map(v => (
                    <div key={v.number} className="group relative flex gap-6">
                      <span className="text-[10px] font-serif font-bold text-secondary/30 mt-2 select-none w-6 shrink-0 text-right tabular-nums">{v.number}</span>
                      <p className="flex-1 leading-[1.8] text-[19px] font-serif text-primary/90 tracking-tight text-justify">
                        {wrapWithDictionary(v.text)}
                      </p>
                    </div>
                  ))}

                  {/* Navegação de Rodapé */}
                  <div className="pt-20 flex flex-col items-center gap-8 border-t border-primary/5">
                    <Icons.Wheat className="w-6 h-6 text-secondary/20" />
                    <div className="flex gap-4 w-full">
                      <Button 
                        variant="outline" 
                        disabled={selectedChapter <= 1}
                        onClick={prevChapter}
                        className="flex-1 h-14 rounded-2xl border-primary/5 text-[10px] font-black uppercase tracking-widest"
                      >
                        Capítulo Anterior
                      </Button>
                      <Button 
                        disabled={selectedChapter >= (selectedBook.chapters || 1)}
                        onClick={nextChapter}
                        className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest"
                      >
                        Próximo Capítulo
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Bible;