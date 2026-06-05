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
import SagradoSummary from './SagradoSummary';
import { BibleSkeleton } from './RouteSkeletons';
import { useRenderPerf } from '@/hooks/useRenderPerf';
import { isLegitimateClick } from '@/lib/navigation-utils';
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
  
  const [showLogosAI, setShowLogosAI] = useState(false);
  const [activeVerseNumber, setActiveVerseNumber] = useState<number | null>(null);
  const { saveLastRead } = useReadingMarks();
  const { user } = useAuth();

  const [favorites, setFavorites] = useState<any[]>([]);
  const [verseNotes, setVerseNotes] = useState<any[]>([]);
  const [editingNote, setEditingNote] = useState<{ verse: number, text: string } | null>(null);

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

  const selectBook = (book: BibleBook, event?: React.MouseEvent | React.KeyboardEvent) => {
    if (event && !isLegitimateClick(event)) return;

    setSelectedBook(book);
    setActiveSummaryBook(book);
    setViewMode('reading');
    setSelectedChapter(1);
    fetchVerses(book.abbr, 1);
    navigate(`/bible?book=${book.abbr}&ch=1`);
  };

  const selectChapter = (ch: number, event?: React.MouseEvent | React.KeyboardEvent) => {
    if (event && !isLegitimateClick(event)) return;

    setSelectedChapter(ch);
    fetchVerses(selectedBook!.abbr, ch);
    navigate(`/bible?book=${selectedBook!.abbr}&ch=${ch}`);
  };

  const nextChapter = useCallback(() => {
    if (!selectedBook) return;
    const maxChapters = selectedBook.chapters || 1;
    if (selectedChapter < maxChapters) {
      selectChapter(selectedChapter + 1);
    }
  }, [selectedBook, selectedChapter]);

  const prevChapter = useCallback(() => {
    if (!selectedBook) return;
    if (selectedChapter > 1) {
      selectChapter(selectedChapter - 1);
    }
  }, [selectedBook, selectedChapter]);

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x < -threshold) {
      nextChapter();
    } else if (info.offset.x > threshold) {
      prevChapter();
    }
  };

  const goBack = (event?: React.MouseEvent | React.KeyboardEvent) => {
    if (event && !isLegitimateClick(event)) return;

    setViewMode('home');
    navigate('/bible');
  };

  const saveNote = async (verseNumber: number, text: string) => {
    if (!user || !selectedBook) return;
    try {
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
      fetchVerseNotes();
      setEditingNote(null);
      toast.success('Nota salva');
    } catch (error) {
      toast.error('Erro ao salvar nota');
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
          <div className="w-full space-y-12 pb-16 animate-in fade-in duration-1000">
            <div className="text-center max-w-lg mx-auto">
              <p className="text-premium-base font-serif italic text-primary/60 leading-relaxed">
                "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho."
              </p>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/20 mt-2 block">Salmo 119,105</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { title: 'Continuar leitura', val: 'João 6,35', desc: 'Evangelho segundo São João', icon: Icons.Bookmark, btn: 'Continuar lendo' },
                { title: 'Leitura do dia', val: 'Mateus 5,1-12', desc: 'Sermão da Montanha', icon: Icons.Sun, btn: 'Ler agora' },
                { title: 'Plano de leitura', val: 'Plano em 365 dias', progress: 35, icon: Icons.Activity, btn: 'Ver plano' },
                { title: 'Favoritos', val: '12 versículos', desc: 'Sua seleção sagrada', icon: Icons.Heart, btn: 'Ver favoritos' }
              ].map((w, i) => (
                <div key={i} className="bg-white/60 backdrop-blur-xl p-6 rounded-premium border border-primary/5 flex flex-col justify-between shadow-premium-sm min-h-[160px]">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/30">{w.title}</span>
                    <h4 className="text-premium-xl font-bold text-primary/80">{w.val}</h4>
                    {w.desc && <p className="text-[10px] text-primary/40 italic">{w.desc}</p>}
                    {w.progress && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex justify-between text-[8px] font-bold text-primary/30 uppercase"><span>Dia 127</span><span>{w.progress}%</span></div>
                        <div className="w-full h-1 bg-primary/5 rounded-full overflow-hidden"><div className="h-full bg-secondary/40" style={{ width: `${w.progress}%` }} /></div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant={i < 2 ? "outline" : "ghost"} size="sm" className={cn("rounded-full h-8 px-4 text-[10px] uppercase font-bold tracking-widest", i < 2 ? "bg-secondary/10 border-secondary/20 text-secondary" : "text-primary/40")}>{w.btn}</Button>
                  </div>
                </div>
              ))}
            </div>

            <SagradoSummary 
              activeBook={activeSummaryBook} 
              setActiveBook={setActiveSummaryBook} 
              onSelectBook={selectBook} 
            />
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
          <motion.div 
            className="pb-16 animate-in fade-in duration-1000 relative"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            {/* Setas discretas nas bordas */}
            <AnimatePresence>
              {selectedChapter > 1 && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={prevChapter}
                  className="fixed left-8 top-1/2 -translate-y-1/2 z-50 p-4 text-primary/10 hover:text-primary/30 transition-colors hidden lg:block"
                  aria-label="Capítulo anterior"
                >
                  <Icons.ChevronLeft className="w-8 h-8" />
                </motion.button>
              )}
              {selectedChapter < (selectedBook.chapters || 1) && (
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onClick={nextChapter}
                  className="fixed right-8 top-1/2 -translate-y-1/2 z-50 p-4 text-primary/10 hover:text-primary/30 transition-colors hidden lg:block"
                  aria-label="Próximo capítulo"
                >
                  <Icons.ChevronRight className="w-8 h-8" />
                </motion.button>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center mb-16 border-b border-primary/5 pb-6">
              <Button variant="ghost" onClick={goBack} className="text-[9px] font-black uppercase tracking-[0.5em] text-secondary/60 hover:text-primary p-0 transition-all duration-500 hover:-translate-x-2">← {selectedBook.name} {selectedChapter}</Button>
              <div className="flex items-center gap-6">
                <div className="h-px w-16 bg-primary/5" />
                <span className="text-[11px] font-serif italic text-primary/40 tracking-wide">{selectedBook.chapterTitles?.[selectedChapter] || `Capitulum ${selectedChapter}`}</span>
                <div className="h-px w-16 bg-primary/5" />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={`${selectedBook.abbr}-${selectedChapter}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="reader-text text-left max-w-2xl mx-auto pt-8"
              >
                {isLoading ? <BibleSkeleton /> : (
                  verses.map(v => (
                    <div key={v.number} className="mb-10 group relative flex gap-8">
                      <span className="text-[11px] font-serif font-bold text-secondary/30 mt-1.5 select-none w-8 shrink-0 text-right tabular-nums">{v.number}</span>
                      <div className="flex-1">
                        {v.number === 1 && (
                          <div className="flex flex-col items-center mb-20 pt-10 border-t border-primary/5 text-center">
                            <Icons.Logo className="w-16 h-16 opacity-10 mb-10" />
                            <span className="text-[9px] font-black uppercase tracking-[0.6em] text-secondary/30 mb-3 italic">Incipit Liber</span>
                            <h3 className="text-5xl font-display font-light text-primary/70 uppercase tracking-[0.4em] italic mb-10">{selectedBook.name} {v.chapter}</h3>
                            <div className="flex items-center gap-6"><div className="w-16 h-px bg-primary/5" /><Icons.Wheat className="w-4 h-4 text-secondary/20" /><div className="w-16 h-px bg-primary/5" /></div>
                          </div>
                        )}
                        <p className="leading-[1.9] text-[20px] font-serif text-primary/90 tracking-tight text-justify indent-8 sm:indent-0" role="text">
                          {wrapWithDictionary(v.text)}
                        </p>
                        
                        <div className="mt-5 flex justify-start gap-5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 group-focus-within:translate-y-0">
                           <button className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/20 hover:text-secondary focus-visible:text-secondary focus-visible:outline-none flex items-center gap-2 transition-colors" aria-label={`Favoritar versículo ${v.number}`}>
                             <Icons.Heart className="w-3.5 h-3.5" /> Favoritar
                           </button>
                           <button className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/20 hover:text-primary focus-visible:text-primary focus-visible:outline-none flex items-center gap-2 transition-colors" onClick={() => setEditingNote({ verse: v.number, text: '' })} aria-label={`Anotar no versículo ${v.number}`}>
                             <Icons.Edit3 className="w-3.5 h-3.5" /> Anotar
                           </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </ContemplativeLayout>
      )}
    </div>
  );
};

export default Bible;