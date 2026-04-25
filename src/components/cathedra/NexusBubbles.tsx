import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSpiritualInsight } from '@/services/aiService';
import { useNavigate } from 'react-router-dom';
import { normalizeText } from '@/lib/utils';
import { getSearchTermsForTag } from '@/lib/tagNormalization';
import { type TagContent, fetchNexusTagContent } from '@/lib/nexusContent';
import { useQueryClient } from '@tanstack/react-query';
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

interface Tag {
  id: string;
  slug: string;
  label: string;
  emoji: string;
  category: string;
}

// Reusing TagContent from @/lib/nexusContent

interface NexusBubblesProps {
  profileId?: ProfileId | null;
}

const TagBubble: React.FC<{ tag: Tag; index: number; isSuggested?: boolean; tabIndex?: number; onKeyDown?: (e: React.KeyboardEvent) => void }> = ({ tag, index, isSuggested, tabIndex, onKeyDown }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [content, setContent] = useState<TagContent[]>([]);
  const [logosInsight, setLogosInsight] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ startTime: number; endTime?: number; source?: 'supabase' | 'ia' | 'both' }>({ startTime: 0 });

  const fetchContent = async () => {
    if (content.length > 0 || status === 'loading') return;
    const startTime = performance.now();
    setMetrics({ startTime });
    setStatus('loading');
    setErrorDetails(null);
    
    const normalizedTag = normalizeText(tag.label);
    console.log(`[Nexus Diagnostic] Fetching content for tag: ${tag.label} (Normalized: ${normalizedTag})`);
    
    try {
      const uniqueResults = await fetchNexusTagContent(tag);
      setContent(uniqueResults);

      // IA Fetch
      try {
        const result = await getSpiritualInsight(tag.label);
        if (!result.error && result.content) {
          setLogosInsight(result.content);
        }
      } catch (iaErr) {
        console.error(`[Nexus Diagnostic] AI Fetch failed.`, iaErr);
      }

      setMetrics(prev => ({ ...prev, endTime: performance.now(), source: 'both' }));
      setStatus('success');
    } catch (e: any) {
      console.error(`[Nexus Diagnostic] Error fetching ${tag.label}:`, e);
      setErrorDetails(e.message || 'Erro desconhecido');
      setMetrics(prev => ({ ...prev, endTime: performance.now() }));
      setStatus('error');
    }
  };

  const prefetchTag = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['tag-contents', tag.id, tag.label],
      queryFn: () => fetchNexusTagContent(tag),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient, tag.id, tag.label]);

  return (
    <Popover open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val) fetchContent();
    }}>
      <PopoverTrigger asChild>
        <BubbleTag
          label={tag.label}
          emoji={tag.emoji}
          index={index}
          isSelected={open}
          isSuggested={isSuggested}
          onClick={() => {}} // Popover handles trigger
          onKeyDown={onKeyDown}
          onMouseEnter={prefetchTag}
          tabIndex={tabIndex}
          data-roving-item={true}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[340px] sm:w-[420px] p-0 rounded-[2.5rem] border-primary/20 overflow-hidden shadow-2xl z-[100] backdrop-blur-2xl bg-card/90">
        <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-black/20 flex items-center justify-center shadow-inner text-primary border border-primary/10">
              {getTagIcon(tag.emoji, "w-6 h-6")}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">{tag.category}</span>
              <h4 className="text-sm font-black uppercase tracking-widest text-primary leading-tight">{tag.label}</h4>
            </div>
          </div>
          <button 
            onClick={() => navigate(`${AppRoute.TEMAS}/${tag.slug}`)}
            className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-primary/20 group"
            title="Estudo Completo"
          >
            <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          </button>
        </div>
        
        <div className="p-5 space-y-5 max-h-[450px] overflow-y-auto scrollbar-none">
          {/* Diagnostic Panel (Mini) */}
          <div className="p-2 rounded-lg bg-muted/30 border border-border/40 flex items-center justify-between text-[8px] font-black uppercase tracking-widest opacity-60">
            <div className="flex gap-2">
              <span>Time: {metrics.endTime ? `${Math.round(metrics.endTime - metrics.startTime)}ms` : '--'}</span>
              <span>Source: {metrics.source || 'pending'}</span>
            </div>
            <span>Query: "{tag.label}"</span>
          </div>

          {status === 'loading' ? (
            <div className="space-y-4 py-2">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse w-full" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </div>
              <div className="h-32 bg-muted/20 rounded-2xl animate-pulse w-full" />
              <p className="text-[10px] text-center text-muted-foreground animate-pulse">Consultando Nexus...</p>
            </div>
          ) : status === 'error' && content.length === 0 ? (
            <div className="p-6 text-center space-y-3 bg-red-500/5 rounded-2xl border border-red-500/10">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-sm font-bold text-red-600">Erro ao carregar conteúdo</p>
              <p className="text-[10px] text-muted-foreground italic">{errorDetails}</p>
              <Button size="sm" variant="outline" onClick={fetchContent} className="h-8 rounded-xl text-[10px] uppercase font-black tracking-widest">Tentar Novamente</Button>
            </div>
          ) : (
            <>
              {status === 'error' && content.length > 0 && (
                <div className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-lg text-[9px] font-bold flex items-center gap-2 mb-2">
                  <Info className="w-3 h-3" /> IA Indisponível — Exibindo conteúdo parcial do Nexus
                </div>
              )}
              {logosInsight && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-secondary/5 rounded-2xl p-4 border border-secondary/10 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rounded-full blur-2xl -mr-6 -mt-6" />
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-secondary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Logos Insight</span>
                  </div>
                  <p className="text-[12px] text-foreground/90 leading-relaxed italic font-serif">
                    "{logosInsight}"
                  </p>
                </motion.div>
              )}
              
              {content.length > 0 ? (
                <div className="space-y-6">
                  {[
                    { id: 'bible', label: 'Bíblia', icon: <BookOpen className="w-3.5 h-3.5" /> },
                    { id: 'catechism', label: 'Catecismo', icon: <Church className="w-3.5 h-3.5" /> },
                    { id: 'magisterium', label: 'Magistério', icon: <Shield className="w-3.5 h-3.5" /> },
                    { id: 'journey', label: 'Jornadas', icon: <Flame className="w-3.5 h-3.5" /> },
                  ].map((category) => {
                    const categoryContent = content.filter(c => c.type === category.id);
                    if (categoryContent.length === 0) return null;

                    return (
                      <div key={category.id} className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
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
                                className="space-y-1.5 group/content p-2 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer"
                                onClick={() => link && navigate(link)}
                              >
                                <p className="text-[11px] leading-relaxed text-foreground/80 line-clamp-3 group-hover/content:text-foreground transition-colors">
                                  {c.content_text}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-primary flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5">
                                    {reference}
                                    {link && <ExternalLink className="w-2.5 h-2.5" />}
                                  </span>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !logosInsight && status === 'success' && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border border-primary/10 animate-ping opacity-20" />
                    <Search className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-widest text-foreground">Nexus Silencioso</p>
                    <p className="text-[10px] text-muted-foreground/60 italic max-w-[200px] mx-auto">
                      Ainda estamos tecendo as conexões para "{tag.label}". Tente outro tema ou explore o A-Z.
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => navigate(`${AppRoute.TEMAS}/${tag.slug}`)} 
                    className="h-8 rounded-xl text-[9px] uppercase font-black tracking-widest border-primary/20 hover:bg-primary/5 transition-all"
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
            className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest h-9 hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
            onClick={() => navigate(`${AppRoute.TEMAS}/${tag.slug}`)}
          >
            Navegação Completa
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};


const NexusBubbles: React.FC<NexusBubblesProps> = ({ profileId }) => {
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
        }));
        setTags(mappedTags);
      }
      setLoading(false);
    };
    fetchTags();
  }, []);

  const [activeFilter, setActiveFilter] = useState<string>(() => {
    return localStorage.getItem('nexus_bubbles_filter') || 'all';
  });

  useEffect(() => {
    localStorage.setItem('nexus_bubbles_filter', activeFilter);
  }, [activeFilter]);

  const categories = {
    fundamentos: { label: 'Fundamentos', icon: <Icons.Church className="w-3.5 h-3.5" /> },
    dores: { label: 'Dores', icon: <Icons.Heart className="w-3.5 h-3.5 text-destructive" /> },
    divino: { label: 'Mistério', icon: <Icons.Sparkles className="w-3.5 h-3.5 text-secondary" /> },
    vida: { label: 'Vida', icon: <Icons.Flame className="w-3.5 h-3.5 text-orange-500" /> },
  };

  const profileSuggestedTags = useMemo(() => {
    if (!profileId || !tags.length) return [];
    const profile = PROFILES[profileId];
    if (!profile) return [];

    const relevantLabels = [profile.theme, profile.pain.label, 'Oração', 'Jesus', 'Fé'];
    return tags.filter(t => relevantLabels.some(l => t.label.toLowerCase().includes(l.toLowerCase()))).slice(0, 8);
  }, [profileId, tags]);

  const filteredTags = useMemo(() => {
    let result = tags;
    if (searchQuery) {
      const q = normalizeText(searchQuery);
      return result.filter(t => 
        normalizeText(t.label).includes(q) || 
        normalizeText(t.category).includes(q)
      );
    }
    
    if (activeFilter !== 'all') {
      result = result.filter(t => t.category === activeFilter);
    }
    return result;
  }, [tags, searchQuery, activeFilter]);

  const { activeIndex: filteredActiveIndex, handleKeyDown: handleFilteredKeyDown } = useRovingTabindex(filteredTags?.length || 0, filteredRef);
  const { activeIndex: suggestedActiveIndex, handleKeyDown: handleSuggestedKeyDown } = useRovingTabindex(profileSuggestedTags?.length || 0, suggestedRef);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex flex-col text-center sm:text-left">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">
            Nexus Theologicus
          </span>
          <span className="text-[10px] text-muted-foreground/60 font-medium italic mt-0.5">Clique nas bolhas para conexões teológicas</span>
        </div>
        
        <div className="relative group/search max-w-[140px] md:max-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60 transition-colors group-focus-within/search:text-primary" />
          <input 
            type="text"
            placeholder="Buscar tema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-8 bg-card/50 border border-border/50 rounded-full text-[10px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            aria-label="Buscar tema no Nexus"

          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full"
            >
              <X className="w-2.5 h-2.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveFilter('all')}
          aria-pressed={activeFilter === 'all'}
          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none ${activeFilter === 'all' ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
        >
          Todos
        </button>

        {Object.entries(categories).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            aria-pressed={activeFilter === key}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-primary outline-none ${activeFilter === key ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
          >

            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {searchQuery || activeFilter !== 'all' ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {searchQuery ? 'Resultado da Busca' : categories[activeFilter as keyof typeof categories]?.label}
              </p>
              <div className="flex flex-wrap gap-1.5" role="list" ref={filteredRef}>
                {filteredTags && filteredTags.length ? filteredTags.map((tag, i) => (
                  <div key={tag.slug} role="listitem">
                    <TagBubble 
                      tag={tag} 
                      index={i} 
                      tabIndex={filteredActiveIndex === i ? 0 : -1}
                      onKeyDown={(e) => handleFilteredKeyDown(e, i)}
                    />
                  </div>
                )) : (
                  <p className="text-[10px] text-muted-foreground italic">Nenhum tema encontrado.</p>
                )}
              </div>
            </motion.div>
          ) : (
            <>
              {/* Profile Suggestions */}
              {profileId && profileSuggestedTags.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-2.5 p-4 rounded-[2rem] bg-gradient-to-br from-secondary/10 via-card to-primary/5 border border-secondary/20 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl -mr-8 -mt-8" />
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Heart className="w-3 h-3 text-secondary" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary">
                      Sugeridos para sua Jornada
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5" role="list" ref={suggestedRef}>
                    {profileSuggestedTags.map((tag, i) => (
                      <div key={tag.slug} role="listitem">
                        <TagBubble 
                          tag={tag} 
                          index={i} 
                          isSuggested 
                          tabIndex={suggestedActiveIndex === i ? 0 : -1}
                          onKeyDown={(e) => handleSuggestedKeyDown(e, i)}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Categorized Tags */}
              <div className="grid grid-cols-1 gap-5">
                {Object.entries(categories).map(([key, category]) => {
                  const categoryTags = tags.filter(t => t.category === key);
                  if (categoryTags.length === 0) return null;

                  return (
                    <motion.div key={key} layout className="space-y-2.5">
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
                        className="flex items-center gap-1.5 group w-full"
                      >
                        {category.icon}
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
                          {category.label}
                        </span>
                        <div className="h-px flex-1 bg-border/40" />
                        <span className="text-[8px] font-black text-muted-foreground/40">{categoryTags.length} temas</span>
                      </button>
                      <div className="flex flex-wrap gap-1.5" role="list">
                        {categoryTags.slice(0, expandedCategory === key ? 100 : 8).map((tag, i) => (
                          <div key={tag.slug} role="listitem">
                            <TagBubble tag={tag} index={i} />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NexusBubbles;
