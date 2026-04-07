import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import StaggeredList from './StaggeredList';
import CrossReferencePanel from './CrossReferencePanel';
import { getBibleCrossRefs } from '@/data/cross-references';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import BibleSearch from './BibleSearch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ScrollText, Swords, Feather, Flame, Cross, Globe, Mail, BookOpen, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import ShareButton from './ShareButton';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { checkNewBadges, getBadgeById } from '@/lib/badges';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

type BibleBook = { name: string; abbr: string; chapters: number };
type BibleCategory = { label: string; icon: React.ElementType; color: string; bgColor: string; books: BibleBook[] };

const BIBLE_CATEGORIES: Record<string, BibleCategory[]> = {
  'Antigo Testamento': [
    { label: 'Pentateuco', icon: ScrollText, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', books: [
      { name: 'Gênesis', abbr: 'Gn', chapters: 50 }, { name: 'Êxodo', abbr: 'Ex', chapters: 40 },
      { name: 'Levítico', abbr: 'Lv', chapters: 27 }, { name: 'Números', abbr: 'Nm', chapters: 36 },
      { name: 'Deuteronômio', abbr: 'Dt', chapters: 34 },
    ]},
    { label: 'Históricos', icon: Swords, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800', books: [
      { name: 'Josué', abbr: 'Js', chapters: 24 }, { name: 'Juízes', abbr: 'Jz', chapters: 21 },
      { name: 'Rute', abbr: 'Rt', chapters: 4 }, { name: '1 Samuel', abbr: '1Sm', chapters: 31 },
      { name: '2 Samuel', abbr: '2Sm', chapters: 24 }, { name: '1 Reis', abbr: '1Rs', chapters: 22 },
      { name: '2 Reis', abbr: '2Rs', chapters: 25 }, { name: '1 Crônicas', abbr: '1Cr', chapters: 29 },
      { name: '2 Crônicas', abbr: '2Cr', chapters: 36 }, { name: 'Esdras', abbr: 'Esd', chapters: 10 },
      { name: 'Neemias', abbr: 'Ne', chapters: 13 }, { name: 'Tobias', abbr: 'Tb', chapters: 14 },
      { name: 'Judite', abbr: 'Jt', chapters: 16 }, { name: 'Ester', abbr: 'Est', chapters: 10 },
      { name: '1 Macabeus', abbr: '1Mc', chapters: 16 }, { name: '2 Macabeus', abbr: '2Mc', chapters: 15 },
    ]},
    { label: 'Sapienciais', icon: Feather, color: 'text-sky-600', bgColor: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800', books: [
      { name: 'Jó', abbr: 'Jó', chapters: 42 }, { name: 'Salmos', abbr: 'Sl', chapters: 150 },
      { name: 'Provérbios', abbr: 'Pr', chapters: 31 }, { name: 'Eclesiastes', abbr: 'Ecl', chapters: 12 },
      { name: 'Cântico dos Cânticos', abbr: 'Ct', chapters: 8 }, { name: 'Sabedoria', abbr: 'Sb', chapters: 19 },
      { name: 'Eclesiástico', abbr: 'Eclo', chapters: 51 },
    ]},
    { label: 'Profetas', icon: Flame, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800', books: [
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
    { label: 'Evangelhos', icon: Cross, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800', books: [
      { name: 'Mateus', abbr: 'Mt', chapters: 28 }, { name: 'Marcos', abbr: 'Mc', chapters: 16 },
      { name: 'Lucas', abbr: 'Lc', chapters: 24 }, { name: 'João', abbr: 'Jo', chapters: 21 },
    ]},
    { label: 'Atos', icon: Globe, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', books: [
      { name: 'Atos dos Apóstolos', abbr: 'At', chapters: 28 },
    ]},
    { label: 'Cartas Paulinas', icon: Mail, color: 'text-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800', books: [
      { name: 'Romanos', abbr: 'Rm', chapters: 16 }, { name: '1 Coríntios', abbr: '1Cor', chapters: 16 },
      { name: '2 Coríntios', abbr: '2Cor', chapters: 13 }, { name: 'Gálatas', abbr: 'Gl', chapters: 6 },
      { name: 'Efésios', abbr: 'Ef', chapters: 6 }, { name: 'Filipenses', abbr: 'Fl', chapters: 4 },
      { name: 'Colossenses', abbr: 'Cl', chapters: 4 }, { name: '1 Tessalonicenses', abbr: '1Ts', chapters: 5 },
      { name: '2 Tessalonicenses', abbr: '2Ts', chapters: 3 }, { name: '1 Timóteo', abbr: '1Tm', chapters: 6 },
      { name: '2 Timóteo', abbr: '2Tm', chapters: 4 }, { name: 'Tito', abbr: 'Tt', chapters: 3 },
      { name: 'Filemon', abbr: 'Fm', chapters: 1 }, { name: 'Hebreus', abbr: 'Hb', chapters: 13 },
    ]},
    { label: 'Cartas Católicas', icon: BookOpen, color: 'text-teal-600', bgColor: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800', books: [
      { name: 'Tiago', abbr: 'Tg', chapters: 5 }, { name: '1 Pedro', abbr: '1Pd', chapters: 5 },
      { name: '2 Pedro', abbr: '2Pd', chapters: 3 }, { name: '1 João', abbr: '1Jo', chapters: 5 },
      { name: '2 João', abbr: '2Jo', chapters: 1 }, { name: '3 João', abbr: '3Jo', chapters: 1 },
      { name: 'Judas', abbr: 'Jd', chapters: 1 },
    ]},
    { label: 'Apocalipse', icon: Sparkles, color: 'text-rose-600', bgColor: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800', books: [
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('books');
  const [selectedBook, setSelectedBook] = useState<{ name: string; abbr: string; chapters: number } | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [testament, setTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Antigo Testamento');
  const [showFullTextSearch, setShowFullTextSearch] = useState(false);
  const [verses, setVerses] = useState<{ number: number; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bibleError, setBibleError] = useState('');
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [fontSizeIdx, setFontSizeIdx] = useState(1);
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
    await supabase
      .from('bible_chapters_read' as any)
      .upsert({ user_id: user.id, book_abbr: bookAbbr, chapter } as any, { onConflict: 'user_id,book_abbr,chapter' });
    
    setChaptersRead(prev => {
      const next = { ...prev };
      if (!next[bookAbbr]) next[bookAbbr] = new Set();
      next[bookAbbr] = new Set(next[bookAbbr]).add(chapter);
      
      // Auto-mark book as completed if all chapters read
      if (next[bookAbbr].size >= totalChapters && !completedBooks.has(bookAbbr)) {
        const newCompleted = [...(profile?.completed_books || []), bookAbbr];
        const newCompletedSet = new Set(newCompleted);
        
        // Check for new badges
        const currentBadges = profile?.badges || [];
        const newBadgeIds = checkNewBadges(currentBadges, {
          completedBooks: newCompletedSet,
          chaptersRead: next,
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
              // Fire confetti
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#FFD700', '#FF6B35', '#4ECDC4', '#8B5CF6'] });
              // Show toasts
              newBadgeIds.forEach(id => {
                const badge = getBadgeById(id);
                if (badge) {
                  toast.success(`🏅 Nova conquista: ${badge.icon} ${badge.name}`, { description: badge.description, duration: 5000 });
                }
              });
            }
          });
      }
      return next;
    });
  }, [user, profile, completedBooks]);

  // All books flat for counting
  const allBooks = useMemo(() => [
    ...BIBLE_CATEGORIES['Antigo Testamento'].flatMap(c => c.books),
    ...BIBLE_CATEGORIES['Novo Testamento'].flatMap(c => c.books),
  ], []);
  const totalBooksRead = useMemo(() => allBooks.filter(b => completedBooks.has(b.abbr)).length, [allBooks, completedBooks]);
  const overallProgress = Math.round((totalBooksRead / 73) * 100);
  // Handle deep-link from Catechism cross-references (?book=Gn&ch=1)
  useEffect(() => {
    const bookParam = searchParams.get('book');
    const chParam = searchParams.get('ch');
    if (bookParam) {
      const allBooks = [...getAllBooks('Antigo Testamento'), ...getAllBooks('Novo Testamento')];
      const found = allBooks.find(b => b.abbr === bookParam);
      if (found) {
        const isNT = getAllBooks('Novo Testamento').some(b => b.abbr === bookParam);
        setTestament(isNT ? 'Novo Testamento' : 'Antigo Testamento');
        setSelectedBook(found);
        if (chParam) {
          const ch = parseInt(chParam);
          if (!isNaN(ch) && ch >= 1 && ch <= found.chapters) {
            setSelectedChapter(ch);
            setViewMode('reading');
          } else {
            setViewMode('chapters');
          }
        } else {
          setViewMode('chapters');
        }
      }
    }
  }, [searchParams]);

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

  const selectBook = (book: typeof filteredBooks[0]) => {
    setSelectedBook(book);
    setViewMode('chapters');
  };

  const selectChapter = (ch: number) => {
    setSelectedChapter(ch);
    setViewMode('reading');
  };

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
    }
  }, [selectedBook, selectedChapter]);

  const handleNavigateToCIC = useCallback((paragraph: number) => {
    navigate(`/catechism?p=${paragraph}`);
  }, [navigate]);

  // Persistent cache for Bible texts using localStorage + in-memory Map
  const bibleCache = useMemo(() => {
    const STORAGE_KEY = 'cathedra_bible_cache';
    const MAX_ENTRIES = 50;
    
    // Load from localStorage
    const map = new Map<string, { number: number; text: string }[]>();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const entries = JSON.parse(stored);
        entries.forEach(([k, v]: [string, any]) => map.set(k, v));
      }
    } catch {}

    // Wrap set to persist
    const originalSet = map.set.bind(map);
    map.set = (key, value) => {
      originalSet(key, value);
      // Evict oldest if over limit
      if (map.size > MAX_ENTRIES) {
        const firstKey = map.keys().next().value;
        if (firstKey) map.delete(firstKey);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...map.entries()]));
      } catch {}
      return map;
    };

    return map;
  }, []);

  useEffect(() => {
    if (viewMode === 'reading' && selectedBook && selectedChapter > 0) {
      const cacheKey = `${selectedBook.abbr}_${selectedChapter}`;
      
      const cached = bibleCache.get(cacheKey);
      if (cached) {
        setVerses(cached);
        setBibleError('');
        setHighlightedVerse(null);
        return;
      }

      setIsLoading(true);
      setBibleError('');
      setVerses([]);
      setHighlightedVerse(null);
      supabase.functions.invoke('bible-text', {
        body: { abbrev: selectedBook.abbr, chapter: selectedChapter }
      }).then(({ data, error }) => {
        if (error) {
          setBibleError('Erro ao carregar o texto. Tente novamente.');
        } else if (data?.verses?.length > 0) {
          setVerses(data.verses);
          bibleCache.set(cacheKey, data.verses);
        } else {
          setBibleError('Texto não disponível para este capítulo.');
        }
        setIsLoading(false);
      });
    }
  }, [viewMode, selectedBook, selectedChapter, bibleCache]);

  // Reading view
  if (viewMode === 'reading' && selectedBook) {
    const fs = FONT_SIZES[fontSizeIdx];
    const fromDashboard = searchParams.get('from') === 'dashboard';
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back to Dashboard */}
        {fromDashboard && (
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Dashboard
          </button>
        )}
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
            <Icons.ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground truncate">{selectedBook.name}</h1>
            <p className="text-sm text-muted-foreground">Capítulo {selectedChapter} de {selectedBook.chapters}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button disabled={selectedChapter <= 1} onClick={() => navigateChapter(-1)}
              className="px-3 py-2 rounded-xl bg-card border border-border text-sm font-bold disabled:opacity-30 hover:bg-primary/10 transition-all">
              ← Anterior
            </button>
            <button disabled={selectedChapter >= selectedBook.chapters} onClick={() => navigateChapter(1)}
              className="px-3 py-2 rounded-xl bg-card border border-border text-sm font-bold disabled:opacity-30 hover:bg-primary/10 transition-all">
              Próximo →
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Font size */}
            <div className="flex items-center bg-card border border-border rounded-xl overflow-hidden">
              {FONT_SIZES.map((f, i) => (
                <button key={f.label} onClick={() => setFontSizeIdx(i)}
                  className={`px-2.5 py-1.5 text-xs font-bold transition-all ${fontSizeIdx === i ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            {/* Cross-ref toggle */}
            {crossRefs.length > 0 && (
              <button onClick={() => setShowCrossRefs(!showCrossRefs)}
                className={`p-2 rounded-xl border transition-all ${showCrossRefs ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground'}`}
                title="Nexus Theologicus">
                <Icons.Cross className="w-4 h-4" />
              </button>
            )}
            {/* Share chapter */}
            <ShareButton
              title={`${selectedBook.name} ${selectedChapter}`}
              text={`Leia ${selectedBook.name}, Capítulo ${selectedChapter} — Cathedra Digital`}
              url={`${window.location.origin}/bible?book=${selectedBook.abbr}&ch=${selectedChapter}`}
            />
          </div>
        </div>

        {/* Cross references panel */}
        {showCrossRefs && crossRefs.length > 0 && (
          <CrossReferencePanel
            type="bible"
            cicParagraphs={crossRefs}
            onNavigateToCIC={handleNavigateToCIC}
          />
        )}

        {/* Content */}
        <div className="bg-card border border-border rounded-3xl p-6 md:p-10 space-y-6">
          <div className="text-center space-y-2 pb-4 border-b border-border">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{selectedBook.abbr} {selectedChapter}</span>
            <h2 className="text-lg font-serif font-bold text-foreground">{selectedBook.name} — Capítulo {selectedChapter}</h2>
          </div>
          <div className={`reader-text text-foreground/90 ${fs.size} ${fs.leading} space-y-2`}>
            {isLoading ? (
              <div className="space-y-3 py-8">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${65 + Math.random() * 35}%` }} />
                ))}
              </div>
            ) : bibleError ? (
              <p className="text-muted-foreground italic text-center py-12">{bibleError}</p>
            ) : verses.length > 0 ? (
              verses.map(v => {
                const verseTitle = `${selectedBook.abbr} ${selectedChapter},${v.number}`;
                const faved = isFavorite('verse', verseTitle);
                return (
                  <p
                    key={v.number}
                    onClick={() => setHighlightedVerse(highlightedVerse === v.number ? null : v.number)}
                    className={`cursor-pointer rounded-lg px-2 py-1 -mx-2 transition-all group/verse ${
                      highlightedVerse === v.number ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted/50'
                    }`}
                  >
                    <sup className="text-primary font-bold mr-1 text-xs select-none">{v.number}</sup>
                    <span className="font-serif">{v.text.replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ')}</span>
                    {highlightedVerse === v.number && (
                      <span className="inline-flex gap-1 ml-2 align-middle">
                        <button
                          onClick={e => { e.stopPropagation(); toggleFavorite({ type: 'verse', title: verseTitle, content: v.text }); }}
                          title={faved ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                        >
                          <Icons.Heart className={`w-4 h-4 transition-all ${faved ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary'}`} />
                        </button>
                        <ShareButton
                          title={verseTitle}
                          text={`"${v.text}" — ${verseTitle}`}
                          url={`${window.location.origin}/bible?book=${selectedBook.abbr}&ch=${selectedChapter}`}
                          className="border-0 p-0 hover:bg-transparent"
                          size="sm"
                        />
                      </span>
                    )}
                  </p>
                );
              })
            ) : (
              <p className="text-muted-foreground italic text-center py-12">Carregando...</p>
            )}
          </div>
        </div>

        {/* Mark chapter as read */}
        {!isLoading && verses.length > 0 && user && (
          <div className="flex justify-center">
            {chaptersRead[selectedBook.abbr]?.has(selectedChapter) ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold">
                <CheckCircle2 className="w-4 h-4" /> Capítulo lido
              </div>
            ) : (
              <button
                onClick={() => markChapterRead(selectedBook.abbr, selectedChapter, selectedBook.chapters)}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all">
                ✓ Marcar como lido
              </button>
            )}
          </div>
        )}

        {/* Bottom navigation */}
        <div className="flex justify-between items-center pt-2">
          <button disabled={selectedChapter <= 1} onClick={() => navigateChapter(-1)}
            className="px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-bold disabled:opacity-30 hover:bg-primary/10 transition-all">
            ← Capítulo {selectedChapter - 1}
          </button>
          <span className="text-xs text-muted-foreground font-bold">{selectedChapter} / {selectedBook.chapters}</span>
          <button disabled={selectedChapter >= selectedBook.chapters} onClick={() => navigateChapter(1)}
            className="px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-bold disabled:opacity-30 hover:bg-primary/10 transition-all">
            Capítulo {selectedChapter + 1} →
          </button>
        </div>
      </div>
    );
  }

  // Chapter selection
  if (viewMode === 'chapters' && selectedBook) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
            <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
          </button>
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">{selectedBook.name}</h1>
            <p className="text-sm text-muted-foreground">{selectedBook.chapters} capítulos • {selectedBook.abbr}</p>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => {
            const hasRefs = getBibleCrossRefs(selectedBook.abbr, ch).length > 0;
            const isChRead = chaptersRead[selectedBook.abbr]?.has(ch);
            return (
              <button key={ch} onClick={() => selectChapter(ch)}
                className={`aspect-square rounded-xl border flex items-center justify-center text-sm font-bold transition-all shadow-sm relative ${
                  isChRead ? 'bg-primary/15 border-primary/40 text-primary' :
                  hasRefs ? 'bg-card border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary' : 'bg-card border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary'
                }`}>
                {ch}
                {isChRead && <CheckCircle2 className="absolute -top-1 -right-1 w-3 h-3 text-primary" />}
                {!isChRead && hasRefs && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
          Capítulos com referências ao Catecismo
        </p>
      </div>
    );
  }

  // Books list
  return (
    <motion.div 
      className="max-w-5xl mx-auto space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div 
        className="text-center space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Book className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Scriptuarium</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Bíblia Sagrada</h1>
        <p className="text-muted-foreground font-serif italic">Cânon completo com 73 livros da tradição católica.</p>
        {/* Overall progress */}
        {user && totalBooksRead > 0 && (
          <div className="max-w-xs mx-auto mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">{totalBooksRead} de 73 livros</span>
              <span className="font-bold text-primary">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        )}
      </motion.div>

      {/* Full-text search */}
      {showFullTextSearch ? (
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-5">
          <BibleSearch onClose={() => setShowFullTextSearch(false)} />
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="max-w-md mx-auto flex gap-2">
            <div className="relative flex-1">
              <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar livro..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button onClick={() => setShowFullTextSearch(true)}
              className="px-4 py-3 rounded-2xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all whitespace-nowrap">
              Buscar Versículos
            </button>
          </div>
        </>
      )}

      {/* Testament tabs */}
      <div className="flex gap-2 justify-center">
        {(['Antigo Testamento', 'Novo Testamento'] as const).map(t => (
          <button key={t} onClick={() => setTestament(t)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              testament === t ? 'bg-foreground text-background shadow-lg' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Books by category */}
      <div className="space-y-3">
        {filteredCategories.map(cat => {
          const CatIcon = cat.icon;
          const readCount = cat.books.filter(b => completedBooks.has(b.abbr)).length;
          const progress = Math.round((readCount / cat.books.length) * 100);
          return (
            <Collapsible key={cat.label} defaultOpen>
              <CollapsibleTrigger className={`flex items-center gap-2.5 w-full px-4 py-3 rounded-xl border transition-all group ${cat.bgColor}`}>
                <div className={`p-1.5 rounded-lg bg-white/70 dark:bg-black/20`}>
                  <CatIcon className={`w-4 h-4 ${cat.color}`} />
                </div>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black uppercase tracking-widest ${cat.color}`}>{cat.label}</span>
                    <span className="text-[10px] text-muted-foreground">({cat.books.length})</span>
                  </div>
                  {readCount > 0 && (
                    <div className="flex items-center gap-2 mt-1 w-full">
                      <div className="h-1 flex-1 max-w-[120px] bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-current rounded-full transition-all" style={{ width: `${progress}%`, color: 'inherit' }} />
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground">{readCount}/{cat.books.length}</span>
                    </div>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1.5 mt-2 ml-1">
                  {cat.books.map(book => {
                    const isRead = completedBooks.has(book.abbr);
                    return (
                      <button key={book.abbr} onClick={() => selectBook(book)}
                        className={`text-left px-2.5 py-2 rounded-lg border transition-all group/book ${
                          isRead ? 'bg-primary/5 border-primary/30' : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5'
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${cat.color}`}>{book.abbr}</span>
                          {isRead && <span className="text-[8px]">✓</span>}
                        </div>
                        <p className="text-xs font-bold text-foreground mt-0.5 group-hover/book:text-primary transition-colors truncate">{book.name}</p>
                        <p className="text-[9px] text-muted-foreground">{book.chapters} cap.</p>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Bible;
