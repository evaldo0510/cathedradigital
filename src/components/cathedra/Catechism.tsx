import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import BackToThemeBanner from './BackToThemeBanner';
import SEOHead from '@/components/SEOHead';
import ShareButton from './ShareButton';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import CrossReferencePanel from './CrossReferencePanel';
import NotesPanel from './NotesPanel';
import BibleVersePopover from './BibleVersePopover';
import DeepContentSection from './DeepContentSection';
import MagisteriumPopover from './MagisteriumPopover';
import { getCatechismCrossRefs, getCatechismDocs } from '@/data/cross-references';
import { CIC_SECTIONS, CATECHISM_LOCAL_DATA } from '@/data/catechism';
import { toast } from 'sonner';

import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { AppRoute } from '@/types';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useCatechismParagraph, usePrefetchCatechismParagraph, useGenerateCatechismParagraph } from '@/hooks/useCatechismParagraph';
import { useCatechismSync } from '@/hooks/useCatechismSync';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';
import CatechismPopover from './CatechismPopover';
import AudioButton from './AudioButton';
import { CatechismParagraphSkeleton } from './SacredSkeleton';
import CatechismOfflineFallback from './CatechismOfflineFallback';




const CatechismContent: React.FC<{ paragraph: number; onNavigateToBible?: (abbr: string, chapter: number) => void; isVisible?: boolean }> = ({ paragraph, onNavigateToBible, isVisible = true }) => {
  const { data, isLoading, isError, refetch } = useCatechismParagraph(paragraph, isVisible);
  const prefetch = usePrefetchCatechismParagraph();
  const generate = useGenerateCatechismParagraph();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isVisible && paragraph < 2865) prefetch(paragraph + 1);
  }, [paragraph, prefetch, isVisible]);

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      await generate(paragraph);
      toast.success(`Parágrafo §${paragraph} regenerado com sucesso.`);
    } catch (err) {
      toast.error(`Falha ao regenerar §${paragraph}.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const segments = useMemo(() => {
    if (!data?.content || data.status === 'not_cached') return [];
    return parseTheologicalReferences(data.content);
  }, [data?.content, data?.status]);

  if (!isVisible) {
    return (
      <div className="reader-text text-foreground/30 leading-[2] text-lg py-4 h-24 flex items-center">
        <span className="text-sm text-muted-foreground italic">Rolar para carregar §${paragraph}...</span>
      </div>
    );
  }

  if (isLoading || isGenerating) {
    return <CatechismParagraphSkeleton paragraph={paragraph} />;
  }

  if (isError) {
    const isOffline = !navigator.onLine || localStorage.getItem('cathedra_offline_mode') === 'true';
    if (isOffline) {
      return <CatechismOfflineFallback paragraph={paragraph} onRetry={() => window.location.reload()} />;
    }

    return (
      <div className="reader-text bg-destructive/5 border border-destructive/10 rounded-2xl p-4 text-destructive font-serif text-sm py-4 space-y-4">
        <div className="font-bold flex items-center gap-2">
           <Icons.Cross className="w-4 h-4" />
           Ops! Problema ao carregar o parágrafo §${paragraph}.
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => refetch()}
            className="px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-destructive/20 transition-all flex items-center gap-2"
          >
            <Icons.RotateCcw className="w-3 h-3" /> Tentar novamente
          </button>
          <button 
            onClick={handleRegenerate}
            className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2"
          >
            <Icons.Zap className="w-3 h-3" /> Regenerar via IA
          </button>
        </div>
      </div>
    );
  }


  if (data?.status === 'error_402') {
    return (
      <div className="reader-text bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-amber-600 dark:text-amber-400 font-serif text-sm py-4 space-y-3">
        <div className="font-bold flex items-center gap-2">
           <Icons.AlertTriangle className="w-4 h-4" />
           Geração pausada: Créditos de IA esgotados.
        </div>
        <p className="text-xs opacity-80 leading-relaxed">
          O parágrafo §${paragraph} ainda não foi gerado e o limite de IA do workspace foi atingido. 
          O conteúdo será gerado automaticamente assim que os créditos forem recarregados.
        </p>
        {data.content && data.content.length > 30 ? (
           <div className="pt-2 border-t border-amber-500/10 text-foreground italic opacity-90">
             "{data.content}"
           </div>
        ) : (
          <div className="pt-2 border-t border-amber-500/10 flex flex-col gap-3">
            <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Alternativas:</p>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={handleRegenerate}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
              >
                <Icons.Zap className="w-3 h-3" /> Tentar Gerar
              </button>
              <a 
                href={`https://www.vatican.va/archive/cathechism_po/index_new/prima-pagina-cic_po.html`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline font-bold text-xs"
              >
                Ver no site oficial do Vaticano <Icons.ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Not cached - this shouldn't happen with the new auto-generate function, but we keep a generic fallback
  if (data?.status === 'not_found' || data?.status === 'not_cached') {
    return (
      <div className="reader-text py-4 space-y-4">
        <p className="text-sm text-muted-foreground italic">Conteúdo do §${paragraph} ainda não disponível no nosso banco de dados.</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            {isGenerating ? <Icons.Loader className="w-3 h-3 animate-spin" /> : <Icons.Zap className="w-3 h-3" />} 
            Gerar com IA
          </button>
          <a 
            href="https://www.vatican.va/archive/cathechism_po/index_new/prima-pagina-cic_po.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-card border border-border hover:bg-primary/5 text-muted-foreground hover:text-primary rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <Icons.ExternalLink className="w-3 h-3" /> Ver no Vaticano
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="reader-text text-foreground/90 leading-[2] text-lg md:text-xl font-serif prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-primary prose-p:my-2">
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
      {currentParagraph === p && <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary rounded-full hidden md:block" />}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-serif font-bold text-primary">§{p}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => toggleFavorite({ type: 'catechism', title: `CIC §${p}`, content: `Catecismo da Igreja Católica, parágrafo §${p}` })} className="p-2 rounded-xl hover:bg-primary/10 transition-all active:scale-95">
              <Icons.Heart className={`w-4 h-4 transition-all ${isFavorite('catechism', `CIC §${p}`) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            </button>
            <ShareButton title={`Catecismo §${p}`} text={`Leia o Catecismo da Igreja Católica, §${p} — Cathedra Digital`} url={`${window.location.origin}/catechism?p=${p}`} className="p-2 h-auto w-auto border-0 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all" />
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
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('parts');
  const [selectedPart, setSelectedPart] = useState<typeof CIC_SECTIONS[0] | null>(null);
  const [selectedSection, setSelectedSection] = useState<typeof CIC_SECTIONS[0]['sections'][0] | null>(null);
  const [currentParagraph, setCurrentParagraph] = useState(1);
  const [paragraphsRead, setParagraphsRead] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showCrossRefs, setShowCrossRefs] = useState(true);
  const isAutoScrolling = React.useRef(false);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

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

  const markParagraphRead = useCallback(async (p: number) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('catechism_paragraphs_read')
        .upsert({ 
          user_id: user.id, 
          paragraph: p,
          read_at: new Date().toISOString()
        }, { onConflict: 'user_id,paragraph' })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data && data.read_at) {
        setParagraphsRead(prev => new Set([...prev, p]));
        setLastSyncTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to mark paragraph read:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    if (viewMode === 'reading' && currentParagraph) {
      markParagraphRead(currentParagraph);
    }
  }, [viewMode, currentParagraph, markParagraphRead]);

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

  // Handle deep-link from Bible cross-references (?p=1324)
  useEffect(() => {
    const p = searchParams.get('p');
    if (p) {
      const num = parseInt(p);
      if (!isNaN(num) && num >= 1 && num <= 2865) {
        navigateToParagraph(num);
      }
    }
  }, [searchParams]);

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
    const [start, end] = selectedSection.paragraphs;
    const fromDashboard = searchParams.get('from') === 'dashboard';
    
    // Progress calculation for the section
    const sectionParas = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    const readInSection = sectionParas.filter(p => paragraphsRead.has(p)).length;
    const sectionProgress = (readInSection / sectionParas.length) * 100;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Persistent Section Progress Bar */}
        <div className="sticky top-[73px] z-[130] -mx-4 px-4 py-2 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-primary/60">Progresso na Seção</span>
              {isSyncing ? (
                <div className="flex items-center gap-1 animate-pulse text-primary">
                  <Icons.Loader2 className="w-2 h-2 animate-spin" />
                  <span>Sincronizando §{currentParagraph}...</span>
                </div>
              ) : lastSyncTime && (
                <div className="flex items-center gap-1 text-green-500">
                  <Icons.Check className="w-2 h-2" />
                  <span>§{currentParagraph} Sincronizado {lastSyncTime}</span>
                </div>
              )}
            </div>
            <span className="text-primary/60">{Math.round(sectionProgress)}%</span>
          </div>
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${sectionProgress}%` }}
              className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]"
            />
          </div>
        </div>

        <BackToThemeBanner />
        {fromDashboard && (
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Dashboard
          </button>
        )}
        <div className="flex items-center gap-4">
          <button 
            onClick={goBack} 
            className="px-3 py-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none flex items-center gap-2"
            aria-label="Voltar para o Sumário"
          >
            <Icons.ArrowDown className="w-4 h-4 rotate-90 text-foreground" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Sumário</span>
          </button>

          <button 
            onClick={goToExplorer} 
            className="px-3 py-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none flex items-center gap-2"
            title="Explorar por Temas"
          >
            <Icons.Search className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Explorar</span>
          </button>

          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{selectedPart.part}</span>
            <h1 className="text-xl font-serif font-bold text-foreground truncate">{selectedSection.title}</h1>
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground whitespace-nowrap">§{start} — §{end}</p>
              <div className="hidden md:flex flex-1 items-center gap-2">
                <div className="h-1 flex-1 bg-primary/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(((paragraphsRead.size > 0 ? Array.from(paragraphsRead).filter(p => p >= start && p <= end).length : 0) / (end - start + 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-primary">
                  {Math.round(((paragraphsRead.size > 0 ? Array.from(paragraphsRead).filter(p => p >= start && p <= end).length : 0) / (end - start + 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSyncing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 rounded-lg"
              >
                <Icons.Loader2 className="w-3 h-3 animate-spin text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary hidden md:inline">Sincronizando</span>
              </motion.div>
            )}
            <button 
              onClick={() => navigate('/catechism/history')}
              className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
              title="Histórico de Leitura"
            >
              <Icons.History className="w-4 h-4" />
            </button>
          </div>
          {(crossRefs.length > 0 || docsRefs.length > 0) && (
            <button onClick={() => setShowCrossRefs(!showCrossRefs)}
              className={`p-2 rounded-xl border transition-all ${showCrossRefs ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground'}`}
              title="Catecismo & Documentos">
              <Icons.Cross className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Section navigator */}
        <div className="flex items-center gap-3 justify-center">
          <button 
            disabled={selectedSection.id <= 1} 
            onClick={() => {
              const prevSec = selectedPart.sections.find(s => s.id === selectedSection.id - 1);
              if (prevSec) {
                setSelectedSection(prevSec);
                setCurrentParagraph(prevSec.paragraphs[0]);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="px-3 py-2 rounded-xl bg-card border border-border text-xs font-bold disabled:opacity-30 hover:bg-primary/10 transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-primary outline-none"
            aria-label="Seção anterior"
          >
            <Icons.ArrowDown className="w-3.5 h-3.5 rotate-90" /> Seção Anterior
          </button>

          <div className="px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl text-xs font-black uppercase tracking-widest text-primary">
            Lendo Seção {selectedSection.id}
          </div>
          <button 
            disabled={selectedSection.id >= 10} 
            onClick={() => {
              const nextSec = selectedPart.sections.find(s => s.id === selectedSection.id + 1);
              if (nextSec) {
                setSelectedSection(nextSec);
                setCurrentParagraph(nextSec.paragraphs[0]);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="px-3 py-2 rounded-xl bg-card border border-border text-xs font-bold disabled:opacity-30 hover:bg-primary/10 transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-primary outline-none"
            aria-label="Próxima seção"
          >
            Próxima Seção <Icons.ArrowDown className="w-3.5 h-3.5 -rotate-90" />
          </button>

        </div>

        {/* Cross references */}
        {showCrossRefs && (crossRefs.length > 0 || docsRefs.length > 0) && (
          <CrossReferencePanel
            type="catechism"
            bibleRefs={crossRefs}
            documents={docsRefs}
            onNavigateToBible={handleNavigateToBible}
            onNavigateToDoc={handleNavigateToDoc}
          />
        )}

        <div className="bg-card border border-border rounded-3xl p-6 md:p-10 space-y-12 shadow-sm">
          <div className="flex flex-col gap-10">
            {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
              <LazyParagraph key={p} paragraph={p} currentParagraph={currentParagraph} paragraphsRead={paragraphsRead} isFavorite={isFavorite} toggleFavorite={toggleFavorite} handleNavigateToBible={handleNavigateToBible} />
            ))}
          </div>

          {/* Next Paragraph Indicator */}
          {currentParagraph < end ? (
            <div className="pt-8 border-t border-border/40 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Continue a leitura</div>
              <button 
                onClick={() => jumpToParagraph(currentParagraph + 1)}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all w-full max-w-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                  <span className="text-xl font-serif font-bold">§{currentParagraph + 1}</span>
                </div>
                <div className="text-left flex-1">
                   <div className="text-xs font-bold text-foreground">Próximo Parágrafo</div>
                   <div className="text-[10px] text-muted-foreground">Clique para saltar agora</div>
                </div>
                <Icons.ArrowDown className="w-5 h-5 text-primary -rotate-90 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="pt-8 border-t border-border/40 flex flex-col items-center gap-4">
               <div className="text-[10px] font-black uppercase tracking-widest text-primary">Seção Concluída</div>
               <p className="text-sm text-muted-foreground text-center">Você terminou esta seção! Deseja ir para a próxima?</p>
               <button 
                disabled={selectedSection.id >= 10}
                onClick={() => {
                  const nextSec = selectedPart.sections.find(s => s.id === selectedSection.id + 1);
                  if (nextSec) {
                    setSelectedSection(nextSec);
                    setCurrentParagraph(nextSec.paragraphs[0]);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-30"
               >
                 Próxima Seção
               </button>
            </div>
          )}
        </div>

        {/* Quick nav - Anchor links to jump between paragraphs */}
        <div className="flex flex-wrap gap-2 justify-center py-6 border-t border-border mt-8">
          <span className="w-full text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Saltar para Parágrafo</span>
          {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
            <button key={p} 
              onClick={() => jumpToParagraph(p)}
              className={`w-10 h-10 rounded-xl text-xs font-bold transition-all relative ${
                currentParagraph === p ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110 z-10' : 
                paragraphsRead.has(p) ? 'bg-primary/10 border-primary/30 text-primary' :
                'bg-card border border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
              }`}>
              {p}
              {paragraphsRead.has(p) && <Icons.Check className="w-2 h-2 absolute top-1 right-1" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Section selection
  if (viewMode === 'sections' && selectedPart) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
            <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
          </button>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{selectedPart.part}</span>
            <h1 className="text-3xl font-serif font-bold text-foreground">{selectedPart.title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedPart.sections.map(sec => (
            <button key={sec.id} onClick={() => { setSelectedSection(sec); setCurrentParagraph(sec.paragraphs[0]); setViewMode('reading'); }}
              className="text-left p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Seção {sec.id}</span>
              <h3 className="text-lg font-serif font-bold text-foreground mt-2 group-hover:text-primary transition-colors">{sec.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">§{sec.paragraphs[0]} — §{sec.paragraphs[1]}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Parts overview
  return (
    <>
    <SEOHead title="Catecismo da Igreja Católica" description="Acesse o Catecismo da Igreja Católica online. Estude a doutrina católica organizada por partes, seções e parágrafos." path="/catechism" keywords="catecismo online, catecismo da igreja católica, doutrina católica, CIC" breadcrumbs={[{ name: "Home", path: "/" }, { name: "Catecismo", path: "/catechism" }]} />
    <motion.div
      className="max-w-5xl mx-auto space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div 
        className="text-center space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Cross className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Codex Fidei</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Catecismo da Igreja Católica</h1>
        <p className="text-muted-foreground font-serif italic">2.865 parágrafos organizados em 4 partes fundamentais.</p>
        <div className="max-w-xs mx-auto pt-4">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">
            <span>Seu Progresso</span>
            <span>{Math.round((paragraphsRead.size / 2865) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(paragraphsRead.size / 2865) * 100}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>
      </motion.div>
      
      {user?.role === 'admin' && (
        <div className="flex justify-center">
          <button 
            onClick={() => navigate('/catechism/integrity')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition-all"
          >
            <Icons.Activity className="w-3.5 h-3.5" /> Painel de Integridade (Admin)
          </button>
        </div>
      )}


      {/* Suggestion Card */}
      {nextUnreadParagraph && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div 
            onClick={() => navigateToParagraph(nextUnreadParagraph)}
            className="max-w-md mx-auto p-4 rounded-2xl border border-primary/20 bg-primary/5 cursor-pointer hover:border-primary/40 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <Icons.Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Continuar Formação</p>
                <h3 className="text-sm font-bold text-foreground">Sugerido: §{nextUnreadParagraph}</h3>
              </div>
            </div>
            <Icons.ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>
      )}

      {/* Search by paragraph */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por número do parágrafo (ex: 1324)..."
            className="w-full pl-11 pr-20 py-3 rounded-2xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-foreground text-background rounded-xl text-xs font-bold">
            Ir
          </button>
        </div>
      </div>

      {/* Parts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CIC_SECTIONS.map(part => (
          <button key={part.part} onClick={() => { setSelectedPart(part); setViewMode('sections'); }}
            className="text-left p-5 md:p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{part.part}</span>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mt-3 group-hover:text-primary transition-colors">{part.title}</h2>
            <p className="text-sm text-muted-foreground mt-2">{part.sections.length} seções</p>
            <div className="flex flex-wrap gap-1 mt-4">
              {part.sections.map(s => (
                <span key={s.id} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-lg text-[10px] font-bold">{s.title.split(' ').slice(0, 3).join(' ')}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </motion.div>
    </>
  );
};

export default Catechism;
