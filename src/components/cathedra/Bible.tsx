import React, { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense, memo } from 'react';
import { useRenderPerf } from '@/hooks/useRenderPerf';
import { motion, AnimatePresence } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import StaggeredList from './StaggeredList';
import Relatio from './Relatio';
import DeepContentSection from './DeepContentSection';
import { getBibleCrossRefs, CIC_TO_BIBLE, BIBLE_TO_CIC, getBibleDocs } from '@/data/cross-references';
import { cn } from '@/lib/utils';
import { CathedraCard } from './CathedraCard';

import CatechismPopover from './CatechismPopover';
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
// CathedraCard is already imported above
// import { Card, CardContent } from '@/components/ui/card';
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

import ContemplativeLayout from './ContemplativeLayout';
import { SectionHeader } from './SectionHeader';
import { CathedraOverlay } from './CathedraOverlay';
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
  { label: 'P', size: 'text-premium-base md:text-premium-lg', leading: 'leading-relaxed' },
  { label: 'M', size: 'text-premium-lg md:text-premium-xl', leading: 'leading-[1.75]' },
  { label: 'G', size: 'text-premium-xl md:text-premium-2xl', leading: 'leading-[1.9]' },
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
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['var(--primary)', 'var(--secondary)', 'var(--accent)'] });
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
      setShouldAutoResume(false); // Icons.User clicked a specific link, don't auto-resume
      
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

      // Icons.History navigation (Alt + Left/Right)
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
      
      // 1) Icons.Check in-memory cache
      const memCached = bibleCache.get(cacheKey);
      if (memCached) {
        setVerses(memCached);
        setBibleError('');
        return;
      }

      setIsLoading(true);
      setBibleError('');
      setVerses([]);

      // 2 Icons.Check IndexedDB cache, then direct DB, then fetch
      import('@/lib/offlineCache').then(({ getCachedBibleChapter, cacheBibleChapter }) => {
        getCachedBibleChapter(selectedBook.abbr, selectedChapter).then(async (idbCached) => {
          if (idbCached?.verses?.length > 0) {
            setVerses(idbCached.verses);
            bibleCache.set(cacheKey, idbCached.verses);
            setIsLoading(false);
            return;
          }

          // 3) Icons.Check Direct DB Connection (spiritual_contents) - No AI fallback requested
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
        icon={Icons.Bible}
      >
        <SEOHead 
          title={`${selectedBook.name} ${selectedChapter} | Bíblia Sagrada`}
          description={`Leia ${selectedBook.name}, capítulo ${selectedChapter}.`}
          path={`/bible?book=${selectedBook.abbr}&ch=${selectedChapter}`}
        />
        
        <div className="max-w-[70ch] mx-auto">
          {/* Unified Reading Navigation */}
          <div className="flex items-center justify-between gap-spacing-md py-spacing-xs border-b border-primary/5 mb-spacing-md">
            <Button 
              variant="ghost" 
              onClick={goBack}
              className="text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary transition-all"
            >
              ← Sumário
            </Button>

            {lastReadMark && lastReadMark.url !== window.location.pathname + window.location.search && (
              <Button 
                variant="ghost" 
                onClick={() => navigate(lastReadMark.url)}
                className="flex items-center gap-spacing-xs text-[10px] font-bold uppercase tracking-[0.3em] text-primary/40 hover:text-primary"
              >
                <Icons.History className="w-spacing-md h-spacing-md" />
                Ponto salvo
              </Button>
            )}
          </div>

          <div className="flex items-center gap-spacing-lg">
            <button 
              disabled={selectedChapter <= 1} 
              onClick={() => {
                const prevCh = selectedChapter - 1;
                setSelectedChapter(prevCh);
                setVerses([]);
                navigate(`/bible?book=${selectedBook.abbr}&ch=${prevCh}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary disabled:opacity-20"
            >
              Anterior
            </button>
            <span className="text-premium-xs font-serif italic text-primary/20">Capítulo {selectedChapter}</span>
            <button 
              disabled={selectedChapter >= selectedBook.chapters} 
              onClick={() => {
                const nextCh = selectedChapter + 1;
                setSelectedChapter(nextCh);
                setVerses([]);
                navigate(`/bible?book=${selectedBook.abbr}&ch=${nextCh}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                markChapterRead(selectedBook.abbr, selectedChapter, selectedBook.chapters);
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary disabled:opacity-20"
            >
              Próximo
            </button>
          </div>
          
          <ReadingControlPanel />
        </div>

        {/* Highlighted verse indicator (when ?v= is active) */}
        {highlightedVerse && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid="bible-highlight-indicator"
            className="flex items-center justify-between gap-spacing-sm px-spacing-md py-spacing-sm rounded-premium-full bg-primary/10 border border-primary/30"
          >
            <div className="flex items-center gap-spacing-xs min-w-spacing-0">
              <Icons.Sparkles className="w-spacing-md h-spacing-md text-primary shrink-0" />
              <span className="text-premium-sm font-bold text-primary truncate">
                Destacado: {selectedBook.name} {selectedChapter}:{highlightedVerse}
              </span>
            </div>
            <Button
              onClick={() => setHighlightedVerse(null)}
              aria-label="Limpar destaque"
              className="text-premium-xs font-bold text-primary/70 hover:text-primary transition-colors flex items-center gap-spacing-2xs shrink-0"
            >
              Limpar
              <Icons.X className="w-spacing-sm h-spacing-sm" />
            </Button>
          </motion.div>
        )}

        {/* Atmospheric Floating Toolbar - Minimalist */}
        <div className="flex items-center justify-between gap-spacing-sm flex-wrap bg-background/20 backdrop-blur-3xl p-spacing-2xs rounded-premium-full border border-primary/5 header-reading-auto-hide fixed bottom-spacing-4xl left-spacing-2xs/2 -translate-x-1/2 z-40 transition-all duration-700 shadow-premium md:bottom-spacing-4xl">
          <div className="flex items-center gap-spacing-2xs">
            <AudioButton variant="ghost" className="rounded-premium-full w-spacing-xl h-spacing-xl p-spacing-0" />
            <ReadingControlPanel />
          </div>
          <div className="flex items-center gap-spacing-2xs">
            <Button variant="ghost" size="icon" className="rounded-premium-full w-spacing-xl h-spacing-xl p-spacing-0" onClick={() => setShowLogosAI(!showLogosAI)}>
              <Icons.Sparkles className={`w-spacing-md h-spacing-md ${showLogosAI ? 'text-primary' : 'text-primary/60'}`} />
            </Button>
            <ReadingMark contentType="bible" contentId={selectedBook.abbr} label={`${selectedBook.name} ${selectedChapter}`} chapter={selectedChapter} />
          </div>
        </div>

        {/* Minimal Desktop Nav Bar */}
        <div className="hidden md:flex items-center justify-between gap-spacing-md py-spacing-md border-b border-primary/5 mb-spacing-xl">
          <div className="flex items-center gap-spacing-sm">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goBack}
              className="text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary transition-all"
            >
              ← Sumário
            </Button>
            <div className="h-spacing-md w-px bg-border/20" />
            <ShareButton
              title={`${selectedBook.name} ${selectedChapter}${highlightedVerse ? `:${highlightedVerse}` : ''}`}
              text={`Leia ${selectedBook.name}, capítulo ${selectedChapter} na Cathedra Digital`}
              url={buildBibleAbsoluteUrl({ abbr: selectedBook.abbr, chapter: selectedChapter, verse: highlightedVerse ?? undefined })}
            />
          </div>

          <div className="flex items-center gap-spacing-lg">
            <button 
              disabled={selectedChapter <= 1} 
              onClick={() => navigateChapter(-1)}
              className="text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary disabled:opacity-20"
            >
              Anterior
            </button>
            <span className="text-premium-xs font-serif italic text-primary/20">Capítulo {selectedChapter}</span>
            <button 
              disabled={selectedChapter >= selectedBook.chapters} 
              onClick={() => navigateChapter(1)}
              className="text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary disabled:opacity-20"
            >
              Próximo
            </button>
          </div>

          <div className="flex items-center gap-spacing-md">
            {/* Controls are in the floating bar now for unified experience */}
          </div>
        </div>



        {/* Content with Side Nav */}
        <div className="mt-spacing-md md:mt-spacing-xl">
          <div className="flex flex-col gap-spacing-md lg:gap-spacing-xl items-start">
            <div className="flex-1 w-full max-w-[70ch] mx-auto relative">
              {currentChapterNotes.length > 0 && (
                <div className="space-y-spacing-md animate-in fade-in slide-in-from-left-spacing-md duration-1000">
                  <p className="text-premium-xs font-medium uppercase tracking-[0.3em] text-primary/40 px-spacing-md">Destaques & Notas</p>
                  <div className="flex flex-col gap-spacing-xs max-h-[40vh] overflow-y-auto no-scrollbar pr-spacing-xs">
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
                        className={`flex flex-col gap-spacing-2xs px-spacing-md py-spacing-sm rounded-premium border text-left transition-all hover:bg-primary/5
                          ${note.highlight_color ? `bg-${note.highlight_color}-50/50 border-${note.highlight_color}-200/30` : 'bg-card border-primary/5'}`}
                      >
                        <div className="flex items-center gap-spacing-xs">
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">Vs {note.verse}</span>
                          {note.highlight_color && (
                            <div className={`w-spacing-xs h-spacing-xs rounded-premium-full highlight-${note.highlight_color}`} />
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed line-clamp-spacing-xs italic text-muted-foreground">
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
                <div className="py-spacing-xl md:py-spacing-3xl lg:py-spacing-4xl">




                {isLoading ? (
                  <BibleChapterSkeleton />
                ) : bibleError ? (
                  <div className="text-center py-spacing-2xl space-y-spacing-md">
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
                        className="fixed bottom-spacing-4xl left-spacing-2xs/2 -translate-x-1/2 z-[160] px-spacing-md py-spacing-xs bg-primary/80 backdrop-blur-md text-primary-foreground rounded-premium-full text-[9px] font-black uppercase tracking-widest flex items-center gap-spacing-sm border border-white/10 shadow-premium"
                      >
                        <span className="flex items-center gap-spacing-2xs"><kbd className="bg-white/20 px-spacing-2xs py-spacing-3xs rounded">H</kbd> Destacar</span>
                        <div className="w-px h-spacing-sm bg-white/20" />
                        <span className="flex items-center gap-spacing-2xs"><kbd className="bg-white/20 px-spacing-2xs py-spacing-3xs rounded">N</kbd> Nota</span>
                        <div className="w-px h-spacing-sm bg-white/20" />
                        <span className="flex items-center gap-spacing-2xs"><kbd className="bg-white/20 px-spacing-2xs py-spacing-3xs rounded">Esc</kbd> Limpar</span>
                      </motion.div>
                    )}

                    <div className="flex flex-col gap-spacing-xl md:gap-spacing-2xl pb-spacing-4xl">
                    {verses.map(v => {
                      const relatedP = verseToCic[v.number];
                      return (
                        <div key={v.number} 
                          id={`v${v.number}`}
                          className={`group relative py-spacing-sm md:py-spacing-md px-spacing-xs md:px-spacing-lg transition-all duration-700
                            ${highlightedVerse === v.number ? 'bg-primary/[0.03] rounded-premium-lg' : 'hover:bg-primary/[0.01]'}`}>
                          <div className="flex items-start gap-spacing-sm md:gap-spacing-md">

                            <span className="text-[0.7em] font-serif italic text-primary/20 mt-spacing-sm select-none group-hover:text-primary/40 transition-colors duration-700 w-spacing-lg shrink-0 text-right">{v.number}</span>
                            <div className="flex-1 cursor-pointer" onClick={() => {
                              const vNum = v.number;
                              setHighlightedVerse(vNum === highlightedVerse ? null : vNum);
                              setLogosAIContext(`${selectedBook.name} ${selectedChapter}:${vNum} - ${v.text}`);
                              localStorage.setItem(`cathedra_last_bible_verse_${selectedBook.abbr}_${selectedChapter}`, vNum.toString());
                              localStorage.setItem(`cathedra_last_bible_scroll_${selectedBook.abbr}_${selectedChapter}`, window.scrollY.toString());
                              
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
                              <p className="leading-[1.8] font-serif font-light text-premium-xl md:text-premium-2xl lg:text-[2.5rem] text-foreground/90 dark:text-foreground/95 group-hover:text-foreground transition-colors duration-700 tracking-tight">
                                {currentChapterNotes.some(n => n.verse === v.number && n.highlight_color) && (
                                  <span 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const note = currentChapterNotes.find(n => n.verse === v.number && n.highlight_color);
                                      if (note) setActiveHighlight(note);
                                    }}
                                    className={`highlight-${currentChapterNotes.find(n => n.verse === v.number)?.highlight_color} px-spacing-3xs rounded-premium-sm mr-spacing-2xs`}
                                  >
                                    {v.text}
                                  </span>
                                )}
                                {!currentChapterNotes.some(n => n.verse === v.number && n.highlight_color) && (
                                  <span>{v.text}</span>
                                )}

                                
                                {relatedP && (
                                  <span className="inline-flex gap-spacing-3xs ml-spacing-xs align-middle">
                                    {relatedP.map(p => (
                                      <CatechismPopover key={p} paragraph={p} onNavigate={handleNavigateToCIC} variant="mini" />
                                    ))}
                                  </span>
                                )}
                              </p>
                              
                              {currentChapterNotes.filter(n => n.verse === v.number).map(note => (
                                <div key={note.id} className="mt-spacing-sm p-spacing-md bg-primary/[0.02] border-l border-primary/10 rounded-r-lg text-[13px] italic text-muted-foreground group/note relative">
                                  {note.note_text}
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); deleteChapterNote(note.id); }}
                                    className="absolute top-spacing-xs right-spacing-xs opacity-0 group-hover/note:opacity-100 transition-opacity p-spacing-2xs hover:text-destructive"
                                  >
                                    <Icons.X className="w-spacing-sm h-spacing-sm" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-spacing-2xs opacity-0 group-hover:opacity-100 transition-opacity invisible md:visible">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="w-spacing-lg h-spacing-lg rounded-premium-full hover:bg-primary/5 text-primary/40 hover:text-primary transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHighlightedVerse(v.number);
                                  setShowLogosAI(true);
                                  setLogosAIContext(`${selectedBook.name} ${selectedChapter}:${v.number} - ${v.text}`);
                                }}
                              >
                                <Icons.Sparkles className="w-spacing-sm h-spacing-sm" />
                              </Button>
                              <ReadingMark contentType="bible" contentId={`${selectedBook.abbr}:${selectedChapter}:${v.number}`} label={`${selectedBook.name} ${selectedChapter}:${v.number}`} chapter={selectedChapter} position={v.number} />
                              <ShareButton 
                                title={`${selectedBook.name} ${selectedChapter}:${v.number}`} 
                                text={v.text} 
                                url={buildBibleAbsoluteUrl({ abbr: selectedBook.abbr, chapter: selectedChapter, verse: v.number })}
                                className="w-spacing-lg h-spacing-lg p-spacing-0 text-primary/40 hover:text-primary"
                              />
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

            <div className="flex-1 w-full max-w-[70ch] mx-auto">
              <div className="w-full relative">
                <div className="py-spacing-xl md:py-spacing-3xl lg:py-spacing-4xl">
                  {/* Mark as read button */}
                  {!isLoading && !bibleError && (
                    <Button 
                      variant={chaptersRead[selectedBook.abbr]?.has(selectedChapter) ? "outline" : "default"}
                      onClick={() => markChapterRead(selectedBook.abbr, selectedChapter, selectedBook.chapters)}
                      className="w-full h-spacing-2xl text-premium-base font-bold mb-spacing-xl"
                    >
                      {chaptersRead[selectedBook.abbr]?.has(selectedChapter) ? (
                        <><Icons.CheckCircle2 className="w-spacing-md h-spacing-md mr-spacing-xs" /> Capítulo Lido</>
                      ) : (
                        'Marcar como Lido'
                      )}
                    </Button>
                  )}

                  {/* Next Chapter Card */}
                  {!isLoading && !bibleError && selectedChapter < selectedBook.chapters && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                      <CathedraCard 
                        variant="interactive"
                        padding="none"
                        className="premium-card-interactive mb-spacing-xl"
                        onClick={() => {
                          const nextCh = selectedChapter + 1;
                          setSelectedChapter(nextCh);
                          setVerses([]);
                          navigate(`/bible?book=${selectedBook.abbr}&ch=${nextCh}`);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          markChapterRead(selectedBook.abbr, selectedChapter, selectedBook.chapters);
                        }}>
                        <div className="p-spacing-lg flex items-center justify-between">
                          <div>
                            <p className="text-premium-xs font-black uppercase tracking-widest text-primary mb-spacing-2xs">Próximo Capítulo</p>
                            <h3 className="text-premium-lg font-bold font-serif">{selectedBook.name} {selectedChapter + 1}</h3>
                          </div>
                          <Icons.ChevronRight className="w-spacing-md h-spacing-md text-primary/30" />
                        </div>
                      </CathedraCard>
                    </motion.div>
                  )}

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
              </div>
            </div>

            <aside className="reader-navigation-aside space-y-spacing-2xl shrink-0">
              <div className="space-y-spacing-md">
                <p className="text-premium-xs font-medium uppercase tracking-[0.3em] text-primary/40 px-spacing-md">Capítulos: {selectedBook.name}</p>
                <nav className="flex flex-col gap-spacing-2xs max-h-[40vh] overflow-y-auto no-scrollbar pr-spacing-xs">
                  {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                    <button
                      key={ch}
                      onClick={() => selectChapter(ch)}
                      className={`flex items-center gap-spacing-sm px-spacing-md py-spacing-xs rounded-premium-full text-premium-sm font-medium transition-all
                        ${selectedChapter === ch 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'}`}
                    >
                      <span className="opacity-50 text-[10px] w-spacing-md">{ch}</span>
                      <span>Capítulo {ch}</span>
                      {chaptersRead[selectedBook.abbr]?.has(ch) && (
                        <Icons.CheckCircle2 className="w-spacing-sm h-spacing-sm ml-auto opacity-60" />
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>
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


            {/* Icons.Cross References Panel - Below the text for focused reading */}
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

                {!settings.totalSilence && showLogosAI && (
                  <div className="w-full max-w-[70ch] mx-auto mt-spacing-xl mb-spacing-xl animate-in fade-in slide-in-from-bottom-spacing-md duration-1000">
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
              </>
              </>
            )}
          </div>
        </div>
      </ContemplativeLayout>
    );
  }







  if (viewMode === 'chapters' && selectedBook) {
    return (
      <ContemplativeLayout
        subtitle="Selectio Capitulorum"
        title={selectedBook.name}
        icon={Icons.Bible}
      >
        <div className="w-full space-y-spacing-3xl pb-spacing-4xl">
          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              onClick={goBack}
              className="px-spacing-xl py-spacing-sm h-auto rounded-premium-full text-[9px] font-black uppercase tracking-[0.3em] text-primary/40 hover:text-primary border border-primary/5 transition-all"
            >
              <Icons.ArrowLeft className="w-spacing-sm h-spacing-sm mr-spacing-xs" />
              Voltar aos Livros
            </Button>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-spacing-xs">
            {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch, idx) => {
              const isRead = chaptersRead[selectedBook.abbr]?.has(ch);
              const isLastReadChapter = lastReadMark?.content_id === selectedBook.abbr && lastReadMark?.chapter === ch;

              return (
                <CathedraCard
                  key={ch}
                  variant="interactive"
                  padding="none"
                  onClick={() => selectChapter(ch)}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center group relative overflow-hidden rounded-premium-lg",
                    isRead && "bg-primary/[0.01]"
                  )}
                >
                  <span className={cn(
                    "text-premium-sm font-display group-hover:scale-110 transition-all duration-700",
                    isLastReadChapter ? "text-primary font-bold" : "text-foreground/60"
                  )}>
                    {ch}
                  </span>
                  {isLastReadChapter && (
                    <div className="absolute bottom-spacing-2xs w-spacing-2xs h-spacing-2xs rounded-premium-full bg-primary animate-pulse" />
                  )}
                  {isRead && !isLastReadChapter && (
                    <div className="absolute top-spacing-2xs right-spacing-2xs w-spacing-3xs h-spacing-3xs rounded-premium-full bg-primary/20" />
                  )}
                </CathedraCard>
              );
            })}
          </div>
        </div>
      </ContemplativeLayout>
    );
  }

  return (
    <ContemplativeLayout
      subtitle="Verbum Domini"
      title="Bíblia Sagrada"
      icon={Icons.Bible}
    >
      <SEOHead 
        title="Bíblia Sagrada | Cathedra Digital"
        description="Acesse o Antigo e Novo Testamento com recursos de busca, anotações e conexões teológicas."
        path="/bible"
      />

      <div className="w-full space-y-spacing-2xl pb-spacing-4xl">
        {/* Unidade de Busca Unificada */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/[0.01] blur-xl rounded-premium-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <Icons.Search className="absolute left-spacing-lg top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-primary/20 group-focus-within:text-primary transition-all duration-700" />
          <input
            type="text"
            placeholder="Buscar livro ou abreviação..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-premium pl-spacing-3xl"
          />
        </div>

        <div className="flex justify-center mb-spacing-xl md:mb-spacing-2xl">
          <div className="flex bg-primary/[0.02] p-spacing-2xs rounded-premium-full border border-primary/5">
            {(['Antigo Testamento', 'Novo Testamento'] as const).map(t => (
              <Button
                key={t}
                variant="ghost"
                onClick={() => setTestament(t)}
                className={`px-spacing-xl py-spacing-sm h-auto rounded-premium-full text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-700 ${
                  testament === t 
                    ? 'bg-background text-primary shadow-premium scale-[1.05]' 
                    : 'text-muted-foreground/30 hover:text-primary'
                }`}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-spacing-2xl md:space-y-spacing-3xl">
          {filteredCategories.map((category, catIdx) => (
            <div key={category.label} className="space-y-spacing-md md:space-y-spacing-xl">
              <div className="flex items-center gap-spacing-lg">
                <div className={`w-spacing-2xl h-spacing-2xl rounded-premium flex items-center justify-center ${category.bgColor} opacity-60`}>
                  <category.icon className={`w-spacing-md h-spacing-md ${category.color}`} strokeWidth={1} />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/40">
                  {category.label}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-primary/[0.05] via-transparent to-transparent" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-spacing-sm">
                {category.books.map((book, bookIdx) => {
                  const isRead = completedBooks.has(book.abbr);
                  const progress = chaptersRead[book.abbr]?.size || 0;
                  
                  return (
                    <CathedraCard
                      key={book.abbr}
                      variant="interactive"
                      padding="none"
                      onClick={() => selectBook(book)}
                      className="group"
                    >
                      <div className="p-spacing-md flex items-center justify-between">
                        <div className="space-y-spacing-2xs">
                          <div className="flex items-center gap-spacing-xs">
                            <span className="text-[7px] font-black tracking-widest text-primary/20 group-hover:text-primary transition-colors">{book.abbr}</span>
                            <h3 className="text-premium-xs font-bold tracking-tight text-foreground/80 group-hover:text-primary transition-colors">
                              {book.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-spacing-xs">
                            <span className="text-[6px] font-bold uppercase tracking-widest text-muted-foreground/30">
                              {book.chapters} {book.chapters === 1 ? 'Capítulo' : 'Capítulos'}
                            </span>
                          </div>
                        </div>
                        <Icons.ChevronRight className="w-spacing-sm h-spacing-sm text-primary/10 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </CathedraCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ContemplativeLayout>
  );
});

export default Bible;