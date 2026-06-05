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
          <div className="w-full space-y-12 pb-16">
            <div className="text-center max-w-lg mx-auto">
              <p className="text-premium-base font-serif italic text-primary/60 italic leading-relaxed">
                "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho."
              </p>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/20 mt-2 block">Salmo 119,105</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { title: 'Continuar leitura', val: 'João 6,35', desc: 'Evangelho segundo São João', icon: Icons.Bookmark },
                { title: 'Leitura do dia', val: 'Mateus 5,1-12', desc: 'Sermão da Montanha', icon: Icons.Sun },
                { title: 'Plano de leitura', val: 'Plano em 365 dias', progress: 35, icon: Icons.Activity },
                { title: 'Favoritos', val: '12 versículos', desc: 'Sua seleção sagrada', icon: Icons.Heart }
              ].map((w, i) => (
                <div key={i} className="bg-white/60 backdrop-blur-xl p-6 rounded-premium border border-primary/5 flex flex-col justify-between shadow-premium-sm min-h-[160px]">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/30">{w.title}</span>
                    <h4 className="text-premium-xl font-bold text-primary/80">{w.val}</h4>
                    {w.desc && <p className="text-[10px] text-primary/40 italic">{w.desc}</p>}
                    {w.progress && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[8px] font-bold text-primary/30 uppercase"><span>Dia 127</span><span>{w.progress}%</span></div>
                        <div className="w-full h-1 bg-primary/5 rounded-full overflow-hidden"><div className="h-full bg-secondary/40" style={{ width: `${w.progress}%` }} /></div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm" className="rounded-full bg-secondary/10 border-secondary/20 text-secondary text-[10px] uppercase font-bold tracking-widest h-8 px-4">Ação</Button>
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
                          <Icons.BookText className="w-4 h-4 text-primary/20 group-hover:text-secondary" />
                          <span className="text-premium-sm font-bold text-primary/60 group-hover:text-primary">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-8 bg-white/50 backdrop-blur-3xl rounded-premium-xl border border-primary/5 p-8 shadow-premium">
                {activeSummaryBook && (
                  <>
                    <div className="border-b border-primary/5 pb-6 mb-8">
                      <h3 className="font-display text-premium-4xl italic text-primary/90">{activeSummaryBook.name}</h3>
                      <span className="text-[10px] font-black tracking-widest text-primary/20 uppercase">{activeSummaryBook.chapters} Capítulos</span>
                    </div>
                    <div className="grid grid-cols-1 gap-px bg-primary/5 rounded-premium overflow-hidden">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                        <button key={num} onClick={() => selectBook(activeSummaryBook)} className="flex items-center justify-between p-6 bg-white/40 hover:bg-white/80 transition-all group">
                          <div className="flex items-center gap-8">
                            <span className="font-display text-premium-2xl text-primary/20 group-hover:text-secondary w-12 text-center">{num}</span>
                            <span className="text-premium-lg font-serif italic text-primary/70 group-hover:text-primary">Título do Capítulo</span>
                          </div>
                          <Icons.ChevronRight className="w-5 h-5 text-primary/10 group-hover:text-primary" />
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
          <div className="pb-16 pt-8 max-w-3xl mx-auto text-center font-reader reader-text">
            {isLoading ? <BibleSkeleton /> : (
              verses.map(v => (
                <div key={v.number} className="mb-8 p-8 rounded-premium hover:bg-white/30 transition-all">
                   <p className="leading-loose">{wrapWithDictionary(v.text)}</p>
                   <div className="mt-8 flex justify-center gap-6 opacity-0 hover:opacity-100 transition-opacity">
                     <Icons.Heart className="w-5 h-5 text-primary/20 cursor-pointer hover:text-secondary" />
                     <Icons.Edit3 className="w-5 h-5 text-primary/20 cursor-pointer hover:text-primary" />
                     <Icons.Share2 className="w-5 h-5 text-primary/20 cursor-pointer hover:text-primary" />
                   </div>
                </div>
              ))
            )}
          </div>
        </ContemplativeLayout>
      )}
    </div>
  );
};

export default Bible;