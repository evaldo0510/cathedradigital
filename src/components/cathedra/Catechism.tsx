import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRenderPerf } from '@/hooks/useRenderPerf';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import ShareButton from './ShareButton';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import Relatio from './Relatio';
import NotesPanel from './NotesPanel';
import BibleVersePopover from './BibleVersePopover';
import DeepContentSection from './DeepContentSection';
import MagisteriumPopover from './MagisteriumPopover';
import { getCatechismCrossRefs, getCatechismDocs } from '@/data/cross-references';
import { CIC_SECTIONS, CATECHISM_LOCAL_DATA } from '@/data/catechism';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppRoute } from '@/types';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useCatechismParagraph, usePrefetchCatechismParagraph } from '@/hooks/useCatechismParagraph';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import CatechismPopover from './CatechismPopover';
import AudioButton from './AudioButton';
import { CatechismParagraphSkeleton } from './SacredSkeleton';
import CatechismOfflineFallback from './CatechismOfflineFallback';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import ReadingControlPanel from './ReadingControlPanel';
import LogosAI from './LogosAI';
import { LogosContextualSuggestions } from './LogosContextualSuggestions';
import ReadingMark from './ReadingMark';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { useAutoFocus } from '@/hooks/useAutoFocus';
import { toast } from 'sonner';
import ContemplativeLayout from './ContemplativeLayout';
import useReadingAutoHide from '@/hooks/useReadingAutoHide';
import { ReadingProgress } from './ReadingProgress';
import { TextSelectionToolbar } from './TextSelectionToolbar';
import ChapterNotesList from './ChapterNotesList';
import { useNotes, UserNote } from '@/hooks/useNotes';
import { NoteEditModal } from './NoteEditModal';
import { cn } from '@/lib/utils';
import { CathedraCard } from './CathedraCard';

const CatechismContent: React.FC<{ 
  paragraph: number; 
  onNavigateToBible?: (abbr: string, chapter: number) => void; 
  isVisible?: boolean;
  onHighlightClick?: (note: UserNote) => void;
  highlights?: UserNote[];
}> = ({ paragraph, onNavigateToBible, isVisible = true, onHighlightClick, highlights = [] }) => {
  const { data, isLoading, isError } = useCatechismParagraph(paragraph, isVisible);
  const prefetch = usePrefetchCatechismParagraph();
  const settingsContext = useReadingSettings();
  const settings = settingsContext?.settings || { fontSize: 'medium', fontFamily: 'serif' };

  useEffect(() => {
    if (isVisible && paragraph < 2865) prefetch(paragraph + 1);
  }, [paragraph, prefetch, isVisible]);

  const segments = useMemo(() => {
    if (!data?.content || data.status === 'not_cached') return [];
    return parseTheologicalReferences(data.content);
  }, [data?.content, data?.status]);

  if (!isVisible) {
    return (
      <div className="reader-text text-foreground/30 leading-[2] text-lg py-4 h-24 flex items-center">
        <span className="text-sm text-muted-foreground italic">Rolar para carregar §{paragraph}...</span>
      </div>
    );
  }

  if (isLoading) {
    return <CatechismParagraphSkeleton paragraph={paragraph} />;
  }

  if (isError) {
    return (
      <div className="reader-text bg-destructive/5 border border-destructive/10 rounded-premium p-4 text-destructive font-serif text-sm py-4 space-y-2">
        <div className="font-bold flex items-center gap-2">
           <Icons.Cross className="w-4 h-4" />
           Ops! Problema ao carregar o parágrafo §{paragraph}.
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className={`reader-text text-foreground/90 font-size-${settings.fontSize} font-family-${settings.fontFamily} prose prose-lg dark:prose-invert max-w-none transition-all duration-300`}>
      {segments.map((seg, i) =>
        seg.type === 'bibleRef' && seg.abbr ? (
          <BibleVersePopover key={i} abbr={seg.abbr} chapter={seg.chapter!} verse={seg.verse} label={seg.value} onNavigate={onNavigateToBible} />
        ) : seg.type === 'catechismRef' && seg.paragraph ? (
          <CatechismPopover key={i} paragraph={seg.paragraph} />
        ) : (
          <ReactMarkdown key={i} components={{
            p: (props) => {
              const h = highlights.find(n => n.paragraph === paragraph && n.highlight_color);
              if (h) {
                return (
                  <span onClick={() => onHighlightClick?.(h)} className={`highlight-${h.highlight_color} px-1 rounded-sm cursor-pointer hover:brightness-95 transition-all`}>
                    {props.children}
                  </span>
                );
              }
              return <span>{props.children}</span>;
            },
          }}>{seg.value}</ReactMarkdown>
        )
      )}
    </div>
  );
};

const LazyParagraph: React.FC<{ 
  paragraph: number; 
  currentParagraph: number; 
  paragraphsRead: Set<number>; 
  isFavorite: (type: string, title: string) => boolean; 
  toggleFavorite: (item: any) => void; 
  handleNavigateToBible: (abbr: string, chapter: number) => void;
  onHighlightClick?: (note: UserNote) => void;
  highlights?: UserNote[];
}> = ({ paragraph: p, currentParagraph, paragraphsRead, isFavorite, toggleFavorite, handleNavigateToBible, onHighlightClick, highlights = [] }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: '300px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} id={`p${p}`} className={`scroll-mt-28 transition-all duration-700 pb-12 border-b border-primary/[0.03] last:border-0 last:pb-0 ${currentParagraph === p ? 'relative' : 'opacity-70 hover:opacity-100'}`}>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-lg md:text-xl font-display font-light tracking-[0.1em] text-primary/30">§{p}</span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button onClick={() => toggleFavorite({ type: 'catechism', title: `CIC §${p}`, content: `Catecismo da Igreja Católica, parágrafo §${p}` })} className="p-1.5 rounded-full hover:bg-primary/5 transition-all">
              <Icons.Heart className={`w-3.5 h-3.5 transition-all ${isFavorite('catechism', `CIC §${p}`) ? 'fill-primary text-primary' : 'text-muted-foreground/40'}`} />
            </Button>
            <Button onClick={() => (window as any).dispatchEvent(new CustomEvent('open-logos-ai', { detail: { context: `Catecismo §${p}`, type: 'catechism' } }))} className="p-1.5 rounded-full hover:bg-primary/5 transition-all text-muted-foreground/40 hover:text-primary">
              <Icons.Sparkles className="w-3.5 h-3.5" />
            </Button>
              <ReadingMark contentType="catechism" contentId={`${p}`} label={`Catecismo §${p}`} paragraph={p} />
          </div>
        </div>
        <div className="h-[0.5px] flex-1 bg-gradient-to-r from-primary/[0.05] via-transparent to-transparent" />
      </div>
      <CatechismContent paragraph={p} onNavigateToBible={handleNavigateToBible} isVisible={isVisible} onHighlightClick={onHighlightClick} highlights={highlights} />
    </div>
  );
};

