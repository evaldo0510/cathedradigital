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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-8">
                {['Antigo Testamento', 'Novo Testamento'].map(t => (
                  <div key={t} className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary/40 pl-4">{t}</h4>
                    <div className="space-y-1">
                      {BIBLE_DATA[t as keyof typeof BIBLE_DATA].map(cat => (
                        <button key={cat.name} className="w-full flex items-center gap-4 p-4 hover:bg-white/40 rounded-premium transition-all text-left group">
                          <Icons.BookText className="w-4 h-4 text-primary/20 group-hover:text-secondary transition-colors" />
                          <span className="text-premium-sm font-bold text-primary/60 group-hover:text-primary transition-colors">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-8 bg-white/50 backdrop-blur-3xl rounded-premium-xl border border-primary/5 p-8 shadow-premium">
                {activeSummaryBook && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[9px] font-black tracking-widest text-primary/20 uppercase">Bíblia</span>
                      <Icons.ChevronRight className="w-2.5 h-2.5 text-primary/10" />
                      <span className="text-[9px] font-black tracking-widest text-primary/40 uppercase">Evangelho segundo São {activeSummaryBook.name}</span>
                    </div>
                    <div className="border-b border-primary/5 pb-6 mb-8">
                      <h3 className="font-display text-premium-4xl italic text-primary/90">{activeSummaryBook.name}</h3>
                      <span className="text-[10px] font-black tracking-widest text-primary/20 uppercase">{activeSummaryBook.chapters} Capítulos</span>
                    </div>
                    <div className="grid grid-cols-1 gap-px bg-primary/5 rounded-premium overflow-hidden">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                        <button key={num} onClick={() => selectBook(activeSummaryBook)} className="flex items-center justify-between p-6 bg-white/40 hover:bg-white/80 transition-all group">
                          <div className="flex items-center gap-12">
                            <span className="font-display text-premium-2xl text-primary/20 group-hover:text-secondary w-12 text-center transition-all">{num}</span>
                            <span className="text-premium-lg font-serif italic text-primary/70 group-hover:text-primary transition-colors">
                              {activeSummaryBook.chapterTitles?.[num] || `Capítulo ${num}`}
                            </span>
                          </div>
                          <Icons.ChevronRight className="w-5 h-5 text-primary/10 group-hover:text-primary transition-all group-hover:translate-x-1" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
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
          <div className="pb-16 animate-in fade-in duration-1000">
            <div className="flex justify-between items-center mb-12 border-b border-primary/5 pb-4">
              <Button variant="ghost" onClick={goBack} className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 hover:text-primary p-0 transition-all">← {selectedBook.name} {selectedChapter}</Button>
              <div className="flex items-center gap-3">
                <div className="h-px w-12 bg-primary/10" />
                <span className="text-premium-sm font-serif italic text-primary/60">{selectedBook.chapterTitles?.[selectedChapter] || `Capitulum ${selectedChapter}`}</span>
              </div>
            </div>

            <div className="reader-text text-center max-w-3xl mx-auto pt-8">
              {isLoading ? <BibleSkeleton /> : (
                verses.map(v => (
                  <div key={v.number} className="mb-12 group relative">
                    {v.number === 1 && (
                      <div className="flex flex-col items-center mb-16 pt-8 border-t border-primary/5">
                        <Icons.Logo className="w-12 h-12 opacity-20 mb-8" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/20 mb-2 italic">Incipit Liber</span>
                        <h3 className="text-premium-4xl font-display font-light text-primary/60 uppercase tracking-[0.3em] italic mb-8">{selectedBook.name} {v.chapter}</h3>
                        <div className="flex items-center gap-4"><div className="w-12 h-px bg-primary/10" /><Icons.Wheat className="w-3 h-3 text-primary/10" /><div className="w-12 h-px bg-primary/10" /></div>
                      </div>
                    )}
                    <p className="leading-[2.2] text-xl font-reader">{wrapWithDictionary(v.text)}</p>
                    <div className="mt-8 flex justify-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md px-6 py-2 rounded-full border border-primary/5 shadow-premium-sm">
                         <Icons.Heart className="w-4 h-4 text-primary/20 hover:text-secondary transition-colors cursor-pointer" />
                         <Icons.Edit3 className="w-4 h-4 text-primary/20 hover:text-primary transition-colors cursor-pointer" onClick={() => setEditingNote({ verse: v.number, text: '' })} />
                         <Icons.Share2 className="w-4 h-4 text-primary/20 hover:text-primary transition-colors cursor-pointer" />
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ContemplativeLayout>
      )}
    </div>
  );
};

export default Bible;