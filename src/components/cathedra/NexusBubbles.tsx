import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSpiritualInsight } from '@/services/aiService';
import { useNavigate } from 'react-router-dom';
import { normalizeText } from '@/lib/utils';
import { getSearchTermsForTag } from '@/lib/tagNormalization';
import { type TagContent, fetchNexusTagContent } from '@/lib/nexusContent';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRoute } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, Sparkles, Search, X, Heart, Church, Flame, Cross, BookOpen, Shield, Crown, Hand, Star, Globe, Eye, Users, Compass, Wine, Orbit, Hash, Mountain, RefreshCw, Frown, Bird, Droplets, Wheat, Target, Clock, Megaphone, Skull, Filter, AlertCircle, Info } from 'lucide-react';
import { Icons } from '@/constants';
import { BubbleTag, getTagIcon } from './BubbleTag';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { type ProfileId, PROFILES } from './SpiritualQuiz';
import { useRovingTabindex } from './TabUtils';
import { useSpiritualProfile } from '@/hooks/useSpiritualProfile';


interface Tag {
  id: string;
  slug: string;
  label: string;
  emoji: string;
  category: string;
  priorityGroup?: string;
}

// Reusing TagContent from @/lib/nexusContent

interface NexusBubblesProps {
  profileId?: ProfileId | null;
}

interface TagBubbleProps {
  tag: Tag;
  index: number;
  isSuggested?: boolean;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
  profileId?: ProfileId | null;
  navigateOnClick?: boolean;
  priorityGroup?: string;
  size?: 'xs' | 'sm' | 'md';
}

