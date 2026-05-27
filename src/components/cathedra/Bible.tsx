import React, { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
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
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { useAutoFocus } from '@/hooks/useAutoFocus';
import { useRenderPerf } from '@/hooks/useRenderPerf';
import { History, LayoutPanelLeft, Compass, ChevronLeft, ChevronRight, X, StopCircle } from 'lucide-react';
import ContemplativeLayout from './ContemplativeLayout';
import useReadingAutoHide from '@/hooks/useReadingAutoHide';


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
  { label: 'P', size: 'text-base', leading: 'leading-relaxed' },
  { label: 'M', size: 'text-lg md:text-xl', leading: 'leading-[1.8]' },
  { label: 'G', size: 'text-xl md:text-2xl', leading: 'leading-[1.9]' },
];

const Bible: React.FC = () => {
  useRenderPerf('Bible', 15);
  useReadingAutoHide();
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
  const { settings, updateSettings } = useReadingSettings();
  const { marks, saveLastRead, getLastRead } = useReadingMarks();
  const [showLogosAI, setShowLogosAI] = useState(false);
  const [lastReadMark, setLastReadMark] = useState<any>(null);
  const [shouldAutoResume, setShouldAutoResume] = useState(true);
  const [logosAIContext, setLogosAIContext] = useState('');
  const [showCrossRefs, setShowCrossRefs] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user, profile } = useAuth();
  const completedBooks = useMemo(() => new Set(profile?.completed_books || []), [profile?.completed_books]);


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
      if (viewMode !== 'reading' || !selectedBook) return;
      if (e.key === 'ArrowLeft') navigateChapter(-1);
      if (e.key === 'ArrowRight') navigateChapter(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, selectedBook, navigateChapter]);

  useEffect(() => {
    const fetchLastRead = async () => {
      const lr = await getLastRead();
      setLastReadMark(lr);
    };
    fetchLastRead();
  }, [getLastRead]);

  useEffect(() => {
    if (viewMode === 'reading' && !isLoading && verses.length > 0) {
      const savedScroll = localStorage.getItem('cathedra_last_bible_scroll');
      const savedVerse = localStorage.getItem('cathedra_last_bible_verse');
      
      // Better resume: only if no specific verse in URL
      if (!searchParams.get('v') && !searchParams.get('verse')) {
        if (savedScroll && parseInt(savedScroll) > 100) {
          setTimeout(() => {
            window.scrollTo({ top: parseInt(savedScroll), behavior: 'smooth' });
          }, 300);
        } else if (savedVerse) {
          const vNum = parseInt(savedVerse);
          setTimeout(() => {
            const el = document.getElementById(`v${vNum}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 400);
        }
      }
    }
  }, [viewMode, isLoading, verses.length]);

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
          <div className="flex items-center justify-between gap-4 border-b border-border/5 pb-8">
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

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-card p-2 rounded-premium border border-border shadow-soft">
          <div className="flex items-center gap-2">
            <AudioButton variant="default" className="px-6" />
            <ShareButton
              title={`${selectedBook.name} ${selectedChapter}${highlightedVerse ? `:${highlightedVerse}` : ''}`}
              text={`Leia ${selectedBook.name}, capítulo ${selectedChapter} na Cathedra Digital`}
              url={buildBibleAbsoluteUrl({ abbr: selectedBook.abbr, chapter: selectedChapter, verse: highlightedVerse ?? undefined })}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button disabled={selectedChapter <= 1} onClick={() => navigateChapter(-1)}
              className="px-3 py-2 rounded-full bg-card border border-border text-sm font-bold disabled:opacity-30 hover:bg-primary/10 transition-all">
              ← Anterior
            </Button>
            <Button disabled={selectedChapter >= selectedBook.chapters} onClick={() => navigateChapter(1)}
              className="px-3 py-2 rounded-full bg-card border border-border text-sm font-bold disabled:opacity-30 hover:bg-primary/10 transition-all">
              Próximo →
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {lastReadMark && lastReadMark.url !== window.location.pathname + window.location.search && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => navigate(lastReadMark.url)}
                className="rounded-full flex items-center gap-2 border-secondary/20 shadow-premium animate-in fade-in slide-in-from-right-4 duration-700"
              >
                <Icons.History className="w-4 h-4" />
                <span className="hidden sm:inline">Continuar de onde parei</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/diario')}
              className="rounded-full flex items-center gap-2 border-primary/10 hover:bg-primary/5"
            >
              <LayoutPanelLeft className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest">Meu Diário</span>
            </Button>
            <ReadingControlPanel />
            {(crossRefs.length > 0 || docsRefs.length > 0) && (
              <Button onClick={() => setShowCrossRefs(!showCrossRefs)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${showCrossRefs ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground'}`}
                title="Conexões Sagradas (Catecismo & Magistério)">
                <Compass className={`w-4 h-4 ${showCrossRefs ? 'animate-spin-slow' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Conexões</span>
                <span className="text-xs font-bold bg-primary/10 px-1.5 rounded-full">{crossRefs.length + docsRefs.length}</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowLogosAI(!showLogosAI)}
              className={`rounded-full flex items-center gap-2 ${showLogosAI ? 'bg-primary text-white' : ''}`}
            >
              <Icons.Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Logos IA</span>
            </Button>
          </div>
        </div>


        {/* Content with Side Nav */}
        <div className="flex flex-col xl:flex-row gap-12 lg:gap-24 items-start mt-12 md:mt-24">
          {/* Elegant Side Navigation for Chapters (Desktop) */}
          <aside className="reader-navigation-aside">
            <div className="space-y-4">
              <p className="text-premium-tiny font-medium uppercase tracking-[0.3em] text-primary/40 px-4">Capítulos: {selectedBook.name}</p>
              <nav className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
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

          <div className="flex-1 w-full space-y-8 max-w-[75ch] mx-auto">
            <div className="reader-container bg-card/10 backdrop-blur-xl border border-primary/[0.03] overflow-hidden rounded-[3rem] md:rounded-[5rem] relative transition-all duration-1000">
              <div className="p-8 md:p-20 lg:p-24">


                {isLoading ? (
                  <BibleChapterSkeleton />
                ) : bibleError ? (
                  <div className="text-center py-12 space-y-4">
                    <p className="text-muted-foreground">{bibleError}</p>
                    <Button variant="outline" onClick={() => window.location.reload()}>Recarregar</Button>
                  </div>
                ) : (
                  <div className={`font-size-${settings.fontSize} font-family-${settings.fontFamily} text-foreground/90 transition-all duration-300 reader-text`}>

                    {verses.map(v => {
                      const relatedP = verseToCic[v.number];
                      return (
                        <div key={v.number} 
                          id={`v${v.number}`}
                          className={`group relative py-2 px-3 rounded-premium transition-all duration-300 mb-1
                            ${highlightedVerse === v.number ? 'bg-primary/[0.03] ring-1 ring-primary/5' : 'hover:bg-primary/[0.01]'}`}>
                          <div className="flex items-start gap-3">
                            <sup className="text-[0.55em] font-medium text-primary mt-2 select-none opacity-20 group-hover:opacity-40 transition-opacity">{v.number}</sup>
                            <div className="flex-1" onClick={() => {
                              const vNum = v.number;
                              setHighlightedVerse(vNum === highlightedVerse ? null : vNum);
                              setLogosAIContext(`${selectedBook.name} ${selectedChapter}:${vNum} - ${v.text}`);
                              localStorage.setItem('cathedra_last_bible_verse', vNum.toString());
                              localStorage.setItem('cathedra_last_bible_scroll', window.scrollY.toString());
                              
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
                              <span className="cursor-pointer">{v.text}</span>
                              {relatedP && (
                                <span className="inline-flex gap-0.5 ml-2">
                                  {relatedP.map(p => (
                                    <CatechismPopover key={p} paragraph={p} onNavigate={handleNavigateToCIC} variant="mini" />
                                  ))}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <NotesPanel contentType="bible" contentId={`${selectedBook.abbr}:${selectedChapter}:${v.number}`} contentLabel={`${selectedBook.abbr} ${selectedChapter}:${v.number}`} />
                              <ReadingMark contentType="bible" contentId={`${selectedBook.abbr}:${selectedChapter}:${v.number}`} label={`${selectedBook.name} ${selectedChapter}:${v.number}`} chapter={selectedChapter} position={v.number} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Cross References Panel - Below the text for focused reading */}
            {/* Relatio: Intelligent Contextual Connections */}
            {!isLoading && !bibleError && (
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
                />
              </div>
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
          </div>
        </div>
        {showLogosAI && (
          <div className="w-full max-w-[72ch] mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <React.Suspense fallback={<BibleChapterSkeleton />}>
              <LogosAI 
                isOpen={showLogosAI} 
                onClose={() => setShowLogosAI(false)} 
                context={logosAIContext}
                type="bible"
                variant="integrated"
              />
            </React.Suspense>
          </div>
        )}

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
        <div className="space-y-12">
          <Button 
            variant="ghost" 
            onClick={goBack}
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary/40 hover:text-primary transition-all"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Todos os Livros
          </Button>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
            {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => {
              const isRead = chaptersRead[selectedBook.abbr]?.has(ch);
              return (
                <motion.button 
                  key={ch} 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectChapter(ch)}
                  className={`aspect-square flex items-center justify-center rounded-full border text-sm font-bold transition-all
                    ${isRead 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-card border-primary/5 text-primary hover:border-primary/20'}`}
                >
                  {ch}
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
            <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20 group-focus-within:text-primary/40 transition-colors" />
            <input
              type="text"
              placeholder="Buscar livro..."
              className="w-full pl-12 pr-6 py-4 bg-primary/[0.01] border border-border/10 rounded-full focus:outline-none focus:ring-1 focus:ring-primary/10 transition-all font-serif italic text-lg placeholder:text-primary/10"
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
                  <cat.icon className="w-4 h-4 text-primary/30" />
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
                      className={`flex flex-col items-center justify-center p-8 rounded-premium border transition-all relative group
                        ${isRead 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-card border-primary/[0.04] text-primary hover:border-primary/10'}`}
                    >
                      <span className="text-2xl font-display font-medium leading-none mb-2">{book.abbr}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-center leading-tight truncate w-full opacity-40 group-hover:opacity-100 transition-opacity">
                        {book.name}
                      </span>
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
};

export default Bible;