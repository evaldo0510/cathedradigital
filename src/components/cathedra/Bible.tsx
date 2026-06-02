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
import { TextSelectionToolbar } from './TextSelectionToolbar';
import { NoteEditModal } from './NoteEditModal';
import { ReadingProgress } from './ReadingProgress';
import ChapterNotesList from './ChapterNotesList';
import Relatio from './Relatio';
import ReadingMark from './ReadingMark';
import ShareButton from './ShareButton';
import AudioButton from './AudioButton';
import { BibleSkeleton } from './RouteSkeletons';
import ReadingControlPanel from './ReadingControlPanel';
import { LogosContextualSuggestions } from './LogosContextualSuggestions';

const BIBLE_CATEGORIES: any = { 'Antigo Testamento': [], 'Novo Testamento': [] };


const LogosAI = lazy(() => import('./LogosAI'));
const CatechismPopover = lazy(() => import('./CatechismPopover'));

// Mock data/utils that were likely defined earlier or imported
const bibleCache = new Map();
const cacheKey = (abbr: string, ch: number) => `${abbr}-${ch}`;
const buildBibleAbsoluteUrl = ({ abbr, chapter, verse }: { abbr: string, chapter: number, verse?: number }) => `/bible?book=${abbr}&ch=${chapter}${verse ? `&v=${verse}` : ''}`;
const cacheBibleChapter = (abbr: string, ch: number, data: any) => {}; 
const markChapterRead = (abbr: string, ch: number, total: number) => {};

const Bible: React.FC = () => {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useReadingSettings();
  
  const [viewMode, setViewMode] = useState<'books' | 'chapters' | 'reading'>('books');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bibleError, setBibleError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [testament, setTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Antigo Testamento');
  
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<any>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [showLogosAI, setShowLogosAI] = useState(false);
  const [logosAIInitialQuery, setLogosAIInitialQuery] = useState('');
  const [logosAIContext, setLogosAIContext] = useState('');
  
  const [currentChapterNotes, setCurrentChapterNotes] = useState<any[]>([]);
  const [completedBooks, setCompletedBooks] = useState<Set<string>>(new Set());
  const [chaptersRead, setChaptersRead] = useState<Record<string, Set<number>>>({});
  const [lastReadMark, setLastReadMark] = useState<any>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeVerseId, setActiveVerseId] = useState<string | null>(null);
  const [sessionResumeUsed, setSessionResumeUsed] = useState(false);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return BIBLE_CATEGORIES[testament].map(cat => ({
      ...cat,
      books: cat.books.filter(b => 
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.abbr.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(cat => cat.books.length > 0);
  }, [testament, searchQuery]);

  const selectBook = (book: any) => {
    setSelectedBook(book);
    setViewMode('chapters');
    window.scrollTo(0, 0);
  };

  const selectChapter = (ch: number) => {
    setSelectedChapter(ch);
    setViewMode('reading');
    window.scrollTo(0, 0);
    navigate(`/bible?book=${selectedBook.abbr}&ch=${ch}`);
  };

  const goBack = () => {
    if (viewMode === 'reading') setViewMode('chapters');
    else if (viewMode === 'chapters') setViewMode('books');
    window.scrollTo(0, 0);
  };

  const navigateChapter = (dir: number) => {
    const nextCh = selectedChapter + dir;
    if (nextCh >= 1 && nextCh <= selectedBook.chapters) {
      selectChapter(nextCh);
    }
  };

  // Mocked functions for the sake of completeness
  const deleteChapterNote = (id: string) => {};
  const handleAddNoteOrHighlight = (text: string, color: string) => {};
  const handleBookmarkCurrent = () => {};
  const handleReturnToParagraph = () => {};
  const handleNavigateToCIC = (p: number) => {};
  const handleNavigateToDoc = (id: string) => {};
  const saveLastRead = (data: any) => {};
  const verseToCic: Record<number, number[]> = {};

  return (
    <div className="bible-container min-h-screen bg-background text-foreground">
      {viewMode === 'books' && (
        <ContemplativeLayout
          subtitle="Verbum Domini"
          title="Bíblia Sagrada"
          icon={Icons.Bible}
        >
          {/* SEOHead removed as it was missing */}


          <div className="w-full space-y-spacing-2xl pb-spacing-4xl">
            <div className="relative group">
              <Icons.Search className="absolute left-spacing-lg top-1/2 -translate-y-1/2 w-spacing-md h-spacing-md text-primary/20 group-focus-within:text-primary transition-all duration-700" />
              <input
                type="text"
                placeholder="Buscar livro ou abreviação..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-premium pl-spacing-3xl"
              />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-spacing-sm">
              {filteredCategories.flatMap(cat => cat.books).map(book => (
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
        >
          <div className="max-w-[70ch] mx-auto pb-spacing-4xl">
            <div className="flex justify-between items-center mb-spacing-xl border-b border-primary/5 pb-spacing-sm">
              <Button variant="ghost" onClick={goBack} className="text-[9px] font-black uppercase tracking-[0.3em]">
                ← Sumário
              </Button>
              <div className="flex gap-spacing-md">
                <button disabled={selectedChapter <= 1} onClick={() => navigateChapter(-1)} className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Anterior</button>
                <span className="text-premium-xs font-serif italic text-primary/20">Capítulo {selectedChapter}</span>
                <button disabled={selectedChapter >= selectedBook.chapters} onClick={() => navigateChapter(1)} className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Próximo</button>
              </div>
            </div>

            {isLoading ? <BibleSkeleton /> : (
              <div className={`font-size-${settings.fontSize} font-family-${settings.fontFamily} reader-text space-y-spacing-lg`}>
                {verses.map(v => (
                  <div key={v.number} id={`v${v.number}`} className="group relative py-spacing-sm hover:bg-primary/[0.01] transition-all">
                    <span className="text-[0.7em] font-serif italic text-primary/20 mr-spacing-md">{v.number}</span>
                    <span className="leading-relaxed">{v.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Floating Controls */}
          <div className="fixed bottom-spacing-4xl left-1/2 -translate-x-1/2 z-40 bg-background/20 backdrop-blur-3xl p-spacing-2xs rounded-premium-full border border-primary/5 shadow-premium flex gap-spacing-xs">
            <AudioButton variant="ghost" />
            <Button variant="ghost" onClick={() => setShowLogosAI(!showLogosAI)}>
              <Icons.Sparkles className={showLogosAI ? 'text-primary' : 'text-primary/40'} />
            </Button>
            <ReadingMark contentType="bible" contentId={selectedBook.abbr} label={`${selectedBook.name} ${selectedChapter}`} />
          </div>

          <Suspense fallback={null}>
            {showLogosAI && (
              <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md p-spacing-xl flex items-center justify-center">
                 <div className="w-full max-w-[70ch] bg-card rounded-premium-lg border border-primary/10 shadow-premium p-spacing-xl">
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
