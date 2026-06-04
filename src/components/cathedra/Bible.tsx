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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [testament, setTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Antigo Testamento');
  
  const [showLogosAI, setShowLogosAI] = useState(false);
  const [logosAIInitialQuery, setLogosAIInitialQuery] = useState('');
  const [logosAIContext, setLogosAIContext] = useState('');
  
  const [activeVerseNumber, setActiveVerseNumber] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(settings.audioPlaybackRate || 1.0);
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

    try {
      const { data, error } = await supabase.functions.invoke('bible-text', {
        body: { book: abbr, chapter }
      });

      if (error) throw error;

      if (append) {
        setVerses(prev => [...prev, ...data.verses.map((v: any) => ({ ...v, chapter }))]);
      } else {
        setVerses(data.verses.map((v: any) => ({ ...v, chapter })));
      }
    } catch (error) {
      console.error('Error fetching verses:', error);
      toast.error('Erro ao carregar versículos');
    } finally {
      setIsLoading(false);
      setIsLoadingNext(false);
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
    utterance.rate = playbackRate;
    
    let charCount = 0;
    const verseOffsets = verses.map(v => {
      const start = charCount;
      charCount += v.text.length + 1; // +1 for space
      return { start, end: charCount, number: v.number, chapter: v.chapter };
    });

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        const currentVerse = verseOffsets.find(v => charIndex >= v.start && charIndex < v.end);
        if (currentVerse) {
          setActiveVerseNumber(currentVerse.number);
          
          // Auto-scroll logic
          if (settings.immersiveMode) {
            const element = document.getElementById(`v${currentVerse.number}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }

          // Persistence: Save last read
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
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [verses, isSpeaking, isPaused, lang, playbackRate, updateSettings, settings.immersiveMode, user, selectedBook, saveLastRead]);

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
          subtitle="Verbum Domini"
          title="Bíblia Sagrada"
          icon={Icons.Bible}
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

            <div className="flex justify-center mb-spacing-xl">
              <div className="flex bg-primary/[0.02] p-spacing-2xs rounded-premium-full border border-primary/5">
                {(['Antigo Testamento', 'Novo Testamento'] as const).map(t => (
                  <Button
                    key={t}
                    variant="ghost"
                    onClick={() => setTestament(t)}
                    className={`px-spacing-xl py-spacing-sm h-auto rounded-premium-full text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                      testament === t ? 'bg-background text-primary shadow-premium' : 'text-muted-foreground/30'
                    }`}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-spacing-xl">
              {filteredCategories.map(cat => (
                <div key={cat.name} className="space-y-spacing-md">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30 px-spacing-md">{cat.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-spacing-sm">
                    {cat.books.map(book => (
                      <CathedraCard key={book.abbr} variant="interactive" onClick={() => selectBook(book)}>
                        <div className="p-spacing-md flex items-center justify-between">
                          <div>
                            <span className="text-[7px] font-black tracking-widest text-primary/20">{book.abbr}</span>
                            <h3 className="text-premium-xs font-bold">{book.name}</h3>
                          </div>
                          <Icons.ChevronRight className="w-spacing-sm h-spacing-sm opacity-20" />
                        </div>
                      </CathedraCard>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ContemplativeLayout>
      )}

      {viewMode === 'chapters' && selectedBook && (
        <ContemplativeLayout
          subtitle="Selectio Capitulorum"
          title={selectedBook.name}
          icon={Icons.Bible}
        >
          <div className="w-full space-y-spacing-3xl pb-spacing-4xl">
             <Button variant="ghost" onClick={goBack} className="text-[9px] font-black uppercase tracking-[0.3em]">
               ← Voltar aos Livros
             </Button>
             <div className="grid grid-cols-5 sm:grid-cols-10 gap-spacing-xs">
               {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                 <CathedraCard key={ch} variant="interactive" onClick={() => selectChapter(ch)} className="aspect-square flex items-center justify-center">
                   <span className="text-premium-sm font-display">{ch}</span>
                 </CathedraCard>
               ))}
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
              <div className="flex justify-between items-center mb-spacing-xl border-b border-primary/5 pb-spacing-sm">
                <Button variant="ghost" onClick={goBack} className="text-[9px] font-black uppercase tracking-[0.3em]">
                  ← Sumário
                </Button>
                <div className="flex gap-spacing-md">
                  <span className="text-premium-xs font-serif italic text-primary/20">Capítulo {selectedChapter}</span>
                </div>
              </div>
            )}

            {isLoading ? <BibleSkeleton /> : (
              <div className={cn(
                `font-size-${settings.fontSize} font-family-${settings.fontFamily} reader-text space-y-spacing-lg`,
                settings.immersiveMode && "text-center"
              )}>
                {verses.map((v, i) => (
                  <div 
                    key={`${v.chapter}-${v.number}`} 
                    id={`v${v.number}`} 
                    className={cn(
                      "group relative py-spacing-sm transition-all duration-700 rounded-premium px-spacing-md",
                      activeVerseNumber === v.number && "bg-primary/[0.03] scale-[1.02] shadow-premium-sm",
                      !settings.immersiveMode && "hover:bg-primary/[0.01]"
                    )}
                  >
                    {v.number === 1 && <h3 className="text-premium-xl font-display mb-spacing-lg opacity-20">Capítulo {v.chapter}</h3>}
                    <span className="text-[0.7em] font-serif italic text-primary/20 mr-spacing-md">{v.number}</span>
                    <span className="leading-relaxed">{wrapWithDictionary(v.text)}</span>
                  </div>
                ))}
                
                {isLoadingNext && <div className="py-spacing-xl"><BibleSkeleton /></div>}
                <div ref={observerTarget} className="h-20" />
              </div>
            )}
          </div>
          
          {/* Floating Controls */}
          <div className={cn(
            "fixed bottom-spacing-4xl left-1/2 -translate-x-1/2 z-40 bg-background/20 backdrop-blur-3xl p-spacing-2xs rounded-premium-full border border-primary/5 shadow-premium flex gap-spacing-xs transition-all duration-1000",
            settings.immersiveMode && "opacity-20 hover:opacity-100"
          )}>
            <AudioButton variant="ghost" />
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