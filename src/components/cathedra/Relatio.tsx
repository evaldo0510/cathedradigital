import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Icons } from '../../constants';
import { fetchNexusTagContent, TagContent } from '@/lib/nexusContent';
import { BIBLE_TO_CIC, CIC_TO_BIBLE, getBibleDocs, getCatechismDocs } from '@/data/cross-references';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import MagisteriumPopover from './MagisteriumPopover';
import { CathedraCard } from './CathedraCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { getSpiritualContext, rankConnectionsIntelligently, deduplicateRelatio, SpiritualContext } from '@/lib/spiritual-relevance';
import { toast } from 'sonner';

interface RelatioProps {
  context: {
    type: 'bible' | 'catechism' | 'magisterium' | 'saint' | 'theme';
    id?: string;
    abbr?: string;
    chapter?: number;
    paragraph?: number;
    tags?: string[];
  };
  onNavigateToBible?: (abbr: string, chapter: number) => void;
  onNavigateToCIC?: (paragraph: number) => void;
  onNavigateToDoc?: (docId: string) => void;
  onSelectLogosQuery?: (prompt: string) => void;
  className?: string;
}

const Relatio: React.FC<RelatioProps> = ({ 
  context, 
  onNavigateToBible, 
  onNavigateToCIC, 
  onNavigateToDoc,
  onSelectLogosQuery,
  className 
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const contextSettings = useReadingSettings();
  const settings = contextSettings?.settings || { relatio: { enabled: true } };
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [connections, setConnections] = useState<(TagContent & { reason?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [autoCollapse, setAutoCollapse] = useState(() => {
    return localStorage.getItem('cathedra-relatio-autocollapse') === 'true';
  });
  const [density, setDensity] = useState<'subtle' | 'normal' | 'deep'>(() => {
    return (localStorage.getItem('cathedra-relatio-density') as any) || 'normal';
  });
  const [isOpeningLogos, setIsOpeningLogos] = useState(false);
  const [spiritualContext, setSpiritualContext] = useState<SpiritualContext | null>(null);


  // Relatio Settings Destructuring with fallbacks
  const relatioConfig = settings.relatio || {
    enabled: true,
    intensity: 'standard',
    showBible: true,
    showCatechism: true,
    showMagisterium: true,
    showSaints: true,
    relevanceByProgress: true,
  };

  // Unified static references based on context
  const staticRefs = useMemo(() => {
    const refs: {
      cicParagraphs: number[];
      bibleRefs: { abbr: string; chapter: number; verse?: number; label: string }[];
      documents: { id: string; name: string; label: string }[];
    } = {
      cicParagraphs: [],
      bibleRefs: [],
      documents: []
    };

    if (!relatioConfig.enabled) return refs;

    if (context.type === 'bible' && context.abbr && context.chapter) {
      if ((relatioConfig as any).showCatechism !== false) {
        refs.cicParagraphs = BIBLE_TO_CIC[`${context.abbr}:${context.chapter}`] || [];
      }
      if ((relatioConfig as any).showMagisterium !== false) {
        refs.documents = getBibleDocs(context.abbr, context.chapter);
      }
    } else if (context.type === 'catechism' && context.paragraph) {
      if ((relatioConfig as any).showBible !== false) {
        refs.bibleRefs = CIC_TO_BIBLE[context.paragraph] || [];
      }
      if ((relatioConfig as any).showMagisterium !== false) {
        refs.documents = getCatechismDocs(context.paragraph);
      }
    }

    return refs;
  }, [context, relatioConfig]);

  useEffect(() => {
    const loadContext = async () => {
      if (user && (relatioConfig as any).relevanceByProgress) {
        const ctx = await getSpiritualContext(user.id);
        setSpiritualContext(ctx);
      }
    };
    loadContext();
  }, [user, (relatioConfig as any).relevanceByProgress]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!relatioConfig.enabled || !context.tags || context.tags.length === 0) return;
      
      setLoading(true);
      try {
        const intensity = density;
        // Limit number of tags to fetch to maintain performance/focus
        const tagCount = intensity === 'subtle' ? 1 : intensity === 'deep' ? 4 : 2;
        
        // Density Control: limit based on intensity settings
        const densityLimits = { subtle: 4, normal: 8, deep: 16 };
        const resultLimit = densityLimits[density] || 8;

        const tagPromises = context.tags.slice(0, tagCount).map(tag => 
          fetchNexusTagContent({ label: tag, slug: tag.toLowerCase() })
        );
        const results = await Promise.all(tagPromises);
        const all = results.flat();
        
        // Apply type filters from settings
        const filtered = all.filter(item => {
          if (item.id === context.id) return false;
          if (item.type === 'bible' && (relatioConfig as any).showBible === false) return false;
          if (item.type === 'catechism' && (relatioConfig as any).showCatechism === false) return false;
          if (item.type === 'magisterium' && (relatioConfig as any).showMagisterium === false) return false;
          if (item.type === 'saint' && (relatioConfig as any).showSaints === false) return false;
          return true;
        });

        // Advanced Deduplication
        const unique = deduplicateRelatio(filtered);
        
        // Advanced Ranking
        let ranked: (TagContent & { reason?: string })[] = [];
        if ((relatioConfig as any).relevanceByProgress && spiritualContext) {
          ranked = rankConnectionsIntelligently(unique, spiritualContext, context.tags);
        } else {
          // Fallback simple reason assignment
          ranked = unique.map(item => ({
            ...item,
            reason: item.metadata?.is_theme_content ? 'Tema Relacionado' : 
                   item.metadata?.tags?.some((t: string) => context.tags?.includes(t)) ? 'Contexto Similar' : 
                   'Tradição Conectada'
          }));
        }
        
        setConnections(ranked.slice(0, resultLimit));

      } catch (error) {
        console.error('Error fetching Relatio connections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [context.tags, context.id, relatioConfig, spiritualContext, density]);

  const updateDensity = (newDensity: 'subtle' | 'normal' | 'deep') => {
    setDensity(newDensity);
    localStorage.setItem('cathedra-relatio-density', newDensity);
    window.dispatchEvent(new CustomEvent('cathedra-relatio-density-changed', { detail: newDensity }));
    toast.info(`Densidade: ${newDensity === 'subtle' ? 'Subtil' : newDensity === 'normal' ? 'Normal' : 'Profunda'}`);
  };

  const toggleAutoCollapse = () => {
    const newVal = !autoCollapse;
    setAutoCollapse(newVal);
    localStorage.setItem('cathedra-relatio-autocollapse', String(newVal));
    toast.info(`Recolhimento Automático: ${newVal ? 'Ativado' : 'Desativado'}`);
  };


  const hasAnyConnections = 
    staticRefs.cicParagraphs.length > 0 || 
    staticRefs.bibleRefs.length > 0 || 
    staticRefs.documents.length > 0 || 
    connections.length > 0;

  if (!relatioConfig.enabled || !hasAnyConnections) return null;

  return (
    <section ref={containerRef} className={cn("mt-spacing-2xl pt-spacing-2xl border-t border-primary/[0.01] space-y-spacing-lg mb-spacing-2xl", className)} aria-labelledby="relatio-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-spacing-sm">
          <div className="w-spacing-lg h-spacing-lg rounded-premium-full bg-primary/[0.03] flex items-center justify-center">
            <Icons.Sparkles className="w-spacing-sm h-spacing-sm text-primary/40" />
          </div>
          <div>
            <h3 id="relatio-heading" className="text-[9px] font-black uppercase tracking-[0.5em] text-primary/10 group-hover:text-primary/30 transition-all duration-1000">Relatio Contextual</h3>
          </div>
        </div>
        <div className="flex items-center gap-spacing-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAutoCollapse}
            className={cn(
              "w-spacing-xl h-spacing-xl rounded-premium-full transition-all duration-300",
              autoCollapse ? "text-primary bg-primary/10" : "text-muted-foreground/40 hover:text-primary"
            )}
            title={autoCollapse ? "Recolhimento automático ativado" : "Ativar recolhimento automático"}
          >
            <Icons.Library className="w-spacing-sm h-spacing-sm" />
          </Button>

          <div className="hidden sm:flex items-center bg-primary/[0.03] rounded-premium-full p-spacing-2xs border border-primary/[0.05]">
            {(['subtle', 'normal', 'deep'] as const).map((d) => (
              <button
                key={d}
                onClick={() => updateDensity(d)}
                className={cn(
                  "px-spacing-sm py-spacing-2xs text-[8px] font-black uppercase tracking-widest rounded-premium-full transition-all duration-300",
                  density === d ? "bg-primary text-primary-foreground shadow-premium-sm" : "text-muted-foreground/60 hover:text-primary"
                )}
              >
                {d === 'subtle' ? 'Subtil' : d === 'normal' ? 'Normal' : 'Profunda'}
              </button>
            ))}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsVisible(!isVisible)}
            className="text-muted-foreground hover:text-primary transition-colors text-premium-xs uppercase tracking-widest font-black"
          >
            {isVisible ? 'Ocultar' : 'Revelar'}
          </Button>
        </div>

      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-spacing-lg"
          >
            <LayoutGroup id="relatio-cards">
            {/* Static References */}
            {(staticRefs.cicParagraphs.length > 0 || staticRefs.bibleRefs.length > 0 || staticRefs.documents.length > 0) && (
              <div className="flex flex-wrap gap-spacing-xs">
                {staticRefs.cicParagraphs.map(p => (
                  <CatechismPopover key={`static-cic-${p}`} paragraph={p} onNavigate={onNavigateToCIC} />
                ))}
                {staticRefs.bibleRefs.map((ref, i) => (
                  <BibleVersePopover 
                    key={`static-bible-${i}`} 
                    abbr={ref.abbr} 
                    chapter={ref.chapter} 
                    verse={ref.verse} 
                    label={ref.label} 
                    onNavigate={onNavigateToBible} 
                  />
                ))}
                {staticRefs.documents.map((doc, i) => (
                  <MagisteriumPopover 
                    key={`static-doc-${i}`} 
                    documentName={doc.name} 
                    label={doc.label} 
                    onNavigate={() => onNavigateToDoc?.(doc.id)} 
                  />
                ))}
              </div>
            )}

            {/* Dynamic Connections */}
            {connections.length > 0 && (
              <div className="space-y-spacing-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg">

                  {(showAll ? connections : connections.slice(0, 4)).map((item) => {
                  const isFav = isFavorite('relatio', item.title);
                  // Calculate connection strength based on matches or metadata
                  const strength = (item as any).relevanceScore || 0;
                  const strengthLabel = strength > 20 ? 'Conexão Profunda' : strength > 10 ? 'Conexão Clara' : 'Vínculo Sutil';
                  
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.5 }}
                      className="group relative"
                    >
                      <CathedraCard 
                        padding="md"
                        variant="default"
                        className="h-full bg-transparent border-none group-hover:bg-primary/[0.005] transition-all duration-700 rounded-premium shadow-premium-none cursor-pointer overflow-hidden flex flex-col"


                        onClick={() => {
                          if (item.type === 'bible') {
                            const abbr = item.metadata?.book_abbr || item.metadata?.abbr;
                            const chapter = item.metadata?.chapter;
                            if (abbr && chapter) {
                              onNavigateToBible?.(abbr, chapter);
                            } else {
                              const [parsedAbbr, parsedChapter] = (item.title || '').split(' ');
                              onNavigateToBible?.(parsedAbbr, parseInt(parsedChapter) || 1);
                            }
                          } else if (item.type === 'catechism') {
                            const p = item.metadata?.paragraph || parseInt(item.title.match(/\d+/)?.[0] || '0');
                            if (p) onNavigateToCIC?.(p);
                          } else if (item.type === 'magisterium') {
                            onNavigateToDoc?.(item.id);
                          }
                        }}
                      >
                        <div className="absolute top-spacing-0 right-0 w-spacing-4xl h-spacing-4xl bg-primary/[0.01] rounded-premium-full -mr-spacing-3xl -mt-spacing-3xl group-hover:bg-primary/[0.03] transition-colors duration-1000" />
                        
                        <div className="flex flex-col h-full relative z-10">
                          <div className="flex items-start justify-between mb-spacing-md">
                            <div className="flex items-center gap-spacing-sm">
                              <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/[0.03] border border-primary/[0.05] flex-shrink-0 flex items-center justify-center text-primary/40 group-hover:text-primary group-hover:bg-primary/[0.05] transition-all duration-700">
                                {item.type === 'bible' && <Icons.Bible className="w-spacing-md h-spacing-md" strokeWidth={1} />}
                                {item.type === 'catechism' && <Icons.CatechismShield className="w-spacing-md h-spacing-md" strokeWidth={1} />}
                                {item.type === 'magisterium' && <Icons.Magisterium className="w-spacing-md h-spacing-md" strokeWidth={1} />}
                                {(item.type === 'journey' || item.type === 'saint') && <Icons.Compass className="w-spacing-md h-spacing-md" strokeWidth={1} />}
                              </div>
                              <div className="space-y-spacing-3xs">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 group-hover:text-primary transition-colors">
                                  {item.type === 'bible' ? 'Escritura' : 
                                   item.type === 'catechism' ? 'Catecismo' : 
                                   item.type === 'magisterium' ? 'Magistério' : 
                                   item.type === 'saint' ? 'Tradição' : 'Jornada'}
                                </p>
                                <div className="flex items-center gap-spacing-xs">
                                  <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                    {item.reason}
                                  </span>
                                  <div className={cn("w-spacing-2xs h-spacing-2xs rounded-premium-full", strength > 20 ? "bg-secondary animate-pulse" : "bg-primary/10")} />
                                  <span className={cn("text-[7px] font-black uppercase tracking-widest", strength > 20 ? "text-secondary" : "text-secondary/60")}>
                                    {strengthLabel}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-spacing-2xs opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              {onSelectLogosQuery && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isOpeningLogos}
                                  className="w-spacing-lg h-spacing-lg rounded-premium-full hover:bg-primary/5 text-primary/60 hover:text-primary disabled:opacity-30"
                                  title="Pedir explicação à Logos IA"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isOpeningLogos) return;
                                    
                                    setIsOpeningLogos(true);
                                    if (autoCollapse) setShowAll(false);
                                    const prompt = `Por favor, explique a conexão teológica e espiritual entre o que estou lendo e esta referência: "${item.title}". Contexto: ${item.type}, Tags: ${item.metadata?.tags?.join(', ') || 'N/A'}.`;
                                    onSelectLogosQuery(prompt);
                                    
                                    // Reset lock after a short delay to allow drawer to open
                                    setTimeout(() => setIsOpeningLogos(false), 1500);
                                  }}
                                >
                                  <Icons.Sparkles className={cn("w-spacing-sm h-spacing-sm", isOpeningLogos && "animate-pulse")} strokeWidth={1.5} />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-spacing-lg h-spacing-lg rounded-premium-full hover:bg-primary/5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite({
                                    type: 'relatio',
                                    title: item.title,
                                    content: item.content_text,
                                  });
                                  toast.success(isFav ? 'Removido dos favoritos' : 'Conexão salva', {
                                    description: item.title,
                                    icon: <Icons.Star className="w-spacing-md h-spacing-md fill-secondary text-secondary" />
                                  });
                                }}
                              >
                                <Icons.Star className={cn("w-spacing-sm h-spacing-sm", isFav ? "fill-secondary text-secondary" : "text-primary/60")} strokeWidth={1.5} />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-spacing-xs">
                            <h4 className="text-premium-base font-bold font-serif text-primary/80 group-hover:text-primary transition-colors duration-500">{item.title}</h4>
                            <p className="text-premium-sm text-muted-foreground leading-relaxed line-clamp-spacing-sm font-serif italic font-light opacity-70 group-hover:opacity-90 transition-opacity duration-500">
                              {item.content_text.replace(/[#*]/g, '')}
                            </p>
                          </div>

                          
                          <div className="mt-spacing-md pt-spacing-md border-t border-primary/[0.02] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-1 group-hover:translate-y-0">
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/60">Explorar Conexão</span>
                            <Icons.ArrowRight className="w-spacing-sm h-spacing-sm text-primary/60" strokeWidth={1.5} />
                          </div>
                        </div>
                      </CathedraCard>
                    </motion.div>
                  );
                })}
                </div>

                {loading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-md mt-spacing-md">
                    {[1, 2].map((i) => (
                      <div key={`skeleton-${i}`} className="h-[180px] w-full rounded-premium-lg bg-primary/[0.02] animate-pulse overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.05] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {connections.length > 4 && (
              <div className="flex flex-col items-center gap-spacing-md pt-spacing-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const nextShowAll = !showAll;
                    setShowAll(nextShowAll);
                    if (!nextShowAll) {
                      containerRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 hover:text-primary transition-all group rounded-premium-full"
                >
                  <span className="mr-spacing-xs">{showAll ? 'Recolher Conexões' : `Ver mais ${connections.length - 4} conexões`}</span>
                  <Icons.ChevronDown className={cn("w-spacing-sm h-spacing-sm transition-transform duration-500", showAll && "rotate-180")} />
                </Button>
                
                {showAll && (
                  <p className="text-[8px] text-muted-foreground/60 uppercase tracking-[0.3em] italic">
                    Fim das conexões contextuais para esta seção
                  </p>
                )}
              </div>
            )}

            </LayoutGroup>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Relatio;