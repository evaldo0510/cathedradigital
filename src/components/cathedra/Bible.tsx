import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, useContext, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
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
import { BibleSkeleton } from './RouteSkeletons';
import { useRenderPerf } from '@/hooks/useRenderPerf';
import { BIBLE_DATA, BibleBook } from '@/data/bible-books';
import BibleDictionaryPopover from './BibleDictionaryPopover';
import ReadingSettingsPopover from './ReadingSettingsPopover';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { useAuth } from '@/hooks/useAuth';

const LogosAI = lazy(() => import('./LogosAI'));

const Bible: React.FC = () => {
  const { lang } = useLang();
  useRenderPerf('Sacra Biblia', 15);

  const navigate = useNavigate();
  const location = useLocation();
  const { settings, updateSettings } = useReadingSettings();
  
  const [viewMode, setViewMode] = useState<'home' | 'reading'>('home');
  const [activeSummaryBook, setActiveSummaryBook] = useState<BibleBook | null>(BIBLE_DATA['Novo Testamento'][0].books[3]);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [testament, setTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Antigo Testamento');
  
  const [showLogosAI, setShowLogosAI] = useState(false);
  const [activeVerseNumber, setActiveVerseNumber] = useState<number | null>(null);
  const { saveLastRead } = useReadingMarks();
  const { user } = useAuth();

  const [favorites, setFavorites] = useState<any[]>([]);
  const [verseNotes, setVerseNotes] = useState<any[]>([]);
  const [editingNote, setEditingNote] = useState<{ verse: number, text: string } | null>(null);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [noteSearchVisible, setNoteSearchVisible] = useState(false);

  const fetchVerseNotes = async () => {
    if (!user || !selectedBook) return;
    try {
      const { data, error } = await supabase
        .from('user_notes')
        .select('*')
        .match({ user_id: user.id, book_abbr: selectedBook.abbr, chapter: selectedChapter });
      if (error) throw error;
      setVerseNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  useEffect(() => {
    if (user && viewMode === 'reading' && selectedBook) fetchVerseNotes();
  }, [user, viewMode, selectedBook, selectedChapter]);

  const selectBook = (book: BibleBook) => {
    setSelectedBook(book);
    setActiveSummaryBook(book);
    setViewMode('reading');
    setSelectedChapter(1);
    fetchVerses(book.abbr, 1);
    navigate(`/bible?book=${book.abbr}&ch=1`);
  };

  const selectChapter = (ch: number) => {
    setSelectedChapter(ch);
    fetchVerses(selectedBook!.abbr, ch);
    navigate(`/bible?book=${selectedBook!.abbr}&ch=${ch}`);
  };

  const goBack = () => {
    setViewMode('home');
    navigate('/bible');
  };

  const fetchVerses = async (abbr: string, chapter: number) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase.functions.invoke('bible-text', {
        body: { book: abbr, chapter }
      });
      if (error) throw error;
      setVerses(data.verses.map((v: any) => ({ ...v, chapter })));
    } catch (error: any) {
      setFetchError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const dictionaryTerms = ['Deus', 'Jesus', 'Cristo', 'Senhor', 'Espírito', 'Jerusalém', 'Israel', 'Moisés', 'Abraão', 'Aliança', 'Graça', 'Pecado', 'Salvação', 'Reino', 'Evangelho'];

  const wrapWithDictionary = (text: string) => {
    const parts = text.split(new RegExp(`(${dictionaryTerms.join('|')})`, 'gi'));
    return parts.map((part, i) => {
      if (dictionaryTerms.some(term => term.toLowerCase() === part.toLowerCase())) {
        return <BibleDictionaryPopover key={i} term={part}>{part}</BibleDictionaryPopover>;
      }
      return part;
    });
  };

  return (
    <div className={cn("relative min-h-screen", settings.immersiveMode && viewMode === 'reading' && "bg-background")}>
      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      </Helmet>

      {viewMode === 'home' && (
        <ContemplativeLayout
          subtitle="A Palavra que transforma"
          title="Bíblia Sagrada"
          icon={Icons.BookOpen}
          maxW="max-w-7xl"
        >
           {/* Widgets e Navegação conforme desenho */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
             {/* Widgets... */}
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
             {/* Navegação */}
             <div className="lg:col-span-4">
               {/* Categorias... */}
             </div>
             {/* Resumo Livro */}
             <div className="lg:col-span-8 bg-white/50 backdrop-blur-3xl rounded-premium-xl p-8 shadow-premium">
                {/* Capítulo List... */}
             </div>
           </div>
        </ContemplativeLayout>
      )}

      {viewMode === 'reading' && selectedBook && (
         <ContemplativeLayout
          subtitle={selectedBook.abbr}
          title={selectedBook.name}
          icon={Icons.BookOpen}
          className={cn(settings.immersiveMode ? "max-w-prose" : "max-w-5xl")}
        >
           {/* Conteúdo de Leitura ... */}
        </ContemplativeLayout>
      )}
    </div>
  );
};

export default Bible;