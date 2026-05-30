import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRenderPerf } from '@/hooks/useRenderPerf';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import BackToThemeBanner from './BackToThemeBanner';
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
  const [logosSelectionsCount, setLogosSelectionsCount] = useState(0);

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
    const isOffline = !navigator.onLine || localStorage.getItem('cathedra_offline_mode') === 'true';
    if (isOffline) {
      return <CatechismOfflineFallback paragraph={paragraph} onRetry={() => window.location.reload()} />;
    }

    return (
      <div className="reader-text bg-destructive/5 border border-destructive/10 rounded-premium p-4 text-destructive font-serif text-sm py-4 space-y-2">
        <div className="font-bold flex items-center gap-2">
           <Icons.Cross className="w-4 h-4" />
           Ops! Problema ao carregar o parágrafo §{paragraph}.
        </div>
        <Button 
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 bg-destructive/10 text-destructive rounded-full text-premium-tiny font-black uppercase tracking-widest hover:bg-destructive/20 transition-all"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (data?.status === 'error_402') {
    return (
      <div className="reader-text bg-amber-500/5 border border-amber-500/10 rounded-premium p-4 text-amber-600 dark:text-amber-400 font-serif text-sm py-4 space-y-3">
        <div className="font-bold flex items-center gap-2">
           <Icons.AlertTriangle className="w-4 h-4" />
           Geração pausada: Créditos de IA esgotados.
        </div>
        <p className="text-xs opacity-80 leading-relaxed">
          O parágrafo §{paragraph} ainda não foi gerado e o limite de IA do workspace foi atingido. 
          O conteúdo será gerado automaticamente assim que os créditos forem recarregados.
        </p>
        {data.content && data.content.length > 30 ? (
           <div className="pt-2 border-t border-amber-500/10 text-foreground italic opacity-90">
             "{data.content}"
           </div>
        ) : (
          <div className="pt-2 border-t border-amber-500/10 flex flex-col gap-2">
            <p className="text-premium-tiny uppercase font-black tracking-widest opacity-60">Alternativa:</p>
            <a 
              href={`https://www.vatican.va/archive/cathechism_po/index_new/prima-pagina-cic_po.html`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline font-bold"
            >
              Ver no site oficial do Vaticano <Icons.ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    );
  }

  if (data?.status === 'not_cached') {
    return (
      <div className="reader-text py-4 space-y-3">
        <p className="text-sm text-muted-foreground italic">Conteúdo do §{paragraph} ainda não disponível no nosso banco de dados.</p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <Icons.Loader className="w-3 h-3" /> Tentar carregar
          </Button>
          <a 
            href="https://www.vatican.va/archive/cathechism_po/index_new/prima-pagina-cic_po.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-card border border-border hover:bg-primary/5 text-muted-foreground hover:text-primary rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <Icons.ExternalLink className="w-3 h-3" /> Ver no Vaticano
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`reader-text text-foreground/90 font-size-${settings.fontSize} font-family-${settings.fontFamily} prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-primary prose-p:my-2 transition-all duration-300`}>
      {segments.map((seg, i) =>
        seg.type === 'bibleRef' && seg.abbr ? (
          <BibleVersePopover
            key={i}
            abbr={seg.abbr}
            chapter={seg.chapter!}
            verse={seg.verse}
            label={seg.value}
            onNavigate={onNavigateToBible}
          />
        ) : seg.type === 'catechismRef' && seg.paragraph ? (
          <CatechismPopover
            key={i}
            paragraph={seg.paragraph}
          />
        ) : (
          <ReactMarkdown key={i} components={{
            p: (props) => {
              const text = typeof props.children === 'string' ? props.children : '';
              const h = highlights.find(n => n.paragraph === paragraph && n.highlight_color);
              
              if (h) {
                return (
                  <span 
                    onClick={() => onHighlightClick?.(h)}
                    className={`highlight-${h.highlight_color} px-1 rounded-sm cursor-pointer hover:brightness-95 transition-all`}
                  >
                    {props.children}
                  </span>
                );
              }
              return <span>{props.children}</span>;
            },
          }}>{seg.value}</ReactMarkdown>
        )
      )}
      {(data?.textoBase || data?.explicacao || data?.interpretacaoProfunda || data?.aplicacaoPratica || data?.reflexaoFinal || data?.exercicio) && (
        <div className="mt-8 pt-8 border-t border-border/30">
          <DeepContentSection 
            content={{ 
              textoBase: data.textoBase,
              explicacao: data.explicacao,
              interpretacaoProfunda: data.interpretacaoProfunda,
              aplicacaoPratica: data.aplicacaoPratica,
              reflexaoFinal: data.reflexaoFinal,
              exercicio: data.exercicio
            }} 
            contentType="catechism"
            title="Meditação e Aprofundamento" 
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
      {currentParagraph === p && <div className="absolute -left-6 top-0 bottom-0 w-0.5 bg-primary/20 rounded-full hidden md:block" />}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xl md:text-2xl font-display font-light tracking-[0.2em] text-primary/40">§{p}</span>
          <div className="flex items-center gap-1">
            <Button onClick={() => {
              toggleFavorite({ type: 'catechism', title: `CIC §${p}`, content: `Catecismo da Igreja Católica, parágrafo §${p}` });
              // Contextual AI trigger removed from heart button to avoid confusion, but keeping the structure
            }} className="p-2 rounded-full hover:bg-primary/10 transition-all active:scale-95">
              <Icons.Heart className={`w-4 h-4 transition-all ${isFavorite('catechism', `CIC §${p}`) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            </Button>
            <Button 
              onClick={() => {
                // We need a way to trigger LogosAI from here. 
                // Since LogosAI state is in the parent Catechism component, we should pass a callback.
                (window as any).dispatchEvent(new CustomEvent('open-logos-ai', { detail: { context: `Catecismo §${p}`, type: 'catechism' } }));
              }} 
              className="p-2 rounded-full hover:bg-primary/10 transition-all text-muted-foreground hover:text-primary"
              title="Perguntar ao Logos IA"
            >
              <Icons.Sparkles className="w-4 h-4" />
            </Button>
            <ShareButton title={`Catecismo §${p}`} text={`Leia o Catecismo da Igreja Católica, §${p} — Cathedra Digital`} url={`${window.location.origin}/catechism?p=${p}`} className="p-2 h-auto w-auto border-0 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all" />
            <ReadingMark contentType="catechism" contentId={`${p}`} label={`Catecismo §${p}`} paragraph={p} />
          </div>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/[0.05] via-transparent to-transparent" />
      </div>
      <CatechismContent 
        paragraph={p} 
        onNavigateToBible={handleNavigateToBible} 
        isVisible={isVisible} 
        onHighlightClick={onHighlightClick}
        highlights={highlights}
      />

      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <NotesPanel contentType="catechism" contentId={`${p}`} contentLabel={`§${p}`} />
      </div>
    </div>
  );
};


type ViewMode = 'parts' | 'sections' | 'reading';

const Catechism: React.FC = memo(() => {
  useRenderPerf('Catechism', 15);
  const { settings, updateSettings } = useReadingSettings();
  useReadingAutoHide(settings.visualSilence);
  const navigate = useNavigate();

  useAutoFocus();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const p = searchParams.get('p');
    return p ? 'reading' : 'parts';
  });
  const [selectedPart, setSelectedPart] = useState<typeof CIC_SECTIONS[0] | null>(null);
  const [selectedSection, setSelectedSection] = useState<typeof CIC_SECTIONS[0]['sections'][0] | null>(null);
  const [currentParagraph, setCurrentParagraph] = useState(() => {
    const p = searchParams.get('p');
    return p ? parseInt(p) : 1;
  });
  // Track visible paragraph for bookmarking
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

    const paragraphElements = document.querySelectorAll('[id^="p"]');
    paragraphElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [viewMode, selectedSection]);

  const handleReturnToParagraph = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-primary/10');
      setTimeout(() => el.classList.remove('bg-primary/10'), 2000);
    }
  };

  const handleBookmarkCurrent = () => {
    if (activeParagraphId) {
      const pNum = parseInt(activeParagraphId.replace('p', ''));
      saveLastRead({
        content_type: 'catechism',
        content_id: pNum.toString(),
        paragraph: pNum,
        label: `Catecismo §${pNum}`,
        url: `/catechism?p=${pNum}`,
        is_last_read: true
      });
      toast.success('Posição salva', {
        description: `Você parou no parágrafo §${pNum}`
      });
    }
  };

  const [paragraphsRead, setParagraphsRead] = useState<Set<number>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [showCrossRefs, setShowCrossRefs] = useState(true);
  const [showLogosAI, setShowLogosAI] = useState(false);
  const { marks, saveLastRead, getLastRead } = useReadingMarks();
  const [lastReadMark, setLastReadMark] = useState<any>(null);
  const [logosAIContext, setLogosAIContext] = useState('');
  const [logosAIInitialQuery, setLogosAIInitialQuery] = useState('');
  const [logosSelectionsCount, setLogosSelectionsCount] = useState(0);
  const [shouldAutoResume, setShouldAutoResume] = useState(() => !searchParams.get('p'));
  const { notes: chapterNotes, addNote, updateNote, deleteNote: deleteChapterNote } = useNotes('catechism');
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);

  const [activeHighlight, setActiveHighlight] = useState<UserNote | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [sessionResumeUsed, setSessionResumeUsed] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Update history
  useEffect(() => {
    const currentUrl = window.location.pathname + window.location.search;
    setHistory(prev => {
      if (prev[historyIndex] === currentUrl) return prev;
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(currentUrl);
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [location.pathname, location.search, historyIndex]);
  
  const currentChapterNotes = useMemo(() => {
    if (!selectedSection) return [];
    return chapterNotes.filter(n => {
      const p = n.paragraph || 0;
      return p >= selectedSection.paragraphs[0] && p <= selectedSection.paragraphs[1];
    });
  }, [chapterNotes, selectedSection]);

  const currentChapterHighlights = useMemo(() => {
    return currentChapterNotes.filter(n => n.highlight_color);
  }, [currentChapterNotes]);


  useEffect(() => {
    const handleOpenAI = (e: any) => {
      if (e.detail?.context) setLogosAIContext(e.detail.context);
      setShowLogosAI(true);
    };
    window.addEventListener('open-logos-ai' as any, handleOpenAI);
    return () => window.removeEventListener('open-logos-ai' as any, handleOpenAI);
  }, []);

  useEffect(() => {
    const fetchLastRead = async () => {
      const lr = await getLastRead();
      setLastReadMark(lr);
    };
    fetchLastRead();
  }, [getLastRead]);

  const isAutoScrolling = React.useRef(false);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();

  const crossRefs = getCatechismCrossRefs(currentParagraph);
  const docsRefs = getCatechismDocs(currentParagraph);

  // Track progress and IntersectionObserver for current paragraph
  useEffect(() => {
    if (!user) return;
    const loadProgress = async () => {
      const { data } = await supabase
        .from('catechism_paragraphs_read')
        .select('paragraph')
        .eq('user_id', user.id);
      if (data) {
        setParagraphsRead(new Set(data.map(p => p.paragraph)));
      }
    };
    loadProgress();
  }, [user]);

  // Observer to track which paragraph is currently in view
  useEffect(() => {
    if (viewMode !== 'reading') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isAutoScrolling.current) return;
        
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const p = parseInt(entry.target.id.replace('p', ''));
            if (!isNaN(p)) {
              setCurrentParagraph(p);
              localStorage.setItem(`cathedra_last_catechism_para_CIC`, p.toString());
              localStorage.setItem(`cathedra_last_catechism_scroll_CIC`, window.scrollY.toString());
              
              // Auto-save progress
              saveLastRead({
                content_type: 'catechism',
                content_id: 'CIC',
                paragraph: p,
                label: `Catecismo §${p}`,
                url: `/catechism?p=${p}`,
                is_last_read: true
              });
            }
          }
        });
      },
      { threshold: 0.3, rootMargin: '-10% 0px -40% 0px' }
    );

    const elements = document.querySelectorAll('[id^="p"]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [viewMode]);

  const [startPara, endPara] = useMemo(() => {
    if (viewMode === 'reading' && selectedSection) {
      return selectedSection.paragraphs;
    }
    return [1, 2865];
  }, [viewMode, selectedSection]);

  // Auto-restore scroll on first load
  useEffect(() => {
    if (viewMode === 'reading' && selectedSection && selectedPart) {
      const savedScroll = localStorage.getItem(`cathedra_last_catechism_scroll_CIC`);
      const savedPara = localStorage.getItem(`cathedra_last_catechism_para_CIC`);
      
      if (savedScroll && savedPara && !searchParams.get('p')) {
        const para = parseInt(savedPara);
        if (para >= startPara && para <= endPara) {
          setTimeout(() => {
            window.scrollTo({ top: parseInt(savedScroll), behavior: 'smooth' });
          }, 500);
        }
      }
    }
  }, [viewMode, selectedSection, selectedPart, startPara, endPara, searchParams]);

  const handleAddNoteOrHighlight = useCallback(async (color: string, text: string) => {
    if (!currentParagraph) return;
    
    if (activeHighlight) {
       await updateNote(activeHighlight.id, text, color);
       setActiveHighlight(null);
    } else {
      await addNote(currentParagraph.toString(), text, color, {
        paragraph: currentParagraph
      });
    }
    setIsNoteModalOpen(false);
  }, [currentParagraph, activeHighlight, addNote]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing or modal is open
      const activeElement = document.activeElement;
      const isTyping = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || (activeElement as HTMLElement)?.isContentEditable;
      if (isTyping || isNoteModalOpen || viewMode !== 'reading') return;
      
      // Accessibility: Reading shortcuts
      if (currentParagraph) {
        if (e.key.toLowerCase() === (settings.shortcuts?.highlight || 'h')) {
          e.preventDefault();
          handleAddNoteOrHighlight('yellow', 'Destacado via atalho');
        }
        if (e.key.toLowerCase() === (settings.shortcuts?.note || 'n')) {
          e.preventDefault();
          setIsNoteModalOpen(true);
        }
        if (e.key === (settings.shortcuts?.clear || 'Escape')) {
          e.preventDefault();
          setActiveHighlight(null);
        }
        // Progress navigation (Alt + Up/Down)
        if (e.altKey && e.key === 'ArrowUp') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (e.altKey && e.key === 'ArrowDown' && lastReadMark?.url) {
          e.preventDefault();
          
          const behavior = settings.resumeBehavior || 'confirm';
          let shouldResume = true;
          
          if (behavior === 'confirm') {
            shouldResume = confirm(`Deseja retomar a leitura em: ${lastReadMark.label}?`);
          } else if (behavior === 'once') {
            if (!sessionResumeUsed) {
              shouldResume = confirm(`Deseja retomar a leitura em: ${lastReadMark.label}?`);
              if (shouldResume) setSessionResumeUsed(true);
            }
          } else if (behavior === 'never') {
            shouldResume = false;
          }

          if (shouldResume) {
            navigate(lastReadMark.url);
          }
        }

        // History navigation (Alt + Left/Right)
        if (e.altKey && e.key === 'ArrowLeft' && historyIndex > 0) {
          e.preventDefault();
          const prevUrl = history[historyIndex - 1];
          setHistoryIndex(prev => prev - 1);
          navigate(prevUrl);
        }
        if (e.altKey && e.key === 'ArrowRight' && historyIndex < history.length - 1) {
          e.preventDefault();
          const nextUrl = history[historyIndex + 1];
          setHistoryIndex(prev => prev + 1);
          navigate(nextUrl);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentParagraph, isNoteModalOpen, handleAddNoteOrHighlight, lastReadMark, navigate]);

  const markParagraphRead = useCallback(async (p: number) => {
    if (!user) return;
    try {
      await supabase
        .from('catechism_paragraphs_read')
        .upsert({ user_id: user.id, paragraph: p }, { onConflict: 'user_id,paragraph' });
      setParagraphsRead(prev => new Set([...prev, p]));
    } catch (err) {
      console.error('Failed to mark paragraph read:', err);
    }
  }, [user]);

  useEffect(() => {
    if (viewMode === 'reading' && currentParagraph) {
      markParagraphRead(currentParagraph);
    }
  }, [viewMode, currentParagraph, markParagraphRead]);

  const handleNavigateToBible = useCallback((abbr: string, chapter: number) => {
    navigate(`/bible?book=${abbr}&ch=${chapter}`);
  }, [navigate]);

  const handleNavigateToDoc = useCallback((docId: string) => {
    navigate(`/magisterium?doc=${docId}`);
  }, [navigate]);

  const MemoizedRelatio = useMemo(() => {
    if (viewMode !== 'reading' || !showCrossRefs) return null;
    return (
      <Relatio 
        context={{ 
          type: 'catechism', 
          paragraph: currentParagraph,
          tags: ['Catecismo', 'CIC']
        }}
        onNavigateToBible={handleNavigateToBible}
        onNavigateToDoc={handleNavigateToDoc}
      />
    );
  }, [viewMode, showCrossRefs, currentParagraph, handleNavigateToBible, handleNavigateToDoc]);


  const jumpToParagraph = useCallback((p: number) => {
    setCurrentParagraph(p);
    isAutoScrolling.current = true;
    const element = document.getElementById(`p${p}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 1000);
    }
  }, []);

  // Handle deep-link or auto-resume
  useEffect(() => {
    const p = searchParams.get('p');
    if (p) {
      setShouldAutoResume(false);
      const num = parseInt(p);
      if (!isNaN(num) && num >= 1 && num <= 2865) {
        navigateToParagraph(num);
      }
      return;
    }

    if (shouldAutoResume && user) {
      const autoResume = async () => {
        const { data } = await supabase
          .from('reading_marks')
          .select('*')
          .eq('user_id', user.id)
          .eq('content_type', 'catechism')
          .eq('is_last_read', true)
          .maybeSingle();

        if (data && data.paragraph) {
          navigateToParagraph(data.paragraph);
          toast.info(`Retornando ao parágrafo §${data.paragraph}`, {
            description: 'Sua leitura foi retomada de onde você parou.',
            duration: 3000
          });
        }
      };
      autoResume();
      setShouldAutoResume(false);
    }
  }, [searchParams, user, shouldAutoResume]);

  const navigateToParagraph = useCallback((num: number) => {
    for (const part of CIC_SECTIONS) {
      for (const sec of part.sections) {
        if (num >= sec.paragraphs[0] && num <= sec.paragraphs[1]) {
          setSelectedPart(part);
          setSelectedSection(sec);
          setViewMode('reading');
          // Wait for render
          setTimeout(() => jumpToParagraph(num), 100);
          return;
        }
      }
    }
  }, [jumpToParagraph]);

  const handleSearch = () => {
    const num = parseInt(searchQuery);
    if (!isNaN(num) && num >= 1 && num <= 2865) {
      navigateToParagraph(num);
    }
  };


  const goBack = () => {
    if (viewMode === 'reading') { setViewMode('sections'); setSelectedSection(null); }
    else if (viewMode === 'sections') { setViewMode('parts'); setSelectedPart(null); }
  };

  const goToExplorer = () => navigate(AppRoute.CATECHISM_EXPLORER);

  const nextUnreadParagraph = useMemo(() => {
    for (let i = 1; i <= 2865; i++) {
      if (!paragraphsRead.has(i)) return i;
    }
    return null;
  }, [paragraphsRead]);

  if (viewMode === 'reading' && selectedSection && selectedPart) {
    const fromDashboard = searchParams.get('from') === 'dashboard';

    return (
      <ContemplativeLayout
        subtitle={`${selectedSection.title}`}
        title={`CIC`}
        maxW="max-w-[var(--layout-max-width)]"
      >
        <SEOHead 
          title={`${selectedSection.title} | Catecismo`}
          description={`Leia o Catecismo da Igreja Católica: ${selectedSection.title}`}
          path={`/catechism?p=${currentParagraph}`}
        />

        {/* Atmospheric Header - Mobile Only */}
        <div className="flex items-center justify-between gap-2 flex-wrap bg-background/40 backdrop-blur-3xl p-1.5 rounded-full border border-primary/5 shadow-premium-hover header-reading-auto-hide md:hidden fixed top-16 left-4 right-4 z-40 transition-all duration-700">
          <div className="flex items-center gap-1">
            <AudioButton variant="ghost" className="rounded-full w-10 h-10 p-0" />
            <ReadingControlPanel />
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 p-0" onClick={() => setShowLogosAI(!showLogosAI)}>
              <Icons.Sparkles className={`w-4 h-4 ${showLogosAI ? 'text-primary' : 'text-primary/60'}`} />
            </Button>
            <ReadingMark contentType="catechism" contentId={`${currentParagraph}`} label={`Catecismo §${currentParagraph}`} paragraph={currentParagraph} />
          </div>
        </div>

        {/* Desktop Toolbar */}
        <div className="hidden md:flex items-center justify-between gap-4 bg-card/40 backdrop-blur-xl p-3 rounded-premium border border-border/40 shadow-soft mb-16">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goBack}
              className="rounded-full hover:bg-primary/5"
              title="Voltar"
            >
              <Icons.ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="h-8 w-px bg-border/20 mx-2" />
            <AudioButton variant="default" className="px-6 rounded-full" />
            <Button 
              disabled={selectedSection.id <= 1} 
              onClick={() => {
                const prevSec = selectedPart.sections.find(s => s.id === selectedSection.id - 1);
                if (prevSec) {
                  setSelectedSection(prevSec);
                  setCurrentParagraph(prevSec.paragraphs[0]);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              variant="outline"
              className="rounded-full border-primary/5 hover:border-primary/20"
            >
              ← Anterior
            </Button>
            <Button 
              disabled={selectedSection.id >= 10} 
              onClick={() => {
                const nextSec = selectedPart.sections.find(s => s.id === selectedSection.id + 1);
                if (nextSec) {
                  setSelectedSection(nextSec);
                  setCurrentParagraph(nextSec.paragraphs[0]);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              variant="outline"
              className="rounded-full border-primary/5 hover:border-primary/20"
            >
              Próximo →
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <ReadingControlPanel />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowLogosAI(!showLogosAI)}
              className={`rounded-full flex items-center gap-2 ${showLogosAI ? 'bg-primary text-white' : 'border-primary/10'}`}
            >
              <Icons.Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Logos IA</span>
            </Button>
            <ReadingMark contentType="catechism" contentId={`${currentParagraph}`} label={`Catecismo §${currentParagraph}`} paragraph={currentParagraph} />
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-12 lg:gap-24 items-start">
          {/* Navigation Sidebar - Desktop Only */}
          <aside className="hidden lg:flex flex-col w-full max-w-[280px] space-y-12 sticky top-32">
            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 space-y-6">
              <div className="flex justify-center">
                <Icons.Scroll className="w-10 h-10 text-primary/40" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-premium-tiny font-black uppercase tracking-[0.2em] text-primary/60">Seção {selectedSection.id}</p>
                <h3 className="text-xl font-display font-light text-primary">{selectedSection.title}</h3>
              </div>
              <p className="text-[10px] text-muted-foreground/60 italic text-center leading-relaxed">
                Navegando entre os parágrafos §{startPara} e §{endPara}
              </p>
            </div>

            {currentChapterHighlights.length > 0 && (
              <div className="space-y-6">
                <p className="text-premium-tiny font-black uppercase tracking-[0.2em] text-primary/40 px-4">Minhas Reflexões</p>
                <div className="flex flex-col gap-3">
                  {currentChapterHighlights.map(note => (
                    <button
                      key={note.id}
                      onClick={() => {
                        if (note.paragraph) jumpToParagraph(note.paragraph);
                      }}
                      className={`flex flex-col gap-2 px-5 py-4 rounded-2xl border text-left transition-all hover:bg-primary/5 group
                        ${note.highlight_color ? `bg-${note.highlight_color}-50/30 border-${note.highlight_color}-200/20` : 'bg-card/50 border-primary/5'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">§{note.paragraph}</span>
                        <div className={`w-1.5 h-1.5 rounded-full highlight-${note.highlight_color}`} />
                      </div>
                      <p className="text-[11px] leading-relaxed line-clamp-2 italic text-muted-foreground group-hover:text-primary transition-colors">
                        {note.note_text === 'Destacado para meditação' ? 'Destaque visual' : note.note_text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <main className="flex-1 w-full">
            <div className="w-full relative">
              <div className="py-8 md:py-24">
                <div className="space-y-16">
                  {Array.from({ length: endPara - startPara + 1 }, (_, i) => startPara + i).map(p => (
                    <LazyParagraph 
                      key={p} 
                      paragraph={p} 
                      currentParagraph={currentParagraph}
                      paragraphsRead={paragraphsRead}
                      isFavorite={isFavorite}
                      toggleFavorite={toggleFavorite}
                      handleNavigateToBible={handleNavigateToBible}
                      onHighlightClick={(note) => {
                        setActiveHighlight(note);
                        setIsNoteModalOpen(true);
                      }}
                      highlights={currentChapterNotes}
                    />
                  ))}
                </div>

                {/* Kindle-style Navigation Footer */}
                <div className="mt-32 pt-24 border-t border-primary/5 space-y-20">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
                    <Button 
                      variant="ghost" 
                      disabled={selectedSection.id <= 1}
                      onClick={() => {
                        const prevSec = selectedPart.sections.find(s => s.id === selectedSection.id - 1);
                        if (prevSec) {
                          setSelectedSection(prevSec);
                          setCurrentParagraph(prevSec.paragraphs[0]);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="rounded-3xl group px-6 py-10 flex flex-col items-start gap-2 hover:bg-primary/5 transition-all w-full sm:w-auto border border-transparent hover:border-primary/5"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 group-hover:text-primary/60 transition-colors">Seção Anterior</span>
                      <div className="flex items-center gap-2 text-primary font-display font-light text-2xl">
                        <Icons.ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform opacity-40" />
                        {selectedPart.sections.find(s => s.id === selectedSection.id - 1)?.title || 'Anterior'}
                      </div>
                    </Button>

                    <Button 
                      variant="ghost" 
                      disabled={selectedSection.id >= 10}
                      onClick={() => {
                        const nextSec = selectedPart.sections.find(s => s.id === selectedSection.id + 1);
                        if (nextSec) {
                          setSelectedSection(nextSec);
                          setCurrentParagraph(nextSec.paragraphs[0]);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="rounded-3xl group px-6 py-10 flex flex-col items-end gap-2 hover:bg-primary/5 transition-all text-right w-full sm:w-auto border border-transparent hover:border-primary/5"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 group-hover:text-primary/60 transition-colors">Próxima Seção</span>
                      <div className="flex items-center gap-2 text-primary font-display font-light text-2xl">
                        {selectedPart.sections.find(s => s.id === selectedSection.id + 1)?.title || 'Próxima'}
                        <Icons.ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform opacity-40" />
                      </div>
                    </Button>
                  </div>

                  <div className="text-center space-y-8 py-16">
                    <Icons.CheckCircle2 className="w-16 h-16 text-primary/60 mx-auto" strokeWidth={1} />
                    <div className="space-y-2">
                      <h3 className="text-2xl font-display text-primary uppercase tracking-[0.2em] font-light">Contemplação Concluída</h3>
                      <p className="text-xs text-muted-foreground/50 italic font-serif">"A luz de Cristo ilumina todos os homens." (Catecismo, 1)</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button 
                        onClick={() => {
                          toast.success("Seção contemplada!", { icon: '📖' });
                          setViewMode('sections');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="rounded-full px-12 py-7 bg-primary text-primary-foreground hover:scale-105 transition-all shadow-premium text-xs font-black uppercase tracking-widest"
                      >
                        Finalizar e Voltar
                      </Button>
                    </div>
                  </div>

                  <Relatio 
                    context={{
                      type: 'catechism',
                      paragraph: currentParagraph,
                      tags: [selectedSection.title, 'Catecismo', 'Tradicao', 'Igreja']
                    }}
                    onNavigateToBible={handleNavigateToBible}
                    onNavigateToCIC={(p) => jumpToParagraph(p)}
                    onNavigateToDoc={handleNavigateToDoc}
                  />
                </div>
              </div>
            </div>

            <TextSelectionToolbar 
              activeHighlightId={activeHighlight?.id}
              activeColor={activeHighlight?.highlight_color}
              onHighlight={(color) => {
                if (activeHighlight) {
                  supabase.from('user_notes').update({ highlight_color: color }).eq('id', activeHighlight.id).then(() => {
                    setActiveHighlight(null);
                  });
                } else {
                  addNote(currentParagraph.toString(), 'Destacado para meditação', color, {
                    paragraph: currentParagraph
                  });
                }
              }}
              onDeleteHighlight={() => {
                if (activeHighlight) {
                  deleteChapterNote(activeHighlight.id);
                  setActiveHighlight(null);
                }
              }}
              onAddNote={() => {
                if (currentParagraph || activeHighlight) {
                  setIsNoteModalOpen(true);
                } else {
                  toast.info('Clique em um parágrafo primeiro para anotar.');
                }
              }}
            />

            <NoteEditModal 
              isOpen={isNoteModalOpen}
              onClose={() => setIsNoteModalOpen(false)}
              onSave={handleAddNoteOrHighlight}
              onDelete={() => {
                if (activeHighlight) {
                  deleteChapterNote(activeHighlight.id);
                  setActiveHighlight(null);
                  setIsNoteModalOpen(false);
                }
              }}
              initialText={activeHighlight?.note_text === 'Destacado para meditação' ? '' : activeHighlight?.note_text}
              initialColor={activeHighlight?.highlight_color || 'yellow'}
              title={activeHighlight ? 'Editar Reflexão' : 'Nova Reflexão'}
              isEditing={!!activeHighlight}
            />

            <ReadingProgress 
              progress={readingProgress}
              onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              onScrollToPercentage={(p) => {
                const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                window.scrollTo({ top: (p / 100) * totalHeight, behavior: 'smooth' });
              }}
              showResume={lastReadMark && lastReadMark.url !== window.location.pathname + window.location.search}
              onResumeLast={() => {
                const behavior = settings.resumeBehavior || 'confirm';
                if (behavior === 'always' || (behavior === 'once' && sessionResumeUsed)) {
                   navigate(lastReadMark.url);
                } else if (behavior === 'never') {
                   toast.info('Retomada automática desativada nas configurações.');
                } else if (confirm(`Deseja retomar a leitura em: ${lastReadMark.label}?`)) {
                   if (behavior === 'once') setSessionResumeUsed(true);
                   navigate(lastReadMark.url);
                }
              }}
              label={`Catecismo §${currentParagraph}`}
              isSubtle={settings.visualSilence}
              lastParagraphId={activeParagraphId || undefined}
              onBookmarkCurrent={handleBookmarkCurrent}
              onReturnToParagraph={handleReturnToParagraph}
            />

          </main>
        </div>
        {!settings.totalSilence && showLogosAI && (
          <div className="w-full max-w-[72ch] mx-auto mt-24 mb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <LogosAI 
              isOpen={showLogosAI} 
              onClose={() => {
                setShowLogosAI(false);
                setLogosAIInitialQuery('');
              }} 
              context={logosAIContext || `Catecismo da Igreja Católica, parágrafo §${currentParagraph}`}
              initialQuery={logosAIInitialQuery}
              type="catechism"
              variant="integrated"
            />
          </div>
        )}
      </ContemplativeLayout>
    );
  }



  // Section selection
  if (viewMode === 'sections' && selectedPart) {
    return (
      <ContemplativeLayout
        subtitle={`${selectedPart.part}`}
        title={`${selectedPart.title}`}
        maxW="max-w-6xl"
      >
        <div className="stack-rhythm">
          <Button 
            variant="ghost" 
            onClick={goBack}
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary/40 hover:text-primary transition-all"
          >
            <Icons.ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Partes
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {selectedPart.sections.map(sec => {
              const isLastReadSection = lastReadMark?.content_id === 'CIC' && lastReadMark?.paragraph >= sec.paragraphs[0] && lastReadMark?.paragraph <= sec.paragraphs[1];
              
              return (
                <motion.button 
                  key={sec.id} 
                  whileHover={{ x: 8 }}
                  onClick={() => { setSelectedSection(sec); setCurrentParagraph(sec.paragraphs[0]); setViewMode('reading'); }}
                  className={`text-left p-10 md:p-12 premium-card-interactive group flex flex-col gap-6 relative
                    ${isLastReadSection ? 'border-secondary/40 ring-1 ring-secondary/10' : ''}`}
                >
                  <span className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">
                    Seção {sec.id} {isLastReadSection && '• Ponto Salvo'}
                  </span>
                  <div className="space-y-2">
                    <h2 className={`text-2xl font-display font-medium group-hover:text-secondary transition-colors ${isLastReadSection ? 'text-secondary' : 'text-primary'}`}>{sec.title}</h2>
                    <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-[0.2em]">§{sec.paragraphs[0]} — §{sec.paragraphs[1]}</p>
                  </div>
                  {isLastReadSection && (
                    <span className="absolute top-4 right-8 text-[8px] font-black uppercase tracking-widest text-secondary animate-pulse">
                      Retomar Leitura
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </ContemplativeLayout>
    );
  }

  return (
    <ContemplativeLayout
      subtitle="Codex Fidei"
      title="Catecismo"
      maxW="max-w-6xl"
    >
      <SEOHead title="Catecismo da Igreja Católica" description="Acesse o Catecismo da Igreja Católica online em uma experiência premium." path="/catechism" type="book" />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Book",
          "name": "Catecismo da Igreja Católica",
          "author": "Magistério da Igreja Católica",
          "genre": "Doutrina Católica",
          "publisher": {
            "@type": "Organization",
            "name": "Cathedra Digital"
          },
          "about": "Exposição sistemática e orgânica dos conteúdos fundamentais da fé."
        })}
      </script>
      
      <div className="space-y-24">
        {/* Search & Suggested */}
        <div className="flex flex-col md:flex-row gap-8 items-center justify-between border-b border-primary/[0.04] pb-12">
          <div className="relative group w-full md:w-96">
            <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Ir para o parágrafo..."
              className="search-input-premium pr-24"
            />
            <Button onClick={handleSearch} variant="ghost" className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary">
              Ir
            </Button>
          </div>

          {nextUnreadParagraph && (
            <button 
              onClick={() => navigateToParagraph(nextUnreadParagraph)}
              className="group flex items-center gap-4 text-left px-8 py-4 rounded-full bg-primary/[0.02] border border-primary/10 hover:border-primary/20 transition-all"
            >
              <Icons.Sparkles className="w-4 h-4 text-secondary/40 group-hover:text-secondary transition-colors" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary/60">Continuar Formação</p>
                <p className="text-sm font-bold text-primary">Sugerido: §{nextUnreadParagraph}</p>
              </div>
            </button>
          )}
        </div>

        {/* Parts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {CIC_SECTIONS.map(part => (
            <motion.button 
              key={part.part} 
              whileHover={{ y: -8 }}
              onClick={() => { setSelectedPart(part); setViewMode('sections'); }}
              className="text-left p-12 md:p-16 premium-card-interactive group flex flex-col gap-8"
            >
              <div className="w-12 h-12 rounded-full bg-primary/[0.02] border border-primary/10 flex items-center justify-center text-primary/60">
                <Icons.Logo className="w-6 h-6" />
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.5em]">{part.part}</span>
                <h2 className="text-3xl font-display font-medium text-primary group-hover:text-secondary transition-colors leading-tight">{part.title}</h2>
                <p className="text-sm text-muted-foreground/40 font-serif italic">{part.sections.length} seções doutrinárias</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </ContemplativeLayout>
  );
});

export default Catechism;
