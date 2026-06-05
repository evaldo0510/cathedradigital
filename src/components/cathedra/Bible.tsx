import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { useNotes } from '@/hooks/useNotes';
import { NoteEditModal } from './NoteEditModal';
import BibleSearch from './BibleSearch';
import BibleFullNotesList from './BibleFullNotesList';
import { MonthlyRecap } from './MonthlyRecap';
import { HighlightMenu } from './HighlightMenu';


// Helper for Daily Reading
const getDailyReading = () => {
  const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
  const date = new Date();
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Pick a book and chapter deterministically
  const bookIndex = dayOfYear % allBooks.length;
  const book = allBooks[bookIndex];
  const chapter = (dayOfYear % book.chapters) + 1;
  
  return { book, chapter };
};


const Bible: React.FC = () => {
  useRenderPerf('Sacra Biblia Mobile-First', 15);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings } = useReadingSettings();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'home' | 'chapters' | 'reading' | 'search' | 'notes' | 'monthly_recap'>('home');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New States for Annotations and Progress
  const [lastRead, setLastRead] = useState<any>(null);
  const [dailyReading, setDailyReading] = useState(getDailyReading());
  const [isDailyCompleted, setIsDailyCompleted] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [activeVerse, setActiveVerse] = useState<{ number: number; text: string } | null>(null);
  
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  
  const { notes, addNote, deleteNote, updateNote } = useNotes('bible');
  const scrollContainerRef = useRef<HTMLDivElement>(null);



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

  // Local Persistence Logic
  useEffect(() => {
    const savedLastRead = localStorage.getItem('cathedra_bible_last_read');
    if (savedLastRead) setLastRead(JSON.parse(savedLastRead));

    const today = new Date().toISOString().split('T')[0];
    const dailyStatus = localStorage.getItem(`cathedra_bible_daily_${today}`);
    if (dailyStatus === 'completed') setIsDailyCompleted(true);
    const savedHighlights = localStorage.getItem('cathedra_bible_highlights');
    if (savedHighlights) setHighlights(JSON.parse(savedHighlights));
  }, []);


  const saveReadingProgress = useCallback((bookAbbr: string, chapter: number, verse?: number) => {
    const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
    const book = allBooks.find(b => b.abbr === bookAbbr);
    if (!book) return;

    const progress = { 
      bookName: book.name, 
      bookAbbr: book.abbr, 
      chapter,
      verse: verse || 1
    };
    setLastRead(progress);
    localStorage.setItem('cathedra_bible_last_read', JSON.stringify(progress));
  }, []);


  const markDailyAsCompleted = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`cathedra_bible_daily_${today}`, 'completed');
    setIsDailyCompleted(true);
    toast.success('Leitura do dia concluída!');
  };

  const [isHighlightMenuOpen, setIsHighlightMenuOpen] = useState(false);

  const handleOpenAnnotation = (verse: { number: number; text: string }) => {
    setActiveVerse(verse);
    setIsNoteModalOpen(true);
  };


  const handleSaveNote = async (text: string, color: string) => {
    if (!activeVerse || !selectedBook) return;
    
    await addNote('bible', text, color, {
      book_abbr: selectedBook.abbr,
      chapter: selectedChapter,
      verse: activeVerse.number
    });
    
    setIsNoteModalOpen(false);
    toast.success('Reflexão guardada');
  };

  const toggleHighlight = (verseNumber: number, color: string) => {
    if (!selectedBook) return;
    const key = `${selectedBook.abbr}-${selectedChapter}-${verseNumber}`;
    const newHighlights = { ...highlights };
    
    if (newHighlights[key] === color) {
      delete newHighlights[key];
    } else {
      newHighlights[key] = color;
    }
    
    setHighlights(newHighlights);
    localStorage.setItem('cathedra_bible_highlights', JSON.stringify(newHighlights));
  };


  const handleExportData = () => {
    const data = {
      notes,
      highlights,
      lastRead,
      dailyStatus: {} as any
    };
    
    // Get all daily reading keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cathedra_bible_daily_')) {
        data.dailyStatus[key] = localStorage.getItem(key);
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cathedra-bible-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.highlights) {
          setHighlights(data.highlights);
          localStorage.setItem('cathedra_bible_highlights', JSON.stringify(data.highlights));
        }
        if (data.lastRead) {
          setLastRead(data.lastRead);
          localStorage.setItem('cathedra_bible_last_read', JSON.stringify(data.lastRead));
        }
        if (data.dailyStatus) {
          Object.entries(data.dailyStatus).forEach(([key, value]) => {
            localStorage.setItem(key, value as string);
          });
        }
        toast.success('Dados importados com sucesso');
      } catch (err) {
        toast.error('Erro ao importar arquivo');
      }
    };
    reader.readAsText(file);
  };

  const fetchVerses = async (abbr: string, chapter: number) => {

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-text', {
        body: { book: abbr, chapter }
      });
      if (error) throw error;
      setVerses(data.verses.map((v: any) => ({ ...v, chapter })));
      
      // Save progress automatically
      const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
      const book = allBooks.find(b => b.abbr === abbr);
      if (book) saveReadingProgress(book.abbr, chapter);
      
      // Scroll to verse if specified
      const verse = searchParams.get('v');
      if (verse) {
        setTimeout(() => {
          const element = document.getElementById(`verse-${verse}`);
          if (element) {
            // Calculate offset for sticky header
            const headerHeight = 56; // 14 * 4
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerHeight - 20;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });

            element.classList.add('bg-secondary/20', 'scale-[1.02]');
            setTimeout(() => element.classList.remove('bg-secondary/20', 'scale-[1.02]'), 3000);
          }
        }, 300);
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }


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
  
  // Mock data for cross references
  const CROSS_REFERENCES: Record<string, string[]> = {
    'Jo-1-1': ['Gn-1-1', '1Jo-1-1'],
    'Jo-3-16': ['Rm-5-8', '1Jo-4-9'],
    'Gn-1-1': ['Jo-1-1', 'Hb-11-3'],
    'Mt-5-3': ['Lc-6-20'],
  };

  const wrapWithDictionary = (text: string) => {
    // Priority: Cross references, then Dictionary
    const refKey = selectedBook && `${selectedBook.abbr}-${selectedChapter}`;
    
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
    <div className={cn(
      "relative min-h-screen transition-colors duration-1000 text-primary/90", 
      settings.theme === 'night' ? "bg-[#0A0B0D]" : "bg-[#FAF9F6]",
      settings.immersiveMode && (settings.theme === 'night' ? "bg-[#0A0B0D]" : "bg-[#FAF9F6]")
    )}>

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
            className={cn(
              "px-6 pt-10 pb-32 max-w-lg mx-auto transition-colors duration-1000",
              settings.theme === 'night' && "bg-[#0D0E10] text-stone-400"
            )}

          >
            {/* Minimal Header */}
            <header className="mb-10 flex items-center justify-between">
              <div className="w-10" /> {/* Spacer */}
              <div className="flex flex-col items-center">
                <Icons.BookOpen className="w-8 h-8 text-secondary/40 mb-3" />
                <h1 className="font-display text-2xl tracking-[0.2em] uppercase text-primary/80">Bíblia Sagrada</h1>
              </div>
              <button 
                onClick={() => setViewMode('notes')}
                className="p-2 text-secondary/60 active:scale-95 transition-transform"
              >
                <Icons.List className="w-6 h-6" />
              </button>
            </header>

            {/* Above the Fold Actions */}
            <div className="space-y-4 mb-12">
              <button 
                onClick={() => lastRead ? navigate(`/bible?book=${lastRead.bookAbbr}&ch=${lastRead.chapter}${lastRead.verse ? `&v=${lastRead.verse}` : ''}`) : navigate('/bible?book=Jo&ch=1')}
                className="w-full flex items-center justify-between p-4 bg-white border border-primary/5 rounded-xl shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4">
                  <Icons.Bookmark className={cn("w-5 h-5", lastRead ? "text-secondary" : "text-secondary/60")} />
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/30 block mb-0.5">Continuar leitura</span>
                    <span className="font-serif font-bold text-base">
                      {lastRead ? `${lastRead.bookName} ${lastRead.chapter}` : 'João 1'}
                    </span>
                  </div>
                </div>
                <Icons.ChevronRight className="w-4 h-4 text-primary/10" />
              </button>

              <div className="relative">
                <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                <input 
                  type="text" 
                  placeholder="Buscar nas Escrituras..."
                  readOnly
                  onClick={() => setViewMode('search')}
                  className="w-full h-14 pl-12 pr-4 bg-white border border-primary/5 rounded-xl text-sm shadow-sm focus:ring-1 focus:ring-secondary/20 transition-all outline-none cursor-pointer"
                />
              </div>

              <div className="relative group">
                <button 
                  onClick={() => navigate(`/bible?book=${dailyReading.book.abbr}&ch=${dailyReading.chapter}`)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-primary/5 rounded-xl shadow-sm active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Icons.Sun className={cn("w-5 h-5", isDailyCompleted ? "text-green-500" : "text-secondary/60")} />
                    <div className="text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary/30 block mb-0.5">Leitura do dia</span>
                      <span className="font-serif font-bold text-base">{dailyReading.book.name} {dailyReading.chapter}</span>
                    </div>
                  </div>
                  {isDailyCompleted ? (
                    <Icons.CheckCircle className="w-5 h-5 text-green-500/50" />
                  ) : (
                    <Icons.ChevronRight className="w-4 h-4 text-primary/10" />
                  )}
                </button>
                
                {!isDailyCompleted && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      markDailyAsCompleted();
                    }}
                    className="absolute -top-2 -right-2 bg-secondary text-white text-[8px] font-black uppercase px-2 py-1 rounded-full shadow-lg"
                  >
                    Concluir
                  </button>
                )}
              </div>

              <button 
                onClick={() => setViewMode('monthly_recap')}
                className="w-full flex items-center justify-center p-3 text-[10px] font-black uppercase tracking-widest text-primary/30 hover:text-secondary transition-colors"
              >
                <Icons.Calendar className="w-3 h-3 mr-2" />
                Recapitular Leituras do Mês
              </button>
            </div>

            <div className="flex gap-4 mb-12">
              <button 
                onClick={handleExportData}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-white border border-primary/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-primary/40"
              >
                <Icons.Download className="w-3 h-3" /> Exportar
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-white border border-primary/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-primary/40 cursor-pointer">
                <Icons.Upload className="w-3 h-3" /> Importar
                <input type="file" className="hidden" accept=".json" onChange={handleImportData} />
              </label>
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
                    {verses.map(v => {
                      const hasNote = notes.some(n => 
                        n.book_abbr === selectedBook.abbr && 
                        n.chapter === selectedChapter && 
                        n.verse === v.number
                      );
                      
                      return (
                        <div 
                          key={v.number} 
                          id={`verse-${v.number}`} 
                          onClick={() => {
                            saveReadingProgress(selectedBook.abbr, selectedChapter, v.number);
                            setActiveVerse(v);
                            setIsHighlightMenuOpen(true);
                          }}
                          className={cn(
                            "flex gap-4 group relative transition-all duration-700 cursor-pointer active:bg-primary/[0.05] p-2 -mx-2 rounded-lg",
                            highlights[`${selectedBook.abbr}-${selectedChapter}-${v.number}`] === 'yellow' && "bg-yellow-200/40",
                            highlights[`${selectedBook.abbr}-${selectedChapter}-${v.number}`] === 'green' && "bg-green-200/40",
                            highlights[`${selectedBook.abbr}-${selectedChapter}-${v.number}`] === 'blue' && "bg-blue-200/40",
                            highlights[`${selectedBook.abbr}-${selectedChapter}-${v.number}`] === 'red' && "bg-red-200/40"
                          )}
                        >

                          <div className="flex flex-col items-center gap-2 mt-2 w-5 shrink-0">
                            <span className="text-[10px] font-serif font-bold text-secondary/30 tabular-nums">{v.number}</span>
                            {hasNote && (
                              <div className="w-1.5 h-1.5 rounded-full bg-secondary/40 shadow-sm" title="Possui anotação" />
                            )}
                          </div>
                          
                          <p className="flex-1 leading-[1.85] text-[19px] font-serif text-primary/85 tracking-tight relative">
                            {wrapWithDictionary(v.text)}
                            
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAnnotation(v);
                              }}
                              className="absolute -right-8 top-1 p-2 text-primary/10 hover:text-secondary opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Icons.PenLine className="w-3.5 h-3.5" />
                            </button>
                          </p>
                        </div>

                      );
                    })}


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
                  </footer>
                </article>
              )}
            </motion.div>
          </motion.div>
        )}
        {viewMode === 'search' && (
          <BibleSearch 
            onClose={() => setViewMode('home')} 
            onSelectResult={(book, chapter, verse) => {
              navigate(`/bible?book=${book}&ch=${chapter}&v=${verse}`);
              setViewMode('reading');
            }} 
          />
        )}

        {viewMode === 'notes' && (
          <BibleFullNotesList 
            onClose={() => setViewMode('home')}
            onSelectReference={(book, chapter, verse) => {
              navigate(`/bible?book=${book}&ch=${chapter}&v=${verse}`);
              setViewMode('reading');
            }}
            onEditNote={async (noteId, text, color) => {
              await updateNote(noteId, text, color);
              toast.success('Anotação atualizada');
            }}
            onDeleteNote={async (noteId) => {
              await deleteNote(noteId);
              toast.success('Anotação removida');
            }}
          />
        )}

        {viewMode === 'monthly_recap' && (
          <MonthlyRecap 
            onClose={() => setViewMode('home')}
            onSelectDate={(bookAbbr, chapter) => {
              navigate(`/bible?book=${bookAbbr}&ch=${chapter}`);
              setViewMode('reading');
            }}
          />
        )}
      </AnimatePresence>

      <NoteEditModal 
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        title={`${selectedBook?.name} ${selectedChapter}:${activeVerse?.number}`}
      />

      <HighlightMenu
        isOpen={isHighlightMenuOpen}
        onClose={() => setIsHighlightMenuOpen(false)}
        onSelectColor={(color) => {
          if (activeVerse) {
            toggleHighlight(activeVerse.number, color);
            setIsHighlightMenuOpen(false);
          }
        }}
        onAddNote={() => {
          setIsHighlightMenuOpen(false);
          setIsNoteModalOpen(true);
        }}
      />


    </div>
  );
};

export default Bible;