import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import { fetchNexusTagContent, TagContent } from '@/lib/nexusContent';
import { getBibleCrossRefs, getCatechismCrossRefs } from '@/data/cross-references';
import BibleVersePopover from './BibleVersePopover';
import CatechismPopover from './CatechismPopover';
import MagisteriumPopover from './MagisteriumPopover';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const [connections, setConnections] = useState<TagContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Hardcoded refs based on context
  const staticRefs = React.useMemo(() => {
    if (context.type === 'bible' && context.abbr && context.chapter) {
      return getBibleCrossRefs(context.abbr, context.chapter);
    }
    if (context.type === 'catechism' && context.paragraph) {
      return getCatechismCrossRefs(context.paragraph);
    }
    return null;
  }, [context]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!context.tags || context.tags.length === 0) return;
      
      setLoading(true);
      try {
        // Fetch for the first 2 tags to keep it relevant but broad enough
        const tagPromises = context.tags.slice(0, 2).map(tag => 
          fetchNexusTagContent({ label: tag, slug: tag.toLowerCase() })
        );
        const results = await Promise.all(tagPromises);
        const all = results.flat();
        
        // Filter out current content if ID matches
        const filtered = all.filter(item => item.id !== context.id);
        
        // Remove duplicates and limit
        const unique = Array.from(new Map(filtered.map(item => [item.id, item])).values());
        setConnections(unique.slice(0, 6));
      } catch (error) {
        console.error('Error fetching Relatio connections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [context.tags, context.id]);

  const hasAnyConnections = (staticRefs && (
    (staticRefs.cicParagraphs?.length ?? 0) > 0 || 
    (staticRefs.bibleRefs?.length ?? 0) > 0 || 
    (staticRefs.documents?.length ?? 0) > 0
  )) || connections.length > 0;

  if (!hasAnyConnections) return null;

  return (
    <div className={cn("mt-12 space-y-6", className)}>
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
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsVisible(!isVisible)}
          className="text-muted-foreground hover:text-primary transition-colors text-premium-tiny uppercase tracking-widest font-black"
        >
          {isVisible ? 'Ocultar' : 'Revelar'}
        </Button>
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-6"
          >
            {/* Hardcoded Cross References (Nexus Theologicus) */}
            {staticRefs && (
              <div className="flex flex-wrap gap-2">
                {staticRefs.cicParagraphs?.map(p => (
                  <CatechismPopover key={`static-cic-${p}`} paragraph={p} onNavigate={onNavigateToCIC} />
                ))}
                {staticRefs.bibleRefs?.map((ref, i) => (
                  <BibleVersePopover 
                    key={`static-bible-${i}`} 
                    abbr={ref.abbr} 
                    chapter={ref.chapter} 
                    verse={ref.verse} 
                    label={ref.label} 
                    onNavigate={onNavigateToBible} 
                  />
                ))}
                {staticRefs.documents?.map((doc, i) => (
                  <MagisteriumPopover 
                    key={`static-doc-${i}`} 
                    documentName={doc.name} 
                    label={doc.label} 
                    onNavigate={() => onNavigateToDoc?.(doc.id)} 
                  />
                ))}
              </div>
            )}

            {/* Dynamic Intelligent Connections */}
            {connections.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {connections.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.01 }}
                    className="group cursor-pointer"
                    onClick={() => {
                      if (item.type === 'bible') {
                        const [abbr, chapter] = (item.title || '').split(' ');
                        onNavigateToBible?.(abbr, parseInt(chapter) || 1);
                      } else if (item.type === 'catechism') {
                        const p = parseInt(item.title.match(/\d+/)?.[0] || '0');
                        if (p) onNavigateToCIC?.(p);
                      } else if (item.type === 'magisterium') {
                        onNavigateToDoc?.(item.id);
                      }
                    }}
                  >
                    <Card className="p-4 bg-card border border-border/40 group-hover:border-primary/30 transition-all rounded-premium shadow-sm">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-premium bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                          {item.type === 'bible' && <Icons.Cross className="w-4 h-4" />}
                          {item.type === 'catechism' && <Icons.Shield className="w-4 h-4" />}
                          {item.type === 'magisterium' && <Icons.ScrollText className="w-4 h-4" />}
                          {item.type === 'journey' && <Icons.Compass className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 group-hover:text-primary transition-colors">
                            {item.type === 'bible' ? 'Escritura' : 
                             item.type === 'catechism' ? 'Catecismo' : 
                             item.type === 'magisterium' ? 'Magistério' : 'Jornada'}
                          </p>
                          <h4 className="text-sm font-bold font-serif truncate mt-0.5">{item.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1 font-serif italic">
                            {item.content_text.replace(/[#*]/g, '')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
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
