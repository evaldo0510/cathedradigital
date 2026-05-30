import React, { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense, memo } from 'react';
import BackToThemeBanner from './BackToThemeBanner';
import { motion, AnimatePresence } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import StaggeredList from './StaggeredList';
import Relatio from './Relatio';
import DeepContentSection from './DeepContentSection';
import { getBibleCrossRefs, CIC_TO_BIBLE, BIBLE_TO_CIC, getBibleDocs } from '@/data/cross-references';

import CatechismPopover from './CatechismPopover';
import MagisteriumPopover from './MagisteriumPopover';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import BibleSearch from './BibleSearch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ShareButton from './ShareButton';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { checkNewBadges, getBadgeById } from '@/lib/badges';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AudioButton from './AudioButton';
import { BibleChapterSkeleton } from './SacredSkeleton';
import { buildBibleAbsoluteUrl, parseVerseParam } from '@/lib/bibleUrl';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import ReadingControlPanel from './ReadingControlPanel';
import ReadingMark from './ReadingMark';
import NotesPanel from './NotesPanel';
const LogosAI = lazy(() => import('./LogosAI'));
const LogosContextualSuggestions = lazy(() => import('./LogosContextualSuggestions').then(m => ({ default: m.LogosContextualSuggestions })));
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { useAutoFocus } from '@/hooks/useAutoFocus';
import { useRenderPerf } from '@/hooks/useRenderPerf';
import { History, LayoutPanelLeft, Compass, ChevronLeft, ChevronRight, X, StopCircle } from 'lucide-react';
import ContemplativeLayout from './ContemplativeLayout';
import useReadingAutoHide from '@/hooks/useReadingAutoHide';
import { ReadingProgress } from './ReadingProgress';
import { TextSelectionToolbar } from './TextSelectionToolbar';
import ChapterNotesList from './ChapterNotesList';
import { useNotes, UserNote } from '@/hooks/useNotes';
import { NoteEditModal } from './NoteEditModal';



type BibleBook = { name: string; abbr: string; chapters: number };
type BibleCategory = { label: string; icon: React.ElementType; color: string; bgColor: string; books: BibleBook[] };

const BIBLE_CATEGORIES: Record<string, BibleCategory[]> = {
  'Antigo Testamento': [
    { label: 'Pentateuco', icon: Icons.ScrollText, color: 'text-primary', bgColor: 'bg-muted border-border', books: [
      { name: 'Gênesis', abbr: 'Gn', chapters: 50 }, { name: 'Êxodo', abbr: 'Ex', chapters: 40 },
      { name: 'Levítico', abbr: 'Lv', chapters: 27 }, { name: 'Números', abbr: 'Nm', chapters: 36 },
      { name: 'Deuteronômio', abbr: 'Dt', chapters: 34 },
    ]},
    { label: 'Históricos', icon: Icons.Swords, color: 'text-primary', bgColor: 'bg-muted border-border', books: [
      { name: 'Josué', abbr: 'Js', chapters: 24 }, { name: 'Juízes', abbr: 'Jz', chapters: 21 },
      { name: 'Rute', abbr: 'Rt', chapters: 4 }, { name: '1 Samuel', abbr: '1Sm', chapters: 31 },
      { name: '2 Samuel', abbr: '2Sm', chapters: 24 }, { name: '1 Reis', abbr: '1Rs', chapters: 22 },
      { name: '2 Reis', abbr: '2Rs', chapters: 25 }, { name: '1 Crônicas', abbr: '1Cr', chapters: 29 },
      { name: '2 Crônicas', abbr: '2Cr', chapters: 36 }, { name: 'Esdras', abbr: 'Esd', chapters: 10 },
      { name: 'Neemias', abbr: 'Ne', chapters: 13 }, { name: 'Tobias', abbr: 'Tb', chapters: 14 },
      { name: 'Judite', abbr: 'Jt', chapters: 16 }, { name: 'Ester', abbr: 'Est', chapters: 10 },
      { name: '1 Macabeus', abbr: '1Mc', chapters: 16 }, { name: '2 Macabeus', abbr: '2Mc', chapters: 15 },
    ]},
    { label: 'Sapienciais', icon: Icons.Feather, color: 'text-primary', bgColor: 'bg-muted border-border', books: [
      { name: 'Jó', abbr: 'Jó', chapters: 42 }, { name: 'Salmos', abbr: 'Sl', chapters: 150 },
      { name: 'Provérbios', abbr: 'Pr', chapters: 31 }, { name: 'Eclesiastes', abbr: 'Ecl', chapters: 12 },
      { name: 'Cântico dos Cânticos', abbr: 'Ct', chapters: 8 }, { name: 'Sabedoria', abbr: 'Sb', chapters: 19 },
      { name: 'Eclesiástico', abbr: 'Eclo', chapters: 51 },
    ]},
    { label: 'Profetas', icon: Icons.Flame, color: 'text-primary', bgColor: 'bg-muted border-border', books: [
      { name: 'Isaías', abbr: 'Is', chapters: 66 }, { name: 'Jeremias', abbr: 'Jr', chapters: 52 },
      { name: 'Lamentações', abbr: 'Lm', chapters: 5 }, { name: 'Baruc', abbr: 'Br', chapters: 6 },
      { name: 'Ezequiel', abbr: 'Ez', chapters: 48 }, { name: 'Daniel', abbr: 'Dn', chapters: 14 },
      { name: 'Oseias', abbr: 'Os', chapters: 14 }, { name: 'Joel', abbr: 'Jl', chapters: 4 },
      { name: 'Amós', abbr: 'Am', chapters: 9 }, { name: 'Abdias', abbr: 'Ab', chapters: 1 },
      { name: 'Jonas', abbr: 'Jn', chapters: 4 }, { name: 'Miqueias', abbr: 'Mq', chapters: 7 },
      { name: 'Naum', abbr: 'Na', chapters: 3 }, { name: 'Habacuc', abbr: 'Hab', chapters: 3 },
      { name: 'Sofonias', abbr: 'Sf', chapters: 3 }, { name: 'Ageu', abbr: 'Ag', chapters: 2 },
      { name: 'Zacarias', abbr: 'Zc', chapters: 14 }, { name: 'Malaquias', abbr: 'Ml', chapters: 3 },
    ]},
  ],
  'Novo Testamento': [
    { label: 'Evangelhos', icon: Icons.Cross, color: 'text-primary', bgColor: 'bg-muted border-border', books: [
      { name: 'Mateus', abbr: 'Mt', chapters: 28 }, { name: 'Marcos', abbr: 'Mc', chapters: 16 },
      { name: 'Lucas', abbr: 'Lc', chapters: 24 }, { name: 'João', abbr: 'Jo', chapters: 21 },
    ]},
    { label: 'Atos', icon: Icons.Globe, color: 'text-primary', bgColor: 'bg-muted border-border', books: [
      { name: 'Atos dos Apóstolos', abbr: 'At', chapters: 28 },
    ]},
    { label: 'Cartas Paulinas', icon: Icons.Mail, color: 'text-primary', bgColor: 'bg-muted border-border', books: [
      { name: 'Romanos', abbr: 'Rm', chapters: 16 }, { name: '1 Coríntios', abbr: '1Cor', chapters: 16 },
      { name: '2 Coríntios', abbr: '2Cor', chapters: 13 }, { name: 'Gálatas', abbr: 'Gl', chapters: 6 },
      { name: 'Efésios', abbr: 'Ef', chapters: 6 }, { name: 'Filipenses', abbr: 'Fl', chapters: 4 },
      { name: 'Colossenses', abbr: 'Cl', chapters: 4 }, { name: '1 Tessalonicenses', abbr: '1Ts', chapters: 5 },
      { name: '2 Tessalonicenses', abbr: '2Ts', chapters: 3 }, { name: '1 Timóteo', abbr: '1Tm', chapters: 6 },
      { name: '2 Timóteo', abbr: '2Tm', chapters: 4 }, { name: 'Tito', abbr: 'Tt', chapters: 3 },
      { name: 'Filemon', abbr: 'Fm', chapters: 1 }, { name: 'Hebreus', abbr: 'Hb', chapters: 13 },
    ]},
    { label: 'Cartas Católicas', icon: Icons.BookOpen, color: 'text-primary', bgColor: 'bg-muted border-border', books: [
      { name: 'Tiago', abbr: 'Tg', chapters: 5 }, { name: '1 Pedro', abbr: '1Pd', chapters: 5 },
      { name: '2 Pedro', abbr: '2Pd', chapters: 3 }, { name: '1 João', abbr: '1Jo', chapters: 5 },
      { name: '2 João', abbr: '2Jo', chapters: 1 }, { name: '3 João', abbr: '3Jo', chapters: 1 },
      { name: 'Judas', abbr: 'Jd', chapters: 1 },
    ]},
    { label: 'Apocalipse', icon: Icons.Sparkles, color: 'text-primary', bgColor: 'bg-muted border-border', books: [
      { name: 'Apocalipse', abbr: 'Ap', chapters: 22 },
    ]},
  ],
};

