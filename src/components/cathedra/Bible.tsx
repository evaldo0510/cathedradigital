import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import StaggeredList from './StaggeredList';
import CrossReferencePanel from './CrossReferencePanel';
import { getBibleCrossRefs } from '@/data/cross-references';
import { useNavigate, useSearchParams } from 'react-router-dom';

const BIBLE_BOOKS = {
  'Antigo Testamento': [
    { name: 'Gênesis', abbr: 'Gn', chapters: 50 },
    { name: 'Êxodo', abbr: 'Ex', chapters: 40 },
    { name: 'Levítico', abbr: 'Lv', chapters: 27 },
    { name: 'Números', abbr: 'Nm', chapters: 36 },
    { name: 'Deuteronômio', abbr: 'Dt', chapters: 34 },
    { name: 'Josué', abbr: 'Js', chapters: 24 },
    { name: 'Juízes', abbr: 'Jz', chapters: 21 },
    { name: 'Rute', abbr: 'Rt', chapters: 4 },
    { name: '1 Samuel', abbr: '1Sm', chapters: 31 },
    { name: '2 Samuel', abbr: '2Sm', chapters: 24 },
    { name: '1 Reis', abbr: '1Rs', chapters: 22 },
    { name: '2 Reis', abbr: '2Rs', chapters: 25 },
    { name: '1 Crônicas', abbr: '1Cr', chapters: 29 },
    { name: '2 Crônicas', abbr: '2Cr', chapters: 36 },
    { name: 'Esdras', abbr: 'Esd', chapters: 10 },
    { name: 'Neemias', abbr: 'Ne', chapters: 13 },
    { name: 'Tobias', abbr: 'Tb', chapters: 14 },
    { name: 'Judite', abbr: 'Jt', chapters: 16 },
    { name: 'Ester', abbr: 'Est', chapters: 10 },
    { name: '1 Macabeus', abbr: '1Mc', chapters: 16 },
    { name: '2 Macabeus', abbr: '2Mc', chapters: 15 },
    { name: 'Jó', abbr: 'Jó', chapters: 42 },
    { name: 'Salmos', abbr: 'Sl', chapters: 150 },
    { name: 'Provérbios', abbr: 'Pr', chapters: 31 },
    { name: 'Eclesiastes', abbr: 'Ecl', chapters: 12 },
    { name: 'Cântico dos Cânticos', abbr: 'Ct', chapters: 8 },
    { name: 'Sabedoria', abbr: 'Sb', chapters: 19 },
    { name: 'Eclesiástico', abbr: 'Eclo', chapters: 51 },
    { name: 'Isaías', abbr: 'Is', chapters: 66 },
    { name: 'Jeremias', abbr: 'Jr', chapters: 52 },
    { name: 'Lamentações', abbr: 'Lm', chapters: 5 },
    { name: 'Baruc', abbr: 'Br', chapters: 6 },
    { name: 'Ezequiel', abbr: 'Ez', chapters: 48 },
    { name: 'Daniel', abbr: 'Dn', chapters: 14 },
    { name: 'Oseias', abbr: 'Os', chapters: 14 },
    { name: 'Joel', abbr: 'Jl', chapters: 4 },
    { name: 'Amós', abbr: 'Am', chapters: 9 },
    { name: 'Abdias', abbr: 'Ab', chapters: 1 },
    { name: 'Jonas', abbr: 'Jn', chapters: 4 },
    { name: 'Miqueias', abbr: 'Mq', chapters: 7 },
    { name: 'Naum', abbr: 'Na', chapters: 3 },
    { name: 'Habacuc', abbr: 'Hab', chapters: 3 },
    { name: 'Sofonias', abbr: 'Sf', chapters: 3 },
    { name: 'Ageu', abbr: 'Ag', chapters: 2 },
    { name: 'Zacarias', abbr: 'Zc', chapters: 14 },
    { name: 'Malaquias', abbr: 'Ml', chapters: 3 },
  ],
  'Novo Testamento': [
    { name: 'Mateus', abbr: 'Mt', chapters: 28 },
    { name: 'Marcos', abbr: 'Mc', chapters: 16 },
    { name: 'Lucas', abbr: 'Lc', chapters: 24 },
    { name: 'João', abbr: 'Jo', chapters: 21 },
    { name: 'Atos dos Apóstolos', abbr: 'At', chapters: 28 },
    { name: 'Romanos', abbr: 'Rm', chapters: 16 },
    { name: '1 Coríntios', abbr: '1Cor', chapters: 16 },
    { name: '2 Coríntios', abbr: '2Cor', chapters: 13 },
    { name: 'Gálatas', abbr: 'Gl', chapters: 6 },
    { name: 'Efésios', abbr: 'Ef', chapters: 6 },
    { name: 'Filipenses', abbr: 'Fl', chapters: 4 },
    { name: 'Colossenses', abbr: 'Cl', chapters: 4 },
    { name: '1 Tessalonicenses', abbr: '1Ts', chapters: 5 },
    { name: '2 Tessalonicenses', abbr: '2Ts', chapters: 3 },
    { name: '1 Timóteo', abbr: '1Tm', chapters: 6 },
    { name: '2 Timóteo', abbr: '2Tm', chapters: 4 },
    { name: 'Tito', abbr: 'Tt', chapters: 3 },
    { name: 'Filemon', abbr: 'Fm', chapters: 1 },
    { name: 'Hebreus', abbr: 'Hb', chapters: 13 },
    { name: 'Tiago', abbr: 'Tg', chapters: 5 },
    { name: '1 Pedro', abbr: '1Pd', chapters: 5 },
    { name: '2 Pedro', abbr: '2Pd', chapters: 3 },
    { name: '1 João', abbr: '1Jo', chapters: 5 },
    { name: '2 João', abbr: '2Jo', chapters: 1 },
    { name: '3 João', abbr: '3Jo', chapters: 1 },
    { name: 'Judas', abbr: 'Jd', chapters: 1 },
    { name: 'Apocalipse', abbr: 'Ap', chapters: 22 },
  ],
};

