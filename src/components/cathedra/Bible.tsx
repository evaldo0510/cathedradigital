import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BIBLE_DATA, BibleBook } from '@/data/bible-books';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRenderPerf } from '@/hooks/useRenderPerf';
import BibleDictionaryPopover from './BibleDictionaryPopover';
import ReadingSettingsPopover from './ReadingSettingsPopover';
import { useAuth } from '@/hooks/useAuth';
import { BibleSkeleton } from './RouteSkeletons';
import { useNotes } from '@/hooks/useNotes';
import { NoteEditModal } from './NoteEditModal';
import BibleSearch from './BibleSearch';
import { BibleHome } from './BibleHome';
import BibleFullNotesList from './BibleFullNotesList';
import { BibleReader } from './BibleReader';

import { MonthlyRecap } from './MonthlyRecap';
import { HighlightMenu } from './HighlightMenu';
import { BibleKnowledgeAudit } from './BibleKnowledgeAudit';
import { KnowledgeGraph } from './KnowledgeGraph';

// Knowledge Connection System (Mock for development, will be replaced by DB)
const KNOWLEDGE_CONNECTIONS: Record<string, { type: 'catechism' | 'document' | 'bible' | 'theology' | 'cross_ref', label: string, color: string, id: string, summary: string }[]> = {
  'Jo-6-35': [
    { type: 'catechism', label: 'CIC 1324', color: 'bg-blue-500', id: '1324', summary: 'A Eucaristia é "fonte e ápice de toda a vida cristã".' },
    { type: 'bible', label: 'Êxodo 16', color: 'bg-green-500', id: 'Ex-16', summary: 'O maná no deserto como prefiguração do Pão da Vida.' },
    { type: 'document', label: 'Ecclesia de Eucharistia', color: 'bg-purple-500', id: 'ede', summary: 'Encíclica de João Paulo II sobre a centralidade da Eucaristia.' },
    { type: 'cross_ref', label: 'Sl 78:24', color: 'bg-amber-500', id: 'Sl-78-24', summary: 'Fez chover sobre eles o maná para comerem.' }
  ],
  'Gn-1-1': [
    { type: 'catechism', label: 'CIC 279', color: 'bg-blue-500', id: '279', summary: '"No princípio, Deus criou o céu e a terra": três coisas são aqui afirmadas.' },
    { type: 'theology', label: 'Criação ex nihilo', color: 'bg-orange-500', id: 'creatio', summary: 'A doutrina de que Deus criou o universo do nada.' },
    { type: 'cross_ref', label: 'Jo 1:1', color: 'bg-amber-500', id: 'Jo-1-1', summary: 'No princípio era o Verbo...' }
  ],
  'Mt-5-3': [
    { type: 'catechism', label: 'CIC 1716', color: 'bg-blue-500', id: '1716', summary: 'As Bem-aventuranças estão no centro da pregação de Jesus.' },
    { type: 'document', label: 'Veritatis Splendor', color: 'bg-purple-500', id: 'vs', summary: 'Sobre algumas questões fundamentais do ensino moral da Igreja.' },
    { type: 'cross_ref', label: 'Lc 6:20', color: 'bg-amber-500', id: 'Lc-6-20', summary: 'Bem-aventurados vós, os pobres...' }
  ]
};




// Helper for Daily Reading
const getDailyReading = () => {
  const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
  const date = new Date();
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Pick a book and chapter deterministically
  const bookIndex = dayOfYear % allBooks.length;
  const book = allBooks[bookIndex];
  const chapter = (dayOfYear % book.chapters) + 1;
  
  return { book, chapter };
};