const getAllBooks = (testament: string) => BIBLE_CATEGORIES[testament].flatMap(c => c.books);

type ViewMode = 'books' | 'chapters' | 'reading';

const FONT_SIZES = [
  { label: 'P', size: 'text-sm md:text-base', leading: 'leading-relaxed' },
  { label: 'M', size: 'text-base md:text-lg', leading: 'leading-[1.7]' },
  { label: 'G', size: 'text-lg md:text-xl', leading: 'leading-[1.8]' },
];

const Bible: React.FC = memo(() => {
  useRenderPerf('Bible', 15);
  const { settings, updateSettings } = useReadingSettings();
  useReadingAutoHide(settings.visualSilence);
  const navigate = useNavigate();

  useAutoFocus();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const book = searchParams.get('book');
    const ch = searchParams.get('ch');
    if (book && ch) return 'reading';
    if (book) return 'chapters';
    return 'books';
  });
  const [selectedBook, setSelectedBook] = useState<{ name: string; abbr: string; chapters: number } | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [testament, setTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Antigo Testamento');
  const [showFullTextSearch, setShowFullTextSearch] = useState(false);
  const [verses, setVerses] = useState<{ number: number; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bibleError, setBibleError] = useState('');
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const { marks, saveLastRead, getLastRead } = useReadingMarks();
  const [showLogosAI, setShowLogosAI] = useState(false);
  const [lastReadMark, setLastReadMark] = useState<any>(null);
  const [shouldAutoResume, setShouldAutoResume] = useState(true);
  const [logosAIContext, setLogosAIContext] = useState('');
  const [logosAIInitialQuery, setLogosAIInitialQuery] = useState('');
  const [logosSelectionsCount, setLogosSelectionsCount] = useState(0);
  const [showCrossRefs, setShowCrossRefs] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user, profile } = useAuth();
  const { notes: chapterNotes, addNote, updateNote, deleteNote: deleteChapterNote } = useNotes('bible');
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeVerseId, setActiveVerseId] = useState<string | null>(null);

  const [activeHighlight, setActiveHighlight] = useState<UserNote | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [sessionResumeUsed, setSessionResumeUsed] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Update history on route change
  useEffect(() => {
    const currentUrl = window.location.pathname + window.location.search;
    setHistory(prev => {
      if (prev[historyIndex] === currentUrl) return prev;
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(currentUrl);
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [location.pathname, location.search, historyIndex]);
  
  const currentChapterNotes = useMemo(() => {
    if (!selectedBook || !selectedChapter) return [];
    return chapterNotes.filter(n => n.book_abbr === selectedBook.abbr && n.chapter === selectedChapter);
  }, [chapterNotes, selectedBook, selectedChapter]);

  const currentChapterHighlights = useMemo(() => {
    return currentChapterNotes.filter(n => !!n.highlight_color);
  }, [currentChapterNotes]);

  const completedBooks = useMemo(() => new Set(profile?.completed_books || []), [profile?.completed_books]);



  // Track visible verse for bookmarking
  useEffect(() => {
    if (viewMode !== 'reading') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveVerseId(entry.target.id);
          }
        });
      },
      { threshold: 0.5, rootMargin: '-10% 0px -70% 0px' }
    );

    const verseElements = document.querySelectorAll('[id^="v"]');
    verseElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [viewMode, verses]);

  const handleReturnToParagraph = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a brief highlight effect
      el.classList.add('bg-primary/10');
      setTimeout(() => el.classList.remove('bg-primary/10'), 2000);
    }
  };

  const handleBookmarkCurrent = () => {
    if (activeVerseId && selectedBook) {
      const verseNum = parseInt(activeVerseId.replace('v', ''));
      saveLastRead({
        content_type: 'bible',
        content_id: selectedBook.abbr,
        chapter: selectedChapter,
        position: verseNum,
        label: `${selectedBook.name} ${selectedChapter}:${verseNum}`,
        url: `/bible?book=${selectedBook.abbr}&ch=${selectedChapter}&v=${verseNum}`,
        is_last_read: true
      });
      toast.success('Posição salva', {
        description: `Você parou em ${selectedBook.name} ${selectedChapter}:${verseNum}`
      });
    }
  };

  // Track chapters read

  const [chaptersRead, setChaptersRead] = useState<Record<string, Set<number>>>({});

  const loadChaptersRead = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('bible_chapters_read' as any)
      .select('book_abbr, chapter')
      .eq('user_id', user.id);
    if (data) {
      const map: Record<string, Set<number>> = {};
      (data as any[]).forEach((r: any) => {
        if (!map[r.book_abbr]) map[r.book_abbr] = new Set();
        map[r.book_abbr].add(r.chapter);
      });
      setChaptersRead(map);
    }
  }, [user]);

  useEffect(() => { loadChaptersRead(); }, [loadChaptersRead]);

  const markChapterRead = useCallback(async (bookAbbr: string, chapter: number, totalChapters: number) => {
    if (!user) return;
    
    // Optimistic update for immediate UI feedback
    setChaptersRead(prev => {
      const next = { ...prev };
      if (!next[bookAbbr]) next[bookAbbr] = new Set();
      next[bookAbbr] = new Set(next[bookAbbr]).add(chapter);
      return next;
    });

    try {
      // Async save to database
      supabase
        .from('bible_chapters_read' as any)
        .upsert({ user_id: user.id, book_abbr: bookAbbr, chapter } as any, { onConflict: 'user_id,book_abbr,chapter' })
        .then(({ error }) => {
          if (error) console.error('Error saving chapter read:', error);
        });
      
      // Complete book logic (must use the updated set)
      const currentRead = chaptersRead[bookAbbr] || new Set();
      const nextRead = new Set(currentRead).add(chapter);

      if (nextRead.size >= totalChapters && !completedBooks.has(bookAbbr)) {
        const newCompleted = [...(profile?.completed_books || []), bookAbbr];
        const newCompletedSet = new Set(newCompleted);
        
        const currentBadges = profile?.badges || [];
        const newBadgeIds = checkNewBadges(currentBadges, {
          completedBooks: newCompletedSet,
          chaptersRead: { ...chaptersRead, [bookAbbr]: nextRead },
          totalMinutesRead: profile?.total_minutes_read || 0,
          streak: profile?.streak || 0,
          completedJourneys: 0,
        });
        
        const updatedBadges = [...currentBadges, ...newBadgeIds];
        
        supabase.from('profiles')
          .update({ completed_books: newCompleted, badges: updatedBadges })
          .eq('id', user.id)
          .then(() => {
            if (newBadgeIds.length > 0) {
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#FFD700', '#FF6B35', '#4ECDC4', '#8B5CF6'] });
              newBadgeIds.forEach(id => {
                const badge = getBadgeById(id);
                if (badge) toast.success(`Nova conquista: ${badge.name}`, { description: badge.description, duration: 5000 });
              });
            }
          });
      }
    } catch (err) {
      console.error('Failed to process chapter read:', err);
    }
  }, [user, profile, completedBooks, chaptersRead]);

  // All books flat for counting
  const allBooks = useMemo(() => [
    ...BIBLE_CATEGORIES['Antigo Testamento'].flatMap(c => c.books),
    ...BIBLE_CATEGORIES['Novo Testamento'].flatMap(c => c.books),
  ], []);
  const totalBooksRead = useMemo(() => allBooks.filter(b => completedBooks.has(b.abbr)).length, [allBooks, completedBooks]);
  const overallProgress = Math.round((totalBooksRead / 73) * 100);
  // Handle deep-link or auto-resume
  useEffect(() => {
    const bookParam = searchParams.get('book');
    const chParam = searchParams.get('ch');
    const refParam = searchParams.get('ref');

    // 1. If we have a specific ref or book/ch, use that
    if (refParam || (bookParam && chParam)) {
      setShouldAutoResume(false); // User clicked a specific link, don't auto-resume
      
      if (refParam) {
        // Handle "Book Chapter,Verse" or "Book Chapter" format
        const match = refParam.match(/^([a-zA-ZáéíóúÁÉÍÓÚ123\s]+)\s+(\d+)(?:[,.:]\s*(\d+)(?:[-–]\d+)?)?$/);
        if (match) {
          const bookNameOrAbbr = match[1].trim();
          const ch = parseInt(match[2]);
          const vs = match[3] ? parseInt(match[3]) : null;

          const allBooksList = [...getAllBooks('Antigo Testamento'), ...getAllBooks('Novo Testamento')];
          const found = allBooksList.find(b => 
            b.abbr.toLowerCase() === bookNameOrAbbr.toLowerCase() || 
            b.name.toLowerCase() === bookNameOrAbbr.toLowerCase()
          );

          if (found) {
            const isNT = getAllBooks('Novo Testamento').some(b => b.abbr === found.abbr);
            setTestament(isNT ? 'Novo Testamento' : 'Antigo Testamento');
            setSelectedBook(found);
            setSelectedChapter(ch);
            if (vs) setHighlightedVerse(vs);
            setViewMode('reading');
            return;
          }
        }
      }

      if (bookParam) {
        const allBooksList = [...getAllBooks('Antigo Testamento'), ...getAllBooks('Novo Testamento')];
        const found = allBooksList.find(b => b.abbr === bookParam);
        if (found) {
          const isNT = getAllBooks('Novo Testamento').some(b => b.abbr === bookParam);
          setTestament(isNT ? 'Novo Testamento' : 'Antigo Testamento');
          setSelectedBook(found);
          if (chParam) {
            const ch = parseInt(chParam);
            if (!isNaN(ch) && ch >= 1 && ch <= found.chapters) {
              setSelectedChapter(ch);
              setViewMode('reading');
              const rawV = searchParams.get('v') ?? searchParams.get('verse');
              if (rawV !== null) {
                const v = parseVerseParam(rawV);
                if (v !== null) setHighlightedVerse(v);
              }
            } else {
              setViewMode('chapters');
            }
          } else {
            setViewMode('chapters');
          }
        }
      }
      return;
    }

    // 2. Auto-resume from last saved point if no specific params
    if (shouldAutoResume && user) {
      const autoResume = async () => {
        const { data } = await supabase
          .from('reading_marks')
          .select('*')
          .eq('user_id', user.id)
          .eq('content_type', 'bible')
          .eq('is_last_read', true)
          .maybeSingle();

        if (data && data.content_id && data.chapter) {
          const allBooksList = [...getAllBooks('Antigo Testamento'), ...getAllBooks('Novo Testamento')];
          const found = allBooksList.find(b => b.abbr === data.content_id);
          if (found) {
            const isNT = getAllBooks('Novo Testamento').some(b => b.abbr === found.abbr);
            setTestament(isNT ? 'Novo Testamento' : 'Antigo Testamento');
            setSelectedBook(found);
            setSelectedChapter(data.chapter);
            if (data.position) {
              setHighlightedVerse(data.position);
              localStorage.setItem('cathedra_last_bible_verse', data.position.toString());
            }
            setViewMode('reading');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            toast.info(`Retomando: ${found.name} ${data.chapter}`, {
              description: 'Continuando sua jornada espiritual de onde parou.',
              duration: 3000
            });
          }
        }
      };
      autoResume();
      setShouldAutoResume(false);
    }
  }, [searchParams, allBooks, user, shouldAutoResume]);

  const filteredCategories = useMemo(() => {
    const categories = BIBLE_CATEGORIES[testament];
    if (!searchQuery) return categories;
    const q = searchQuery.toLowerCase();
    return categories
      .map(cat => ({
        ...cat,
        books: cat.books.filter(b => b.name.toLowerCase().includes(q) || b.abbr.toLowerCase().includes(q)),
      }))
      .filter(cat => cat.books.length > 0);
  }, [testament, searchQuery]);

  const filteredBooks = useMemo(() => getAllBooks(testament), [testament]);

  const crossRefs = useMemo(() => {
    if (!selectedBook || !selectedChapter) return [];
    return getBibleCrossRefs(selectedBook.abbr, selectedChapter);
  }, [selectedBook, selectedChapter]);

  const docsRefs = useMemo(() => {
    if (!selectedBook || !selectedChapter) return [];
    return getBibleDocs(selectedBook.abbr, selectedChapter);
  }, [selectedBook, selectedChapter]);

  const verseToCic = useMemo(() => {
    if (!selectedBook || !selectedChapter) return {};
    const map: Record<number, number[]> = {};
    // Extract verse-specific references from the CIC_TO_BIBLE map
    Object.entries(CIC_TO_BIBLE).forEach(([paragraph, refs]) => {
      refs.forEach(ref => {
        if (ref.abbr === selectedBook.abbr && ref.chapter === selectedChapter && ref.verse) {
          const p = parseInt(paragraph);
          if (!map[ref.verse]) map[ref.verse] = [];
          map[ref.verse].push(p);
        }
      });
    });
    return map;
  }, [selectedBook, selectedChapter]);

  const selectBook = (book: typeof filteredBooks[0]) => {
    setSelectedBook(book);
    setViewMode('chapters');
  };

  const selectChapter = (ch: number) => {
    setSelectedChapter(ch);
    setViewMode('reading');
    setHighlightedVerse(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToCIC = useCallback((paragraph: number) => {
    navigate(`/catechism?p=${paragraph}`);
  }, [navigate]);

  const handleNavigateToDoc = useCallback((docId: string) => {
    navigate(`/magisterium?doc=${docId}`);
  }, [navigate]);

  const MemoizedRelatio = useMemo(() => {
    if (!selectedBook || !selectedChapter || !showCrossRefs) return null;
    return (
      <Relatio 
        context={{ 
          type: 'bible', 
          abbr: selectedBook.abbr, 
          chapter: selectedChapter,
          tags: [selectedBook.name, 'Bíblia']
        }}
        onNavigateToCIC={handleNavigateToCIC}
        onNavigateToDoc={handleNavigateToDoc}
      />
    );
  }, [selectedBook, selectedChapter, showCrossRefs, handleNavigateToCIC, handleNavigateToDoc]);


  const goBack = () => {
    if (viewMode === 'reading') setViewMode('chapters');
    else if (viewMode === 'chapters') { setViewMode('books'); setSelectedBook(null); }
  };

  const navigateChapter = useCallback((dir: 1 | -1) => {
    if (!selectedBook) return;
    const next = selectedChapter + dir;
    if (next >= 1 && next <= selectedBook.chapters) {
      setSelectedChapter(next);
      setHighlightedVerse(null);
      localStorage.setItem('cathedra_last_bible_scroll', '0');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Auto-save progress
      saveLastRead({
        content_type: 'bible',
        content_id: selectedBook.abbr,
        chapter: next,
        label: `${selectedBook.name} ${next}`,
        url: `/bible?book=${selectedBook.abbr}&ch=${next}`,
        is_last_read: true
      });
    }
  }, [selectedBook, selectedChapter, saveLastRead]);


  // In-memory cache with IndexedDB persistence for offline access
  const bibleCache = useMemo(() => {
    const map = new Map<string, { number: number; text: string }[]>();
    // Migrate localStorage cache to memory on first load
    try {
      const stored = localStorage.getItem('cathedra_bible_cache');
      if (stored) {
        const entries = JSON.parse(stored);
        entries.forEach(([k, v]: [string, any]) => map.set(k, v));
        localStorage.removeItem('cathedra_bible_cache'); // migrated
      }
    } catch (e) {
      console.warn('Failed to migrate bible cache:', e);
    }
    return map;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or if a modal is open
      const activeElement = document.activeElement;
      const isTyping = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || (activeElement as HTMLElement)?.isContentEditable;
      if (isTyping || isNoteModalOpen || viewMode !== 'reading' || !selectedBook) return;

      // Accessibility: Reading shortcuts
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateChapter(-1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateChapter(1);
      }
        if (e.key.toLowerCase() === (settings.shortcuts?.highlight || 'h')) {
          e.preventDefault();
          if (highlightedVerse) {
            handleAddNoteOrHighlight('yellow', 'Destacado via atalho');
          } else {
            toast.info('Selecione um versículo (clique ou toque) para destacar.', { icon: '💡' });
          }
        }
        if (e.key.toLowerCase() === (settings.shortcuts?.note || 'n')) {
          e.preventDefault();
          if (highlightedVerse) {
            setIsNoteModalOpen(true);
          } else {
            toast.info('Selecione um versículo (clique ou toque) para anotar.', { icon: '📝' });
          }
        }
        if (e.key === (settings.shortcuts?.clear || 'Escape')) {
          e.preventDefault();
          setHighlightedVerse(null);
          setActiveHighlight(null);
        }
      // Progress navigation (Alt + Up/Down)
      if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (e.altKey && e.key === 'ArrowDown' && lastReadMark?.url) {
        e.preventDefault();
        
        const behavior = settings.resumeBehavior || 'confirm';
        let shouldResume = true;
        
        if (behavior === 'confirm') {
          shouldResume = confirm(`Deseja retomar a leitura em: ${lastReadMark.label}?`);
        } else if (behavior === 'once') {
          if (!sessionResumeUsed) {
            shouldResume = confirm(`Deseja retomar a leitura em: ${lastReadMark.label}?`);
            if (shouldResume) setSessionResumeUsed(true);
          }
        } else if (behavior === 'never') {
          shouldResume = false;
        }

        if (shouldResume) {
          navigate(lastReadMark.url);
        }
      }

      // History navigation (Alt + Left/Right)
      if (e.altKey && e.key === 'ArrowLeft' && historyIndex > 0) {
        e.preventDefault();
        const prevUrl = history[historyIndex - 1];
        setHistoryIndex(prev => prev - 1);
        navigate(prevUrl);
      }
      if (e.altKey && e.key === 'ArrowRight' && historyIndex < history.length - 1) {
        e.preventDefault();
        const nextUrl = history[historyIndex + 1];
        setHistoryIndex(prev => prev + 1);
        navigate(nextUrl);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, selectedBook, navigateChapter, highlightedVerse, isNoteModalOpen, lastReadMark, navigate]);

  const handleAddNoteOrHighlight = useCallback(async (color: string, text: string) => {
    if (!selectedBook || !highlightedVerse) return;
    
    if (activeHighlight) {
       await updateNote(activeHighlight.id, text, color);
       setActiveHighlight(null);
    } else {
      await addNote(selectedBook.abbr, text, color, {
        book_abbr: selectedBook.abbr,
        chapter: selectedChapter,
        verse: highlightedVerse
      });
    }
    setIsNoteModalOpen(false);
  }, [selectedBook, selectedChapter, highlightedVerse, activeHighlight, addNote]);

  useEffect(() => {
    const fetchLastRead = async () => {
      const lr = await getLastRead();
      setLastReadMark(lr);
    };
    fetchLastRead();
  }, [getLastRead]);

  useEffect(() => {
    if (viewMode === 'reading' && !isLoading && verses.length > 0) {
      const savedScroll = localStorage.getItem(`cathedra_last_bible_scroll_${selectedBook.abbr}_${selectedChapter}`);
      const savedVerse = localStorage.getItem(`cathedra_last_bible_verse_${selectedBook.abbr}_${selectedChapter}`);
      
      // Better resume: only if no specific verse in URL
      if (!searchParams.get('v') && !searchParams.get('verse')) {
        if (savedScroll && parseInt(savedScroll) > 200) {
          setTimeout(() => {
            window.scrollTo({ top: parseInt(savedScroll), behavior: 'smooth' });
            toast('Ponto de leitura restaurado', { icon: '📖', duration: 2000 });
          }, 300);
        } else if (savedVerse) {
          const vNum = parseInt(savedVerse);
          setTimeout(() => {
            const el = document.getElementById(`v${vNum}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              toast('Ponto de leitura restaurado', { icon: '📖', duration: 2000 });
            }
          }, 400);
        }
      }
    }
  }, [viewMode, isLoading, verses.length]);

  useEffect(() => {
    const handleScroll = () => {
      if (viewMode !== 'reading' || verses.length === 0) return;
      
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
      
      // Persist scroll for resumption
      if (Math.abs(window.scrollY - parseInt(localStorage.getItem(`cathedra_last_bible_scroll_${selectedBook.abbr}_${selectedChapter}`) || '0')) > 100) {
        localStorage.setItem(`cathedra_last_bible_scroll_${selectedBook.abbr}_${selectedChapter}`, window.scrollY.toString());
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [viewMode, verses.length]);

  useEffect(() => {

    if (viewMode === 'reading' && selectedBook && selectedChapter > 0) {
      const cacheKey = `${selectedBook.abbr}_${selectedChapter}`;
      const isOfflineMode = localStorage.getItem('cathedra_offline_mode') === 'true';
      
      // 1) Check in-memory cache
      const memCached = bibleCache.get(cacheKey);
      if (memCached) {
        setVerses(memCached);
        setBibleError('');
        return;
      }

      setIsLoading(true);
      setBibleError('');
      setVerses([]);

      // 2 Check IndexedDB cache, then direct DB, then fetch
      import('@/lib/offlineCache').then(({ getCachedBibleChapter, cacheBibleChapter }) => {
        getCachedBibleChapter(selectedBook.abbr, selectedChapter).then(async (idbCached) => {
          if (idbCached?.verses?.length > 0) {
            setVerses(idbCached.verses);
            bibleCache.set(cacheKey, idbCached.verses);
            setIsLoading(false);
            return;
          }

          // 3) Check Direct DB Connection (spiritual_contents) - No AI fallback requested
          try {
            const { data: dbData } = await supabase
              .from('spiritual_contents')
              .select('*')
              .eq('type', 'bible')
              .contains('metadata', { book: selectedBook.abbr, chapter: selectedChapter })
              .order('metadata->verse', { ascending: true });

            if (dbData && dbData.length > 0) {
              const dbVerses = dbData.map(v => ({
                number: (v.metadata as any).verse,
                text: v.content_text
              }));
              setVerses(dbVerses);
              bibleCache.set(cacheKey, dbVerses);
              setIsLoading(false);
              return;
            }
          } catch (err) {
            console.error('Error fetching direct bible data:', err);
          }

          // 4) If in Offline Mode and miss cache, show error
          if (isOfflineMode) {
            setBibleError('Modo Somente-Cache ativo: Este capítulo não foi baixado para uso offline.');
            setIsLoading(false);
            return;
          }

          // 5 Fetch from edge function (Only as fallback)
          supabase.functions.invoke('bible-text', {
            body: { abbrev: selectedBook.abbr, chapter: selectedChapter }
          }).then(({ data, error }) => {
            if (error) {
              window.dispatchEvent(new CustomEvent('supabase-unreachable'));
              setBibleError('Erro ao carregar o texto. Usando cache local se disponível.');
            } else if (data?.verses?.length > 0) {
              setVerses(data.verses);
              bibleCache.set(cacheKey, data.verses);

              // Persist to IndexedDB for offline
              cacheBibleChapter(selectedBook.abbr, selectedChapter, data);
            } else {
              setBibleError('Texto não disponível para este capítulo.');
            }
            setIsLoading(false);
          });
        });
      });
    }
  }, [viewMode, selectedBook, selectedChapter, bibleCache]);



  // Auto-scroll to highlighted verse when verses are loaded.
  // If the verse is out of range for the loaded chapter, warn the user
  // but keep the chapter visible.
  useEffect(() => {
    if (highlightedVerse && verses.length > 0 && !isLoading) {
      const exists = verses.some(v => v.number === highlightedVerse);
      if (!exists) {
        toast.warning(`Versículo ${highlightedVerse} não encontrado`, {
          description: `Este capítulo tem ${verses.length} versículos. Mostrando o capítulo completo.`,
        });
        setHighlightedVerse(null);
        return;
      }
      // Wait for DOM to render
      setTimeout(() => {
        const el = document.getElementById(`v${highlightedVerse}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    }
  }, [highlightedVerse, verses, isLoading]);

  // Reading view
  if (viewMode === 'reading' && selectedBook) {
    return (
      <ContemplativeLayout
        subtitle={`${selectedBook.name}`}
        title={`Capítulo ${selectedChapter}`}
        maxW="max-w-[1200px]"
      >
        <SEOHead 
          title={`${selectedBook.name} ${selectedChapter} | Bíblia Sagrada`}
          description={`Leia ${selectedBook.name}, capítulo ${selectedChapter}.`}
          path={`/bible?book=${selectedBook.abbr}&ch=${selectedChapter}`}
        />
        
        <div className="space-y-12">
          <div className="space-y-12">
            <Button 
              variant="ghost" 
              onClick={goBack}
              className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary/40 hover:text-primary transition-all"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Sumário
            </Button>

            {lastReadMark && lastReadMark.url !== window.location.pathname + window.location.search && (
              <Button 
                variant="ghost" 
                onClick={() => navigate(lastReadMark.url)}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary/40 hover:text-primary"
              >
                <History className="w-4 h-4" />
                Ponto salvo
              </Button>
            )}
          </div>

        {/* Highlighted verse indicator (when ?v= is active) */}
        {highlightedVerse && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid="bible-highlight-indicator"
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-full bg-primary/10 border border-primary/30"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icons.Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-bold text-primary truncate">
                Destacado: {selectedBook.name} {selectedChapter}:{highlightedVerse}
              </span>
            </div>
            <Button
              onClick={() => setHighlightedVerse(null)}
              aria-label="Limpar destaque"
              className="text-xs font-bold text-primary/70 hover:text-primary transition-colors flex items-center gap-1 shrink-0"
            >
              Limpar
              <Icons.X className="w-3 h-3" />
            </Button>
          </motion.div>
        )}

        {/* Atmospheric Floating Header - Only visible on interaction or scroll up */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-background/40 backdrop-blur-3xl p-2 rounded-full border border-primary/5 shadow-premium-hover header-reading-auto-hide md:hidden fixed top-24 left-6 right-6 z-40 transition-all duration-700">
          <div className="flex items-center gap-1">
            <AudioButton variant="ghost" className="rounded-full w-10 h-10 p-0" />
            <ReadingControlPanel />
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 p-0" onClick={() => setShowLogosAI(!showLogosAI)}>
              <Icons.Sparkles className={`w-4 h-4 ${showLogosAI ? 'text-primary' : 'text-primary/60'}`} />
            </Button>
            <ReadingMark contentType="bible" contentId={selectedBook.abbr} label={`${selectedBook.name} ${selectedChapter}`} chapter={selectedChapter} />
          </div>
        </div>

        {/* Desktop Toolbar */}
        <div className="hidden md:flex items-center justify-between gap-4 bg-card/40 backdrop-blur-xl p-3 rounded-premium border border-border/40 shadow-soft mb-16">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goBack}
              className="rounded-full hover:bg-primary/5"
              title="Voltar ao Sumário"
            >
              <Icons.ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="h-8 w-px bg-border/20 mx-2" />
            <AudioButton variant="default" className="px-6 rounded-full" />
            <ShareButton
              title={`${selectedBook.name} ${selectedChapter}${highlightedVerse ? `:${highlightedVerse}` : ''}`}
              text={`Leia ${selectedBook.name}, capítulo ${selectedChapter} na Cathedra Digital`}
              url={buildBibleAbsoluteUrl({ abbr: selectedBook.abbr, chapter: selectedChapter, verse: highlightedVerse ?? undefined })}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button 
              disabled={selectedChapter <= 1} 
              onClick={() => navigateChapter(-1)}
              variant="outline"
              className="rounded-full border-primary/5 hover:border-primary/20"
            >
              ← Anterior
            </Button>
            <Button 
              disabled={selectedChapter >= selectedBook.chapters} 
              onClick={() => navigateChapter(1)}
              variant="outline"
              className="rounded-full border-primary/5 hover:border-primary/20"
            >
              Próximo →
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <ReadingControlPanel />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowLogosAI(!showLogosAI)}
              className={`rounded-full flex items-center gap-2 ${showLogosAI ? 'bg-primary text-white' : 'border-primary/10'}`}
            >
              <Icons.Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Logos IA</span>
            </Button>
            <ReadingMark contentType="bible" contentId={selectedBook.abbr} label={`${selectedBook.name} ${selectedChapter}`} chapter={selectedChapter} />
          </div>
        </div>



        {/* Content with Side Nav */}
        <div className="mt-12 md:mt-24">
          <div className="flex flex-col xl:flex-row gap-12 lg:gap-24 items-start">
            <div className="flex-1 w-full max-w-[75ch] mx-auto relative">
              {currentChapterNotes.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-1000">
                  <p className="text-premium-tiny font-medium uppercase tracking-[0.3em] text-primary/40 px-4">Destaques & Notas</p>
                  <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
                    {currentChapterNotes.map(note => (
                      <button
                        key={note.id}
                        onClick={() => {
                          if (note.verse) {
                            setHighlightedVerse(note.verse);
                            const el = document.getElementById(`v${note.verse}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }}
                        className={`flex flex-col gap-1.5 px-4 py-3 rounded-2xl border text-left transition-all hover:bg-primary/5
                          ${note.highlight_color ? `bg-${note.highlight_color}-50/50 border-${note.highlight_color}-200/30` : 'bg-card border-primary/5'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">Vs {note.verse}</span>
                          {note.highlight_color && (
                            <div className={`w-2 h-2 rounded-full highlight-${note.highlight_color}`} />
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed line-clamp-2 italic text-muted-foreground">
                          {note.note_text === 'Destacado para meditação' ? 'Somente destaque' : note.note_text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 w-full max-w-[var(--layout-max-width)] mx-auto">
              <div className="w-full relative">
                <div className="py-8 md:py-20 lg:py-24">




                {isLoading ? (
                  <BibleChapterSkeleton />
                ) : bibleError ? (
                  <div className="text-center py-12 space-y-4">
                    <p className="text-muted-foreground">{bibleError}</p>
                    <Button variant="outline" onClick={() => window.location.reload()}>Recarregar</Button>
                  </div>
                ) : (
                  <div className={`font-size-${settings.fontSize} font-family-${settings.fontFamily} text-foreground/90 transition-all duration-300 reader-text relative`}>
                    
                    {/* Visual Indicator for Keyboard Shortcuts */}
                    {highlightedVerse && settings.totalSilence && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[160] px-4 py-2 bg-primary/80 backdrop-blur-md text-primary-foreground rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-3 border border-white/10 shadow-2xl"
                      >
                        <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded">H</kbd> Destacar</span>
                        <div className="w-px h-3 bg-white/20" />
                        <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded">N</kbd> Nota</span>
                        <div className="w-px h-3 bg-white/20" />
                        <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded">Esc</kbd> Limpar</span>
                      </motion.div>
                    )}

                    <div className="flex flex-col gap-8 md:gap-14 pb-48">
                    {verses.map(v => {
                      const relatedP = verseToCic[v.number];
                      return (
                        <div key={v.number} 
                          id={`v${v.number}`}
                          className={`group relative py-6 px-8 rounded-[2rem] transition-all duration-1000 mb-2
                            ${highlightedVerse === v.number ? 'bg-primary/[0.01]' : 'hover:bg-primary/[0.005]'}`}>
                          <div className="flex items-start gap-4">

                            <sup className="text-[0.6em] font-bold text-primary/10 mt-2 select-none group-hover:text-primary/30 transition-colors duration-1000">{v.number}</sup>
                            <div className="flex-1 cursor-pointer" onClick={() => {
                              const vNum = v.number;
                              setHighlightedVerse(vNum === highlightedVerse ? null : vNum);
                              setLogosAIContext(`${selectedBook.name} ${selectedChapter}:${vNum} - ${v.text}`);
                              localStorage.setItem(`cathedra_last_bible_verse_${selectedBook.abbr}_${selectedChapter}`, vNum.toString());
                              localStorage.setItem(`cathedra_last_bible_scroll_${selectedBook.abbr}_${selectedChapter}`, window.scrollY.toString());
                              
                              // Seamless auto-save on verse click/selection
                              saveLastRead({
                                content_type: 'bible',
                                content_id: selectedBook.abbr,
                                chapter: selectedChapter,
                                position: vNum,
                                label: `${selectedBook.name} ${selectedChapter}:${vNum}`,
                                url: `/bible?book=${selectedBook.abbr}&ch=${selectedChapter}&v=${vNum}`,
                                is_last_read: true
                              });
                            }}>
                              <p className="leading-[1.9] font-light text-xl md:text-2xl text-foreground/90 dark:text-foreground/95 group-hover:text-foreground transition-colors duration-1000">
                                {currentChapterNotes.some(n => n.verse === v.number && n.highlight_color) && (
                                  <span 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const note = currentChapterNotes.find(n => n.verse === v.number && n.highlight_color);
                                      if (note) setActiveHighlight(note);
                                    }}
                                    className={`highlight-${currentChapterNotes.find(n => n.verse === v.number)?.highlight_color} px-1 rounded-sm mr-1 cursor-pointer hover:brightness-95 transition-all`}
                                  >
                                    {v.text}
                                  </span>
                                )}
                                {!currentChapterNotes.some(n => n.verse === v.number && n.highlight_color) && (
                                  <span className="opacity-100 leading-[1.85]">{v.text}</span>
                                )}

                                
                                {relatedP && (
                                  <span className="inline-flex gap-0.5 ml-2">
                                    {relatedP.map(p => (
                                      <CatechismPopover key={p} paragraph={p} onNavigate={handleNavigateToCIC} variant="mini" />
                                    ))}
                                  </span>
                                )}
                              </p>
                              
                              {/* Inline Notes display */}
                              {currentChapterNotes.filter(n => n.verse === v.number).map(note => (
                                <div key={note.id} className="mt-3 p-4 bg-secondary/5 border-l-2 border-secondary rounded-r-xl text-[13px] italic text-muted-foreground group/note relative">
                                  <div className="flex items-center gap-2 mb-1.5 opacity-40">
                                    <Icons.FileText className="w-3 h-3" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Minha Reflexão</span>
                                  </div>
                                  {note.note_text}
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); deleteChapterNote(note.id); }}
                                    className="absolute top-2 right-2 opacity-0 group-hover/note:opacity-100 transition-opacity p-1 hover:text-destructive"
                                  >
                                    <Icons.X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity">
                              <NotesPanel contentType="bible" contentId={`${selectedBook.abbr}:${selectedChapter}:${v.number}`} contentLabel={`${selectedBook.abbr} ${selectedChapter}:${v.number}`} />
                              <ReadingMark contentType="bible" contentId={`${selectedBook.abbr}:${selectedChapter}:${v.number}`} label={`${selectedBook.name} ${selectedChapter}:${v.number}`} chapter={selectedChapter} position={v.number} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 w-full max-w-[var(--layout-max-width)] mx-auto">
              <div className="w-full relative">
                <div className="py-8 md:py-20 lg:py-24">
                  <Relatio 
                    context={{
                      type: 'bible',
                      abbr: selectedBook.abbr,
                      chapter: selectedChapter,
                      tags: [selectedBook.name, `Capitulo ${selectedChapter}`, 'Biblia', 'Palavra de Deus']
                    }}
                    onNavigateToBible={(abbr, ch) => navigate(`/bible?book=${abbr}&ch=${ch}`)}
                    onNavigateToCIC={handleNavigateToCIC}
                    onNavigateToDoc={(docId) => navigate(`/magisterium/${docId}`)}
                    onSelectLogosQuery={(prompt) => {
                      setLogosAIInitialQuery(prompt);
                      setShowLogosAI(true);
                      setLogosSelectionsCount(prev => prev + 1);
                    }}
                  />

                  {!settings.totalSilence && (
                    <LogosContextualSuggestions
                      type="bible"
                      context={`${selectedBook.name} ${selectedChapter}`}
                      isVisible={settings.logosSuggestions === 'always' || (settings.logosSuggestions === 'first_selection' && logosSelectionsCount === 0)}
                      onSelectSuggestion={(prompt) => {
                        setLogosAIInitialQuery(prompt);
                        setShowLogosAI(true);
                        setLogosSelectionsCount(prev => prev + 1);
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            <aside className="reader-navigation-aside space-y-12 shrink-0">
              <div className="space-y-4">
                <p className="text-premium-tiny font-medium uppercase tracking-[0.3em] text-primary/40 px-4">Capítulos: {selectedBook.name}</p>
                <nav className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
                  {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                    <button
                      key={ch}
                      onClick={() => selectChapter(ch)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all
                        ${selectedChapter === ch 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'}`}
                    >
                      <span className="opacity-50 text-[10px] w-4">{ch}</span>
                      <span>Capítulo {ch}</span>
                      {chaptersRead[selectedBook.abbr]?.has(ch) && (
                        <Icons.CheckCircle2 className="w-3 h-3 ml-auto opacity-60" />
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>
          </div>
        </div>


          <div className="mt-24 pt-16 border-t border-primary/5 space-y-16">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
            <Button 
              variant="ghost" 
              disabled={selectedChapter <= 1}
              onClick={() => {
                if (selectedChapter > 1) {
                  const prevCh = selectedChapter - 1;
                  setSelectedChapter(prevCh);
                  setVerses([]);
                  navigate(`/bible?book=${selectedBook.abbr}&ch=${prevCh}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="rounded-3xl group px-6 py-10 flex flex-col items-start gap-2 hover:bg-primary/5 transition-all w-full sm:w-auto border border-transparent hover:border-primary/5"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 group-hover:text-primary/60 transition-colors">Capítulo Anterior</span>
              <div className="flex items-center gap-2 text-primary font-display font-light text-2xl">
                <Icons.ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform opacity-40" />
                {selectedBook.name} {selectedChapter - 1}
              </div>
            </Button>



                <Button 
                  variant="ghost" 
                  disabled={selectedChapter >= selectedBook.chapters}
                  onClick={() => {
                    if (selectedChapter < selectedBook.chapters) {
                      const nextCh = selectedChapter + 1;
                      setSelectedChapter(nextCh);
                      setVerses([]);
                      navigate(`/bible?book=${selectedBook.abbr}&ch=${nextCh}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      markChapterRead(selectedBook.abbr, selectedChapter, selectedBook.chapters);
                    }
                  }}
                  className="rounded-3xl group px-6 py-10 flex flex-col items-end gap-2 hover:bg-primary/5 transition-all text-right w-full sm:w-auto border border-transparent hover:border-primary/5"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 group-hover:text-primary/60 transition-colors">Próximo Capítulo</span>
                  <div className="flex items-center gap-2 text-primary font-display font-light text-2xl">
                    {selectedBook.name} {selectedChapter + 1}
                    <Icons.ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform opacity-40" />
                  </div>
                </Button>
              </div>

              <div className="text-center space-y-8 py-16">
                <Icons.CheckCircle2 className="w-16 h-16 text-primary/60 mx-auto" strokeWidth={1} />
                <div className="space-y-2">
                  <h3 className="text-2xl font-display text-primary uppercase tracking-[0.2em] font-light">Contemplação Concluída</h3>
                  <p className="text-xs text-muted-foreground/50 italic font-serif">"Lâmpada para meus pés é a Tua Palavra e luz para o meu caminho." (Salmo 119, 105)</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button 
                    onClick={() => {
                      markChapterRead(selectedBook.abbr, selectedChapter, selectedBook.chapters);
                      toast.success("Capítulo contemplado!", { icon: '📖' });
                      setViewMode('chapters');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="rounded-full px-12 py-7 bg-primary text-primary-foreground hover:scale-105 transition-all shadow-premium text-xs font-black uppercase tracking-widest"
                  >
                    Finalizar e Voltar
                  </Button>
                </div>
              </div>
            </div>

            
            <TextSelectionToolbar 
              activeHighlightId={activeHighlight?.id}
              activeColor={activeHighlight?.highlight_color}
              onHighlight={(color) => {
                if (activeHighlight) {
                  supabase.from('user_notes').update({ highlight_color: color }).eq('id', activeHighlight.id).then(() => {
                    setActiveHighlight(null);
                  });
                } else if (highlightedVerse) {
                  addNote(selectedBook.abbr, 'Destacado para meditação', color, {
                    book_abbr: selectedBook.abbr,
                    chapter: selectedChapter,
                    verse: highlightedVerse
                  });
                } else {
                  toast.info('Clique em um versículo primeiro para destacar.');
                }
              }}
              onDeleteHighlight={() => {
                if (activeHighlight) {
                  deleteChapterNote(activeHighlight.id);
                  setActiveHighlight(null);
                }
              }}
              onAddNote={() => {
                if (highlightedVerse || activeHighlight) {
                  setIsNoteModalOpen(true);
                } else {
                  toast.info('Clique em um versículo primeiro para anotar.');
                }
              }}
              onAskLogos={(text) => {
                const currentContext = `${selectedBook.name} ${selectedChapter}${highlightedVerse ? ':' + highlightedVerse : ''}`;
                setLogosAIInitialQuery(`Ajude-me a contemplar esta passagem sob a luz da Tradição: "${text}"`);
                setLogosAIContext(currentContext);
                setLogosSelectionsCount(prev => prev + 1);
                
                if (!settings.totalSilence) {
                  setShowLogosAI(true);
                } else {
                  toast.success("Reflexão Logos preparada para leitura posterior.");
                }
              }}
            />

            <NoteEditModal 
              isOpen={isNoteModalOpen}
              onClose={() => setIsNoteModalOpen(false)}
              onSave={handleAddNoteOrHighlight}
              onDelete={() => {
                if (activeHighlight) {
                  deleteChapterNote(activeHighlight.id);
                  setActiveHighlight(null);
                  setIsNoteModalOpen(false);
                }
              }}
              initialText={activeHighlight?.note_text === 'Destacado para meditação' ? '' : activeHighlight?.note_text}
              initialColor={activeHighlight?.highlight_color || 'yellow'}
              title={activeHighlight ? 'Editar Reflexão' : 'Nova Reflexão'}
              isEditing={!!activeHighlight}
            />

            <ReadingProgress 
              progress={readingProgress}
              onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              onScrollToPercentage={(p) => {
                const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                window.scrollTo({ top: (p / 100) * totalHeight, behavior: 'smooth' });
              }}
              showResume={lastReadMark && lastReadMark.url !== window.location.pathname + window.location.search}
              onResumeLast={() => {
                const behavior = settings.resumeBehavior || 'confirm';
                if (behavior === 'always' || (behavior === 'once' && sessionResumeUsed)) {
                   navigate(lastReadMark.url);
                } else if (behavior === 'never') {
                   toast.info('Retomada automática desativada nas configurações.');
                } else if (confirm(`Deseja retomar a leitura em: ${lastReadMark.label}?`)) {
                   if (behavior === 'once') setSessionResumeUsed(true);
                   navigate(lastReadMark.url);
                }
              }}
              label={`${selectedBook.name} ${selectedChapter}`}
              isSubtle={settings.visualSilence}
              lastParagraphId={activeVerseId || undefined}
              onBookmarkCurrent={handleBookmarkCurrent}
              onReturnToParagraph={handleReturnToParagraph}
            />


            {/* Cross References Panel - Below the text for focused reading */}
            {/* Relatio: Intelligent Contextual Connections */}
            {!isLoading && !bibleError && (
              <>
                <ChapterNotesList 
                  notes={currentChapterNotes} 
                  onDeleteNote={deleteChapterNote}
                  onNoteClick={(note) => {
                    if (note.verse) {
                      const el = document.getElementById(`v${note.verse}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                />
                
                <Suspense fallback={null}>
                  <LogosContextualSuggestions
                    type="bible"
                    context={`${selectedBook.name} ${selectedChapter}`}
                    onSelectSuggestion={(prompt) => {
                      setLogosAIInitialQuery(prompt);
                      setLogosAIContext(`${selectedBook.name} ${selectedChapter}`);
                      setShowLogosAI(true);
                    }}
                  />
                </Suspense>

                <div className="w-full max-w-[65ch] mx-auto opacity-80 hover:opacity-100 transition-opacity">
                  <Relatio 
                    context={{
                      type: 'bible',
                      id: `bible-${selectedBook.abbr}-${selectedChapter}`,
                      abbr: selectedBook.abbr,
                      chapter: selectedChapter,
                      tags: [selectedBook.name, 'Biblia', 'Escritura', 'Palavra de Deus']
                    }}
                    onNavigateToBible={(abbr, ch) => {
                      const book = BIBLE_CATEGORIES['Antigo Testamento'].concat(BIBLE_CATEGORIES['Novo Testamento'])
                        .flatMap(cat => cat.books)
                        .find(b => b.abbr === abbr);
                      if (book) {
                        setSelectedBook(book);
                        setSelectedChapter(ch);
                        setViewMode('reading');
                        window.scrollTo(0, 0);
                      }
                    }}
                    onNavigateToCIC={handleNavigateToCIC}
                    onNavigateToDoc={handleNavigateToDoc}
                    onSelectLogosQuery={(prompt) => {
                      setLogosAIInitialQuery(prompt);
                      setLogosAIContext(`${selectedBook.name} ${selectedChapter}`);
                      setShowLogosAI(true);
                    }}
                  />
                </div>
              </>
            )}




            {/* Deep Content Section for famous Bible Chapters */}
            {selectedBook.abbr === 'Jo' && selectedChapter === 3 && (
              <DeepContentSection 
                content={{
                  textoBase: "Porque Deus amou tanto o mundo que deu o seu Filho unigénito, para que todo o que n’Ele crê não pereça, mas tenha a vida eterna.",
                  explicacao: "Este versículo (João 3:16) é frequentemente chamado de 'o Evangelho em miniatura'. Ele resume o plano de salvação de Deus: amor sacrificial que busca resgatar a humanidade através de Jesus.",
                  interpretacaoProfunda: "O 'amor' aqui mencionado (ágapé) não é um sentimento, mas uma decisão da vontade de dar-se inteiramente. Deus não 'precisava' salvar o mundo, mas escolheu fazê-lo pelo valor infinito que Ele atribui a cada alma humana.",
                  aplicacaoPratica: "Tente olhar para as pessoas ao seu redor hoje como pessoas que Deus amou a ponto de dar Seu Filho. Isso muda como tratamos os outros e como vemos a nós mesmos.",
                  reflexaoFinal: "Eu realmente acredito que sou amado por Deus com essa intensidade, ou trato minha fé como apenas um conjunto de regras?",
                  exercicio: "Passe 2 minutos em silêncio repetindo mentalmente: 'Deus me amou tanto que deu Seu Filho por mim'."
                }} 
                contentType="bible"
                title="Lectio Divina Profunda" 
              />
            )}

            {/* Mark as read button */}
            {!isLoading && !bibleError && (
              <Button 
                variant={chaptersRead[selectedBook.abbr]?.has(selectedChapter) ? "outline" : "default"}
                onClick={() => markChapterRead(selectedBook.abbr, selectedChapter, selectedBook.chapters)}
                className="w-full h-12 text-base font-bold"
              >
                {chaptersRead[selectedBook.abbr]?.has(selectedChapter) ? (
                  <><Icons.CheckCircle2 className="w-5 h-5 mr-2" /> Capítulo Lido</>
                ) : (
                  'Marcar como Lido'
                )}
              </Button>
            )}

            {/* Next Chapter Card */}
            {!isLoading && !bibleError && selectedChapter < selectedBook.chapters && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card 
                  className="premium-card-interactive"
                  onClick={() => navigateChapter(1)}>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-premium-tiny font-black uppercase tracking-widest text-primary mb-1">Próximo Capítulo</p>
                      <h3 className="text-lg font-bold font-serif">{selectedBook.name} {selectedChapter + 1}</h3>
                    </div>
                    <Icons.ChevronRight className="w-6 h-6 text-primary" />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* If end of book */}
            {!isLoading && !bibleError && selectedChapter >= selectedBook.chapters && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="premium-card border-secondary/40 bg-secondary/5 text-center p-8">
                  <div className="flex flex-col items-center gap-4">
                    <Icons.CheckCircle2 className="w-12 h-12 text-primary" />
                    <h2 className="text-xl font-bold font-serif">Livro Concluído!</h2>
                    <p className="text-sm text-muted-foreground">Você concluiu a leitura de {selectedBook.name}. Que a Palavra de Deus continue frutificando em seu coração.</p>
                    <Button onClick={() => setViewMode('books')} className="mt-4">Ver Todos os Livros</Button>
                  </div>
                </Card>
              </motion.div>
            )}
          {!settings.totalSilence && showLogosAI && (
            <div className="w-full max-w-[72ch] mx-auto mt-24 mb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <React.Suspense fallback={<BibleChapterSkeleton />}>
                <LogosAI 
                  isOpen={showLogosAI} 
                  onClose={() => {
                    setShowLogosAI(false);
                    setLogosAIInitialQuery('');
                  }} 
                  context={logosAIContext}
                  initialQuery={logosAIInitialQuery}
                  type="bible"
                  variant="integrated"
                />
              </React.Suspense>
            </div>
          )}
          </div>
        </div>
      </ContemplativeLayout>
    );
  }







  if (viewMode === 'chapters' && selectedBook) {
    return (
      <ContemplativeLayout
        subtitle={`${selectedBook.name}`}
        title="Capítulos"
        maxW="max-w-6xl"
      >
        <div className="stack-rhythm">



          <Button 
            variant="ghost" 
            onClick={goBack}
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary/40 hover:text-primary transition-all"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Todos os Livros
          </Button>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-2 md:gap-4">
            {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => {
              const isRead = chaptersRead[selectedBook.abbr]?.has(ch);
              const isLastReadChapter = lastReadMark?.content_id === selectedBook.abbr && lastReadMark?.chapter === ch;
              
              return (
                <motion.button 
                  key={ch} 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectChapter(ch)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-2xl border text-sm font-bold transition-all relative group
                    ${isRead 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : isLastReadChapter
                        ? 'bg-secondary/10 border-secondary text-primary'
                        : 'bg-card border-primary/5 text-primary hover:border-primary/20'}`}
                >
                  <span>{ch}</span>
                  {isLastReadChapter && (
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-secondary animate-pulse whitespace-nowrap">
                      Retomar
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </ContemplativeLayout>
    );
  }


  return (
    <ContemplativeLayout 
      subtitle="A Palavra de Deus"
      title="Sagrada Escritura"
      maxW="max-w-6xl"
    >
      <SEOHead 
        title="Bíblia Sagrada | Cathedra Digital"
        description="Explore as Sagradas Escrituras em uma experiência contemplativa premium."
        path="/bible"
        type="book"
      />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Book",
          "name": "Bíblia Sagrada",
          "author": "Inspirada por Deus / Tradição da Igreja",
          "genre": "Religioso / Sagrada Escritura",
          "publisher": {
            "@type": "Organization",
            "name": "Cathedra Digital"
          },
          "about": "Palavra de Deus e base da fé católica."
        })}
      </script>
      
      <div className="space-y-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-primary/[0.04] pb-12">
          <div className="flex gap-4">
            {(['Antigo Testamento', 'Novo Testamento'] as const).map(t => (
              <Button
                key={t}
                variant="ghost"
                onClick={() => setTestament(t)}
                className={`px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] transition-all
                  ${testament === t 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground/40 hover:text-primary'}`}
              >
                {t}
              </Button>
            ))}
          </div>
          
          <div className="relative group w-full md:w-80">
            <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60 group-focus-within:text-primary/40 transition-colors" />
            <input
              type="text"
              placeholder="Buscar livro..."
              className="search-input-premium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-24">
          {filteredCategories.map((cat) => (
            <section key={cat.label} className="space-y-12">
              <div className="flex items-center gap-6">
                <div className="w-8 h-8 rounded-full bg-primary/[0.02] border border-primary/10 flex items-center justify-center">
                  <cat.icon className="w-4 h-4 text-primary/60" />
                </div>
                <h2 className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.6em]">{cat.label}</h2>
                <div className="h-px flex-1 bg-border/5" />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                {cat.books.map(book => {
                  const isRead = completedBooks.has(book.abbr);
                  return (
                    <motion.button
                      key={book.abbr}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectBook(book)}
                      className={`text-left p-6 md:p-8 premium-card-interactive group flex flex-col gap-4 relative
                        ${isRead ? 'border-primary/20 bg-primary/[0.02]' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">{book.abbr}</span>
                        {isRead && <Icons.CheckCircle2 className="w-3.5 h-3.5 text-primary/60" />}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-display font-medium text-lg text-primary group-hover:text-secondary transition-colors leading-tight">{book.name}</h3>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{book.chapters} Capítulos</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </ContemplativeLayout>
  );
});

export default Bible;