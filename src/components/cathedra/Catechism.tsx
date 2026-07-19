import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRenderPerf } from '@/hooks/useRenderPerf';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

import SEOHead from '@/components/SEOHead';

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
import { getParagraphParam } from '@/lib/queryParams';
import { isValidCatechismParagraph } from '@/lib/nexusNavigation';
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
import PassageActions from '@/components/shared/PassageActions';
import { CathedraCard } from './CathedraCard';
import CatechismDiagnosticPanel from './CatechismDiagnosticPanel';
import { CatechismPendingProvider, useCatechismPending } from '@/contexts/CatechismPendingContext';
import CatechismPendingPanel from './CatechismPendingPanel';
import { ReaderContinuation } from '@/components/shared/ReaderContinuation';
import NexusBubbles from '@/components/cathedra/NexusBubbles';
import { EditorialReaderHeader, EditorialDivider } from '@/components/editorial';


const CatechismContent: React.FC<{ 
  paragraph: number; 
  onNavigateToBible?: (abbr: string, chapter: number) => void; 
  isVisible?: boolean;
  onHighlightClick?: (note: UserNote) => void;
  highlights?: UserNote[];
}> = ({ paragraph, onNavigateToBible, isVisible = true, onHighlightClick, highlights = [] }) => {
  const { data, isLoading, isError, error, refetch, isFetching } = useCatechismParagraph(paragraph, isVisible);
  const prefetch = usePrefetchCatechismParagraph();
  const { settings } = useReadingSettings();
  const { markPending, clearPending } = useCatechismPending();

  useEffect(() => {
    if (isVisible && paragraph < 2865) prefetch(paragraph + 1);
  }, [paragraph, prefetch, isVisible]);

  // Sincroniza este parágrafo com o painel de pendências da seção.
  useEffect(() => {
    if (isError && (error as any)?.code === 'not_found') {
      markPending(paragraph);
    } else if (data) {
      clearPending(paragraph);
    }
  }, [isError, error, data, paragraph, markPending, clearPending]);

  const handleRetry = useCallback(async () => {
    const readNum = (k: string, fb: number, min: number, max: number) => {
      const v = Number(localStorage.getItem(k));
      return Number.isFinite(v) && v >= min && v <= max ? v : fb;
    };
    const MAX_RETRIES = readNum('cathedra.catechism.verifyMaxRetries', 3, 0, 6);
    const BASE_MS = readNum('cathedra.catechism.verifyBaseBackoffMs', 600, 100, 5000);
    let attempt = 0;
    let lastResult: any = null;
    while (attempt <= MAX_RETRIES) {
      attempt += 1;
      lastResult = await refetch();
      if (!lastResult.error) break;
      const code = (lastResult.error as any)?.code ?? 'unknown';
      const transient = code === 'network' || code === 'unknown';
      if (!transient || attempt > MAX_RETRIES) break;
      await new Promise(r => setTimeout(r, BASE_MS * Math.pow(2, attempt - 1)));
    }
    if (lastResult?.error) {
      const err: any = lastResult.error;
      const code = err?.code ?? 'unknown';
      const reason =
        code === 'not_found' ? 'não encontrado no banco oficial' :
        code === 'network' ? 'falha de rede' :
        code === 'unauthorized' ? 'sessão expirada' :
        code === 'forbidden' ? 'sem permissão' :
        'erro desconhecido';
      toast.error(`§${paragraph} — ${reason}`, {
        description: `Tentativa ${attempt}${err?.status ? ` · HTTP ${err.status}` : ''}${err?.message ? ` · ${err.message}` : ''}`,
      });
    } else if (lastResult?.data) {
      toast.success(`§${paragraph} carregado com sucesso.`);
    }
  }, [refetch, paragraph]);

  const segments = useMemo(() => {
    if (!data?.content || data.status === 'not_cached') return [];
    return parseTheologicalReferences(data.content);
  }, [data?.content, data?.status]);

  if (!isVisible) {
    return (
      <div className="reader-text text-foreground/30 leading-[2] text-premium-lg py-spacing-md h-spacing-4xl flex items-center">
        <span className="text-premium-sm text-muted-foreground italic">Rolar para carregar §{paragraph}...</span>
      </div>
    );
  }

  if (isLoading) {
    return <CatechismParagraphSkeleton paragraph={paragraph} />;
  }

  // Refetch em andamento após erro: mostra skeleton em vez de bolha vazia.
  if (isError && isFetching) {
    return <CatechismParagraphSkeleton paragraph={paragraph} />;
  }

  if (isError) {
    const err: any = error;
    const code: string = err?.code ?? 'unknown';
    const status = err?.status;

    if (code === 'not_found') {
      return (
        <div
          role="note"
          aria-live="polite"
          data-testid={`catechism-placeholder-${paragraph}`}
          className="reader-text bg-muted/30 border border-dashed border-primary/15 rounded-premium p-spacing-md font-serif text-premium-sm italic text-muted-foreground space-y-spacing-xs"
        >
          <div className="flex items-center gap-spacing-xs not-italic font-display tracking-[0.1em] uppercase text-premium-xs text-primary/50">
            <Icons.Catechism className="w-spacing-sm h-spacing-sm" />
            Texto em preparação
          </div>
          <p>
            O parágrafo §{paragraph} ainda não foi importado para o banco oficial em português.
            Estamos preparando o texto soberano para que esteja disponível em breve.
          </p>
          <div className="pt-spacing-xs">
            <Button
              onClick={handleRetry}
              disabled={isFetching}
              variant="ghost"
              size="sm"
              data-testid={`catechism-retry-${paragraph}`}
              className="text-primary/60 hover:text-primary"
            >
              {isFetching ? 'Verificando…' : 'Verificar novamente'}
            </Button>
          </div>
        </div>
      );
    }

    const title =
      code === 'unauthorized' ? `Sessão expirada — faça login para ler §${paragraph}.` :
      code === 'forbidden'    ? `Sem permissão para acessar §${paragraph}.` :
      code === 'network'      ? `Sem conexão para carregar §${paragraph}.` :
                                `Ops! Não conseguimos carregar §${paragraph}.`;
    return (
      <div
        role="alert"
        aria-live="polite"
        data-testid={`catechism-error-${paragraph}`}
        className="reader-text bg-destructive/5 border border-destructive/10 rounded-premium p-spacing-md text-destructive font-serif text-premium-sm py-spacing-md space-y-spacing-xs"
      >
        <div className="font-bold flex items-center gap-spacing-xs">
          <Icons.Cross className="w-spacing-md h-spacing-md" />
          {title}
        </div>
        {err?.message && (
          <div className="text-premium-xs text-destructive/80 font-sans">
            {err.message}{status ? ` (HTTP ${status})` : ''}
          </div>
        )}
        <div className="flex items-center gap-spacing-xs pt-spacing-xs">
          <Button
            onClick={handleRetry}
            disabled={isFetching}
            variant="outline"
            size="sm"
            data-testid={`catechism-retry-${paragraph}`}
          >
            {isFetching ? 'Tentando…' : 'Tentar novamente'}
          </Button>
          {code === 'unauthorized' && (
            <Button asChild variant="ghost" size="sm">
              <a href="/auth">Entrar</a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "reader-text text-foreground/90 font-size-", settings.fontSize, 
      "font-family-", settings.fontFamily, 
      "prose prose-lg dark:prose-invert max-w-none transition-all",
      settings.reduceAnimations ? "duration-0" : "duration-300"
    )}>
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
                  <span onClick={() => onHighlightClick?.(h)} className={`highlight-${h.highlight_color} px-spacing-2xs rounded-premium-sm cursor-pointer hover:brightness-95 transition-all`}>
                    {props.children}
                  </span>
                );
              }
              return <span>{props.children}</span>;
            },
          }}>{seg.value}</ReactMarkdown>
        )
      )}
      {data?.content && (
        <div className="mt-spacing-md pt-spacing-sm border-t border-primary/[0.06]">
          <PassageActions
            text={data.content}
            reference={`CIC §${paragraph}`}
            title={`Cathedra — CIC §${paragraph}`}
            passage={{ kind: 'catechism', paragraph }}
          />
          <div className="mt-spacing-md">
            <NexusBubbles />
          </div>
          <ReaderContinuation
            context={{
              kind: 'catechism',
              id: String(paragraph),
              meta: { paragraph, nextParagraph: paragraph + 1 },
            }}
          />
        </div>
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
  const { settings } = useReadingSettings();

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
    <article 
      ref={ref} 
      id={`p${p}`} 
      className={cn(
        "scroll-mt-spacing-4xl transition-all pb-spacing-lg md:pb-spacing-2xl border-b border-primary/[0.03] last:border-0 last:pb-spacing-0",
        settings.reduceAnimations ? "duration-0" : "duration-700",
        currentParagraph === p ? 'relative' : 'opacity-70 hover:opacity-100'
      )}
      aria-labelledby={`heading-p${p}`}
    >
      <div className="flex items-center gap-spacing-md mb-spacing-lg">
        <div className="flex items-center gap-spacing-sm">
          <span id={`heading-p${p}`} className="text-premium-base md:text-premium-lg font-display tracking-[0.18em] text-secondary/70 uppercase">§{p}</span>
          <div className="flex items-center gap-spacing-3xs opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => toggleFavorite({ type: 'catechism', title: `CIC §${p}`, content: `Catecismo da Igreja Católica, parágrafo §${p}` })}
              className="rounded-premium-full hover:bg-primary/5 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label={`${isFavorite('catechism', `CIC §${p}`) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} - Parágrafo ${p}`}
            >
              <Icons.Heart className={`w-spacing-sm h-spacing-sm transition-all ${isFavorite('catechism', `CIC §${p}`) ? 'fill-primary text-primary' : 'text-muted-foreground/40'}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => (window as any).dispatchEvent(new CustomEvent('open-logos-ai', { detail: { context: `Catecismo §${p}`, type: 'catechism' } }))}
              className="rounded-premium-full hover:bg-primary/5 transition-all text-muted-foreground/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label={`Perguntar à Logos IA sobre o Parágrafo ${p}`}
            >
              <Icons.Sparkles className="w-spacing-sm h-spacing-sm" />
            </Button>
            <ReadingMark contentType="catechism" contentId={`${p}`} label={`Catecismo §${p}`} paragraph={p} />
          </div>
        </div>
        <div className="h-[0.5px] flex-1 bg-gradient-to-r from-primary/[0.05] via-transparent to-transparent" />
      </div>
      <CatechismContent paragraph={p} onNavigateToBible={handleNavigateToBible} isVisible={isVisible} onHighlightClick={onHighlightClick} highlights={highlights} />
    </article>
  );
};

type ViewMode = 'parts' | 'sections' | 'reading';

const Catechism: React.FC = memo(() => {
  useRenderPerf('Catechism', 15);
  const { settings } = useReadingSettings();
  const navigate = useNavigate();
  useAutoFocus();
  const [searchParams] = useSearchParams();
  const initialParagraph = useMemo(() => {
    const raw = getParagraphParam(searchParams);
    if (raw == null) return null;
    const n = parseInt(raw, 10);
    return isValidCatechismParagraph(n) ? n : 'invalid' as const;
  }, [searchParams]);
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    typeof initialParagraph === 'number' ? 'reading' : 'parts',
  );
  const [selectedPart, setSelectedPart] = useState<typeof CIC_SECTIONS[0] | null>(null);
  const [selectedSection, setSelectedSection] = useState<typeof CIC_SECTIONS[0]['sections'][0] | null>(null);
  const [currentParagraph, setCurrentParagraph] = useState(() =>
    typeof initialParagraph === 'number' ? initialParagraph : 1,
  );
  const [lastFocusedElement, setLastFocusedElement] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogosAI, setShowLogosAI] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { notes: chapterNotes, addNote, updateNote, deleteNote: deleteChapterNote } = useNotes('catechism');
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<UserNote | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  useEffect(() => {
    if (initialParagraph === 'invalid') {
      toast.error('Referência inválida do Catecismo — abrindo o índice.', { duration: 4000 });
    }
    // Só notifica uma vez por mudança de query.
  }, [initialParagraph]);

  // Deep-link ?p=N: resolve part+section para entrar em modo leitura.
  useEffect(() => {
    if (typeof initialParagraph !== 'number') return;
    const part = CIC_SECTIONS.find(pt => pt.sections.some(s => initialParagraph >= s.paragraphs[0] && initialParagraph <= s.paragraphs[1]));
    if (!part) return;
    const section = part.sections.find(s => initialParagraph >= s.paragraphs[0] && initialParagraph <= s.paragraphs[1]) || null;
    setSelectedPart(part);
    setSelectedSection(section);
    setViewMode('reading');
    setCurrentParagraph(initialParagraph);
  }, [initialParagraph]);



  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewMode === 'reading') {
          setViewMode('sections');
          setTimeout(() => {
            if (lastFocusedElement) {
              document.getElementById(lastFocusedElement)?.focus();
            }
          }, 100);
        } else if (viewMode === 'sections') {
          setViewMode('parts');
          setSelectedPart(null);
          setTimeout(() => {
            if (lastFocusedElement) {
              document.getElementById(lastFocusedElement)?.focus();
            }
          }, 100);
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [viewMode, lastFocusedElement]);

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
    if (viewMode === 'reading') {
      setViewMode('sections');
      setTimeout(() => {
        if (lastFocusedElement) document.getElementById(lastFocusedElement)?.focus();
      }, 100);
    } else if (viewMode === 'sections') {
      setViewMode('parts');
      setSelectedPart(null);
      setTimeout(() => {
        if (lastFocusedElement) document.getElementById(lastFocusedElement)?.focus();
      }, 100);
    }
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
      <CatechismPendingProvider>
        <ContemplativeLayout subtitle={selectedSection.title} title="Catecismo" icon={Icons.Catechism}>
          <div className="w-full editorial-column editorial-section" data-testid={`secao-${selectedSection.id}-conteudo`}>
            {/* Unified Reading Navigation */}
            <div className="flex items-center justify-between gap-spacing-md py-spacing-xs border-b border-primary/5 mb-spacing-md">
               <Button variant="ghost" onClick={() => { goBack(); setTimeout(() => { if (lastFocusedElement) document.getElementById(lastFocusedElement)?.focus(); }, 100); }} id="back-to-summary" className="text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary" aria-label="Voltar para o sumário de seções">← Sumário</Button>
               <div className="flex items-center gap-spacing-lg">
                  <Button 
                    disabled={selectedSection.id <= 1}
                    onClick={() => {
                      const prev = selectedPart.sections.find(s => s.id === selectedSection.id - 1);
                      if (prev) {
                        console.info('[CIC section nav]', {
                          origin: 'Catechism.section-nav',
                          direction: 'prev',
                          from: { section: selectedSection.id, paragraph: currentParagraph },
                          to: { section: prev.id, paragraph: prev.paragraphs[0] },
                          href: `/catechism?p=${prev.paragraphs[0]}`,
                        });
                        setSelectedSection(prev); setCurrentParagraph(prev.paragraphs[0]); window.scrollTo(0,0);
                      }
                    }}
                    data-testid="catechism-section-prev"
                    variant="ghost" className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100">Anterior</Button>
                  <span className="text-premium-xs font-serif italic text-primary/20">Seção {selectedSection.id}</span>
                  <Button 
                    disabled={selectedSection.id >= 10}
                    onClick={() => {
                      const next = selectedPart.sections.find(s => s.id === selectedSection.id + 1);
                      if (next) {
                        console.info('[CIC section nav]', {
                          origin: 'Catechism.section-nav',
                          direction: 'next',
                          from: { section: selectedSection.id, paragraph: currentParagraph },
                          to: { section: next.id, paragraph: next.paragraphs[0] },
                          href: `/catechism?p=${next.paragraphs[0]}`,
                        });
                        setSelectedSection(next); setCurrentParagraph(next.paragraphs[0]); window.scrollTo(0,0);
                      }
                    }}
                    data-testid="catechism-section-next"
                    variant="ghost" className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100">Próxima</Button>

               </div>
               <ReadingControlPanel />
            </div>

            <CatechismPendingPanel
              startPara={startPara}
              endPara={endPara}
              onJumpTo={(p) => document.getElementById(`p${p}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            />

            <div className="space-y-spacing-xl md:space-y-spacing-3xl">
              {Array.from({ length: endPara - startPara + 1 }, (_, i) => startPara + i).map(p => (
                <LazyParagraph key={p} paragraph={p} currentParagraph={currentParagraph} paragraphsRead={new Set()} isFavorite={isFavorite} toggleFavorite={toggleFavorite} handleNavigateToBible={handleNavigateToBible} highlights={currentChapterNotes} />
              ))}
            </div>

            <div className="mt-spacing-xl pt-spacing-xl md:mt-spacing-4xl md:pt-spacing-4xl border-t border-primary/5">
               <Relatio context={{ type: 'catechism', paragraph: currentParagraph }} onNavigateToBible={handleNavigateToBible} onNavigateToCIC={jumpToParagraph} onNavigateToDoc={handleNavigateToDoc} />
            </div>
          </div>
          <CatechismDiagnosticPanel />
        </ContemplativeLayout>
      </CatechismPendingProvider>
    );
  }

  if (viewMode === 'sections' && selectedPart) {
    return (
      <ContemplativeLayout subtitle={selectedPart.part} title={selectedPart.title} icon={Icons.Catechism}>
        <div className="w-full space-y-spacing-lg md:space-y-spacing-2xl pb-spacing-2xl md:pb-spacing-4xl">
          <div className="flex justify-center">
            <Button variant="ghost" onClick={goBack} className="px-spacing-xl py-spacing-sm h-auto rounded-premium-full text-[9px] font-black uppercase tracking-[0.3em] text-primary/40 hover:text-primary border border-primary/5 transition-all">
              <Icons.ChevronLeft className="w-spacing-sm h-spacing-sm mr-spacing-xs" /> Voltar às Partes
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-md">
            {selectedPart.sections.map((sec, idx) => (
              <CathedraCard key={sec.id} id={`section-card-${sec.id}`} data-testid={`secao-${sec.id}`} variant="interactive" padding="none" role="button" tabIndex={0} aria-label={`Seção ${sec.id}: ${sec.title}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setLastFocusedElement(`section-card-${sec.id}`); setSelectedSection(sec); setViewMode('reading'); setCurrentParagraph(sec.paragraphs[0]); window.scrollTo(0,0); } }} onClick={() => { setLastFocusedElement(`section-card-${sec.id}`); setSelectedSection(sec); setViewMode('reading'); setCurrentParagraph(sec.paragraphs[0]); window.scrollTo(0,0); }} className="group focus-within:ring-2 focus-within:ring-primary focus-within:outline-none">
                <div className="p-spacing-lg flex items-center justify-between h-full">
                  <div className="space-y-spacing-xs text-left">
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary/30">Seção {sec.id}</span>
                    <h3 className="text-premium-base font-display font-light text-foreground/80 group-hover:text-primary transition-colors leading-snug">{sec.title}</h3>
                    <p className="text-[9px] text-muted-foreground/50 italic tracking-wider uppercase">§{sec.paragraphs[0]} — §{sec.paragraphs[1]}</p>
                  </div>
                  <Icons.ChevronRight className="w-spacing-sm h-spacing-sm text-primary/10 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </CathedraCard>
            ))}
          </div>
        </div>
      </ContemplativeLayout>
    );
  }

  return (
    <ContemplativeLayout maxW="max-w-5xl w-full">
      <SEOHead title="Catecismo da Igreja Católica | Cathedra Digital" description="Doutrina católica organizada por parágrafos." path="/catechism" />
      <div className="w-full space-y-8 md:space-y-14 pb-spacing-2xl md:pb-spacing-4xl">
        {/* HERO Noir & Gold */}
        <div className="text-center space-y-4 pt-spacing-sm md:pt-spacing-xl">
          <div className="flex items-center justify-center gap-3" aria-hidden="true">
            <span className="h-px w-10 md:w-16" style={{ backgroundColor: '#c9a84c' }} />
            <span
              className="text-[9px] md:text-[10px] uppercase"
              style={{ color: '#c9a84c', fontFamily: 'Inter, sans-serif', letterSpacing: '0.32em' }}
            >
              Sacra Doctrina
            </span>
            <span className="h-px w-10 md:w-16" style={{ backgroundColor: '#c9a84c' }} />
          </div>
          <h1
            className="leading-none"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              fontSize: 'clamp(2.25rem, 6vw, 4rem)',
              letterSpacing: '0.01em',
            }}
          >
            Catecismo<span style={{ color: '#c9a84c' }}>.</span>
          </h1>
          <p
            className="mx-auto"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
              color: 'hsl(var(--muted-foreground))',
              maxWidth: '48ch',
              lineHeight: 1.65,
            }}
          >
            A doutrina da Igreja em quatro partes — <span style={{ color: '#c9a84c' }}>Credo</span>, <span style={{ color: '#c9a84c' }}>Sacramentos</span>, <span style={{ color: '#c9a84c' }}>Vida em Cristo</span> e <span style={{ color: '#c9a84c' }}>Oração</span>.
          </p>
        </div>

        {/* BUSCA */}
        <div className="sticky top-0 z-20 bg-background/85 backdrop-blur-md py-3 -mx-spacing-md px-spacing-md">
          <div className="relative group max-w-2xl mx-auto">
            <Icons.Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: '#c9a84c', opacity: 0.6 }} />
            <input 
              type="text" 
              placeholder="Buscar por parágrafo (§) ou tema..." 
              aria-label="Buscar no Catecismo por parágrafo ou tema"
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && jumpToParagraph(parseInt(searchQuery.replace('§', '')))} 
              className="w-full bg-transparent border-0 border-b py-3 pl-12 pr-4 focus:outline-none focus:ring-0"
              style={{
                borderBottomColor: '#c9a84c',
                borderBottomWidth: 1,
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontSize: '1rem',
                color: 'hsl(var(--foreground))',
              }}
            />
          </div>
        </div>

        {/* CARDS DE PARTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {CIC_SECTIONS.map((part, idx) => (
            <div 
              key={part.part} 
              id={`part-card-${idx}`}
              onClick={() => { setLastFocusedElement(`part-card-${idx}`); setSelectedPart(part); setViewMode('sections'); }} 
              className="group cursor-pointer p-6 md:p-8 flex flex-col justify-between min-h-[180px] text-left transition-all duration-500 rounded-none focus-visible:outline-none"
              style={{
                border: '1px solid rgba(201, 168, 76, 0.35)',
                background: 'transparent',
              }}
              tabIndex={0}
              role="button"
              aria-label={`Ver ${part.part}: ${part.title}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setLastFocusedElement(`part-card-${idx}`); setSelectedPart(part); setViewMode('sections'); } }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#c9a84c'; e.currentTarget.style.background = 'rgba(201, 168, 76, 0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.35)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] uppercase shrink-0"
                    style={{ color: '#c9a84c', fontFamily: 'Inter, sans-serif', letterSpacing: '0.32em' }}
                  >
                    {part.part}
                  </span>
                  <div className="h-px flex-1" style={{ backgroundColor: '#c9a84c', opacity: 0.4 }} />
                </div>
                <h2
                  className="leading-tight break-words"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 400,
                    fontSize: 'clamp(1.35rem, 2.4vw, 1.75rem)',
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  {part.title}
                </h2>
              </div>
              <div className="flex items-center justify-between pt-6">
                <p
                  className="text-[10px] uppercase"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Inter, sans-serif', letterSpacing: '0.28em' }}
                >
                  {part.sections.length} seções
                </p>
                <Icons.ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: '#c9a84c' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <CatechismDiagnosticPanel />
    </ContemplativeLayout>
  );
});

export default Catechism;
