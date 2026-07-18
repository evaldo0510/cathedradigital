import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSpiritualInsight } from '@/services/aiService';
import { useNavigate } from 'react-router-dom';
import { normalizeText, cn } from '@/lib/utils';
import { getSearchTermsForTag } from '@/lib/tagNormalization';
import { type TagContent, fetchNexusTagContent } from '@/lib/nexusContent';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRoute } from '@/types';
import { supabase } from '@/integrations/supabase/client';

import { Icons } from '@/constants';
import { BubbleTag, getTagIcon } from './BubbleTag';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { type ProfileId, PROFILES } from './SpiritualQuiz';
import { useRovingTabindex } from './TabUtils';
import { useSpiritualProfile } from '@/hooks/useSpiritualProfile';
import { useIsMobile } from '@/hooks/use-mobile';
import BibleVersePopover from './BibleVersePopover';
import { NexusDebugPanel, type NexusDebugInfo } from './NexusDebugPanel';
import { NEXUS_KIND_PRESETS, NEXUS_HEADER, NEXUS_EMPTY, NEXUS_ERROR, type NexusKind } from './nexus/nexusPresets';




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
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  profileId?: ProfileId | null;
  navigateOnClick?: boolean;
  priorityGroup?: string;
  size?: 'xs' | 'sm' | 'md';
}