export const TagBubble: React.FC<TagBubbleProps> = ({ tag, index, isSuggested, tabIndex, onKeyDown, className, profileId, navigateOnClick, priorityGroup, size }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [content, setContent] = useState<TagContent[]>([]);
  const [logosInsight, setLogosInsight] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ startTime: number; endTime?: number; source?: 'supabase' | 'ia' | 'both' }>({ startTime: 0 });
  
  // Navigation stack for context-to-context breadcrumbs
  const [navHistory, setNavHistory] = useState<Tag[]>([tag]);

  const currentTag = navHistory[navHistory.length - 1];

  const fetchContentForTag = async (targetTag: Tag) => {
    const startTime = performance.now();
    setMetrics({ startTime });
    setStatus('loading');
    setErrorDetails(null);
    setContent([]);
    setLogosInsight(null);
    
    try {
      const uniqueResults = await fetchNexusTagContent(targetTag);
      setContent(uniqueResults);

      // IA Fetch
      try {
        const result = await getSpiritualInsight(targetTag.label, undefined, profileId);
        if (!result.error && result.content) {
          setLogosInsight(result.content);
        }
      } catch (iaErr) {
        console.error(`[Nexus Diagnostic] AI Fetch failed.`, iaErr);
      }

      setMetrics(prev => ({ ...prev, endTime: performance.now(), source: 'both' }));
      setStatus('success');
    } catch (e: any) {
      console.error(`[Nexus Diagnostic] Error fetching ${targetTag.label}:`, e);
      setErrorDetails(e.message || 'Erro desconhecido');
      setMetrics(prev => ({ ...prev, endTime: performance.now() }));
      setStatus('error');
    }
  };

  const handlePushTag = (newTag: Tag) => {
    setNavHistory(prev => [...prev, newTag]);
    fetchContentForTag(newTag);
  };

  const handlePopTag = (index: number) => {
    const newHistory = navHistory.slice(0, index + 1);
    setNavHistory(newHistory);
    fetchContentForTag(newHistory[newHistory.length - 1]);
  };


  const { data: allThemes } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('themes').select('*').order('name');
      if (error) throw error;
      return (data || []).map((t: any) => ({
        id: t.id,
        label: t.name,
        slug: t.slug,
        emoji: t.emoji || '⛪',
        category: t.category || 'Geral'
      })) as Tag[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const prefetchTag = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['tag-contents', tag.id, tag.label],
      queryFn: () => fetchNexusTagContent(tag),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient, tag.id, tag.label]);

  return (
    <Popover open={navigateOnClick ? false : open} onOpenChange={(val) => {
      if (navigateOnClick && val) {
        navigate(`${AppRoute.TEMAS}/${tag.slug}`);
        return;
      }
      setOpen(val);
      if (val) fetchContentForTag(tag);
    }}>

      <PopoverTrigger asChild>
        <BubbleTag
          label={tag.label}
          emoji={tag.emoji}
          index={index}
          isSelected={open}
          isSuggested={isSuggested}
          size={size}
          onClick={() => {
            if (navigateOnClick) {
              navigate(`${AppRoute.TEMAS}/${tag.slug}`);
            }
          }} 
          onKeyDown={onKeyDown}
          onMouseEnter={prefetchTag}
          tabIndex={tabIndex}
          data-roving-item={true}
          data-priority={priorityGroup}
          className={className}
        />
      </PopoverTrigger>
      <PopoverContent data-testid="nexus-popover" className="w-[340px] sm:w-[460px] p-0 rounded-[3rem] border-primary/10 overflow-hidden shadow-premium-hover z-[100] bg-card/95 backdrop-blur-xl">
        <div className="bg-gradient-to-b from-primary/[0.03] to-transparent p-8 border-b border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-premium bg-white/40 dark:bg-black/20 flex items-center justify-center shadow-soft text-primary border border-primary/5">
              {getTagIcon(tag.emoji, "w-7 h-7")}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/40">{tag.category}</span>
              <h4 className="text-lg font-display font-medium text-primary leading-tight mt-1">{tag.label}</h4>
            </div>
          </div>
          <Button 
            onClick={() => navigate(`${AppRoute.TEMAS}/${tag.slug}`)}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-premium-hover shadow-primary/10 group border-none"
            title="Estudo Completo"
          >
            <ExternalLink className="w-5 h-5 group-hover:rotate-12 transition-transform" strokeWidth={1.5} />
          </Button>
        </div>
        
        <div className="p-10 space-y-10 max-h-[600px] overflow-y-auto scrollbar-none">
          {/* Path Navigation - Monastic Breadcrumbs with History */}
          <nav className="flex items-center gap-3 overflow-x-auto whitespace-nowrap scrollbar-none pb-4 border-b border-border/5">
            <button 
              onClick={() => {
                setOpen(false);
                setNavHistory([tag]);
              }}
              className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-primary transition-all flex items-center gap-2 group"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary/40 transition-colors" />
              Cathedra
            </button>
            <Icons.ChevronRight className="w-2 h-2 text-muted-foreground/20" />
            <button 
              onClick={() => handlePopTag(0)}
              className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all ${navHistory.length === 1 ? 'text-primary' : 'text-muted-foreground/40 hover:text-primary'}`}
            >
              Nexus
            </button>
            
            {navHistory.map((hTag, idx) => (
              <React.Fragment key={hTag.id}>
                <Icons.ChevronRight className="w-2 h-2 text-muted-foreground/20" />
                <button 
                  onClick={() => handlePopTag(idx)}
                  disabled={idx === navHistory.length - 1}
                  className={`text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border transition-all ${
                    idx === navHistory.length - 1 
                      ? 'text-primary bg-primary/[0.03] border-primary/5' 
                      : 'text-muted-foreground/40 border-transparent hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {hTag.label}
                </button>
              </React.Fragment>
            ))}
          </nav>

          {/* Elegant Map Header */}
          <header className="flex flex-col gap-2 items-center justify-center text-center py-4">
            <span className="text-[8px] font-black uppercase tracking-[0.8em] text-primary/20">SENTIERO DI SAPIENZA</span>
            <p className="text-sm text-muted-foreground/60 font-serif italic max-w-[280px]">
              {navHistory.length > 1 ? `Explorando conexões de ${currentTag.label}` : 'Mapeando as conexões vivas da Fé e da Tradição'}
            </p>
          </header>



          {status === 'loading' ? (
            <div className="space-y-4 py-2">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-premium bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse w-full" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </div>
              <div className="h-32 bg-muted/20 rounded-premium animate-pulse w-full" />
              <p className="text-premium-tiny text-center text-muted-foreground animate-pulse">Consultando Nexus...</p>
            </div>
          ) : status === 'error' && content.length === 0 ? (
            <div className="p-6 text-center space-y-3 bg-red-500/5 rounded-premium border border-red-500/10">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-bold text-red-600">Erro ao carregar conteúdo</p>
            <p className="text-premium-tiny text-muted-foreground italic">{errorDetails}</p>
            <Button size="sm" variant="outline" onClick={() => fetchContentForTag(currentTag)} data-testid="retry-button" className="h-8 rounded-full text-premium-tiny uppercase font-black tracking-widest">Tentar Novamente</Button>
          </div>
        ) : (

            <>
              {status === 'error' && content.length > 0 && (
                <div className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-premium text-premium-tiny font-bold flex items-center gap-2 mb-2">
                  <Info className="w-3 h-3" /> IA Indisponível — Exibindo conteúdo parcial do Nexus
                </div>
              )}
              {logosInsight && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.2 }}
                  className="bg-primary/[0.01] rounded-[2.5rem] p-8 border border-primary/[0.03] relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.01] rounded-full -mr-16 -mt-16 blur-3xl" />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-5 h-5 rounded-full bg-primary/5 flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-primary/40" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Contemplação Logos</span>
                  </div>
                  <p className="text-base text-foreground/70 leading-relaxed italic font-serif text-center px-4">
                    "{logosInsight}"
                  </p>
                </motion.div>
              )}
              
              {content.length > 0 && (
                <div className="space-y-6">
                  {[
                    { id: 'bible', label: 'Bíblia', icon: <BookOpen className="w-3.5 h-3.5" /> },
                    { id: 'catechism', label: 'Catecismo', icon: <Church className="w-3.5 h-3.5" /> },
                    { id: 'magisterium', label: 'Magistério', icon: <Shield className="w-3.5 h-3.5" /> },
                    { id: 'saint', label: 'Santos', icon: <Sparkles className="w-3.5 h-3.5" /> },
                    { id: 'journey', label: 'Jornadas', icon: <Flame className="w-3.5 h-3.5" /> },
                  ].map((category) => {
                    const categoryContent = content.filter(c => c.type === category.id);
                    if (categoryContent.length === 0) return null;

                    return (
                      <div key={category.id} className="space-y-3">
                        <span className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                          <div className="h-[1px] w-4 bg-border/40" />
                          <div className="flex items-center gap-1.5 text-primary/60">
                            {category.icon}
                            {category.label}
                          </div>
                          <div className="h-[1px] flex-1 bg-border/40" />
                        </span>
                        
                        <div className="space-y-4">
                          {categoryContent.map((c, i) => {
                            const isBible = c.type === 'bible';
                            const isJourney = c.type === 'journey';
                            const reference = c.title;
                            
                            const link = isBible && c.metadata?.book && c.metadata?.chapter 
                              ? `/bible?book=${c.metadata.book}&ch=${c.metadata.chapter}` 
                              : isJourney ? `/jornadas/${c.id}` : null;

                            return (
                              <motion.div 
                                key={c.id || i} 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="space-y-1.5 group/content p-3 rounded-3xl hover:bg-primary/[0.03] transition-colors cursor-pointer border border-transparent hover:border-primary/5"
                                onClick={() => link && navigate(link)}
                              >
                                <p className="text-premium-small leading-relaxed text-foreground/80 line-clamp-3 group-hover/content:text-foreground transition-colors">
                                  {c.content_text}
                                </p>
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-premium-tiny font-bold text-primary flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5">
                                      {reference}
                                      {link && <ExternalLink className="w-2.5 h-2.5" />}
                                    </span>
                                  </div>
                                  
                                  {c.metadata?.tags && c.metadata.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {c.metadata.tags
                                        .filter((tLabel: string) => tLabel.toLowerCase() !== tag.label.toLowerCase())
                                        .map((tLabel: string) => {
                                          const matchingTag = allThemes?.find(at => at.label.toLowerCase() === tLabel.toLowerCase());
                                          if (!matchingTag) return null;
                                          return (
                                            <BubbleTag
                                              key={matchingTag.id}
                                              label={matchingTag.label}
                                              emoji={matchingTag.emoji}
                                              index={i}
                                              size="xs"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handlePushTag(matchingTag);
                                              }}
                                            />
                                          );
                                        })
                                      }
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}


              {/* Related Themes (The "Map" feeling) */}
              <div className="pt-10 space-y-6 border-t border-border/5">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[8px] font-black uppercase tracking-[0.6em] text-primary/20">RADIUS COGNITIONIS</span>
                  <p className="text-[10px] text-muted-foreground/40 font-serif italic text-center">Temas convergentes neste raio de conhecimento</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {allThemes?.filter(t => t.category === tag.category && t.id !== tag.id).slice(0, 5).map((t, i) => (
                    <TagBubble key={t.id} tag={t} index={i} size="xs" navigateOnClick className="opacity-60 hover:opacity-100 transition-opacity" />
                  ))}
                </div>
              </div>

              {!logosInsight && status === 'success' && content.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-premium bg-muted/20 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-premium border border-primary/10 animate-ping opacity-20" />
                    <Search className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-widest text-foreground">Nexus Silencioso</p>
                    <p className="text-premium-tiny text-muted-foreground/60 italic max-w-[200px] mx-auto">
                      Ainda estamos tecendo as conexões para "{tag.label}". Tente outro tema ou explore o A-Z.
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => navigate(`${AppRoute.TEMAS}/${tag.slug}`)} 
                    className="h-8 rounded-full text-premium-tiny uppercase font-black tracking-widest border-primary/20 hover:bg-primary/5 transition-all"
                  >
                    Navegação A-Z
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-3 bg-muted/20 border-t border-border/40 flex justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full rounded-full text-premium-tiny font-black uppercase tracking-widest h-9 hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
            onClick={() => navigate(`${AppRoute.TEMAS}/${tag.slug}`)}
          >
            Navegação Completa
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};


const NexusBubbles: React.FC<NexusBubblesProps> = ({ profileId: propProfileId }) => {
  const { profileId: hookProfileId } = useSpiritualProfile();
  const profileId = propProfileId || hookProfileId;
  const navigate = useNavigate();
  const filteredRef = React.useRef<HTMLDivElement>(null);
  const suggestedRef = React.useRef<HTMLDivElement>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('name');
      
      if (!error && data) {
        // Map themes to the Tag interface expected by the component
        const mappedTags = data.map((t: any) => ({
          id: t.id,
          slug: t.slug,
          label: t.name,
          emoji: t.emoji || '⛪',
          category: t.category || 'Geral'
        })) as Tag[];
        setTags(mappedTags);
      }
      setLoading(false);
    };

    fetchTags();
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(tags.map(t => t.category))];
    return cats.sort();
  }, [tags]);

  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags;
    const query = normalizeText(searchQuery);
    return tags.filter(t => normalizeText(t.label).includes(query));
  }, [tags, searchQuery]);

  // Priority grouping for better visualization
  const priorityGroups = useMemo(() => {
    const suggested = tags.filter(t => t.priorityGroup === 'suggested');
    const essential = tags.filter(t => t.priorityGroup === 'essential');
    return { suggested, essential };
  }, [tags]);

  const { handleKeyDown } = useRovingTabindex(filteredTags.length);

  return (
    <div className="space-y-12">
      <div className="relative group max-w-md mx-auto">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input 
          type="text" 
          placeholder="Buscar temas e conexões..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-full bg-card border border-border/40 focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-sm outline-none"
        />
      </div>

      <div className="space-y-16">
        {searchQuery.trim() ? (
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30 text-center">Resultados da Busca</h3>
            <div 
              ref={filteredRef}
              className="flex flex-wrap justify-center gap-3"
            >
              {filteredTags.map((tag, i) => (
                <TagBubble 
                  key={tag.id} 
                  tag={tag} 
                  index={i} 
                  profileId={profileId}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {categories.map((cat, idx) => {
              const catTags = tags.filter(t => t.category === cat);
              return (
                <section key={cat} className="space-y-6">
                  <div className="flex items-center gap-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30 whitespace-nowrap">{cat}</h3>
                    <div className="h-px flex-1 bg-border/20" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {catTags.map((tag, i) => (
                      <TagBubble 
                        key={tag.id} 
                        tag={tag} 
                        index={i} 
                        profileId={profileId}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>

      {!loading && filteredTags.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <Search className="w-12 h-12 text-muted-foreground/20 mx-auto" />
          <p className="text-muted-foreground font-serif italic">Nenhum tema encontrado para "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};

export default NexusBubbles;