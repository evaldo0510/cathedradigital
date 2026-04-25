import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSpiritualInsight } from '@/services/aiService';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRoute } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, Sparkles, Search, X, Heart, Church, Flame, Cross, BookOpen, Shield, Crown, Hand, Star, Globe, Eye, Users, Compass, Wine, Orbit, Hash, Mountain, RefreshCw, Frown, Bird, Droplets, Wheat, Target, Clock, Megaphone, Skull, Filter } from 'lucide-react';
import { Icons } from '@/constants';
import { BubbleTag, getTagIcon } from './BubbleTag';
import { useRovingTabindex } from './TabUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { type ProfileId, PROFILES } from './SpiritualQuiz';

interface Tag {
  id: string;
  slug: string;
  label: string;
  emoji: string;
  category: string;
}

interface TagContent {
  id: string;
  type: string;
  content_text: string;
  title: string;
  metadata: any;
}

interface NexusBubblesProps {
  profileId?: ProfileId | null;
}

const TagBubble: React.FC<{ tag: Tag; index: number; isSuggested?: boolean }> = ({ tag, index, isSuggested }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<TagContent[]>([]);
  const [logosInsight, setLogosInsight] = useState<string | null>(null);

  const fetchContent = async () => {
    if (content.length > 0 || loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_tags')
        .select(`
          spiritual_contents (
            id,
            content_text,
            type,
            title,
            metadata
          )
        `)
        .eq('tag_id', tag.id)
        .limit(3);

      if (!error && data) {
        const formatted = (data as any[]).map(d => d.spiritual_contents).filter(Boolean);
        setContent(formatted);
      }

      const result = await getSpiritualInsight(tag.label);
      if (!result.error && result.content) {
        setLogosInsight(result.content);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const prefetchTag = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['tag-contents', tag.id],
      queryFn: async () => {
        const { data: tagContents, error } = await supabase
          .from('content_tags')
          .select(`
            spiritual_contents (
              id, title, content_text, type, reference_id, tags
            )
          `)
          .eq('tag_id', tag.id);
        
        if (error) throw error;
        return (tagContents || []).map((c: any) => ({
          id: c.spiritual_contents.id,
          content_type: c.spiritual_contents.type,
          reference: c.spiritual_contents.reference_id || c.spiritual_contents.title || 'Referência',
          title: c.spiritual_contents.title,
          text_content: c.spiritual_contents.content_text,
          tags: c.spiritual_contents.tags || []
        }));
      },
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient, tag.id]);

  return (
    <Popover open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val) fetchContent();
    }}>
      <PopoverTrigger asChild>
        <div>
          <BubbleTag
            label={tag.label}
            emoji={tag.emoji}
            index={index}
            isSelected={open}
            isSuggested={isSuggested}
            onClick={() => {}} // Popover handles trigger
            onMouseEnter={prefetchTag}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 rounded-[2rem] border-primary/20 overflow-hidden shadow-2xl z-[100] backdrop-blur-xl">
        <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center shadow-inner text-primary">
              {getTagIcon(tag.emoji)}
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-primary">{tag.label}</span>
          </div>
          <button 
            onClick={() => navigate(`${AppRoute.TEMAS}/${tag.slug}`)}
            className="p-1.5 rounded-full bg-primary/5 hover:bg-primary/20 text-primary transition-colors group"
            title="Estudo Completo"
          >
            <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        <div className="p-5 space-y-5 max-h-[350px] overflow-y-auto scrollbar-none">
          {loading ? (
            <div className="space-y-4 py-2">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse w-full" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </div>
              <div className="h-32 bg-muted/20 rounded-2xl animate-pulse w-full" />
            </div>
          ) : (
            <>
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
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                    <div className="h-[1px] flex-1 bg-border/40" />
                    Versículos & Fontes
                    <div className="h-[1px] flex-1 bg-border/40" />
                  </span>
                  {content.map((c, i) => {
                    const isBible = c.type === 'bible';
                    const reference = c.title || 'Referência';
                    const bibleLink = isBible && c.metadata?.book && c.metadata?.chapter 
                      ? `/bible?book=${c.metadata.book}&ch=${c.metadata.chapter}` 
                      : null;

                    return (
                      <motion.div 
                        key={c.id || i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="space-y-1.5 group/content"
                      >
                        <p className="text-[11px] leading-relaxed text-foreground/80 line-clamp-3 group-hover/content:text-foreground transition-colors">
                          {c.content_text}
                        </p>
                        {bibleLink ? (
                          <button 
                            onClick={() => navigate(bibleLink)}
                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1.5 bg-primary/5 px-2 py-0.5 rounded-full w-fit"
                          >
                            {reference}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-primary/60">{reference}</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : !logosInsight && (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                  <p className="text-[11px] text-muted-foreground italic">Conteúdo em aprofundamento...</p>
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('label');
      
      if (!error && data) {
        setTags(data as Tag[]);
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
      result = result.filter(t => 
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeFilter !== 'all') {
      result = result.filter(t => t.category === activeFilter);
    }
    return result;
  }, [tags, searchQuery, activeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">
            Nexus Theologicus
          </span>
          <span className="text-[9px] text-muted-foreground/60 font-medium italic mt-0.5">Clique nas bolhas para insights do Logos</span>
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
              <div className="flex flex-wrap gap-1.5" role="list">
                {filteredTags && filteredTags.length ? filteredTags.map((tag, i) => (
                  <div key={tag.slug} role="listitem">
                    <TagBubble tag={tag} index={i} />
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
                  <div className="flex flex-wrap gap-1.5" role="list">
                    {profileSuggestedTags.map((tag, i) => (
                      <div key={tag.slug} role="listitem">
                        <TagBubble tag={tag} index={i} isSuggested />
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
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${expandedCategory === key ? 'bg-primary/10' : 'bg-muted/50'}`}>
                          {category.icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80 group-hover:text-primary transition-colors">
                          {category.label}
                        </span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                        <span className="text-[10px] text-muted-foreground/50 group-hover:text-primary">
                          {expandedCategory === key ? 'Ocultar' : `Ver ${categoryTags.length}`}
                        </span>
                      </button>

                      <div className="flex flex-wrap gap-1.5" role="list">
                        {(expandedCategory === key ? categoryTags : categoryTags.slice(0, 6)).map((tag, i) => (
                          <div key={tag.slug} role="listitem">
                            <TagBubble tag={tag} index={i} />
                          </div>
                        ))}
                        {expandedCategory !== key && categoryTags.length > 6 && (
                          <button
                            onClick={() => setExpandedCategory(key)}
                            className="px-3 py-1.5 rounded-full border border-dashed border-border text-[11px] font-bold text-muted-foreground hover:text-primary hover:border-primary/40 transition-all flex items-center gap-1"
                          >
                            <span>+{categoryTags.length - 6}</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-center pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 hover:text-primary hover:bg-primary/5 px-6"
          onClick={() => navigate(AppRoute.TEMAS)}
        >
          Explorar todos os temas →
        </Button>
      </div>
    </div>
  );
};

export default NexusBubbles;
