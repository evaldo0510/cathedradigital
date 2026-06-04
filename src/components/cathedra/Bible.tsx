import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { useLang } from '@/hooks/useLang';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ContemplativeLayout from './ContemplativeLayout';
import { CathedraCard } from './CathedraCard';
import ReadingMark from './ReadingMark';
import AudioButton from './AudioButton';
import { BibleSkeleton } from './RouteSkeletons';
import { useRenderPerf } from '@/hooks/useRenderPerf';
import { BIBLE_DATA, BibleBook } from '@/data/bible-books';
import BibleDictionaryPopover from './BibleDictionaryPopover';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { useAuth } from '@/hooks/useAuth';


const LogosAI = lazy(() => import('./LogosAI'));

const Bible: React.FC = () => {
  const { t, lang } = useLang();
  useRenderPerf('Sacra Biblia', 15);

  const navigate = useNavigate();
  const location = useLocation();
  const { settings, updateSettings } = useReadingSettings();
  
  const [viewMode, setViewMode] = useState<'books' | 'chapters' | 'reading'>('books');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<any[]>([]);
  const [nextChapterVerses, setNextChapterVerses] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLoadingPreload, setIsLoadingPreload] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [testament, setTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Antigo Testamento');
  
  const [showLogosAI, setShowLogosAI] = useState(false);
  const [logosAIInitialQuery, setLogosAIInitialQuery] = useState('');
  const [logosAIContext, setLogosAIContext] = useState('');
  
  const [activeVerseNumber, setActiveVerseNumber] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(settings.audioPlaybackRate || 1.0);
  const [showTranscript, setShowTranscript] = useState(settings.showAudioTranscriptPanel);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { saveLastRead } = useReadingMarks();
  const { user } = useAuth();

  const observerTarget = useRef(null);
  const versesContainerRef = useRef<HTMLDivElement>(null);


  // Sync with URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookAbbr = params.get('book');
    const ch = params.get('ch');

    if (bookAbbr && ch) {
      let foundBook: BibleBook | null = null;
      for (const t of Object.values(BIBLE_DATA)) {
        for (const cat of t) {
          const b = cat.books.find(b => b.abbr === bookAbbr);
          if (b) {
            foundBook = b;
            break;
          }
        }
        if (foundBook) break;
      }

      if (foundBook) {
        setSelectedBook(foundBook);
        setSelectedChapter(parseInt(ch));
        setViewMode('reading');
        fetchVerses(foundBook.abbr, parseInt(ch));
      }
    } else {
      setViewMode('books');
    }
  }, [location.search]);

  const fetchVerses = async (abbr: string, chapter: number, append = false) => {
    if (append) setIsLoadingNext(true);
    else setIsLoading(true);
    setFetchError(null);

    try {
      // Check if we have preloaded data
      if (append && nextChapterVerses && nextChapterVerses.length > 0 && nextChapterVerses[0].chapter === chapter) {
        setVerses(prev => [...prev, ...nextChapterVerses]);
        setNextChapterVerses(null);
        preloadNextChapter(abbr, chapter + 1);
        return;
      }

      const { data, error } = await supabase.functions.invoke('bible-text', {
        body: { book: abbr, chapter }
      });

      if (error) throw error;

      const newVerses = data.verses.map((v: any) => ({ ...v, chapter }));
      
      if (append) {
        setVerses(prev => [...prev, ...newVerses]);
      } else {
        setVerses(newVerses);
        
        // Auto-scroll to saved verse if loading a chapter
        const memoryKey = `bible:${abbr}:${chapter}`;
        const savedVerse = settings.audioPositionMemory[memoryKey];
        if (savedVerse) {
          setTimeout(() => {
            const el = document.getElementById(`v${savedVerse}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 500);
        }

        // Preload next chapter when loading a new chapter normally
        preloadNextChapter(abbr, chapter + 1);
      }
    } catch (error: any) {
      console.error('Error fetching verses:', error);
      const msg = error.message || 'Erro ao carregar versículos';
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
      setIsLoadingNext(false);
    }
  };

  const preloadNextChapter = async (abbr: string, chapter: number) => {
    if (!selectedBook || chapter > selectedBook.chapters || isLoadingPreload) return;
    
    setIsLoadingPreload(true);
    try {
      const { data, error } = await supabase.functions.invoke('bible-text', {
        body: { book: abbr, chapter }
      });

      if (!error && data?.verses) {
        setNextChapterVerses(data.verses.map((v: any) => ({ ...v, chapter })));
      }
    } catch (error) {
      console.warn('Preload failed:', error);
    } finally {
      setIsLoadingPreload(false);
    }
  };

  const loadNextChapter = useCallback(() => {
    if (!selectedBook || isLoadingNext) return;
    if (selectedChapter < selectedBook.chapters) {
      const nextChapter = selectedChapter + 1;
      setSelectedChapter(nextChapter);
      fetchVerses(selectedBook.abbr, nextChapter, true);
    }
  }, [selectedBook, selectedChapter, isLoadingNext]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && viewMode === 'reading' && !isLoadingNext) {
          loadNextChapter();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [viewMode, isLoadingNext, loadNextChapter]);

  const filteredCategories = useMemo(() => {
    return BIBLE_DATA[testament].map(cat => ({
      ...cat,
      books: cat.books.filter(b => 
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.abbr.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(cat => cat.books.length > 0);
  }, [testament, searchQuery]);

  const selectBook = (book: BibleBook) => {
    setSelectedBook(book);
    setViewMode('chapters');
    window.scrollTo(0, 0);
  };

  const selectChapter = (ch: number) => {
    setSelectedChapter(ch);
    setViewMode('reading');
    window.scrollTo(0, 0);
    navigate(`/bible?book=${selectedBook?.abbr}&ch=${ch}`);
  };

  const goBack = () => {
    if (viewMode === 'reading') setViewMode('chapters');
    else if (viewMode === 'chapters') setViewMode('books');
    window.scrollTo(0, 0);
    navigate('/bible');
  };

  const toggleAudio = useCallback((action?: 'play' | 'pause' | 'stop' | 'forward' | 'backward' | 'rate', value?: number) => {
    if (action === 'stop' || (isSpeaking && !action)) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setActiveVerseNumber(null);
      return;
    }

    if (action === 'pause') {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (action === 'play' && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    if (action === 'rate' && value) {
      setPlaybackRate(value);
      updateSettings({ audioPlaybackRate: value });
      if (isSpeaking) {
        // SpeechSynthesisUtterance rate is set at start. To change it, we need to restart from current position.
        // For now, it will apply to the next play.
      }
      return;
    }

    const textToRead = verses.map(v => v.text).join(' ');
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = lang === 'pt' ? 'pt-BR' : 'en-US';
    utterance.rate = settings.audioPlaybackRate || 1.0;
    
    // Resume from memory if available
    const memoryKey = `bible:${selectedBook?.abbr}:${selectedChapter}`;
    const savedPos = settings.audioPositionMemory[memoryKey] || 0;
    
    let charCount = 0;
    const verseOffsets = verses.map(v => {
      const start = charCount;
      charCount += v.text.length + 1; // +1 for space
      return { start, end: charCount, number: v.number, chapter: v.chapter };
    });

    // Simple heuristic to jump to saved position if we have multiple verses
    // Web Speech API doesn't support jumping directly to a charIndex easily on all browsers
    // but we can try to find the starting verse.
    let startIndex = 0;
    if (savedPos > 0) {
      // Find verse matching saved position (this is rough since we don't store time -> verse map perfectly)
      // but let's assume savedPos is the verse number for now as a more reliable memory
    }

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        const currentVerse = verseOffsets.find(v => charIndex >= v.start && charIndex < v.end);
        if (currentVerse) {
          setActiveVerseNumber(currentVerse.number);
          
          // Auto-scroll logic: Highlight and center the current verse
          const element = document.getElementById(`v${currentVerse.number}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          
          // Persistence: Save last read and audio position
          const memoryKey = `bible:${selectedBook?.abbr}:${selectedChapter}`;
          const currentMemory = settings.audioPositionMemory || {};
          
          updateSettings({
            audioPositionMemory: {
              ...currentMemory,
              [memoryKey]: currentVerse.number // Using verse number as position for reliability
            }
          });

          if (user) {
            saveLastRead({
              content_type: 'bible',
              content_id: selectedBook?.abbr,
              chapter: currentVerse.chapter,
              paragraph: currentVerse.number,
              label: `${selectedBook?.name} ${currentVerse.chapter}:${currentVerse.number}`
            });
          }
        }
      }
    };

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setActiveVerseNumber(null);
      
      // Continuous playback logic
      if (settings.audioContinuous && selectedBook && selectedChapter < selectedBook.chapters) {
        toast.info(`Iniciando capítulo ${selectedChapter + 1}...`);
        setTimeout(() => {
          selectChapter(selectedChapter + 1);
          // Auto-play next chapter after small delay to let state update
          setTimeout(() => toggleAudio('play'), 1000);
        }, 1500);
      }
    };

    utteranceRef.current = utterance;
    
    // Jump to saved verse if it's in the current chapter
    if (savedPos > 0 && savedPos <= verses.length) {
      // In Web Speech API we can't jump to a boundary directly in the speak() call easily,
      // but we can slice the text. However, for simplicity and boundary tracking reliability, 
      // we'll just scroll to it and start. 
      // A better way is to create a new utterance from the text slice.
      const el = document.getElementById(`v${savedPos}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    window.speechSynthesis.speak(utterance);
  }, [verses, isSpeaking, isPaused, lang, playbackRate, updateSettings, settings.audioPositionMemory, settings.audioContinuous, settings.immersiveMode, user, selectedBook, selectedChapter, saveLastRead]);

  useEffect(() => {
    const handleToggleAudio = (e: any) => {
      const { action, value } = e.detail || {};
      toggleAudio(action, value);
    };
    window.addEventListener('toggle-audio', handleToggleAudio);
    return () => {
      window.removeEventListener('toggle-audio', handleToggleAudio);
      window.speechSynthesis.cancel();
    };
  }, [toggleAudio]);


  // Dictionary terms to highlight (example list)
  const dictionaryTerms = ['Deus', 'Jesus', 'Cristo', 'Senhor', 'Espírito', 'Jerusalém', 'Israel', 'Moisés', 'Abrão', 'Abraão', 'Aliança', 'Gracia', 'Graça', 'Pecado', 'Salvação', 'Reino', 'Evangelho'];

  const wrapWithDictionary = (text: string) => {
    const parts = text.split(new RegExp(`(${dictionaryTerms.join('|')})`, 'gi'));
    return parts.map((part, i) => {
      const isTerm = dictionaryTerms.some(term => term.toLowerCase() === part.toLowerCase());
      if (isTerm) {
        return <BibleDictionaryPopover key={i} term={part}>{part}</BibleDictionaryPopover>;
      }
      return part;
    });
  };

  return (
    <div className={cn("relative", settings.immersiveMode && viewMode === 'reading' && "bg-background")}>
      <div className="reveal-header-trigger" />
      
      {viewMode === 'books' && (
        <ContemplativeLayout
          subtitle="Sacra Scriptura"
          title="Bíblia Sagrada"
          icon={Icons.Bible}
          maxW="max-w-spacing-4xl"
        >
          <div className="w-full space-y-spacing-2xl pb-spacing-4xl">
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md py-spacing-sm -mx-spacing-md px-spacing-md mb-spacing-md">
              <div className="relative group">
                <Icons.Search className="absolute left-spacing-lg top-1/2 -translate-y-1/2 w-spacing-md h-spacing-md text-primary/20 group-focus-within:text-primary transition-all duration-700" />
                <input
                  type="text"
                  placeholder="Buscar livro ou abreviação..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-premium pl-spacing-3xl bg-background/50"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-spacing-xl">
              <div className="w-full md:w-1/3 shrink-0">
                <div className="sticky top-24 space-y-spacing-md">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30 px-spacing-md">Testamento</h4>
                  <div className="flex flex-col bg-primary/[0.02] p-spacing-2xs rounded-premium border border-primary/5">
                    {(['Antigo Testamento', 'Novo Testamento'] as const).map(t => (
                      <Button
                        key={t}
                        variant="ghost"
                        onClick={() => setTestament(t)}
                        className={`justify-start px-spacing-xl py-spacing-md h-auto rounded-premium text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                          testament === t ? 'bg-background text-primary shadow-premium' : 'text-muted-foreground/30 hover:bg-primary/[0.02]'
                        }`}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-spacing-2xl">
                {filteredCategories.map(cat => (
                  <div key={cat.name} className="space-y-spacing-lg">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30 px-spacing-md border-b border-primary/5 pb-spacing-xs">{cat.name}</h4>
                    <div className="grid grid-cols-1 gap-px bg-primary/5 rounded-premium overflow-hidden border border-primary/5">
                      {cat.books.map(book => (
                        <button 
                          key={book.abbr} 
                          onClick={() => selectBook(book)}
                          className="group flex items-center justify-between p-spacing-lg bg-background hover:bg-primary/[0.02] transition-colors text-left"
                        >
                          <div className="flex items-baseline gap-spacing-md">
                            <span className="text-[8px] font-black tracking-widest text-primary/20 w-8">{book.abbr}</span>
                            <h3 className="text-premium-sm font-bold group-hover:text-primary transition-colors">{book.name}</h3>
                          </div>
                          <div className="flex items-center gap-spacing-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] font-serif italic text-primary/20">{book.chapters} capítulos</span>
                            <Icons.ChevronRight className="w-spacing-sm h-spacing-sm text-primary/20" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ContemplativeLayout>
      )}

      {viewMode === 'chapters' && selectedBook && (
        <ContemplativeLayout
          subtitle="Sumário do Livro"
          title={selectedBook.name}
          icon={Icons.Bible}
          maxW="max-w-prose"
        >
          <div className="w-full space-y-spacing-2xl pb-spacing-4xl">
            <Button variant="ghost" onClick={goBack} className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 mb-spacing-xl">
              ← Todos os Livros
            </Button>
            
            <div className="space-y-spacing-md">
              <div className="flex items-center justify-between px-spacing-md border-b border-primary/5 pb-spacing-sm">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30">Selecione o Capítulo</h4>
                <span className="text-[9px] font-serif italic text-primary/20">{selectedBook.chapters} capítulos disponíveis</span>
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-px bg-primary/5 rounded-premium overflow-hidden border border-primary/5">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                  <button 
                    key={ch} 
                    onClick={() => selectChapter(ch)} 
                    className="aspect-square flex flex-col items-center justify-center bg-background hover:bg-primary/5 transition-all group"
                  >
                    <span className="text-premium-sm font-display group-hover:scale-110 transition-transform">{ch}</span>
                    <span className="text-[6px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-20 transition-opacity mt-1">Cap.</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ContemplativeLayout>
      )}

      {viewMode === 'reading' && selectedBook && (
        <ContemplativeLayout
          subtitle={selectedBook.name}
          title={`Capítulo ${selectedChapter}`}
          icon={Icons.Bible}
          className={cn(settings.immersiveMode && "max-w-prose")}
        >
          <div className="pb-spacing-4xl">
            {!settings.immersiveMode && (
              <div className="flex justify-between items-center mb-spacing-2xl border-b border-primary/5 pb-spacing-md">
                <Button variant="ghost" onClick={goBack} className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100">
                  ← Sumário
                </Button>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/20">{selectedBook.name}</span>
                  <span className="text-premium-sm font-serif italic text-primary/40">Capítulo {selectedChapter}</span>
                </div>
              </div>
            )}

            {fetchError && (
              <div className="flex flex-col items-center justify-center py-spacing-2xl text-center space-y-spacing-md bg-destructive/5 rounded-premium border border-destructive/10">
                <Icons.AlertCircle className="w-spacing-xl h-spacing-xl text-destructive/50" />
                <div className="space-y-spacing-2xs">
                  <p className="text-premium-sm font-bold text-destructive">Houve um obstáculo no carregamento</p>
                  <p className="text-premium-xs text-muted-foreground italic px-spacing-xl">{fetchError}</p>
                </div>
                <div className="flex gap-spacing-sm">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsLoading(true);
                      setFetchError(null);
                      fetchVerses(selectedBook.abbr, selectedChapter);
                    }}
                    className="rounded-premium-full px-spacing-xl border-destructive/20 hover:bg-destructive/5"
                  >
                    <Icons.RefreshCw className="w-spacing-sm h-spacing-sm mr-spacing-xs" />
                    Reenviar
                  </Button>
                  <Button variant="ghost" onClick={goBack} className="text-[10px] uppercase tracking-widest opacity-50">
                    Voltar
                  </Button>
                </div>
              </div>
            )}

            {isLoading ? <BibleSkeleton /> : !fetchError && (
              <div className={cn(
                `font-size-${settings.fontSize} font-family-${settings.fontFamily} reader-text space-y-px`,
                settings.immersiveMode && "text-center"
              )}>
                {verses.map((v, i) => (
                  <div 
                    key={`${v.chapter}-${v.number}`} 
                    id={`v${v.number}`} 
                    className={cn(
                      "group relative py-spacing-md transition-all duration-700 px-spacing-lg",
                      activeVerseNumber === v.number && "bg-primary/[0.03] shadow-[inset_4px_0_0_0_rgba(var(--primary),0.1)]",
                      !settings.immersiveMode && "hover:bg-primary/[0.01]"
                    )}
                  >
                    {v.number === 1 && (
                      <div className="flex flex-col items-center mb-spacing-3xl pt-spacing-xl">
                        <div className="w-8 h-px bg-primary/10 mb-spacing-md" />
                        <h3 className="text-premium-2xl font-display opacity-30 italic">Capítulo {v.chapter}</h3>
                        <div className="w-8 h-px bg-primary/10 mt-spacing-md" />
                      </div>
                    )}
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/[0.03] text-[9px] font-black text-primary/30 mr-spacing-md align-middle">{v.number}</span>
                    <span className="leading-[1.8] align-middle">{wrapWithDictionary(v.text)}</span>
                  </div>
                ))}
                
                {isLoadingNext && <div className="py-spacing-xl"><BibleSkeleton /></div>}
                <div ref={observerTarget} className="h-20" />
              </div>
            )}
          </div>
          
          {/* Audio Captions & Transcript Overlay */}
          <AnimatePresence>
            {(isSpeaking || isPaused) && activeVerseNumber && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-[120px] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-spacing-md pointer-events-none"
              >
                <div className="bg-background/40 backdrop-blur-3xl p-spacing-md rounded-premium-lg border border-primary/10 shadow-premium text-center pointer-events-auto">
                  <p className={cn(
                    "font-serif italic text-primary leading-relaxed",
                    settings.audioCaptionSize === 'small' ? 'text-premium-xs' : 
                    settings.audioCaptionSize === 'large' ? 'text-premium-xl' : 'text-premium-sm'
                  )}>
                    {verses.find(v => v.number === activeVerseNumber)?.text}
                  </p>
                  <div className="mt-spacing-sm flex justify-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary/30">
                      {selectedBook.name} {selectedChapter}:{activeVerseNumber}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcript Panel */}
          <AnimatePresence>
            {showTranscript && (
              <motion.div
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                className="fixed inset-y-0 right-0 z-[60] w-full sm:w-80 bg-background/95 backdrop-blur-3xl border-l border-primary/10 shadow-premium p-spacing-xl flex flex-col"
              >
                <div className="flex justify-between items-center mb-spacing-xl">
                  <h3 className="font-display text-premium-lg">Transcrição</h3>
                  <div className="flex gap-spacing-xs">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Exportar TXT"
                      onClick={() => {
                        const content = verses.map(v => `${v.number}. ${v.text}`).join('\n');
                        const blob = new Blob([content], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Transcricao_${selectedBook.name}_Cap_${selectedChapter}.txt`;
                        a.click();
                      }}
                    >
                      <Icons.Download className="w-spacing-sm h-spacing-sm" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setShowTranscript(false);
                      updateSettings({ showAudioTranscriptPanel: false });
                    }}>
                      <Icons.X className="w-spacing-md h-spacing-md" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-spacing-md pr-spacing-sm">
                  {verses.map(v => (
                    <div 
                      key={v.number} 
                      className={cn(
                        "p-spacing-sm rounded-premium transition-colors cursor-pointer",
                        activeVerseNumber === v.number ? "bg-primary/5 border border-primary/10" : "hover:bg-primary/[0.02]"
                      )}
                      onClick={() => {
                        const el = document.getElementById(`v${v.number}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                      <span className="text-[9px] font-bold text-primary/30 mr-spacing-sm">{v.number}</span>
                      <p className="text-premium-xs leading-relaxed">{v.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Floating Controls */}
          <div className={cn(
            "fixed bottom-spacing-4xl left-1/2 -translate-x-1/2 z-40 bg-background/20 backdrop-blur-3xl p-spacing-2xs rounded-premium-full border border-primary/5 shadow-premium flex gap-spacing-xs transition-all duration-1000",
            settings.immersiveMode && "opacity-20 hover:opacity-100"
          )}>
            <AudioButton variant="ghost" />
            <Button 
              variant="ghost" 
              onClick={() => {
                const newState = !showTranscript;
                setShowTranscript(newState);
                updateSettings({ showAudioTranscriptPanel: newState });
              }}
              className={showTranscript ? "bg-primary/10" : ""}
              title="Ver Transcrição"
              aria-label="Alternar painel de transcrição"
            >
              <Icons.FileText className={showTranscript ? 'text-primary' : 'text-primary/40'} />
            </Button>
            <Button variant="ghost" onClick={() => setShowLogosAI(!showLogosAI)}>
              <Icons.Sparkles className={showLogosAI ? 'text-primary' : 'text-primary/40'} />
            </Button>
            <ReadingMark contentType="bible" contentId={selectedBook.abbr} label={`${selectedBook.name} ${selectedChapter}`} />
            {settings.immersiveMode && (
              <Button variant="ghost" onClick={() => updateSettings({ immersiveMode: false })}>
                <Icons.Minimize2 className="text-primary/40" />
              </Button>
            )}
          </div>

          <Suspense fallback={null}>
            {showLogosAI && (
              <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md p-spacing-xl flex items-center justify-center">
                 <div className="w-full max-w-2xl bg-card rounded-premium-lg border border-primary/10 shadow-premium p-spacing-xl">
                    <div className="flex justify-between items-center mb-spacing-lg">
                      <h3 className="font-display text-premium-lg">Reflexão Logos</h3>
                      <Button variant="ghost" size="icon" onClick={() => setShowLogosAI(false)}><Icons.X /></Button>
                    </div>
                    <LogosAI 
                      isOpen={showLogosAI} 
                      onClose={() => setShowLogosAI(false)} 
                      context={logosAIContext}
                      initialQuery={logosAIInitialQuery}
                      type="bible"
                    />
                 </div>
              </div>
            )}
          </Suspense>
        </ContemplativeLayout>
      )}
    </div>
  );
};

export default Bible;