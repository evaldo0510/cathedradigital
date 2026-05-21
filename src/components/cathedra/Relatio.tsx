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
import { getSpiritualContext, rankConnections, deduplicateRelatio, SpiritualContext } from '@/lib/spiritual-relevance';
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
  className?: string;
}

const Relatio: React.FC<RelatioProps> = ({ 
  context, 
  onNavigateToBible, 
  onNavigateToCIC, 
  onNavigateToDoc,
  className 
}) => {
  const { settings } = useReadingSettings();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [connections, setConnections] = useState<(TagContent & { reason?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
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
      if (relatioConfig.showCatechism) {
        refs.cicParagraphs = BIBLE_TO_CIC[`${context.abbr}:${context.chapter}`] || [];
      }
      if (relatioConfig.showMagisterium) {
        refs.documents = getBibleDocs(context.abbr, context.chapter);
      }
    } else if (context.type === 'catechism' && context.paragraph) {
      if (relatioConfig.showBible) {
        refs.bibleRefs = CIC_TO_BIBLE[context.paragraph] || [];
      }
      if (relatioConfig.showMagisterium) {
        refs.documents = getCatechismDocs(context.paragraph);
      }
    }

    return refs;
  }, [context, relatioConfig]);

  useEffect(() => {
    const loadContext = async () => {
      if (user && relatioConfig.relevanceByProgress) {
        const ctx = await getSpiritualContext(user.id);
        setSpiritualContext(ctx);
      }
    };
    loadContext();
  }, [user, relatioConfig.relevanceByProgress]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!relatioConfig.enabled || !context.tags || context.tags.length === 0) return;
      
      setLoading(true);
      try {
        // Intensity determines how many tags we look at and how many results we show
        const tagCount = relatioConfig.intensity === 'subtle' ? 1 : relatioConfig.intensity === 'deep' ? 4 : 2;
        const resultLimit = relatioConfig.intensity === 'subtle' ? 3 : relatioConfig.intensity === 'deep' ? 12 : 6;

        const tagPromises = context.tags.slice(0, tagCount).map(tag => 
          fetchNexusTagContent({ label: tag, slug: tag.toLowerCase() })
        );
        const results = await Promise.all(tagPromises);
        const all = results.flat();
        
        // Apply type filters from settings
        let filtered = all.filter(item => {
          if (item.id === context.id) return false;
          if (item.type === 'bible' && !relatioConfig.showBible) return false;
          if (item.type === 'catechism' && !relatioConfig.showCatechism) return false;
          if (item.type === 'magisterium' && !relatioConfig.showMagisterium) return false;
          if (item.type === 'saint' && !relatioConfig.showSaints) return false;
          return true;
        });

        // Advanced Deduplication
        const unique = deduplicateRelatio(filtered);
        
        // Advanced Ranking if enabled
        let ranked: (TagContent & { reason?: string })[] = unique;
        if (relatioConfig.relevanceByProgress && spiritualContext) {
          ranked = rankConnections(unique, spiritualContext, context.tags);
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
    <div className={cn("mt-16 pt-16 border-t border-border/5 space-y-8", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Icons.Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Relatio Contextual</h3>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {connections.map((item) => {
                  const isFav = isFavorite('relatio', item.title);
                  
                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -1 }}
                      className="group relative"
                    >
                      <Card 
                        className="p-4 bg-card/30 backdrop-blur-sm border border-border/20 group-hover:border-primary/20 transition-all rounded-premium shadow-none cursor-pointer"
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
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-premium bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                            {item.type === 'bible' && <Icons.Cross className="w-4 h-4" />}
                            {item.type === 'catechism' && <Icons.CatechismShield className="w-4 h-4" />}
                            {item.type === 'magisterium' && <Icons.Magisterium className="w-4 h-4" />}
                            {(item.type === 'journey' || item.type === 'saint') && <Icons.Compass className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 group-hover:text-primary transition-colors">
                                  {item.type === 'bible' ? 'Escritura' : 
                                   item.type === 'catechism' ? 'Catecismo' : 
                                   item.type === 'magisterium' ? 'Magistério' : 
                                   item.type === 'saint' ? 'Santos' : 'Jornada'}
                                </p>
                                <span className="text-[8px] text-muted-foreground/50 uppercase tracking-tighter opacity-70 mt-0.5">
                                  {item.reason}
                                </span>
                              </div>
                            </div>
                            <h4 className="text-sm font-bold font-serif truncate mt-0.5">{item.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1 font-serif italic">
                              {item.content_text.replace(/[#*]/g, '')}
                            </p>
                          </div>
                        </div>
                      </Card>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite({
                            type: 'relatio',
                            title: item.title,
                            content: item.content_text,
                          });
                          toast.success(isFav ? 'Removido dos favoritos' : 'Conexão salva nos favoritos', {
                            description: item.title
                          });
                        }}
                      >
                        <Icons.Star className={cn("w-3 h-3", isFav ? "fill-primary text-primary" : "text-muted-foreground")} />
                      </Button>
                    </motion.div>
                  );
                })}
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
    </div>
  );
};

export default Relatio;