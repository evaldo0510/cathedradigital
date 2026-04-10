import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import StaggeredList from './StaggeredList';
import CrossReferencePanel from './CrossReferencePanel';
import { getBibleCrossRefs } from '@/data/cross-references';
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
                  toast.success(`Nova conquista: ${badge.name}`, { description: badge.description, duration: 5000 });
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
    } catch {}
    return map;
  }, []);

  useEffect(() => {
    if (viewMode === 'reading' && selectedBook && selectedChapter > 0) {
      const cacheKey = `${selectedBook.abbr}_${selectedChapter}`;
      
      // 1) Check in-memory cache
      const memCached = bibleCache.get(cacheKey);
      if (memCached) {
        setVerses(memCached);
        setBibleError('');
        setHighlightedVerse(null);
        return;
      }

      setIsLoading(true);
      setBibleError('');
      setVerses([]);
      setHighlightedVerse(null);

      // 2) Check IndexedDB cache, then fetch if miss
      import('@/lib/offlineCache').then(({ getCachedBibleChapter, cacheBibleChapter }) => {
        getCachedBibleChapter(selectedBook.abbr, selectedChapter).then((idbCached) => {
          if (idbCached?.verses?.length > 0) {
            setVerses(idbCached.verses);
            bibleCache.set(cacheKey, idbCached.verses);
            setIsLoading(false);
            return;
          }

          // 3) Fetch from edge function
          supabase.functions.invoke('bible-text', {
            body: { abbrev: selectedBook.abbr, chapter: selectedChapter }
          }).then(({ data, error }) => {
            if (error) {
              setBibleError('Erro ao carregar o texto. Tente novamente.');
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

  // Reading view
  if (viewMode === 'reading' && selectedBook) {
    const fs = FONT_SIZES[fontSizeIdx];
    const fromDashboard = searchParams.get('from') === 'dashboard';
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back to Dashboard */}
        {fromDashboard && (
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Icons.ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Dashboard
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
            <button onClick={() => setShowCrossRefs(!showCrossRefs)}
              className={`p-2 rounded-xl border transition-all ${showCrossRefs ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground'}`}>
              <Icons.Columns className="w-5 h-5" />
            </button>
            <ShareButton 
              title={selectedBook.name} 
              text={`Lendo ${selectedBook.name} na Cathedra: Digital Sanctuarium`} 
            />
          </div>
        </div>


        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className={`lg:col-span-${showCrossRefs && crossRefs.length > 0 ? '8' : '12'} space-y-6`}>
            <Card className="border-border/40 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 md:p-8">
                {isLoading ? (
                  <div className="space-y-4 py-8">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`h-4 bg-muted animate-pulse rounded-full ${i % 2 === 0 ? 'w-full' : 'w-3/4'}`} />
                    ))}
                  </div>
                ) : bibleError ? (
                  <div className="text-center py-12 space-y-4">
                    <p className="text-muted-foreground">{bibleError}</p>
                    <Button variant="outline" onClick={() => window.location.reload()}>Recarregar</Button>
                  </div>
                ) : (
                  <div className={`font-serif ${fs.size} ${fs.leading} text-foreground/90 transition-all duration-300`}>
                    {verses.map(v => (
                      <span key={v.number} 
                        id={`v${v.number}`}
                        onClick={() => setHighlightedVerse(v.number === highlightedVerse ? null : v.number)}
                        className={`inline transition-colors duration-300 cursor-pointer rounded px-0.5
                          ${highlightedVerse === v.number ? 'bg-primary/20 ring-1 ring-primary/30' : 'hover:bg-muted/50'}`}>
                        <sup className="text-[0.6em] font-bold text-primary mr-1 select-none">{v.number}</sup>
                        {v.text}{' '}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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
                <Card className="border-primary/20 bg-primary/5 cursor-pointer hover:border-primary/40 transition-all"
                  onClick={() => navigateChapter(1)}>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Próximo Capítulo</p>
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
                <Card className="border-secondary/40 bg-secondary/5 text-center p-8">
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

          {/* Cross References Panel */}
          {showCrossRefs && crossRefs.length > 0 && (
            <div className="lg:col-span-4 sticky top-24">
              <CrossReferencePanel 
                type="bible"
                cicParagraphs={crossRefs} 
                onNavigateToCIC={handleNavigateToCIC}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chapter selection view
  if (viewMode === 'chapters' && selectedBook) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
            <Icons.ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-serif font-bold text-foreground">{selectedBook.name}</h1>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => {
            const isRead = chaptersRead[selectedBook.abbr]?.has(ch);
            return (
              <button 
                key={ch} 
                onClick={() => selectChapter(ch)}
                className={`aspect-square flex items-center justify-center rounded-xl border font-bold transition-all relative
                  ${isRead 
                    ? 'bg-primary/10 border-primary/30 text-primary' 
                    : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
              >
                {ch}
                {isRead && <Icons.CheckCircle2 className="w-2.5 h-2.5 absolute top-1 right-1" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Book selection view
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SEOHead 
        title="Bíblia Sagrada | Cathedra" 
        description="Leia e estude a Sagrada Escritura com referências cruzadas e comentários."
        path="/bible"
      />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-black text-foreground tracking-tight">Sagrada Escritura</h1>
          <p className="text-muted-foreground mt-1">Lâmpada para meus pés é a vossa palavra.</p>
        </div>
        
        <div className="w-full md:w-auto flex flex-col gap-2">
           <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">
             <span>Progresso Geral</span>
             <span>{overallProgress}%</span>
           </div>
           <Progress value={overallProgress} className="h-2 w-full md:w-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['Antigo Testamento', 'Novo Testamento'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTestament(t)}
            className={`px-6 py-4 rounded-2xl font-bold transition-all border-2 text-sm
              ${testament === t 
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                : 'bg-card border-border text-muted-foreground hover:border-primary/40'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="relative">
        <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar livro..."
          className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-8">
        {filteredCategories.map((cat, idx) => (
          <Collapsible key={cat.label} defaultOpen={idx === 0 || !!searchQuery}>
            <CollapsibleTrigger className="w-full flex items-center justify-between group p-2 hover:bg-muted/50 rounded-xl transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.bgColor}`}>
                  <cat.icon className={`w-5 h-5 ${cat.color}`} />
                </div>
                <h2 className="text-base font-bold text-foreground uppercase tracking-widest">{cat.label}</h2>
              </div>
              <Icons.ChevronDown className="w-5 h-5 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {cat.books.map(book => {
                  const isRead = completedBooks.has(book.abbr);
                  return (
                    <button
                      key={book.abbr}
                      onClick={() => selectBook(book)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all relative overflow-hidden group
                        ${isRead 
                          ? 'bg-primary/5 border-primary/20 text-primary' 
                          : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:scale-[1.02] shadow-sm'}`}
                    >
                      {isRead && (
                        <div className="absolute top-0 right-0 p-1.5 bg-primary text-white rounded-bl-xl shadow-lg">
                          <Icons.CheckCircle2 className="w-3 h-3" />
                        </div>
                      )}
                      <span className="text-lg font-bold font-serif">{book.abbr}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-center leading-tight truncate w-full">
                        {book.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

export default Bible;