const Bible: React.FC = () => {
  const [isConnectionEditorOpen, setIsConnectionEditorOpen] = useState(false);

  useRenderPerf('Sacra Biblia Mobile-First', 15);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings } = useReadingSettings();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'home' | 'chapters' | 'reading' | 'search' | 'notes' | 'monthly_recap'>('home');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New States for Annotations and Progress
  const [lastRead, setLastRead] = useState<any>(null);
  const [dailyReading, setDailyReading] = useState(getDailyReading());
  const [isDailyCompleted, setIsDailyCompleted] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [activeVerse, setActiveVerse] = useState<{ number: number; text: string } | null>(null);
  const [expandedConnection, setExpandedConnection] = useState<{ label: string, summary: string, type: string, id: string } | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);



  
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  
  const { notes, addNote, deleteNote, updateNote } = useNotes('bible');
  const scrollContainerRef = useRef<HTMLDivElement>(null);



  // Sync with URL
  useEffect(() => {
    const bookAbbr = searchParams.get('book');
    const chapter = searchParams.get('ch');

    if (bookAbbr && chapter) {
      const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
      const decodedAbbr = decodeURIComponent(bookAbbr);
      const book = allBooks.find(b => b.abbr === decodedAbbr || b.name === decodedAbbr);
      if (book) {
        setSelectedBook(book);
        setSelectedChapter(parseInt(chapter));
        setViewMode('reading');
        fetchVerses(book.abbr, parseInt(chapter));
      }
    } else if (bookAbbr) {
      const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
      const decodedAbbr = decodeURIComponent(bookAbbr);
      const book = allBooks.find(b => b.abbr === decodedAbbr || b.name === decodedAbbr);
      if (book) {
        setSelectedBook(book);
        setViewMode('chapters');
      }
    } else {
      setViewMode('home');
    }
  }, [searchParams]);

  // Local Persistence Logic
  useEffect(() => {
    const savedLastRead = localStorage.getItem('cathedra_bible_last_read');
    if (savedLastRead) setLastRead(JSON.parse(savedLastRead));

    const today = new Date().toISOString().split('T')[0];
    const dailyStatus = localStorage.getItem(`cathedra_bible_daily_${today}`);
    if (dailyStatus === 'completed') setIsDailyCompleted(true);
    const savedHighlights = localStorage.getItem('cathedra_bible_highlights');
    if (savedHighlights) setHighlights(JSON.parse(savedHighlights));
  }, []);


  const saveReadingProgress = useCallback((bookAbbr: string, chapter: number, verse?: number) => {
    const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
    const book = allBooks.find(b => b.abbr === bookAbbr);
    if (!book) return;

    const progress = { 
      bookName: book.name, 
      bookAbbr: book.abbr, 
      chapter,
      verse: verse || 1
    };
    setLastRead(progress);
    localStorage.setItem('cathedra_bible_last_read', JSON.stringify(progress));
    
    // Offline storage for favorites/progress
    const offlineKey = `offline_bible_progress_${bookAbbr}`;
    localStorage.setItem(offlineKey, JSON.stringify({ ...progress, timestamp: Date.now() }));
  }, []);


  const [showKnowledgePanel, setShowKnowledgePanel] = useState(false);
  const [activeThemeFilter, setActiveThemeFilter] = useState<string | null>(null);

  const markDailyAsCompleted = () => {


    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`cathedra_bible_daily_${today}`, 'completed');
    setIsDailyCompleted(true);
    toast.success('Leitura do dia concluída!');
  };

  const [isHighlightMenuOpen, setIsHighlightMenuOpen] = useState(false);

  const handleOpenAnnotation = (verse: { number: number; text: string }) => {
    setActiveVerse(verse);
    setIsNoteModalOpen(true);
  };


  const handleSaveNote = async (text: string, color: string) => {
    if (!activeVerse || !selectedBook) return;
    
    await addNote('bible', text, color, {
      book_abbr: selectedBook.abbr,
      chapter: selectedChapter,
      verse: activeVerse.number
    });
    
    setIsNoteModalOpen(false);
    toast.success('Reflexão guardada');
  };

  const toggleHighlight = (verseNumber: number, color: string) => {
    if (!selectedBook) return;
    const key = `${selectedBook.abbr}-${selectedChapter}-${verseNumber}`;
    const newHighlights = { ...highlights };
    
    if (newHighlights[key] === color) {
      delete newHighlights[key];
    } else {
      newHighlights[key] = color;
    }
    
    setHighlights(newHighlights);
    localStorage.setItem('cathedra_bible_highlights', JSON.stringify(newHighlights));
  };


  const handleExportData = () => {
    const data = {
      notes,
      highlights,
      lastRead,
      dailyStatus: {} as any
    };
    
    // Get all daily reading keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cathedra_bible_daily_')) {
        data.dailyStatus[key] = localStorage.getItem(key);
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cathedra-bible-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.highlights) {
          setHighlights(data.highlights);
          localStorage.setItem('cathedra_bible_highlights', JSON.stringify(data.highlights));
        }
        if (data.lastRead) {
          setLastRead(data.lastRead);
          localStorage.setItem('cathedra_bible_last_read', JSON.stringify(data.lastRead));
        }
        if (data.dailyStatus) {
          Object.entries(data.dailyStatus).forEach(([key, value]) => {
            localStorage.setItem(key, value as string);
          });
        }
        toast.success('Dados importados com sucesso');
      } catch (err) {
        toast.error('Erro ao importar arquivo');
      }
    };
    reader.readAsText(file);
  };

  const fetchVerses = async (abbr: string, chapter: number) => {
    setIsLoading(true);
    
    // Attempt offline recovery
    const offlineKey = `bible_cache_${abbr}_${chapter}`;
    const cached = localStorage.getItem(offlineKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        if (Date.now() - cachedData.timestamp < 1000 * 60 * 60 * 24 * 7) { // 1 week cache
          setVerses(cachedData.verses.map((v: any) => ({ ...v, chapter })));
          setIsLoading(false);
          // Still fetch in background to refresh
        }
      } catch(e) {}
    }

    try {
      const { data, error } = await supabase.functions.invoke('bible-text', {
        body: { book: abbr, chapter }
      });
      if (error) throw error;
      
      const loadedVerses = data.verses || [];
      setVerses(loadedVerses.map((v: any) => ({ ...v, chapter })));
      
      if (loadedVerses.length > 0) {
        localStorage.setItem(offlineKey, JSON.stringify({ verses: loadedVerses, timestamp: Date.now() }));
      } else {
        toast.warning('Este capítulo parece estar sem conteúdo no momento.');
      }

      
      // Save progress automatically
      const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
      const book = allBooks.find(b => b.abbr === abbr);
      if (book) saveReadingProgress(book.abbr, chapter);
      
      // Scroll to verse if specified
      const verse = searchParams.get('v');
      if (verse) {
        setTimeout(() => {
          const element = document.getElementById(`verse-${verse}`);
          if (element) {
            // Calculate offset for sticky header
            const headerHeight = 56; // 14 * 4
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerHeight - 20;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });

            element.classList.add('bg-secondary/20', 'scale-[1.02]');
            setTimeout(() => element.classList.remove('bg-secondary/20', 'scale-[1.02]'), 3000);
          }
        }, 300);
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }


    } catch (error: any) {
      // Local fallback for Abdias or connection issues
      if (abbr === 'Ab') {
         const obadiahText = [
            { number: 1, text: "Visão de Abdias. Assim diz o Senhor Deus a respeito de Edom: Ouvimos um anúncio do Senhor, e um mensageiro foi enviado às nações: Levantai-vos! Levantemo-nos para a guerra contra ele!" },
            { number: 2, text: "Eis que te fiz pequeno entre as nações; tu és muito desprezado." },
            { number: 3, text: "A soberba do teu coração enganou-te, a ti que habitas nas fendas das rochas, na tua alta morada, que dizes no teu coração: Quem me derrubará por terra?" }
         ];
         setVerses(obadiahText.map(v => ({ ...v, chapter: 1 })));
         setIsLoading(false);
         return;
      }
      toast.error('Erro ao carregar texto sagrado');
    } finally {
      setIsLoading(false);
    }
  };


  const selectBook = (book: BibleBook) => {
    setSelectedBook(book);
    navigate(`/bible?book=${encodeURIComponent(book.abbr)}`);
  };

  const selectChapter = (ch: number) => {
    setSelectedChapter(ch);
    navigate(`/bible?book=${encodeURIComponent(selectedBook!.abbr)}&ch=${ch}`);
    // Scroll context top
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const nextChapter = useCallback(() => {
    if (!selectedBook) return;
    if (selectedChapter < selectedBook.chapters) {
      selectChapter(selectedChapter + 1);
    }
  }, [selectedBook, selectedChapter]);

  const prevChapter = useCallback(() => {
    if (selectedChapter > 1) {
      selectChapter(selectedChapter - 1);
    }
  }, [selectedChapter]);

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 80;
    if (info.offset.x < -threshold) nextChapter();
    else if (info.offset.x > threshold) prevChapter();
  };

  const dictionaryTerms = ['Deus', 'Jesus', 'Cristo', 'Senhor', 'Espírito', 'Jerusalém', 'Israel', 'Moisés', 'Abraão', 'Aliança', 'Graça', 'Pecado', 'Salvação', 'Reino', 'Evangelho'];
  
  // Knowledge Connection System
  const KNOWLEDGE_CONNECTIONS: Record<string, { type: 'catechism' | 'document' | 'bible' | 'theology' | 'cross_ref', label: string, color: string, id: string, summary: string }[]> = {
    'Jo-6-35': [
      { type: 'catechism', label: 'CIC 1324', color: 'bg-blue-500', id: '1324', summary: 'A Eucaristia é "fonte e ápice de toda a vida cristã".' },
      { type: 'bible', label: 'Êxodo 16', color: 'bg-green-500', id: 'Ex-16', summary: 'O maná no deserto como prefiguração do Pão da Vida.' },
      { type: 'document', label: 'Ecclesia de Eucharistia', color: 'bg-purple-500', id: 'ede', summary: 'Encíclica de João Paulo II sobre a centralidade da Eucaristia.' },
      { type: 'cross_ref', label: 'Sl 78:24', color: 'bg-amber-500', id: 'Sl-78-24', summary: 'Fez chover sobre eles o maná para comerem.' }
    ],
    // New empty placeholder for connections
    'all': [
      { type: 'theology', label: 'Conexões Relacionadas', color: 'bg-primary/20', id: 'coming-soon', summary: 'As conexões vivas entre a Palavra e a Tradição estarão disponíveis em breve.' }
    ],
    'Gn-1-1': [
      { type: 'catechism', label: 'CIC 279', color: 'bg-blue-500', id: '279', summary: '"No princípio, Deus criou o céu e a terra": três coisas são aqui afirmadas.' },
      { type: 'theology', label: 'Criação ex nihilo', color: 'bg-orange-500', id: 'creatio', summary: 'A doutrina de que Deus criou o universo do nada.' },
      { type: 'cross_ref', label: 'Jo 1:1', color: 'bg-amber-500', id: 'Jo-1-1', summary: 'No princípio era o Verbo...' }
    ],
    'Mt-5-3': [
      { type: 'catechism', label: 'CIC 1716', color: 'bg-blue-500', id: '1716', summary: 'As Bem-aventuranças estão no centro da pregação de Jesus.' },
      { type: 'document', label: 'Veritatis Splendor', color: 'bg-purple-500', id: 'vs', summary: 'Sobre algumas questões fundamentais do ensino moral da Igreja.' },
      { type: 'cross_ref', label: 'Lc 6:20', color: 'bg-amber-500', id: 'Lc-6-20', summary: 'Bem-aventurados vós, os pobres...' }
    ]
  };

  const THEOLOGICAL_THEMES = [
    { id: 'creatio', label: 'Criação', parent: null, connections: 12, tags: ['Dogma', 'Ontologia'] },
    { id: 'eucharistia', label: 'Eucaristia', parent: null, connections: 45, tags: ['Sacramento', 'Liturgia'] },
    { id: 'gratia', label: 'Graça', parent: null, connections: 28, tags: ['Soteriologia'] },
    { id: 'trinitas', label: 'Santíssima Trindade', parent: null, connections: 34, tags: ['Mistério', 'Dogma'] },
    { id: 'mariologia', label: 'Mariologia', parent: null, connections: 18, tags: ['Santos', 'Dogma'] },
  ];

  const CROSS_REFERENCES: Record<string, string[]> = {
    'Jo-1-1': ['Gn-1-1', '1Jo-1-1', 'Sl 33:6'],
    'Jo-3-16': ['Rm-5-8', '1Jo-4-9', 'Ef 2:4'],
    'Gn-1-1': ['Jo-1-1', 'Hb-11-3', 'Sl 102:25'],
    'Mt-5-3': ['Lc-6-20', 'Is 57:15'],
  };

  const wrapWithDictionary = (text: string) => {
    const parts = text.split(new RegExp(`(${dictionaryTerms.join('|')})`, 'gi'));
    return parts.map((part, i) => {
      if (dictionaryTerms.some(term => term.toLowerCase() === part.toLowerCase())) {
        return <BibleDictionaryPopover key={i} term={part}>{part}</BibleDictionaryPopover>;
      }
      return part;
    });
  };

  const auditData = useMemo(() => {
    const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
    const connectedBooks = new Set();
    const uncoveredBooks: string[] = [];
    
    Object.keys(KNOWLEDGE_CONNECTIONS).forEach(key => {
      const bookAbbr = key.split('-')[0];
      connectedBooks.add(bookAbbr);
    });

    allBooks.forEach(b => {
      if (!connectedBooks.has(b.abbr)) {
        uncoveredBooks.push(b.name);
      }
    });

    const themes = Array.from(new Set(
      Object.values(KNOWLEDGE_CONNECTIONS)
        .flat()
        .filter(c => c.type === 'theology')
        .map(c => c.label)
    ));
    
    return {
      totalBooks: allBooks.length,
      coveredBooks: connectedBooks.size,
      emptyBooks: uncoveredBooks,
      totalChapters: allBooks.reduce((acc, b) => acc + b.chapters, 0),
      themesCount: themes.length,
      theologicalThemes: THEOLOGICAL_THEMES,
    };
  }, [KNOWLEDGE_CONNECTIONS]);





  const filteredBooks = useMemo(() => {

    if (!searchQuery) return BIBLE_DATA;
    const result: any = {};
    Object.entries(BIBLE_DATA).forEach(([testament, categories]) => {
      const filteredCategories = categories.map(cat => ({
        ...cat,
        books: cat.books.filter(b => 
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          b.abbr.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.books.length > 0);
      if (filteredCategories.length > 0) result[testament] = filteredCategories;
    });
    return result;
  }, [searchQuery]);

  return (
    <div className={cn(
      "relative min-h-screen transition-colors duration-1000 text-primary/90", 
      settings.theme === 'night' ? "bg-[#0A0B0D]" : "bg-[#FAF9F6]",
      settings.immersiveMode && (settings.theme === 'night' ? "bg-[#0A0B0D]" : "bg-[#FAF9F6]")
    )}>

      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </Helmet>

      <AnimatePresence mode="wait">
        {viewMode === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "px-6 pt-10 pb-32 max-w-lg mx-auto transition-colors duration-1000",
              settings.theme === 'night' && "bg-[#0D0E10] text-stone-400"
            )}

          >
            {/* Minimal Header */}
            <header className="mb-10 flex items-center justify-between">
              <div className="w-10" /> {/* Spacer */}
              <div className="flex flex-col items-center">
                <Icons.BookOpen className="w-8 h-8 text-secondary/40 mb-3" />
                <h1 className="font-display text-2xl tracking-[0.2em] uppercase text-primary/80">Bíblia Sagrada</h1>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsConnectionEditorOpen(true)}
                  className="p-2 text-secondary/40 active:scale-95 transition-transform"
                  title="Editor Bíblia ↔ CIC"
                >
                  <Icons.Edit3 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsFeedbackOpen(true)}
                  className="p-2 text-secondary/40 active:scale-95 transition-transform"
                  title="Suporte & Feedback"
                >
                  <Icons.HelpCircle className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setShowKnowledgePanel(true)}
                  className="p-2 text-secondary/60 active:scale-95 transition-transform"
                  title="Auditoria Estratégica"
                >
                  <Icons.Activity className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setViewMode('notes')}
                  className="p-2 text-secondary/60 active:scale-95 transition-transform"
                >
                  <Icons.List className="w-6 h-6" />
                </button>
              </div>




            </header>

            {/* Bible Home Experience */}
            <div className="space-y-4 mb-12">
              <BibleHome onSelectBook={selectBook} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </div>

            <div className="flex gap-4 mb-12">
              <button 
                onClick={handleExportData}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-white border border-primary/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-primary/40 shadow-sm"
              >
                <Icons.Download className="w-3 h-3" /> Exportar
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-white border border-primary/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-primary/40 cursor-pointer shadow-sm">
                <Icons.Upload className="w-3 h-3" /> Importar
                <input type="file" className="hidden" accept=".json" onChange={handleImportData} />
              </label>
            </div>




            {/* Vertical Book List */}
            <div className="space-y-12">
              {Object.entries(filteredBooks).map(([testament, categories]: any) => (
                <section key={testament} className="space-y-6">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-secondary/50 border-b border-primary/5 pb-2">{testament}</h2>
                  
                  {categories.map((cat: any) => (
                    <div key={cat.name} className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary/20 ml-2 mb-2 block">{cat.name}</span>
                      <div className="divide-y divide-primary/[0.03]">
                        {cat.books.map((book: BibleBook) => (
                          <button 
                            key={book.abbr}
                            onClick={() => selectBook(book)}
                            className="w-full h-14 flex items-center justify-between active:bg-primary/[0.02] transition-colors px-2 group"
                          >
                            <span className="font-serif text-lg text-primary/70 group-active:text-primary transition-colors">{book.name}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/20">{book.abbr}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </motion.div>
        )}

        {viewMode === 'chapters' && selectedBook && (
          <motion.div 
            key="chapters"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-6 pt-10 pb-32 max-w-lg mx-auto"
          >
            <button 
              onClick={() => {
                navigate('/bible');
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 active:text-secondary transition-colors"
            >
              <Icons.ChevronLeft className="w-4 h-4" /> Voltar
            </button>

            <header className="mb-8 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary/50 mb-2 block">Sumário Bíblico</span>
              <h1 className="font-display text-4xl text-primary/80 tracking-tight mb-4">{selectedBook.name}</h1>
              {selectedBook.description && (
                <p className="text-sm font-serif italic text-primary/40 leading-relaxed max-w-xs mx-auto mb-6">
                  {selectedBook.description}
                </p>
              )}
              <div className="w-12 h-px bg-secondary/20 mx-auto" />
            </header>

            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
                <button 
                  key={ch}
                  onClick={() => selectChapter(ch)}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center rounded-xl border transition-all group shadow-sm",
                    selectedChapter === ch && viewMode === 'reading' 
                      ? "bg-secondary/10 border-secondary/40 ring-2 ring-secondary/20" 
                      : notes.some(n => n.book_abbr === selectedBook.abbr && n.chapter === ch)
                        ? "bg-secondary/5 border-secondary/20"
                        : "bg-white border-primary/5 hover:border-secondary/30"
                  )}

                >
                  <span className={cn(
                    "text-lg font-display transition-colors",
                    selectedChapter === ch && viewMode === 'reading' ? "text-secondary font-bold" : "text-primary/70 group-active:text-secondary"
                  )}>{ch}</span>
                  {selectedBook.chapterTitles?.[ch] && (
                    <div className={cn(
                      "w-1 h-1 rounded-full mt-1",
                      selectedChapter === ch && viewMode === 'reading' ? "bg-secondary" : "bg-secondary/40"
                    )} />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {viewMode === 'reading' && selectedBook && (
          <motion.div 
            key="reading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            {/* Sticky Reading Header */}
            <header className={cn(
              "sticky top-0 z-50 backdrop-blur-md border-b border-primary/5 px-4 h-14 flex items-center justify-between transition-colors duration-1000",
              settings.theme === 'night' ? "bg-[#0A0B0D]/90" : "bg-[#FAF9F6]/90"
            )}>

              <button onClick={() => navigate(`/bible?book=${selectedBook.abbr}`)} className="p-2 text-primary/40 active:text-secondary">
                <Icons.ChevronLeft className="w-6 h-6" />
              </button>
              <div className="text-center">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-primary/80">{selectedBook.name} {selectedChapter}</h2>
              </div>
              <ReadingSettingsPopover />
            </header>

            <motion.div 
              className="px-6 py-10 pb-40 max-w-prose mx-auto"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
            >
              {isLoading ? <BibleSkeleton /> : (
                <article className="space-y-12">
                  <header className="flex flex-col items-center mb-16 opacity-30">
                    <Icons.Logo className="w-10 h-10 mb-6" />
                    <h3 className="text-2xl font-display font-light uppercase tracking-[0.4em] italic">{selectedBook.name} {selectedChapter}</h3>
                  </header>

                  {/* Context Banner */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-secondary/5 rounded-2xl border border-secondary/10 mb-8"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icons.Info className="w-4 h-4 text-secondary/40" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Contexto do Livro</span>
                    </div>
                    <p className="text-xs font-serif italic text-primary/60 leading-relaxed">
                      {selectedBook.context || selectedBook.description || "Este livro faz parte do Cânone Sagrado das Escrituras."}
                    </p>
                  </motion.div>

                  <div className="space-y-8">
                    {verses.length === 0 && !isLoading ? (
                      <div className="py-20 text-center space-y-6 bg-primary/[0.02] rounded-3xl border border-primary/5 p-8">
                        <Icons.AlertCircle className="w-12 h-12 text-secondary/40 mx-auto" />
                        <div className="space-y-2">
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-primary/60">Texto não disponível</h4>
                          <p className="text-sm font-serif italic text-primary/40">
                            Não conseguimos carregar este capítulo. Verifique sua conexão ou relate o problema.
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsFeedbackOpen(true)}
                          className="h-12 rounded-xl text-[9px] font-black uppercase tracking-widest border-primary/10"
                        >
                          Relatar Problema
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {verses.map((v, index) => {


                      const hasNote = notes.some(n => 
                        n.book_abbr === selectedBook.abbr && 
                        n.chapter === selectedChapter && 
                        n.verse === v.number
                      );
                      
                      return (
                        <div 
                          key={v.number} 
                          id={`verse-${v.number}`} 
                          onClick={() => {
                            saveReadingProgress(selectedBook.abbr, selectedChapter, v.number);
                            setActiveVerse(v);
                            setIsHighlightMenuOpen(true);
                          }}
                          className={cn(
                            "flex gap-4 group relative transition-all duration-700 cursor-pointer active:bg-primary/[0.05] p-2 -mx-2 rounded-lg",
                            highlights[`${selectedBook.abbr}-${selectedChapter}-${v.number}`] === 'yellow' && "bg-yellow-200/40",
                            highlights[`${selectedBook.abbr}-${selectedChapter}-${v.number}`] === 'green' && "bg-green-200/40",
                            highlights[`${selectedBook.abbr}-${selectedChapter}-${v.number}`] === 'blue' && "bg-blue-200/40",
                            highlights[`${selectedBook.abbr}-${selectedChapter}-${v.number}`] === 'red' && "bg-red-200/40"
                          )}
                        >

                          <div className="flex flex-col items-center gap-2 mt-2 w-5 shrink-0">
                            <span className="text-[10px] font-serif font-bold text-secondary/30 tabular-nums">{v.number}</span>
                            {hasNote && (
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-secondary/60 shadow-sm" title="Possui anotação" />
                                <span className="text-[7px] font-black uppercase tracking-tighter text-secondary/40 leading-none">Meditado</span>
                              </div>
                            )}
                          </div>

                          
                          <div className="flex-1 space-y-4">
                            <p 
                              className={cn(
                                "leading-[1.85] font-serif text-primary/85 tracking-tight relative",
                                settings.fontSize === 'small' && "text-[16px]",
                                settings.fontSize === 'medium' && "text-[19px]",
                                settings.fontSize === 'large' && "text-[22px]",
                                settings.fontSize === 'extra-large' && "text-[26px]",
                                settings.lineSpacing === 'tight' && "leading-[1.6]",
                                settings.lineSpacing === 'normal' && "leading-[1.85]",
                                settings.lineSpacing === 'wide' && "leading-[2.1]",
                                settings.contrast === 'soft' && "opacity-70",
                                settings.contrast === 'high' && "text-primary font-bold"
                              )}
                            >
                              {wrapWithDictionary(v.text)}
                              
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAnnotation(v);
                                }}
                                className="absolute -right-8 top-1 p-2 text-primary/10 hover:text-secondary opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Icons.PenLine className="w-3.5 h-3.5" />
                              </button>
                            </p>

                            {/* Knowledge Connection Bubbles */}
                            {KNOWLEDGE_CONNECTIONS[`${selectedBook.abbr}-${selectedChapter}-${v.number}`] && (
                              <div className="flex flex-wrap gap-2 pt-1 opacity-80 max-h-12 overflow-hidden">
                                {KNOWLEDGE_CONNECTIONS[`${selectedBook.abbr}-${selectedChapter}-${v.number}`].slice(0, 3).map((conn, idx) => (
                                  <motion.button
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedConnection(conn);
                                    }}

                                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/50 border border-primary/5 shadow-sm active:scale-95 transition-all mb-1"
                                  >
                                    <div className={cn("w-1.5 h-1.5 rounded-full", conn.color)} />
                                    <span className="text-[8px] font-black uppercase tracking-wider text-primary/50">{conn.label}</span>
                                  </motion.button>
                                ))}
                              </div>
                            )}



                            {/* Cross References */}
                            {CROSS_REFERENCES[`${selectedBook.abbr}-${selectedChapter}-${v.number}`] && !KNOWLEDGE_CONNECTIONS[`${selectedBook.abbr}-${selectedChapter}-${v.number}`] && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {CROSS_REFERENCES[`${selectedBook.abbr}-${selectedChapter}-${v.number}`].map(ref => {
                                  const [b, c, vNum] = ref.split('-');
                                  return (
                                    <button
                                      key={ref}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/bible?book=${b}&ch=${c}&v=${vNum}`);
                                      }}
                                      className="text-[9px] font-black uppercase tracking-widest bg-secondary/5 text-secondary/60 px-2 py-1 rounded-full border border-secondary/10 hover:bg-secondary/10 transition-colors"
                                    >
                                      {b} {c}:{vNum}
                                    </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>








                  {/* Vertical Navigation Buttons */}
                  <footer className="pt-12 pb-20 space-y-4">
                    <div className="flex gap-4">
                      <Button 
                        onClick={prevChapter}
                        disabled={selectedChapter <= 1}
                        variant="outline"
                        className="flex-1 h-16 rounded-2xl border-primary/5 text-primary/40 text-[10px] font-black uppercase tracking-widest shadow-sm"
                      >
                        <Icons.ChevronLeft className="w-4 h-4 mr-2" /> Anterior
                      </Button>
                      <Button 
                        onClick={nextChapter}
                        disabled={selectedChapter >= selectedBook.chapters}
                        className="flex-[2] h-16 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all"
                      >
                        Próximo Capítulo <Icons.ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </footer>

                </article>
              )}
            </motion.div>
          </motion.div>
        )}
        {viewMode === 'search' && (
          <BibleSearch 
            onClose={() => setViewMode('home')} 
            onSelectResult={(book, chapter, verse) => {
              navigate(`/bible?book=${book}&ch=${chapter}&v=${verse}`);
              setViewMode('reading');
            }} 
            initialTheme={activeThemeFilter}
          />
        )}


        {viewMode === 'notes' && (
          <BibleFullNotesList 
            onClose={() => setViewMode('home')}
            onSelectReference={(book, chapter, verse) => {
              navigate(`/bible?book=${book}&ch=${chapter}&v=${verse}`);
              setViewMode('reading');
            }}
            onEditNote={async (noteId, text, color) => {
              await updateNote(noteId, text, color);
              toast.success('Anotação atualizada');
            }}
            onDeleteNote={async (noteId) => {
              await deleteNote(noteId);
              toast.success('Anotação removida');
            }}
          />
        )}

        {viewMode === 'monthly_recap' && (
          <MonthlyRecap 
            onClose={() => setViewMode('home')}
            onSelectDate={(bookAbbr, chapter) => {
              navigate(`/bible?book=${bookAbbr}&ch=${chapter}`);
              setViewMode('reading');
            }}
          />
        )}
      </AnimatePresence>

      {showKnowledgePanel && (
        <BibleKnowledgeAudit 
          onClose={() => setShowKnowledgePanel(false)} 
          auditData={auditData}
          onThemeClick={(theme) => {
            setActiveThemeFilter(theme);
            setViewMode('search');
            setShowKnowledgePanel(false);
          }}
        />
      )}



      <NoteEditModal 

        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        title={`${selectedBook?.name} ${selectedChapter}:${activeVerse?.number}`}
      />

      <HighlightMenu
        isOpen={isHighlightMenuOpen}
        onClose={() => setIsHighlightMenuOpen(false)}
        onSelectColor={(color) => {
          if (activeVerse) {
            toggleHighlight(activeVerse.number, color);
            setIsHighlightMenuOpen(false);
          }
        }}
        onAddNote={() => {
          setIsHighlightMenuOpen(false);
          setIsNoteModalOpen(true);
        }}
      />


      <AnimatePresence>
        {expandedConnection && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedConnection(null)}
              className="absolute inset-0 bg-background/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-primary/10 rounded-[2.5rem] shadow-premium p-8 md:p-10 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-display font-bold text-primary uppercase tracking-widest">{expandedConnection.label}</h3>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">Documentum Sacrum</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setExpandedConnection(null)} className="rounded-full opacity-40 hover:opacity-100">
                  <Icons.X className="w-6 h-6" />
                </Button>
              </div>
              
              <div className="bg-primary/[0.02] border border-primary/5 rounded-3xl p-6 md:p-8">
                <p className="text-lg font-serif italic text-primary/80 leading-relaxed">
                  {expandedConnection.summary}
                  {" "}Este texto representa o ensino oficial da Igreja sobre o tema. O Catecismo e o Magistério fornecem a lente interpretativa para as Sagradas Escrituras, garantindo a fidelidade à Tradição Apostólica.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setIsGraphOpen(true);
                  }}
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl text-[9px] font-black uppercase tracking-widest border-primary/10"
                >
                  <Icons.Orbit className="w-4 h-4 mr-2" /> Explorar Grafo
                </Button>

                <Button 
                  onClick={() => setExpandedConnection(null)}
                  className="flex-1 h-14 bg-primary text-primary-foreground rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all"
                >
                  Concluir Consulta
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGraphOpen && (
          <KnowledgeGraph 
            onClose={() => setIsGraphOpen(false)}
            initialNodeId={expandedConnection?.id}
            onNavigateToContent={(book, chapter, verse) => {
              navigate(`/bible?book=${book}&ch=${chapter}&v=${verse}`);
              setViewMode('reading');
              setIsGraphOpen(false);
              setExpandedConnection(null);
            }}

          />
        )}
      </AnimatePresence>


      <AnimatePresence>
        {isFeedbackOpen && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFeedbackOpen(false)}
              className="absolute inset-0 bg-background/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card border border-primary/10 rounded-[2.5rem] shadow-premium p-8 space-y-6"
            >
              <div className="text-center space-y-2">
                <Icons.HelpCircle className="w-10 h-10 text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-display font-bold text-primary uppercase tracking-widest">Suporte Sagrado</h3>
                <p className="text-sm font-serif italic text-primary/60">
                  Relate problemas de exibição ou sugira conexões teológicas.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary/30">O que está acontecendo?</span>
                  <textarea 
                    placeholder="Ex: O capítulo 3 de Gênesis não está carregando..."
                    className="w-full bg-primary/[0.02] border border-primary/5 rounded-2xl p-4 text-sm font-serif italic focus:outline-none focus:ring-1 focus:ring-secondary/20"
                    rows={4}
                  />
                </div>
              </div>

              <Button 
                onClick={() => {
                  toast.success('Feedback enviado com sucesso. Nossa equipe analisará o ocorrido.');
                  setIsFeedbackOpen(false);
                }}
                className="w-full h-14 bg-primary text-primary-foreground rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg"
              >
                Enviar Relatório
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isConnectionEditorOpen && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConnectionEditorOpen(false)}
              className="absolute inset-0 bg-[#0A0B0D]/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-primary/10 rounded-[2.5rem] shadow-premium p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-primary uppercase">Editor Bíblia ↔ CIC</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsConnectionEditorOpen(false)} className="rounded-full opacity-40">
                  <Icons.X className="w-6 h-6" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-primary/30">Versículo</span>
                    <input className="w-full bg-primary/[0.02] border border-primary/5 rounded-xl p-3 text-sm font-serif" placeholder="Ex: João 6,35" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-primary/30">Parágrafo CIC</span>
                    <input className="w-full bg-primary/[0.02] border border-primary/5 rounded-xl p-3 text-sm font-serif" placeholder="Ex: 1324" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-primary/30">Nota de Relacionamento</span>
                  <textarea className="w-full bg-primary/[0.02] border border-primary/5 rounded-xl p-3 text-sm font-serif" rows={2} placeholder="Descreva o motivo desta conexão..." />
                </div>
              </div>

              <div className="p-4 bg-primary/[0.01] rounded-2xl border border-primary/5 max-h-40 overflow-y-auto">
                <span className="text-[8px] font-black uppercase text-primary/20 block mb-3">Histórico de Revisão</span>
                <div className="space-y-3">
                  {[
                    { ref: 'Jo 1:1 ↔ CIC 279', status: 'Validado', author: 'Dr. Silva', date: '04/06/2026', diff: 'v1.2 → v1.3' },
                    { ref: 'Mt 5:3 ↔ CIC 1716', status: 'Pendente', author: 'Ana M.', date: '05/06/2026', diff: 'Novo' },
                  ].map((entry, idx) => (
                    <div key={idx} className="space-y-1 border-b border-primary/5 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-serif font-bold">{entry.ref}</span>
                        <span className={cn(
                          "font-bold uppercase tracking-tighter",
                          entry.status === 'Validado' ? "text-green-500" : "text-stone-400"
                        )}>{entry.status}</span>
                      </div>
                      <div className="flex justify-between text-[8px] text-primary/30 uppercase tracking-widest">
                        <span>{entry.author} • {entry.date}</span>
                        <span>{entry.diff}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => {
                  // Simplified validation rules
                  const verseInput = document.querySelector('input[placeholder="Ex: João 6,35"]') as HTMLInputElement;
                  const cicInput = document.querySelector('input[placeholder="Ex: 1324"]') as HTMLInputElement;
                  
                  if (!verseInput?.value || !cicInput?.value) {
                    toast.error('Preencha as referências obrigatórias');
                    return;
                  }

                  if (verseInput.value.includes('Jo 1:1') && cicInput.value.includes('279')) {
                    toast.warning('Esta conexão já existe no banco de dados');
                    return;
                  }

                  toast.success('Conexão enviada para validação teológica');
                  setIsConnectionEditorOpen(false);
                }}
                className="w-full h-14 bg-primary text-primary-foreground rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg"
              >
                Salvar Relação
              </Button>


            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Bible;
