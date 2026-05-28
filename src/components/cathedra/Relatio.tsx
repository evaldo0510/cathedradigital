import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import { fetchNexusTagContent, TagContent } from '@/lib/nexusContent';
import { BIBLE_TO_CIC, CIC_TO_BIBLE, getBibleDocs, getCatechismDocs } from '@/data/cross-references';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import MagisteriumPopover from './MagisteriumPopover';
import { Card } from '@/components/ui/card';
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
  const contextSettings = useReadingSettings();
  const settings = contextSettings?.settings || { relatio: { enabled: true } };
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [connections, setConnections] = useState<(TagContent & { reason?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showAll, setShowAll] = useState(false);
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
        const intensity = (relatioConfig as any).intensity || 'standard';
        const tagCount = intensity === 'subtle' ? 1 : intensity === 'deep' ? 4 : 2;
        // Density Control: limit based on intensity settings
        const densityLimits = { subtle: 4, standard: 8, deep: 16 };
        const resultLimit = densityLimits[intensity as keyof typeof densityLimits] || 8;


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
  }, [context.tags, context.id, relatioConfig, spiritualContext]);

  const hasAnyConnections = 
    staticRefs.cicParagraphs.length > 0 || 
    staticRefs.bibleRefs.length > 0 || 
    staticRefs.documents.length > 0 || 
    connections.length > 0;

  if (!relatioConfig.enabled || !hasAnyConnections) return null;

  return (
    <section className={cn("mt-16 pt-16 border-t border-border/5 space-y-8", className)} aria-labelledby="relatio-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Icons.Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 id="relatio-heading" className="text-xs font-black uppercase tracking-[0.2em] text-primary">Relatio Contextual</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Conexões na Tradição</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsVisible(!isVisible)}
            className="text-muted-foreground hover:text-primary transition-colors text-premium-tiny uppercase tracking-widest font-black"
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
            className="space-y-6"
          >
            {/* Static References */}
            {(staticRefs.cicParagraphs.length > 0 || staticRefs.bibleRefs.length > 0 || staticRefs.documents.length > 0) && (
              <div className="flex flex-wrap gap-2">
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
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(showAll ? connections : connections.slice(0, 4)).map((item) => {
                  const isFav = isFavorite('relatio', item.title);
                  // Calculate connection strength based on matches or metadata
                  const strength = (item as any).relevanceScore || 0;
                  const strengthLabel = strength > 20 ? 'Conexão Profunda' : strength > 10 ? 'Conexão Clara' : 'Vínculo Sutil';
                  
                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.5 }}
                      className="group relative"
                    >
                      <Card 
                        className="h-full p-6 bg-card/40 backdrop-blur-md border border-primary/5 group-hover:border-primary/20 transition-all duration-700 rounded-premium-lg shadow-none cursor-pointer overflow-hidden"
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
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.01] rounded-full -mr-16 -mt-16 group-hover:bg-primary/[0.03] transition-colors duration-1000" />
                        
                        <div className="flex flex-col h-full relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-premium bg-primary/[0.03] border border-primary/[0.05] flex-shrink-0 flex items-center justify-center text-primary/40 group-hover:text-primary group-hover:bg-primary/[0.05] transition-all duration-700">
                                {item.type === 'bible' && <Icons.Bible className="w-4 h-4" strokeWidth={1} />}
                                {item.type === 'catechism' && <Icons.CatechismShield className="w-4 h-4" strokeWidth={1} />}
                                {item.type === 'magisterium' && <Icons.Magisterium className="w-4 h-4" strokeWidth={1} />}
                                {(item.type === 'journey' || item.type === 'saint') && <Icons.Compass className="w-4 h-4" strokeWidth={1} />}
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 group-hover:text-primary transition-colors">
                                  {item.type === 'bible' ? 'Escritura' : 
                                   item.type === 'catechism' ? 'Catecismo' : 
                                   item.type === 'magisterium' ? 'Magistério' : 
                                   item.type === 'saint' ? 'Tradição' : 'Jornada'}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                    {item.reason}
                                  </span>
                                  <div className={cn("w-1 h-1 rounded-full", strength > 20 ? "bg-secondary animate-pulse" : "bg-primary/10")} />
                                  <span className={cn("text-[7px] font-black uppercase tracking-widest", strength > 20 ? "text-secondary" : "text-secondary/60")}>
                                    {strengthLabel}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              {onSelectLogosQuery && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-7 h-7 rounded-full hover:bg-primary/5 text-primary/30 hover:text-primary"
                                  title="Pedir explicação à Logos IA"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectLogosQuery(`Por favor, explique a conexão teológica e espiritual entre o que estou lendo e esta referência: "${item.title}".`);
                                  }}
                                >
                                  <Icons.Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 rounded-full hover:bg-primary/5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite({
                                    type: 'relatio',
                                    title: item.title,
                                    content: item.content_text,
                                  });
                                  toast.success(isFav ? 'Removido dos favoritos' : 'Conexão salva', {
                                    description: item.title,
                                    icon: <Icons.Star className="w-4 h-4 fill-secondary text-secondary" />
                                  });
                                }}
                              >
                                <Icons.Star className={cn("w-3.5 h-3.5", isFav ? "fill-secondary text-secondary" : "text-primary/20")} strokeWidth={1.5} />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <h4 className="text-base font-bold font-serif text-primary/80 group-hover:text-primary transition-colors duration-500">{item.title}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 font-serif italic font-light opacity-70 group-hover:opacity-90 transition-opacity duration-500">
                              {item.content_text.replace(/[#*]/g, '')}
                            </p>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-primary/[0.02] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-1 group-hover:translate-y-0">
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/30">Explorar Conexão</span>
                            <Icons.ArrowRight className="w-3 h-3 text-primary/30" strokeWidth={1.5} />
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
                </div>
              </div>
            )}


            {connections.length > 4 && (
              <div className="flex flex-col items-center gap-4 pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const nextShowAll = !showAll;
                    setShowAll(nextShowAll);
                    if (!nextShowAll) {
                      document.getElementById('relatio-heading')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 hover:text-primary transition-all group rounded-full"
                >
                  <span className="mr-2">{showAll ? 'Recolher Conexões' : `Ver mais ${connections.length - 4} conexões`}</span>
                  <Icons.ChevronDown className={cn("w-3 h-3 transition-transform duration-500", showAll && "rotate-180")} />
                </Button>
                
                {showAll && (
                  <p className="text-[8px] text-muted-foreground/30 uppercase tracking-[0.3em] italic">
                    Fim das conexões contextuais para esta seção
                  </p>
                )}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-4">
                <Icons.Loader2 className="w-5 h-5 animate-spin text-primary/30" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};



export default Relatio;