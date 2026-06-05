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
import ReadingSettingsPopover from './ReadingSettingsPopover';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { useAuth } from '@/hooks/useAuth';


const LogosAI = lazy(() => import('./LogosAI'));

const Bible: React.FC = () => {
  const { t, lang } = useLang();
  useRenderPerf('Sacra Biblia', 15);

  const navigate = useNavigate();
  const location = useLocation();
  const { settings, updateSettings } = useReadingSettings();
  
  const [viewMode, setViewMode] = useState<'home' | 'books' | 'chapters' | 'reading' | 'favorites'>('home');

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

  const [favorites, setFavorites] = useState<any[]>([]);
  const [verseNotes, setVerseNotes] = useState<any[]>([]);
  const [editingNote, setEditingNote] = useState<{ verse: number, text: string } | null>(null);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [noteSearchVisible, setNoteSearchVisible] = useState(false);
  const [favoriteSearchQuery, setFavoriteSearchQuery] = useState('');
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);



  const observerTarget = useRef(null);
  const versesContainerRef = useRef<HTMLDivElement>(null);

  const fetchFavorites = async () => {
    if (!user) return;
    setIsFavoritesLoading(true);
    try {
      const { data, error } = await supabase
        .from('bible_favorites')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFavorites(data || []);
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsFavoritesLoading(false);
    }
  };

  const fetchVerseNotes = async () => {
    if (!user || !selectedBook) return;
    try {
      const { data, error } = await supabase
        .from('user_notes')
        .select('*')
        .match({ 
          user_id: user.id, 
          book_abbr: selectedBook.abbr, 
          chapter: selectedChapter 
        });
      if (error) throw error;
      setVerseNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  useEffect(() => {
    if (user && viewMode === 'favorites') {
      fetchFavorites();
    }
    if (user && viewMode === 'reading' && selectedBook) {
      fetchVerseNotes();
    }
  }, [user, viewMode, selectedBook, selectedChapter]);


  const toggleFavorite = async (verse: any) => {
    if (!user) {
      toast.error('Faça login para favoritar versículos');
      return;
    }

    const isFav = favorites.some(f => 
      f.book_abbr === selectedBook?.abbr && 
      f.chapter === selectedChapter && 
      f.verse_number === verse.number
    );

    try {
      if (isFav) {
        const { error } = await supabase
          .from('bible_favorites')
          .delete()
          .match({ 
            user_id: user.id, 
            book_abbr: selectedBook?.abbr, 
            chapter: selectedChapter, 
            verse_number: verse.number 
          });
        if (error) throw error;
        setFavorites(prev => prev.filter(f => 
          !(f.book_abbr === selectedBook?.abbr && f.chapter === selectedChapter && f.verse_number === verse.number)
        ));
        toast.success('Removido dos favoritos');
      } else {
        const { error } = await supabase
          .from('bible_favorites')
          .insert({
            user_id: user.id,
            book_abbr: selectedBook?.abbr,
            chapter: selectedChapter,
            verse_number: verse.number,
            content: verse.text
          });
        if (error) throw error;
        fetchFavorites();
        toast.success('Adicionado aos favoritos');
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error('Erro ao processar favorito');
    }
  };

  const saveNote = async (verseNumber: number, text: string) => {
    if (!user || !selectedBook) return;
    try {
      const existing = verseNotes.find(n => n.verse === verseNumber);
      if (existing) {
        const { error } = await supabase
          .from('user_notes')
          .update({ note_text: text, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_notes')
          .insert({
            user_id: user.id,
            book_abbr: selectedBook.abbr,
            chapter: selectedChapter,
            verse: verseNumber,
            note_text: text,
            content_type: 'bible',
            content_id: selectedBook.abbr
          });
        if (error) throw error;
      }
      fetchVerseNotes();
      setEditingNote(null);
      toast.success('Nota salva');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Erro ao salvar nota');
    }
  };

  const exportNotes = (format: 'csv' | 'json') => {
    if (!verseNotes.length) {
      toast.error('Nenhuma nota para exportar');
      return;
    }

    let content = '';
    let mimeType = '';
    let fileName = `margens-estudo-${selectedBook?.abbr || 'geral'}`;

    if (format === 'csv') {
      const headers = ['Livro', 'Capítulo', 'Versículo', 'Nota', 'Data'];
      const rows = verseNotes.map(n => [
        n.book_abbr,
        n.chapter,
        n.verse,
        `"${n.note_text.replace(/"/g, '""')}"`,
        new Date(n.created_at).toLocaleDateString()
      ]);
      content = [headers, ...rows].map(e => e.join(',')).join('\n');
      mimeType = 'text/csv';
      fileName += '.csv';
    } else {
      content = JSON.stringify(verseNotes, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Notas exportadas com sucesso');
  };



  const filteredVerseNotes = useMemo(() => {
    if (!noteSearchQuery) return verseNotes;
    const query = noteSearchQuery.toLowerCase();
    return verseNotes.filter(n => 
      n.note_text.toLowerCase().includes(query) || 
      n.verse.toString().includes(query)
    );
  }, [verseNotes, noteSearchQuery]);

  const jumpToVerse = (verseNumber: number) => {
    const el = document.getElementById(`v${verseNumber}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Visual feedback
      el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 2000);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      
      if (isTyping && e.key !== 'Escape') return;

      // Theme toggle (Alt + T)
      if (e.altKey && e.key.toLowerCase() === 't') {
        const themes: any[] = ['paper', 'sepia', 'dark', 'night'];
        const currentIndex = themes.indexOf(settings.theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        updateSettings({ theme: nextTheme });
        toast.info(`Tema: ${nextTheme}`);
      }

      // Next Verse (ArrowDown / J)
      if (!isTyping && (e.key === 'ArrowDown' || e.key.toLowerCase() === 'j')) {
        const nextVerse = activeVerseNumber ? activeVerseNumber + 1 : 1;
        if (nextVerse <= verses.length) jumpToVerse(nextVerse);
      }

      // Prev Verse (ArrowUp / K)
      if (!isTyping && (e.key === 'ArrowUp' || e.key.toLowerCase() === 'k')) {
        const prevVerse = activeVerseNumber ? activeVerseNumber - 1 : 1;
        if (prevVerse >= 1) jumpToVerse(prevVerse);
      }

      // Focus Note (Alt + N)
      if (e.altKey && e.key.toLowerCase() === 'n' && activeVerseNumber) {
        setEditingNote({ verse: activeVerseNumber, text: verseNotes.find(n => n.verse === activeVerseNumber)?.note_text || '' });
      }

      // Toggle Study Marginalia (Alt + M)
      if (e.altKey && e.key.toLowerCase() === 'm') {
        updateSettings({ showStudyMarginalia: !settings.showStudyMarginalia });
      }
      
      // Toggle Note Search (Ctrl/Cmd + F inside reading)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && viewMode === 'reading') {
        e.preventDefault();
        setNoteSearchVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [settings.theme, activeVerseNumber, verses.length, settings.showStudyMarginalia, viewMode, updateSettings, verseNotes]);


  const jumpToFavorite = (fav: any) => {

    let foundBook: BibleBook | null = null;
    for (const t of Object.values(BIBLE_DATA)) {
      for (const cat of t) {
        const b = cat.books.find(b => b.abbr === fav.book_abbr);
        if (b) {
          foundBook = b;
          break;
        }
      }
      if (foundBook) break;
    }

    if (foundBook) {
      setSelectedBook(foundBook);
      setSelectedChapter(fav.chapter);
      setViewMode('reading');
      navigate(`/bible?book=${fav.book_abbr}&ch=${fav.chapter}`);
      
      // We need to wait for verses to load, handled by the memory scroll logic in fetchVerses 
      // or we can manually trigger a scroll if already loaded.
      // The Bible.tsx already has a scroll to settings.audioPositionMemory logic.
      // Let's update the settings to ensure it scrolls.
      const memoryKey = `bible:${fav.book_abbr}:${fav.chapter}`;
      updateSettings({
        audioPositionMemory: {
          ...settings.audioPositionMemory,
          [memoryKey]: fav.verse_number
        }
      });
    }
  };

  const filteredFavorites = useMemo(() => {
    return favorites.filter(f => 
      f.content.toLowerCase().includes(favoriteSearchQuery.toLowerCase()) ||
      f.book_abbr.toLowerCase().includes(favoriteSearchQuery.toLowerCase())
    );
  }, [favorites, favoriteSearchQuery]);


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
      setViewMode('home');
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
    else if (viewMode === 'books') setViewMode('home');
    window.scrollTo(0, 0);
    if (viewMode === 'home') navigate('/bible');
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
      
      {viewMode === 'home' && (
        <ContemplativeLayout
          subtitle="A Palavra que transforma"
          title="Bíblia Sagrada"
          icon={Icons.BookOpen}
          maxW="max-w-7xl"
        >
          <div className="w-full space-y-spacing-3xl pb-spacing-4xl">
            {/* Citação inspiracional discreta */}
            <div className="text-center max-w-lg mx-auto mb-spacing-2xl">
              <p className="text-premium-sm font-serif italic text-primary/40 leading-relaxed">
                "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho."
              </p>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/20 mt-2 block">Salmo 119,105</span>
            </div>

            {/* Widgets de Ação Rápida */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-spacing-md">
               <div className="bg-white/60 backdrop-blur-xl p-spacing-lg rounded-premium border border-primary/5 flex flex-col justify-between shadow-premium-sm">
                 <div className="flex justify-between items-start mb-4">
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary/30">Continuar leitura</span>
                   <Icons.BookMarked className="w-4 h-4 text-primary/20" />
                 </div>
                 <div className="space-y-1">
                   <h4 className="text-premium-lg font-bold text-primary/80">João 6,35</h4>
                   <p className="text-[10px] text-primary/40 italic">Evangelho segundo São João</p>
                 </div>
                 <Button variant="outline" size="sm" className="mt-6 rounded-full bg-secondary/10 border-secondary/20 text-secondary hover:bg-secondary/20 transition-all text-[10px] uppercase font-bold tracking-widest">
                   Continuar lendo
                 </Button>
               </div>

               <div className="bg-white/60 backdrop-blur-xl p-spacing-lg rounded-premium border border-primary/5 flex flex-col justify-between shadow-premium-sm">
                 <div className="flex justify-between items-start mb-4">
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary/30">Leitura do dia</span>
                   <Icons.Sun className="w-4 h-4 text-primary/20" />
                 </div>
                 <div className="space-y-1">
                   <h4 className="text-premium-lg font-bold text-primary/80">Mateus 5,1-12</h4>
                   <p className="text-[10px] text-primary/40 italic">Sermão da Montanha</p>
                 </div>
                 <Button variant="outline" size="sm" className="mt-6 rounded-full bg-secondary/10 border-secondary/20 text-secondary hover:bg-secondary/20 transition-all text-[10px] uppercase font-bold tracking-widest">
                   Ler agora
                 </Button>
               </div>

               <div className="bg-white/60 backdrop-blur-xl p-spacing-lg rounded-premium border border-primary/5 flex flex-col justify-between shadow-premium-sm">
                 <div className="flex justify-between items-start mb-4">
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary/30">Plano de leitura</span>
                   <Icons.Activity className="w-4 h-4 text-primary/20" />
                 </div>
                 <div className="space-y-3">
                   <h4 className="text-premium-base font-bold text-primary/80">Plano em 365 dias</h4>
                   <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-bold text-primary/30 uppercase">
                      <span>Dia 127 de 365</span>
                      <span>35%</span>
                    </div>
                    <div className="w-full h-1 bg-primary/5 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary/40" style={{ width: '35%' }} />
                    </div>
                   </div>
                 </div>
                 <Button variant="ghost" size="sm" className="mt-6 rounded-full text-primary/40 hover:bg-primary/5 transition-all text-[10px] uppercase font-bold tracking-widest">
                   Ver plano
                 </Button>
               </div>

               <div className="bg-white/60 backdrop-blur-xl p-spacing-lg rounded-premium border border-primary/5 flex flex-col justify-between shadow-premium-sm">
                 <div className="flex justify-between items-start mb-4">
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary/30">Favoritos</span>
                   <Icons.Heart className="w-4 h-4 text-primary/20" />
                 </div>
                 <div className="space-y-1">
                   <h4 className="text-premium-lg font-bold text-primary/80">12 versículos</h4>
                   <p className="text-[10px] text-primary/40 italic">Sua seleção sagrada</p>
                 </div>
                 <Button variant="ghost" size="sm" className="mt-6 rounded-full text-primary/40 hover:bg-primary/5 transition-all text-[10px] uppercase font-bold tracking-widest">
                   Ver favoritos
                 </Button>
               </div>
            </div>

            {/* Sumário do Livro - Área de Navegação em Bloco */}
            <div className="pt-spacing-xl">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-spacing-xl">
                <div className="lg:col-span-1 space-y-spacing-lg">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Antigo Testamento</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {BIBLE_DATA['Antigo Testamento'].map(cat => (
                        <div key={cat.name} className="p-spacing-md bg-white/20 hover:bg-white/40 rounded-premium border border-primary/5 transition-all cursor-pointer group">
                           <div className="flex items-center gap-3">
                             <Icons.BookText className="w-3 h-3 text-primary/20 group-hover:text-secondary transition-colors" />
                             <span className="text-premium-xs font-bold text-primary/60 group-hover:text-primary transition-colors">{cat.name}</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Novo Testamento</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {BIBLE_DATA['Novo Testamento'].map(cat => (
                        <div key={cat.name} className="p-spacing-md bg-white/20 hover:bg-white/40 rounded-premium border border-primary/5 transition-all cursor-pointer group">
                           <div className="flex items-center gap-3">
                             <Icons.Cross className="w-3 h-3 text-primary/20 group-hover:text-secondary transition-colors" />
                             <span className="text-premium-xs font-bold text-primary/60 group-hover:text-primary transition-colors">{cat.name}</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white/40 backdrop-blur-xl rounded-premium-xl border border-primary/5 p-spacing-2xl shadow-premium">
                   <div className="flex items-center justify-between border-b border-primary/5 pb-spacing-md mb-spacing-xl">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black tracking-[0.5em] text-primary/20 uppercase">Selectio Librorum</span>
                        <h3 className="font-display text-premium-2xl italic text-primary/80">Evangelho segundo São João</h3>
                      </div>
                      <span className="text-[9px] font-black tracking-widest text-primary/20 uppercase">21 Capítulos</span>
                   </div>

                   <div className="grid grid-cols-1 gap-px bg-primary/5 rounded-premium overflow-hidden">
                      {[
                        "O Verbo se fez carne",
                        "As bodas de Caná",
                        "Jesus e Nicodemos",
                        "Jesus e a Samaritana",
                        "A cura do filho do oficial",
                        "O pão da vida",
                        "A festa dos Tabernáculos",
                        "A mulher adúltera",
                        "O bom pastor",
                        "A ressurreição de Lázaro"
                      ].map((title, idx) => (
                        <button 
                          key={idx}
                          className="flex items-center justify-between p-spacing-lg bg-white/40 hover:bg-white/80 transition-all group"
                        >
                          <div className="flex items-center gap-spacing-xl">
                            <span className="font-display text-premium-xl text-primary/20 group-hover:text-secondary transition-colors">{idx + 1}</span>
                            <span className="text-premium-base font-serif italic text-primary/70 group-hover:text-primary transition-colors">{title}</span>
                          </div>
                          <Icons.ChevronRight className="w-4 h-4 text-primary/10 group-hover:text-primary transition-all group-hover:translate-x-1" />
                        </button>
                      ))}
                   </div>
                   <Button variant="ghost" className="w-full mt-6 text-[10px] uppercase font-bold tracking-widest text-primary/30 hover:text-primary transition-colors">
                      Ver todos os 21 capítulos <Icons.ChevronDown className="ml-2 w-3 h-3" />
                   </Button>
                </div>
              </div>
            </div>
          </div>
        </ContemplativeLayout>
      )}



      {viewMode === 'books' && (
        <ContemplativeLayout
          subtitle="Sanctum Archivum"
          title="O Sumário Sagrado"
          icon={Icons.Bible}
          maxW="max-w-spacing-4xl"
          headerActions={
            <div className="flex gap-spacing-md">
              <Button variant="ghost" onClick={() => setViewMode('home')} className="text-[9px] font-black uppercase tracking-widest opacity-40">← Início</Button>
            </div>
          }
        >
          <div className="w-full space-y-spacing-4xl pb-spacing-4xl">
            {/* Seletor de Testamento Estilo Manuscrito */}
            <div className="flex justify-center border-b border-primary/5 pb-spacing-xl mb-spacing-3xl">
              <div className="flex gap-spacing-4xl">
                {(['Antigo Testamento', 'Novo Testamento'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTestament(t)}
                    className={cn(
                      "group relative py-spacing-md px-spacing-xl transition-all",
                      testament === t ? "text-primary scale-110" : "text-primary/20 hover:text-primary/40"
                    )}
                  >
                    <span className="font-display text-premium-xl uppercase tracking-[0.3em] italic">{t}</span>
                    {testament === t && (
                      <motion.div 
                        layoutId="testament-underline"
                        className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-spacing-4xl gap-y-spacing-3xl">
              {filteredCategories.map(cat => (
                <div key={cat.name} className="space-y-spacing-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="space-y-spacing-2xs border-b border-primary/10 pb-spacing-sm">
                    <h4 className="font-display text-premium-lg text-primary/60 italic uppercase tracking-widest">{cat.name}</h4>
                    {cat.description && <p className="text-[10px] text-primary/30 font-serif italic">{cat.description}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-spacing-xl gap-y-spacing-md">
                    {cat.books.map(book => (
                      <button 
                        key={book.abbr} 
                        onClick={() => selectBook(book)}
                        className="group flex flex-col items-start transition-all hover:translate-x-1"
                      >
                        <span className="text-[8px] font-black tracking-widest text-primary/10 group-hover:text-primary/30 transition-colors uppercase mb-1">{book.abbr}</span>
                        <h3 className="text-premium-sm font-serif text-primary/70 group-hover:text-primary transition-colors border-b border-transparent group-hover:border-primary/20 pb-0.5">{book.name}</h3>
                      </button>
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
          maxW="max-w-4xl"
        >
          <div className="w-full space-y-spacing-4xl pb-spacing-4xl animate-in fade-in zoom-in-95 duration-1000">
            <div className="flex flex-col items-center text-center space-y-spacing-lg mb-spacing-4xl">
              <Button 
                variant="ghost" 
                onClick={goBack} 
                className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30 hover:opacity-100 transition-all mb-spacing-xl"
                aria-label="Voltar para o sumário de livros"
              >
                ← Sumário da Biblioteca
              </Button>
              
              <div className="relative inline-block pb-spacing-lg">
                <h2 className="font-display text-premium-5xl font-light uppercase tracking-[0.3em] italic text-primary/80">
                  {selectedBook.name}
                </h2>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              </div>

              {selectedBook.description && (
                <p className="max-w-xl text-premium-lg font-serif italic text-primary/40 leading-relaxed">
                  "{selectedBook.description}"
                </p>
              )}
            </div>
            
            <div className="max-w-3xl mx-auto space-y-spacing-xl">
              <div className="flex items-center justify-between border-b border-primary/5 pb-spacing-sm mb-spacing-2xl">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/20 italic">Index Capitulorum</h4>
                <span className="text-[8px] font-black uppercase tracking-widest text-primary/10 italic">{selectedBook.chapters} CAPÍTULOS AO TODO</span>
              </div>
              
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-spacing-md">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                  <button 
                    key={ch} 
                    onClick={() => selectChapter(ch)} 
                    className="group relative flex items-center justify-center aspect-square rounded-premium border border-primary/5 bg-primary/[0.01] hover:bg-primary/[0.04] hover:border-primary/20 transition-all duration-500"
                    aria-label={`Capítulo ${ch}`}
                  >
                    <span className="text-premium-lg font-display text-primary/30 group-hover:text-primary group-hover:scale-110 transition-all duration-500">{ch}</span>
                    <div className="absolute inset-0 border border-primary/10 rounded-premium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ContemplativeLayout>
      )}


      {viewMode === 'reading' && selectedBook && (
        <ContemplativeLayout
          subtitle={selectedBook.abbr}
          title={selectedBook.name}
          icon={Icons.Bible}
          className={cn(settings.immersiveMode ? "max-w-prose" : "max-w-4xl")}

          headerActions={
            <div className="flex items-center gap-spacing-sm">
              <ReadingSettingsPopover />
            </div>
          }
        >

          <div className="pb-spacing-4xl">
            {viewMode === 'reading' && !settings.immersiveMode && (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-spacing-3xl border-b border-primary/5 pb-spacing-lg gap-4">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    onClick={goBack} 
                    className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 hover:opacity-100 p-0 transition-all hover:-translate-x-1"
                    aria-label="Voltar para o sumário de capítulos"
                  >
                    ← Sumário
                  </Button>
                  
                  {settings.showStudyMarginalia && (
                    <div className="flex items-center gap-2 border-l border-primary/5 pl-4">
                      <div className="relative group">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setNoteSearchVisible(!noteSearchVisible)}
                          className={cn("h-7 px-2 rounded-full", noteSearchVisible && "bg-primary/10")}
                          aria-label={noteSearchVisible ? "Fechar busca de notas" : "Abrir busca de notas"}
                          aria-expanded={noteSearchVisible}
                        >
                          <Icons.Search className="w-3 h-3 text-primary/40" />
                        </Button>
                        {noteSearchVisible && (
                          <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 180, opacity: 1 }}
                            className="absolute left-full ml-2 top-0 z-[60]"
                          >
                            <input 
                              autoFocus
                              placeholder="Buscar notas..."
                              value={noteSearchQuery}
                              onChange={(e) => setNoteSearchQuery(e.target.value)}
                              className="h-7 w-full bg-primary/[0.03] border border-primary/10 rounded-full px-3 text-[10px] font-serif italic focus:ring-1 focus:ring-primary/20 outline-none"
                              aria-label="Digitar termo para buscar em suas notas"
                            />
                          </motion.div>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => exportNotes('csv')} 
                        className="h-7 px-2 rounded-full opacity-40 hover:opacity-100"
                        title="Exportar notas (CSV)"
                        aria-label="Exportar Margens de Estudo como CSV"
                      >
                        <Icons.Download className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/40 italic leading-none">{selectedBook.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-px w-8 bg-primary/10" />
                    <span className="text-premium-xs font-serif italic text-primary/60">Capitulum {selectedChapter}</span>
                  </div>
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
                "reader-text space-y-spacing-md pb-spacing-4xl mx-auto transition-all relative pt-spacing-2xl",
                `font-size-${settings.fontSize} font-family-${settings.fontFamily} line-spacing-${settings.lineSpacing}`,
                settings.immersiveMode && "text-center max-w-2xl",
                settings.showStudyMarginalia && "lg:pr-64"
              )}>


                {verses.map((v, i) => (
                  <div 
                    key={`${v.chapter}-${v.number}`} 
                    id={`v${v.number}`} 
                    role="article"
                    aria-label={`Versículo ${v.number}`}
                    tabIndex={0}
                    onFocus={() => setActiveVerseNumber(v.number)}
                    className={cn(
                      "group relative py-spacing-2xl transition-all duration-700 px-spacing-xl rounded-premium border border-transparent outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                      activeVerseNumber === v.number ? "bg-white/60 shadow-premium-md" : "hover:bg-white/30",
                      "text-center max-w-3xl mx-auto"
                    )}


                  >
                    {v.number === 1 && (
                      <div className="flex flex-col items-center mb-spacing-4xl pt-spacing-2xl border-t border-primary/5" role="presentation">
                        <Icons.Logo className="w-spacing-xl h-spacing-xl opacity-20 mb-spacing-xl" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/20 mb-2 italic">Incipit Liber</span>
                        <h3 className="text-premium-4xl font-display font-light text-primary/60 uppercase tracking-[0.3em] italic mb-spacing-lg" aria-level={2}>
                          {selectedBook.name} <span className="text-primary/20 ml-2">{v.chapter}</span>
                        </h3>
                        {selectedBook.description && v.chapter === 1 && (
                          <p className="max-w-prose text-center text-premium-sm font-serif italic text-primary/40 mb-spacing-xl leading-relaxed">
                            {selectedBook.description}
                          </p>
                        )}
                        <div className="flex items-center gap-spacing-md">
                          <div className="w-12 h-px bg-gradient-to-r from-transparent to-primary/10" />
                          <Icons.Wheat className="w-3 h-3 text-primary/10" />
                          <div className="w-12 h-px bg-gradient-to-l from-transparent to-primary/10" />
                        </div>
                      </div>
                    )}



                    <span className="text-[10px] font-serif italic text-primary/20 mr-spacing-md align-top inline-block w-4 text-right select-none" aria-hidden="true">{v.number}</span>
                    <span className="align-baseline" id={`v-text-${v.number}`}>{wrapWithDictionary(v.text)}</span>
                    
                    <div className="flex flex-col items-center gap-spacing-md mt-spacing-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md px-6 py-2 rounded-full border border-primary/5 shadow-premium-sm">
                        <button 
                          onClick={() => toggleFavorite(v)}
                          aria-label={favorites.some(f => f.book_abbr === selectedBook?.abbr && f.chapter === selectedChapter && f.verse_number === v.number) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                          className={cn(
                            "p-2 rounded-full hover:bg-primary/5 transition-colors",
                            favorites.some(f => f.book_abbr === selectedBook?.abbr && f.chapter === selectedChapter && f.verse_number === v.number) 
                              ? "text-secondary" 
                              : "text-primary/20"
                          )}
                        >
                          <Icons.Heart 
                            className={cn(
                              "w-4 h-4",
                              favorites.some(f => f.book_abbr === selectedBook?.abbr && f.chapter === selectedChapter && f.verse_number === v.number) && "fill-current"
                            )} 
                          />
                        </button>
                        <button 
                          onClick={() => setEditingNote({ verse: v.number, text: verseNotes.find(n => n.verse === v.number)?.note_text || '' })}
                          aria-label={verseNotes.some(n => n.verse === v.number) ? "Editar nota de estudo" : "Adicionar nota de estudo"}
                          className={cn(
                            "p-2 rounded-full hover:bg-primary/5 transition-colors",
                            verseNotes.some(n => n.verse === v.number) ? "text-primary" : "text-primary/20"
                          )}
                        >
                          <Icons.Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          aria-label="Compartilhar versículo"
                          className="p-2 rounded-full hover:bg-primary/5 transition-colors text-primary/20"
                        >
                          <Icons.Share2 className="w-4 h-4" />
                        </button>
                      </div>
                      <Button variant="ghost" className="text-[10px] uppercase font-black tracking-[0.2em] text-primary/10 hover:text-primary/30 h-auto p-0 transition-colors">Ver contexto</Button>
                    </div>



                    {settings.showStudyMarginalia && filteredVerseNotes.find(n => n.verse === v.number) && (
                      <div 
                        className="hidden lg:block absolute left-full ml-spacing-xl top-0 w-56 p-spacing-sm rounded-premium bg-primary/[0.02] border border-primary/5 text-[10px] italic text-primary/60 leading-relaxed shadow-premium-sm animate-in fade-in slide-in-from-left-2"
                        role="complementary"
                        aria-label={`Sua nota para o versículo ${v.number}`}
                      >
                        <div className="flex items-center gap-1 mb-1 opacity-40" aria-hidden="true">
                          <Icons.MessageSquare size={8} />
                          <span className="font-black uppercase tracking-tighter">Marginalia</span>
                        </div>
                        {filteredVerseNotes.find(n => n.verse === v.number)?.note_text}
                      </div>
                    )}

                    {settings.showStudyMarginalia && !filteredVerseNotes.find(n => n.verse === v.number) && noteSearchQuery && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-[5] pointer-events-none transition-all duration-1000" />
                    )}




                    {editingNote?.verse === v.number && (
                      <div className="mt-spacing-md p-spacing-md bg-primary/[0.03] rounded-premium border border-primary/10 animate-in fade-in zoom-in-95">
                        <textarea
                          autoFocus
                          value={editingNote.text}
                          onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })}
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              saveNote(v.number, editingNote.text);
                            }
                          }}
                          placeholder="Escreva sua meditação..."
                          aria-label={`Campo de edição de nota para o versículo ${v.number}. Pressione Ctrl+Enter para salvar.`}
                          className="w-full bg-transparent border-none focus:ring-0 text-premium-xs font-serif italic text-primary/80 resize-none min-h-[80px]"
                        />

                        <div className="flex justify-end gap-spacing-sm mt-spacing-sm">
                          <Button variant="ghost" size="sm" onClick={() => setEditingNote(null)} className="text-[9px] uppercase tracking-tighter">Cancelar</Button>
                          <Button size="sm" onClick={() => saveNote(v.number, editingNote.text)} className="h-7 px-4 rounded-full text-[9px] uppercase tracking-tighter">Salvar</Button>
                        </div>
                      </div>
                    )}
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
            "fixed bottom-spacing-4xl left-1/2 -translate-x-1/2 z-40 bg-background/20 backdrop-blur-3xl p-spacing-2xs rounded-premium-full border border-primary/5 shadow-premium flex gap-spacing-xs transition-all duration-1000 items-center",
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
              className={cn("rounded-premium-full", showTranscript ? "bg-primary/10" : "")}
              title="Ver Transcrição"
              aria-label="Alternar painel de transcrição"
            >
              <Icons.FileText className={showTranscript ? 'text-primary' : 'text-primary/40'} />
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowLogosAI(!showLogosAI)}
              className="rounded-premium-full"
            >
              <Icons.Sparkles className={showLogosAI ? 'text-primary' : 'text-primary/40'} />
            </Button>
            
            <ReadingSettingsPopover />

            <ReadingMark contentType="bible" contentId={selectedBook.abbr} label={`${selectedBook.name} ${selectedChapter}`} />
            {settings.immersiveMode && (
              <Button variant="ghost" onClick={() => updateSettings({ immersiveMode: false })} className="rounded-premium-full">
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

      {viewMode === 'favorites' && (
        <ContemplativeLayout
          subtitle="Versículos Guardados"
          title="Meus Favoritos"
          icon={Icons.Heart}
          maxW="max-w-spacing-4xl"
          headerActions={
            <div className="flex gap-spacing-md">
              <Button variant="ghost" onClick={() => setViewMode('home')} className="text-[9px] font-black uppercase tracking-widest opacity-40">← Início</Button>
            </div>
          }
        >
          <div className="w-full space-y-spacing-2xl pb-spacing-4xl">
            <div className="space-y-spacing-md">
              <div className="relative group max-w-md">
                <Icons.Search className="absolute left-spacing-lg top-1/2 -translate-y-1/2 w-spacing-sm h-spacing-sm text-primary/20 group-focus-within:text-primary transition-all duration-700" />
                <input
                  type="text"
                  placeholder="Buscar nos favoritos..."
                  value={favoriteSearchQuery}
                  onChange={(e) => setFavoriteSearchQuery(e.target.value)}
                  className="search-input-premium pl-spacing-3xl bg-primary/[0.01] h-12 text-premium-sm"
                />
              </div>

              {isFavoritesLoading ? (
                <div className="py-spacing-4xl flex flex-col items-center justify-center opacity-20">
                  <Icons.Loader2 className="w-spacing-xl h-spacing-xl animate-spin mb-spacing-md" />
                  <span className="text-premium-xs uppercase tracking-widest">Carregando...</span>
                </div>
              ) : filteredFavorites.length > 0 ? (
                <div className="grid grid-cols-1 gap-spacing-md">
                  {filteredFavorites.map((fav) => (
                    <div 
                      key={fav.id} 
                      className="group p-spacing-lg bg-background rounded-premium border border-primary/5 hover:border-primary/20 transition-all cursor-pointer"
                      onClick={() => jumpToFavorite(fav)}
                    >
                      <div className="flex justify-between items-start mb-spacing-md">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">
                          {fav.book_abbr} {fav.chapter}:{fav.verse_number}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite({ number: fav.verse_number, text: fav.content });
                          }}
                        >
                          <Icons.X className="w-3 h-3 text-destructive/50" />
                        </Button>
                      </div>
                      <p className="text-premium-sm font-serif italic text-primary/70 line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                        "{fav.content}"
                      </p>
                      <div className="mt-spacing-md flex items-center gap-spacing-xs opacity-0 group-hover:opacity-40 transition-opacity">
                        <span className="text-[8px] font-black uppercase tracking-widest">Retornar ao ponto exato</span>
                        <Icons.ArrowRight className="w-spacing-xs h-spacing-xs" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-spacing-4xl text-center">
                  <Icons.Heart className="w-spacing-xl h-spacing-xl text-primary/10 mx-auto mb-spacing-md" />
                  <p className="text-premium-sm text-primary/30 italic">
                    {favoriteSearchQuery ? "Nenhum favorito encontrado para esta busca." : "Você ainda não guardou nenhum versículo."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </ContemplativeLayout>
      )}
    </div>
  );
};

export default Bible;