type ViewMode = 'parts' | 'sections' | 'reading';

const Catechism: React.FC = memo(() => {
  useRenderPerf('Catechism', 15);
  const { settings } = useReadingSettings();
  const navigate = useNavigate();
  useAutoFocus();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>(() => searchParams.get('p') ? 'reading' : 'parts');
  const [selectedPart, setSelectedPart] = useState<typeof CIC_SECTIONS[0] | null>(null);
  const [selectedSection, setSelectedSection] = useState<typeof CIC_SECTIONS[0]['sections'][0] | null>(null);
  const [currentParagraph, setCurrentParagraph] = useState(() => {
    const p = searchParams.get('p');
    return p ? parseInt(p) : 1;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogosAI, setShowLogosAI] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { notes: chapterNotes, addNote, updateNote, deleteNote: deleteChapterNote } = useNotes('catechism');
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<UserNote | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  useEffect(() => {
    if (viewMode !== 'reading') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveParagraphId(entry.target.id);
            const pNum = parseInt(entry.target.id.replace('p', ''));
            if (!isNaN(pNum)) setCurrentParagraph(pNum);
          }
        });
      },
      { threshold: 0.5, rootMargin: '-10% 0px -70% 0px' }
    );
    document.querySelectorAll('[id^="p"]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [viewMode, selectedSection]);

  const goBack = () => {
    if (viewMode === 'reading') setViewMode('sections');
    else if (viewMode === 'sections') { setViewMode('parts'); setSelectedPart(null); }
  };

  const jumpToParagraph = (p: number) => {
    const part = CIC_SECTIONS.find(pt => pt.sections.some(s => p >= s.paragraphs[0] && p <= s.paragraphs[1]));
    if (part) {
      const section = part.sections.find(s => p >= s.paragraphs[0] && p <= s.paragraphs[1]);
      setSelectedPart(part);
      setSelectedSection(section || null);
      setCurrentParagraph(p);
      setViewMode('reading');
      setTimeout(() => {
        document.getElementById(`p${p}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  const handleNavigateToBible = (abbr: string, chapter: number) => navigate(`/bible?book=${abbr}&ch=${chapter}`);
  const handleNavigateToDoc = (docId: string) => navigate(`/magisterium?doc=${docId}`);

  const startPara = selectedSection?.paragraphs[0] || 1;
  const endPara = selectedSection?.paragraphs[1] || 2865;

  const currentChapterNotes = useMemo(() => {
    if (!selectedSection) return [];
    return chapterNotes.filter(n => (n.paragraph || 0) >= startPara && (n.paragraph || 0) <= endPara);
  }, [chapterNotes, selectedSection, startPara, endPara]);

  const nextUnreadParagraph = 1; // Simplified for template consistency

  if (viewMode === 'reading' && selectedSection && selectedPart) {
    return (
      <ContemplativeLayout subtitle={selectedSection.title} title="Catecismo" icon={Icons.Catechism}>
        <div className="max-w-[70ch] mx-auto space-y-12">
          {/* Unified Reading Navigation */}
          <div className="flex items-center justify-between gap-4 py-4 border-b border-primary/5 mb-12">
             <Button variant="ghost" onClick={goBack} className="text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary">← Sumário</Button>
             <div className="flex items-center gap-6">
                <Button 
                  disabled={selectedSection.id <= 1}
                  onClick={() => {
                    const prev = selectedPart.sections.find(s => s.id === selectedSection.id - 1);
                    if (prev) { setSelectedSection(prev); setCurrentParagraph(prev.paragraphs[0]); window.scrollTo(0,0); }
                  }}
                  variant="ghost" className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100">Anterior</Button>
                <span className="text-xs font-serif italic text-primary/20">Seção {selectedSection.id}</span>
                <Button 
                  disabled={selectedSection.id >= 10}
                  onClick={() => {
                    const next = selectedPart.sections.find(s => s.id === selectedSection.id + 1);
                    if (next) { setSelectedSection(next); setCurrentParagraph(next.paragraphs[0]); window.scrollTo(0,0); }
                  }}
                  variant="ghost" className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100">Próxima</Button>
             </div>
             <ReadingControlPanel />
          </div>

          <div className="space-y-16">
            {Array.from({ length: endPara - startPara + 1 }, (_, i) => startPara + i).map(p => (
              <LazyParagraph key={p} paragraph={p} currentParagraph={currentParagraph} paragraphsRead={new Set()} isFavorite={isFavorite} toggleFavorite={toggleFavorite} handleNavigateToBible={handleNavigateToBible} highlights={currentChapterNotes} />
            ))}
          </div>

          <div className="mt-32 pt-24 border-t border-primary/5">
             <Relatio context={{ type: 'catechism', paragraph: currentParagraph }} onNavigateToBible={handleNavigateToBible} onNavigateToCIC={jumpToParagraph} onNavigateToDoc={handleNavigateToDoc} />
          </div>
        </div>
      </ContemplativeLayout>
    );
  }

  if (viewMode === 'sections' && selectedPart) {
    return (
      <ContemplativeLayout subtitle={selectedPart.part} title={selectedPart.title} icon={Icons.Catechism}>
        <div className="w-full space-y-12 pb-32">
          <div className="flex justify-center">
            <Button variant="ghost" onClick={goBack} className="px-8 py-3 h-auto rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-primary/40 hover:text-primary border border-primary/5 transition-all">
              <Icons.ChevronLeft className="w-3.5 h-3.5 mr-2" /> Voltar às Partes
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedPart.sections.map((sec, idx) => (
              <CathedraCard key={sec.id} variant="interactive" padding="none" onClick={() => { setSelectedSection(sec); setViewMode('reading'); setCurrentParagraph(sec.paragraphs[0]); window.scrollTo(0,0); }} className="group">
                <div className="p-6 flex items-center justify-between h-full">
                  <div className="space-y-2 text-left">
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary/30">Seção {sec.id}</span>
                    <h3 className="text-base font-display font-light text-foreground/80 group-hover:text-primary transition-colors leading-snug">{sec.title}</h3>
                    <p className="text-[9px] text-muted-foreground/50 italic tracking-wider uppercase">§{sec.paragraphs[0]} — §{sec.paragraphs[1]}</p>
                  </div>
                  <Icons.ChevronRight className="w-3.5 h-3.5 text-primary/10 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </CathedraCard>
            ))}
          </div>
        </div>
      </ContemplativeLayout>
    );
  }

  return (
    <ContemplativeLayout subtitle="Sacra Doctrina" title="Catecismo" icon={Icons.Catechism}>
      <SEOHead title="Catecismo da Igreja Católica | Cathedra Digital" description="Doutrina católica organizada por parágrafos." path="/catechism" />
      <div className="w-full space-y-12 pb-32">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/[0.01] blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/20 group-focus-within:text-primary transition-all duration-700" />
          <input type="text" placeholder="Buscar por parágrafo (§) ou tema..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && jumpToParagraph(parseInt(searchQuery.replace('§', '')))} className="search-input-premium pl-16" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CIC_SECTIONS.map((part, idx) => (
            <div 
              key={part.part} 
              onClick={() => { setSelectedPart(part); setViewMode('sections'); }} 
              className="group cursor-pointer p-6 flex flex-col justify-between h-full space-y-6 text-left transition-all duration-1000 hover:bg-primary/[0.01] rounded-[2rem] border border-transparent hover:border-primary/[0.03]"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/30">{part.part}</span>
                  <div className="h-[0.5px] flex-1 bg-gradient-to-r from-primary/[0.08] to-transparent" />
                </div>
                <h2 className="text-xl font-display font-light text-foreground/80 group-hover:text-primary transition-colors leading-tight">{part.title}</h2>
              </div>
              <div className="flex items-center justify-between pt-2 opacity-0 group-hover:opacity-100 transition-all duration-1000">
                 <p className="text-[9px] text-muted-foreground/40 italic uppercase tracking-widest">{part.sections.length} Seções</p>
                 <Icons.ChevronRight className="w-3.5 h-3.5 text-primary/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ContemplativeLayout>
  );
});

export default Catechism;