export const TagBubble: React.FC<TagBubbleProps> = ({ tag, index, isSuggested, tabIndex, onKeyDown, onClick, className, profileId, navigateOnClick, priorityGroup, size }) => {

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [content, setContent] = useState<TagContent[]>([]);
  const [logosInsight, setLogosInsight] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ startTime: number; endTime?: number; source?: 'supabase' | 'ia' | 'both' }>({ startTime: 0 });
  const [debug, setDebug] = useState<NexusDebugInfo>({});

  // Navigation stack for context-to-context breadcrumbs
  const [navHistory, setNavHistory] = useState<Tag[]>([tag]);

  const currentTag = navHistory[navHistory.length - 1];

  const fetchContentForTag = async (targetTag: Tag) => {
    const startTime = performance.now();
    const correlationId = `nexus-${targetTag.slug || targetTag.id}-${Date.now()}`;
    setMetrics({ startTime });
    setStatus('loading');
    setErrorDetails(null);
    setContent([]);
    setLogosInsight(null);
    setDebug({ correlationId, startedAt: startTime, request: { tag: targetTag, profileId } });

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

      const endedAt = performance.now();
      setMetrics(prev => ({ ...prev, endTime: endedAt, source: 'both' }));
      setDebug(prev => ({
        ...prev,
        endedAt,
        source: 'fetchNexusTagContent',
        response: { count: uniqueResults.length, sample: uniqueResults.slice(0, 3) },
      }));
      setStatus('success');
    } catch (e: any) {
      const endedAt = performance.now();
      console.error(`[Nexus Diagnostic] Error fetching ${targetTag.label}:`, e);
      setErrorDetails(e.message || 'Erro desconhecido');
      setMetrics(prev => ({ ...prev, endTime: endedAt }));
      setDebug(prev => ({ ...prev, endedAt, error: String(e?.message || e), response: null }));
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
          onClick={(e) => {
            if (onClick) {
              onClick(e);
            } else if (navigateOnClick) {
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
      <PopoverContent data-testid="nexus-popover" className="w-[340px] sm:w-[460px] p-spacing-0 rounded-[3rem] border-primary/10 overflow-hidden shadow-premium-hover z-[100] bg-card/95 backdrop-blur-xl">
        <div className="bg-gradient-to-b from-primary/[0.03] to-transparent p-spacing-xl border-b border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-spacing-md">
            <div className="w-spacing-2xl h-spacing-2xl rounded-premium bg-white/40 dark:bg-black/20 flex items-center justify-center shadow-premium-md text-primary border border-primary/5">
              {getTagIcon(tag.emoji, "w-spacing-lg h-spacing-lg")}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/40">{tag.category}</span>
              <h4 className="text-premium-lg font-display font-medium text-primary leading-tight mt-spacing-2xs">{tag.label}</h4>
            </div>
          </div>
          <Button 
            onClick={() => navigate(`${AppRoute.TEMAS}/${tag.slug}`)}
            className="w-spacing-2xl h-spacing-2xl rounded-premium-full bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-premium-hover shadow-primary/10 group border-none"
            title="Estudo Completo"
          >
            <Icons.ExternalLink className="w-spacing-md h-spacing-md group-hover:rotate-12 transition-transform" strokeWidth={1.5} />
          </Button>
        </div>
        
        <div className="p-spacing-xl space-y-spacing-xl max-h-[600px] overflow-y-auto scrollbar-none">
          {/* Path Navigation - Monastic Breadcrumbs with Icons.History */}
          <nav className="flex items-center gap-spacing-xs overflow-x-auto whitespace-nowrap scrollbar-none pb-spacing-md border-b border-border/5">
            <button 
              onClick={() => handlePopTag(0)}
              aria-label="Voltar à raiz do Nexus"
              data-bubble-nav="breadcrumb"
              className="min-h-11 min-w-11 px-spacing-sm text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-primary transition-all flex items-center justify-center gap-spacing-2xs group"
            >
              <Icons.Logo className="w-spacing-sm h-spacing-sm opacity-20 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              Nexus
            </button>
            
            {navHistory.map((hTag, idx) => (
              <React.Fragment key={`${hTag.id}-${idx}`}>
                <Icons.ChevronRight className="w-spacing-xs h-spacing-xs text-muted-foreground/60 flex-shrink-0" aria-hidden="true" />
                <button 
                  onClick={() => handlePopTag(idx)}
                  disabled={idx === navHistory.length - 1}
                  aria-label={`Ir para ${hTag.label}${idx === navHistory.length - 1 ? ' (atual)' : ''}`}
                  aria-current={idx === navHistory.length - 1 ? 'page' : undefined}
                  data-bubble-nav="breadcrumb"
                  className={`min-h-11 min-w-11 text-[9px] font-black uppercase tracking-[0.3em] px-spacing-sm py-spacing-2xs rounded-premium-full border transition-all flex items-center justify-center ${
                    idx === navHistory.length - 1 
                      ? 'text-primary bg-primary/[0.03] border-primary/10 shadow-premium-md' 
                      : 'text-muted-foreground/60 border-transparent hover:text-primary hover:bg-primary/5 hover:border-primary/5'
                  }`}
                >
                  {hTag.label}
                </button>
              </React.Fragment>
            ))}
            
            {navHistory.length > 1 && (
              <button 
                onClick={() => handlePopTag(navHistory.length - 2)}
                aria-label="Voltar um nível"
                data-bubble-nav="breadcrumb"
                className="ml-auto min-h-11 min-w-11 text-[9px] font-black uppercase tracking-[0.2em] text-secondary/80 hover:text-secondary flex items-center justify-center gap-spacing-2xs pl-spacing-md"
              >
                <Icons.ArrowDown className="w-spacing-sm h-spacing-sm rotate-90" aria-hidden="true" /> Voltar
              </button>
            )}
          </nav>

          {/* Elegant Icons.Map Header */}
          <header className="flex flex-col gap-spacing-xs items-center justify-center text-center py-spacing-md">
            <span className="text-[8px] font-black uppercase tracking-[0.8em] text-primary/60">SENTIERO DI SAPIENZA</span>
            <p className="text-premium-sm text-muted-foreground/60 font-serif italic max-w-[280px]">
              {navHistory.length > 1 ? `Explorando conexões de ${currentTag.label}` : 'Mapeando as conexões vivas da Fé e da Tradição'}
            </p>
          </header>



          {status === 'loading' ? (
            <div className="space-y-spacing-md py-spacing-xs">
              <div className="flex gap-spacing-xs">
                <div className="w-spacing-xl h-spacing-xl rounded-premium bg-muted animate-pulse" />
                <div className="flex-1 space-y-spacing-xs">
                  <div className="h-spacing-sm bg-muted rounded animate-pulse w-full" />
                  <div className="h-spacing-sm bg-muted rounded animate-pulse w-spacing-xs/3" />
                </div>
              </div>
              <div className="h-spacing-4xl bg-muted/20 rounded-premium animate-pulse w-full" />
              <p className="text-premium-xs text-center text-muted-foreground animate-pulse">Consultando Nexus...</p>
            </div>
          ) : status === 'error' && content.length === 0 ? (
            <div className="p-spacing-lg text-center space-y-spacing-sm bg-red-500/5 rounded-premium border border-red-500/10">
              <Icons.AlertCircle className="w-spacing-xl h-spacing-xl text-red-500 mx-auto" />
            <p className="text-premium-sm font-bold text-red-600">Erro ao carregar conteúdo</p>
            <p className="text-premium-xs text-muted-foreground italic">{errorDetails}</p>
            <Button size="sm" variant="outline" onClick={() => fetchContentForTag(currentTag)} data-testid="retry-button" className="h-spacing-xl rounded-premium-full text-premium-xs uppercase font-black tracking-widest">Tentar Novamente</Button>
            <NexusDebugPanel info={debug} />
          </div>
        ) : (

            <>
              {status === 'error' && content.length > 0 && (
                <div className="px-spacing-sm py-spacing-2xs bg-amber-500/10 text-amber-600 rounded-premium text-premium-xs font-bold flex items-center gap-spacing-xs mb-spacing-xs">
                  <Icons.Info className="w-spacing-sm h-spacing-sm" /> IA Indisponível — Exibindo conteúdo parcial do Nexus
                </div>
              )}
              {logosInsight && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.2 }}
                  className="bg-primary/[0.01] rounded-[2.5rem] p-spacing-xl border border-primary/[0.03] relative overflow-hidden group"
                >
                  <div className="absolute top-spacing-0 right-0 w-spacing-4xl h-spacing-4xl bg-primary/[0.01] rounded-premium-full -mr-spacing-3xl -mt-spacing-3xl blur-3xl" />
                  <div className="flex items-center gap-spacing-sm mb-spacing-md">
                    <div className="w-spacing-md h-spacing-md rounded-premium-full bg-primary/5 flex items-center justify-center">
                      <Icons.Sparkles className="w-spacing-xs h-spacing-xs text-primary/40" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Contemplação Logos</span>
                  </div>
                  <p className="text-premium-base text-foreground/70 leading-relaxed italic font-serif text-center px-spacing-md">
                    "{logosInsight}"
                  </p>
                </motion.div>
              )}
              
              {content.length > 0 && (
                <div className="space-y-spacing-lg">
                  {[
                    { id: 'bible', label: 'Bíblia', icon: <Icons.BookOpen className="w-spacing-sm h-spacing-sm" /> },
                    { id: 'catechism', label: 'Catecismo', icon: <Icons.Church className="w-spacing-sm h-spacing-sm" /> },
                    { id: 'magisterium', label: 'Magistério', icon: <Icons.Shield className="w-spacing-sm h-spacing-sm" /> },
                    { id: 'saint', label: 'Santos', icon: <Icons.Sparkles className="w-spacing-sm h-spacing-sm" /> },
                    { id: 'journey', label: 'Jornadas', icon: <Icons.Flame className="w-spacing-sm h-spacing-sm" /> },
                  ].map((category) => {
                    const categoryContent = content.filter(c => c.type === category.id);
                    if (categoryContent.length === 0) return null;

                    return (
                      <div key={category.id} className="space-y-spacing-sm">
                        <span className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-spacing-xs">
                          <div className="h-[1px] w-spacing-md bg-border/40" />
                          <div className="flex items-center gap-spacing-2xs text-primary/60">
                            {category.icon}
                            {category.label}
                          </div>
                          <div className="h-[1px] flex-1 bg-border/40" />
                        </span>
                        
                        <div className="space-y-spacing-md">
                          {categoryContent.map((c, i) => {
                            const isBible = c.type === 'bible';
                            const isJourney = c.type === 'journey';
                            const reference = c.title;
                            
                            const link = isBible && c.metadata?.book && c.metadata?.chapter 
                              ? `/bible?book=${c.metadata.book}&ch=${c.metadata.chapter}` 
                              : isJourney ? `/jornadas/${c.id}` : null;

                            const bibleAbbr: string | undefined = isBible ? c.metadata?.book : undefined;
                            const bibleChapter: number | undefined = isBible ? Number(c.metadata?.chapter) : undefined;
                            const bibleVerse: number | undefined = isBible && c.metadata?.verse ? Number(c.metadata.verse) : undefined;
                            const canPopover = isBible && !!bibleAbbr && Number.isFinite(bibleChapter);

                            return (
                              <motion.div
                                key={c.id || i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="min-h-11 space-y-spacing-2xs group/content p-spacing-sm rounded-premium hover:bg-primary/[0.03] transition-colors cursor-pointer border border-transparent hover:border-primary/5"
                                onClick={() => !canPopover && link && navigate(link)}
                              >
                                <p className="text-premium-small leading-relaxed text-foreground/80 line-clamp-spacing-sm group-hover/content:text-foreground transition-colors">
                                  {c.content_text}
                                </p>
                                <div className="flex flex-col gap-spacing-xs">
                                  <div className="flex items-center justify-between" onClick={(e) => canPopover && e.stopPropagation()}>
                                    {canPopover ? (
                                      <BibleVersePopover
                                        abbr={bibleAbbr!}
                                        chapter={bibleChapter!}
                                        verse={bibleVerse}
                                        label={reference}
                                      />
                                    ) : (
                                      <span className="text-premium-xs font-bold text-primary flex items-center gap-spacing-2xs px-spacing-xs py-spacing-3xs rounded-premium-full bg-primary/5">
                                        {reference}
                                        {link && <Icons.ExternalLink className="w-spacing-xs h-spacing-xs" />}
                                      </span>
                                    )}
                                  </div>

                                  
                                  {c.metadata?.tags && c.metadata.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-spacing-2xs mt-spacing-2xs">
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
              <div className="pt-spacing-xl space-y-spacing-lg border-t border-border/5">
                <div className="flex flex-col items-center gap-spacing-xs">
                  <span className="text-[8px] font-black uppercase tracking-[0.6em] text-primary/60">RADIUS COGNITIONIS</span>
                  <p className="text-[10px] text-muted-foreground/40 font-serif italic text-center">Temas convergentes neste raio de conhecimento</p>
                </div>
                <div className="flex flex-wrap justify-center gap-spacing-sm">
                  {allThemes?.filter(t => t.category === currentTag.category && t.id !== currentTag.id).slice(0, 5).map((t, i) => (
                    <TagBubble 
                      key={t.id} 
                      tag={t} 
                      index={i} 
                      size="xs" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePushTag(t);
                      }}
                      className="opacity-60 hover:opacity-100 transition-opacity" 
                    />
                  ))}
                </div>

              </div>

              {!logosInsight && status === 'success' && content.length === 0 && (
                <div className="flex flex-col items-center justify-center py-spacing-xl text-center space-y-spacing-md">
                  <div className="w-spacing-3xl h-spacing-3xl rounded-premium bg-muted/20 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-premium border border-primary/10 animate-ping opacity-20" />
                    <Icons.Search className="w-spacing-xl h-spacing-xl text-muted-foreground/60" />
                  </div>
                  <div className="space-y-spacing-2xs">
                    <p className="text-premium-sm font-black uppercase tracking-widest text-foreground">Nexus Silencioso</p>
                    <p className="text-premium-xs text-muted-foreground/60 italic max-w-[200px] mx-auto">
                      Ainda estamos tecendo as conexões para "{tag.label}". Tente outro tema ou explore o A-Z.
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => navigate(`${AppRoute.TEMAS}/${tag.slug}`)} 
                    className="h-spacing-xl rounded-premium-full text-premium-xs uppercase font-black tracking-widest border-primary/20 hover:bg-primary/5 transition-all"
                  >
                    Navegação A-Z
                  </Button>
                  <NexusDebugPanel info={debug} />
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-spacing-sm bg-muted/20 border-t border-border/40 flex justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full rounded-premium-full text-premium-xs font-black uppercase tracking-widest h-spacing-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
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
        // Icons.Map themes to the Icons.Tag interface expected by the component
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
    <div className="space-y-spacing-2xl">
      <div className="relative group max-w-spacing-md mx-auto">
        <div className="absolute inset-0 bg-primary/5 rounded-premium-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <Icons.Search className="absolute left-spacing-md top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input 
          type="text" 
          placeholder="Buscar temas e conexões..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-spacing-2xl pl-spacing-2xl pr-spacing-md rounded-premium-full bg-card border border-border/40 focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-premium-sm outline-none"
        />
      </div>

      <div className="space-y-spacing-3xl">
        {searchQuery.trim() ? (
          <div className="space-y-spacing-lg">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 text-center">Resultados da Busca</h3>
            <div 
              ref={filteredRef}
              className="flex flex-wrap justify-center gap-spacing-sm"
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
                <section key={cat} className="space-y-spacing-lg">
                  <div className="flex items-center gap-spacing-lg">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 whitespace-nowrap">{cat}</h3>
                    <div className="h-px flex-1 bg-border/20" />
                  </div>
                  <div className="flex flex-wrap gap-spacing-sm">
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
        <div className="text-center py-spacing-3xl space-y-spacing-md">
          <Icons.Search className="w-spacing-2xl h-spacing-2xl text-muted-foreground/60 mx-auto" />
          <p className="text-muted-foreground font-serif italic">Nenhum tema encontrado para "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};

export default NexusBubbles;