type ViewMode = 'books' | 'chapters' | 'reading';

const FONT_SIZES = [
  { label: 'P', size: 'text-sm', leading: 'leading-relaxed' },
  { label: 'M', size: 'text-base', leading: 'leading-[1.9]' },
  { label: 'G', size: 'text-lg', leading: 'leading-[2]' },
];

const Bible: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('books');
  const [selectedBook, setSelectedBook] = useState<{ name: string; abbr: string; chapters: number } | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [testament, setTestament] = useState<'Antigo Testamento' | 'Novo Testamento'>('Antigo Testamento');
  const [verses, setVerses] = useState<{ number: number; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bibleError, setBibleError] = useState('');
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [fontSizeIdx, setFontSizeIdx] = useState(1);
  const [showCrossRefs, setShowCrossRefs] = useState(true);

  const filteredBooks = useMemo(() => {
    const books = BIBLE_BOOKS[testament];
    if (!searchQuery) return books;
    return books.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.abbr.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [testament, searchQuery]);

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

  useEffect(() => {
    if (viewMode === 'reading' && selectedBook && selectedChapter > 0) {
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
        } else {
          setBibleError('Texto não disponível para este capítulo.');
        }
        setIsLoading(false);
      });
    }
  }, [viewMode, selectedBook, selectedChapter]);

  // Reading view
  if (viewMode === 'reading' && selectedBook) {
    const fs = FONT_SIZES[fontSizeIdx];
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
            <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
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
              verses.map(v => (
                <p
                  key={v.number}
                  onClick={() => setHighlightedVerse(highlightedVerse === v.number ? null : v.number)}
                  className={`cursor-pointer rounded-lg px-2 py-1 -mx-2 transition-all ${
                    highlightedVerse === v.number ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted/50'
                  }`}
                >
                  <sup className="text-primary font-bold mr-1 text-xs select-none">{v.number}</sup>
                  <span className="font-serif">{v.text}</span>
                </p>
              ))
            ) : (
              <p className="text-muted-foreground italic text-center py-12">Carregando...</p>
            )}
          </div>
        </div>

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
            return (
              <button key={ch} onClick={() => selectChapter(ch)}
                className={`aspect-square rounded-xl bg-card border flex items-center justify-center text-sm font-bold transition-all shadow-sm relative ${
                  hasRefs ? 'border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary' : 'border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary'
                }`}>
                {ch}
                {hasRefs && (
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
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Book className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Scriptuarium</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Bíblia Sagrada</h1>
        <p className="text-muted-foreground font-serif italic">Cânon completo com 73 livros da tradição católica.</p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar livro..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

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

      {/* Books grid */}
      <StaggeredList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" staggerDelay={0.04}>
        {filteredBooks.map(book => (
          <button key={book.abbr} onClick={() => selectBook(book)}
            className="text-left p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{book.abbr}</span>
            <p className="text-sm font-bold text-foreground mt-1 group-hover:text-primary transition-colors">{book.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{book.chapters} cap.</p>
          </button>
        ))}
      </StaggeredList>
    </div>
  );
};

export default Bible;
