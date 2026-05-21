import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import ReadingMark from './ReadingMark';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { useAutoFocus } from '@/hooks/useAutoFocus';
import { toast } from 'sonner';
import ContemplativeLayout from './ContemplativeLayout';

const CatechismContent: React.FC<{ paragraph: number; onNavigateToBible?: (abbr: string, chapter: number) => void; isVisible?: boolean }> = ({ paragraph, onNavigateToBible, isVisible = true }) => {
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
            p: (props) => <span>{props.children}</span>,
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

const LazyParagraph: React.FC<{ paragraph: number; currentParagraph: number; paragraphsRead: Set<number>; isFavorite: (type: string, title: string) => boolean; toggleFavorite: (item: any) => void; handleNavigateToBible: (abbr: string, chapter: number) => void }> = ({ paragraph: p, currentParagraph, paragraphsRead, isFavorite, toggleFavorite, handleNavigateToBible }) => {
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
    <div ref={ref} id={`p${p}`} className={`scroll-mt-28 transition-all duration-700 pb-10 border-b border-border/40 last:border-0 last:pb-0 ${currentParagraph === p ? 'relative' : 'opacity-80 hover:opacity-100'}`}>
      {currentParagraph === p && <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary rounded-premium hidden md:block" />}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-serif font-bold text-primary">§{p}</span>
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
        <div className="h-px flex-1 bg-gradient-to-r from-border/60 via-border/20 to-transparent" />
      </div>
      <CatechismContent paragraph={p} onNavigateToBible={handleNavigateToBible} isVisible={isVisible} />

      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <NotesPanel contentType="catechism" contentId={`${p}`} contentLabel={`§${p}`} />
      </div>
    </div>
  );
};


type ViewMode = 'parts' | 'sections' | 'reading';

const Catechism: React.FC = () => {
  const navigate = useNavigate();
  useAutoFocus();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('parts');
  const [selectedPart, setSelectedPart] = useState<typeof CIC_SECTIONS[0] | null>(null);
  const [selectedSection, setSelectedSection] = useState<typeof CIC_SECTIONS[0]['sections'][0] | null>(null);
  const [currentParagraph, setCurrentParagraph] = useState(1);
  const [paragraphsRead, setParagraphsRead] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showCrossRefs, setShowCrossRefs] = useState(true);
  const [showLogosAI, setShowLogosAI] = useState(false);
  const { settings } = useReadingSettings();
  const { marks, saveLastRead, getLastRead } = useReadingMarks();
  const [lastReadMark, setLastReadMark] = useState<any>(null);
  const [logosAIContext, setLogosAIContext] = useState('');
  const [shouldAutoResume, setShouldAutoResume] = useState(true);

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
              localStorage.setItem('cathedra_last_catechism_para', p.toString());
              localStorage.setItem('cathedra_last_catechism_scroll', window.scrollY.toString());
              
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
      const savedScroll = localStorage.getItem('cathedra_last_catechism_scroll');
      const savedPara = localStorage.getItem('cathedra_last_catechism_para');
      
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

  const handleNavigateToBible = useCallback((abbr: string, chapter: number) => {
    navigate(`/bible?book=${abbr}&ch=${chapter}`);
  }, [navigate]);

  const handleNavigateToDoc = useCallback((docId: string) => {
    navigate(`/magisterium?doc=${docId}`);
  }, [navigate]);

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

  // Reading view
  if (viewMode === 'reading' && selectedSection && selectedPart) {
    const fromDashboard = searchParams.get('from') === 'dashboard';

    return (
      <ContemplativeLayout
        subtitle={selectedPart.part}
        title={selectedSection.title}
        maxW="max-w-[1200px]"
      >
        <BackToThemeBanner />
        {fromDashboard && (
          <Button onClick={() => navigate('/')} className="mb-6 flex items-center gap-1.5 text-xs text-primary hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Dashboard
          </Button>
        )}
        
        <div className="flex items-center gap-4 mb-8">
          <Button 
            onClick={goBack} 
            className="p-2.5 rounded-full bg-card border border-border hover:bg-primary/10 transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none"
            aria-label="Voltar para o Sumário"
          >
            <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
          </Button>

          <Button 
            onClick={goToExplorer} 
            className="px-4 py-2.5 rounded-full bg-card border border-border hover:bg-primary/10 transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none flex items-center gap-2"
            title="Explorar por Temas"
          >
            <Icons.Search className="w-4 h-4 text-primary" />
            <span className="text-premium-tiny font-black uppercase tracking-widest hidden sm:inline">Explorar</span>
          </Button>

          <div className="flex-1 min-w-0">
            <span className="text-premium-tiny font-black uppercase tracking-[0.2em] text-primary">{selectedPart.part}</span>
            <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground truncate">{selectedSection.title}</h1>
            <p className="text-sm text-muted-foreground">§{startPara} — §{endPara}</p>
          </div>

          <div className="flex items-center gap-2">
            {lastReadMark && lastReadMark.url !== window.location.pathname + window.location.search && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => navigate(lastReadMark.url)}
                className="rounded-full flex items-center gap-2 border-secondary/20 shadow-premium animate-in fade-in slide-in-from-right-4 duration-700"
              >
                <Icons.History className="w-4 h-4" />
                <span className="hidden sm:inline">Continuar de onde parei</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/diario')}
              className="rounded-full flex items-center gap-2 border-primary/10 hover:bg-primary/5"
            >
              <Icons.Layout className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest">Meu Diário</span>
            </Button>
            <ReadingControlPanel />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowLogosAI(!showLogosAI)}
              className={`rounded-full flex items-center gap-2 ${showLogosAI ? 'bg-primary text-white' : ''}`}
            >
              <Icons.Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest">Logos IA</span>
            </Button>
            {(crossRefs.length > 0 || docsRefs.length > 0) && (
              <Button onClick={() => setShowCrossRefs(!showCrossRefs)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${showCrossRefs ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground'}`}
                title="Conexões Sagradas (Bíblia & Magistério)">
                <Icons.Compass className={`w-4 h-4 ${showCrossRefs ? 'animate-spin-slow' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Conexões</span>
              </Button>
            )}
          </div>
        </div>

        {/* Section navigator */}
        <div className="flex items-center gap-3 justify-center">
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
            className="px-3 py-2 rounded-full bg-card border border-border text-xs font-bold disabled:opacity-30 hover:bg-primary/10 transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-primary outline-none"
            aria-label="Seção anterior"
          >
            <Icons.ArrowDown className="w-3.5 h-3.5 rotate-90" /> Seção Anterior
          </Button>

          <div className="px-4 py-2 bg-primary/5 border border-primary/20 rounded-premium text-xs font-black uppercase tracking-widest text-primary">
            Lendo Seção {selectedSection.id}
          </div>
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
            className="px-3 py-2 rounded-full bg-card border border-border text-xs font-bold disabled:opacity-30 hover:bg-primary/10 transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-primary outline-none"
            aria-label="Próxima seção"
          >
            Próxima Seção <Icons.ArrowDown className="w-3.5 h-3.5 -rotate-90" />
          </Button>

        </div>

        <div className="flex flex-col xl:flex-row gap-12 items-start mt-12">
          {/* Elegant Side Navigation for paragraphs (Desktop) */}
          <aside className="reader-navigation-aside">
            <div className="space-y-4">
              <p className="text-premium-tiny font-black uppercase tracking-widest text-primary/40 px-4">Navegação na Seção</p>
              <nav className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                {Array.from({ length: endPara - startPara + 1 }, (_, i) => startPara + i).map(p => (
                  <button
                    key={p}
                    onClick={() => jumpToParagraph(p)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all
                      ${currentParagraph === p 
                        ? 'bg-primary text-white shadow-soft' 
                        : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'}`}
                  >
                    <span className="opacity-50 text-[10px] w-8">§{p}</span>
                    <span className="truncate text-left flex-1">Parágrafo {p}</span>
                    {paragraphsRead.has(p) && (
                      <Icons.CheckCircle2 className="w-3 h-3 ml-auto opacity-60" />
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <div className="flex-1 w-full space-y-8 max-w-3xl mx-auto">
            <div className="reader-container bg-card/30 backdrop-blur-sm border border-border/5 shadow-premium overflow-hidden rounded-3xl relative transition-all duration-1000">
              <div className="p-8 md:p-16">

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
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Relatio: Intelligent Contextual Connections */}
            {showCrossRefs && (
              <div className="w-full max-w-[72ch] mx-auto">
                <Relatio 
                  context={{
                    type: 'catechism',
                    id: `catechism-${currentParagraph}`,
                    paragraph: currentParagraph,
                    tags: CATECHISM_LOCAL_DATA[currentParagraph]?.tags || ['Catecismo', 'Doutrina', 'Igreja']
                  }}
                  onNavigateToBible={handleNavigateToBible}
                  onNavigateToCIC={(p) => setCurrentParagraph(p)}
                  onNavigateToDoc={handleNavigateToDoc}
                />
              </div>
            )}

            
            {showLogosAI && (
              <div className="w-full max-w-[72ch] mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <LogosAI 
                  isOpen={showLogosAI} 
                  onClose={() => setShowLogosAI(false)} 
                  context={`Catecismo da Igreja Católica, parágrafo §${currentParagraph}`}
                  type="catechism"
                  variant="integrated"
                />
              </div>
            )}
          </div>
        </div>
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
        <div className="space-y-16">
          <Button 
            variant="ghost" 
            onClick={goBack}
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary/40 hover:text-primary transition-all"
          >
            <Icons.ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Partes
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {selectedPart.sections.map(sec => (
              <motion.button 
                key={sec.id} 
                whileHover={{ x: 8 }}
                onClick={() => { setSelectedSection(sec); setCurrentParagraph(sec.paragraphs[0]); setViewMode('reading'); }}
                className="text-left p-10 md:p-12 rounded-premium bg-card border border-border/5 hover:border-primary/10 hover:shadow-premium transition-all group flex flex-col gap-6"
              >
                <span className="text-[9px] font-bold text-primary/20 uppercase tracking-widest">Seção {sec.id}</span>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-medium text-primary group-hover:text-secondary transition-colors">{sec.title}</h3>
                  <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-[0.2em]">§{sec.paragraphs[0]} — §{sec.paragraphs[1]}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </ContemplativeLayout>
    );
  }

  return (
    <ContemplativeLayout
      subtitle="Codex Fidei"
      title="Catecismo da Igreja Católica"
      maxW="max-w-6xl"
    >
      <SEOHead title="Catecismo da Igreja Católica" description="Acesse o Catecismo da Igreja Católica online em uma experiência premium." path="/catechism" />
      
      <div className="space-y-24">
        {/* Search & Suggested */}
        <div className="flex flex-col md:flex-row gap-8 items-center justify-between border-b border-border/5 pb-12">
          <div className="relative group w-full md:w-96">
            <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Ir para o parágrafo..."
              className="w-full pl-14 pr-24 py-5 rounded-full border border-border/10 bg-primary/[0.01] focus:bg-background transition-all font-serif italic text-lg"
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
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary/30">Continuar Formação</p>
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
              className="text-left p-12 md:p-16 rounded-premium bg-card border border-border/5 hover:border-primary/10 hover:shadow-premium transition-all group flex flex-col gap-8"
            >
              <div className="w-12 h-12 rounded-full bg-primary/[0.02] border border-primary/10 flex items-center justify-center text-primary/20">
                <Icons.Logo className="w-6 h-6" />
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-primary/30 uppercase tracking-[0.5em]">{part.part}</span>
                <h2 className="text-3xl font-display font-medium text-primary group-hover:text-secondary transition-colors leading-tight">{part.title}</h2>
                <p className="text-sm text-muted-foreground/40 font-serif italic">{part.sections.length} seções doutrinárias</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </ContemplativeLayout>
  );
};

export default Catechism;
