import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRenderPerf } from '@/hooks/useRenderPerf';
import { BIBLE_DATA, BibleBook } from '@/data/bible-books';
import BibleDictionaryPopover from './BibleDictionaryPopover';
import ReadingSettingsPopover from './ReadingSettingsPopover';
import { useAuth } from '@/hooks/useAuth';
import { BibleSkeleton } from './RouteSkeletons';

const Bible: React.FC = () => {
  useRenderPerf('Sacra Biblia Mobile-First', 15);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings } = useReadingSettings();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'home' | 'chapters' | 'reading'>('home');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync with URL
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
      window.scrollTo({ top: 0, behavior: 'instant' });
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
    <div className={cn("relative min-h-screen bg-[#FAF9F6] text-primary/90", settings.immersiveMode && "bg-[#FAF9F6]")}>
      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </Helmet>

      <AnimatePresence mode="wait">
        {viewMode === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-6 pt-10 pb-32 max-w-lg mx-auto"
          >
            {/* Minimal Header */}
            <header className="mb-10 flex flex-col items-center">
              <Icons.BookOpen className="w-8 h-8 text-secondary/40 mb-3" />
              <h1 className="font-display text-2xl tracking-[0.2em] uppercase text-primary/80">Bíblia Sagrada</h1>
            </header>

            {/* Above the Fold Actions */}
            <div className="space-y-4 mb-12">
              <button 
                onClick={() => navigate('/bible?book=Jo&ch=6')}
                className="w-full flex items-center justify-between p-4 bg-white border border-primary/5 rounded-xl shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4">
                  <Icons.Bookmark className="w-5 h-5 text-secondary/60" />
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/30 block mb-0.5">Continuar leitura</span>
                    <span className="font-serif font-bold text-base">João 6</span>
                  </div>
                </div>
                <Icons.ChevronRight className="w-4 h-4 text-primary/10" />
              </button>

              <div className="relative">
                <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                <input 
                  type="text" 
                  placeholder="Buscar livro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-white border border-primary/5 rounded-xl text-sm shadow-sm focus:ring-1 focus:ring-secondary/20 transition-all outline-none"
                />
              </div>

              <button className="w-full flex items-center justify-between p-4 bg-white border border-primary/5 rounded-xl shadow-sm active:scale-[0.98] transition-all">
                <div className="flex items-center gap-4">
                  <Icons.Sun className="w-5 h-5 text-secondary/60" />
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/30 block mb-0.5">Leitura do dia</span>
                    <span className="font-serif font-bold text-base">Mateus 5,1-12</span>
                  </div>
                </div>
                <Icons.ChevronRight className="w-4 h-4 text-primary/10" />
              </button>
            </div>

            {/* Vertical Book List */}
            <div className="space-y-12">
              {Object.entries(filteredBooks).map(([testament, categories]: any) => (
                <section key={testament} className="space-y-6">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-secondary/50 border-b border-primary/5 pb-2">{testament}</h2>
                  
                  {categories.map((cat: any) => (
                    <div key={cat.name} className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary/20 ml-2 mb-2 block">{cat.name}</span>
                      <div className="divide-y divide-primary/[0.03]">
                        {cat.books.map((book: BibleBook) => (
                          <button 
                            key={book.abbr}
                            onClick={() => selectBook(book)}
                            className="w-full h-14 flex items-center justify-between active:bg-primary/[0.02] transition-colors px-2 group"
                          >
                            <span className="font-serif text-lg text-primary/70 group-active:text-primary transition-colors">{book.name}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/20">{book.abbr}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
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
            className="px-6 pt-10 pb-32 max-w-lg mx-auto"
          >
            <button 
              onClick={() => navigate('/bible')}
              className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 active:text-secondary transition-colors"
            >
              <Icons.ChevronLeft className="w-4 h-4" /> Voltar
            </button>

            <header className="mb-12 text-center">
              <h1 className="font-display text-4xl text-primary/80 tracking-tight mb-2">{selectedBook.name}</h1>
              <div className="w-12 h-px bg-secondary/20 mx-auto" />
            </header>

            <div className="divide-y divide-primary/[0.03]">
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
                <button 
                  key={ch}
                  onClick={() => selectChapter(ch)}
                  className="w-full h-16 flex items-center justify-between active:bg-primary/[0.02] transition-all px-2 group"
                >
                  <span className="font-serif text-xl text-primary/70 group-active:text-secondary transition-colors">Capítulo {ch}</span>
                  {selectedBook.chapterTitles?.[ch] && (
                    <span className="text-[11px] font-serif italic text-primary/30 max-w-[150px] truncate text-right">{selectedBook.chapterTitles[ch]}</span>
                  )}
                  <Icons.ChevronRight className="w-4 h-4 text-primary/10 ml-4" />
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
            className="min-h-screen"
          >
            {/* Sticky Reading Header */}
            <header className="sticky top-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-primary/5 px-4 h-14 flex items-center justify-between">
              <button onClick={() => navigate(`/bible?book=${selectedBook.abbr}`)} className="p-2 text-primary/40 active:text-secondary">
                <Icons.ChevronLeft className="w-6 h-6" />
              </button>
              <div className="text-center">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-primary/80">{selectedBook.name} {selectedChapter}</h2>
              </div>
              <ReadingSettingsPopover />
            </header>

            <motion.div 
              className="px-6 py-10 pb-40 max-w-prose mx-auto"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
            >
              {isLoading ? <BibleSkeleton /> : (
                <article className="space-y-12">
                  <header className="flex flex-col items-center mb-16 opacity-30">
                    <Icons.Logo className="w-10 h-10 mb-6" />
                    <h3 className="text-2xl font-display font-light uppercase tracking-[0.4em] italic">{selectedBook.name} {selectedChapter}</h3>
                  </header>

                  <div className="space-y-8">
                    {verses.map(v => (
                      <div key={v.number} className="flex gap-4">
                        <span className="text-[10px] font-serif font-bold text-secondary/30 mt-2 w-5 shrink-0 tabular-nums">{v.number}</span>
                        <p className="flex-1 leading-[1.85] text-[19px] font-serif text-primary/85 tracking-tight">
                          {wrapWithDictionary(v.text)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Vertical Navigation Buttons */}
                  <footer className="pt-20 space-y-4">
                    <Button 
                      onClick={nextChapter}
                      disabled={selectedChapter >= selectedBook.chapters}
                      className="w-full h-16 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all"
                    >
                      Próximo Capítulo
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={prevChapter}
                      disabled={selectedChapter <= 1}
                      className="w-full h-14 text-primary/40 text-[10px] font-black uppercase tracking-widest"
                    >
                      Capítulo Anterior
                    </Button>
                  </footer statistics>
                </article>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Bible;