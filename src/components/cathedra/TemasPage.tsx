import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { normalizeText } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNexusTagContent } from '@/lib/nexusContent';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { AppRoute } from '@/types';

import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { FuzzySearchInput } from './FuzzySearchInput';
import { BubbleTag } from './BubbleTag';
import { TagBubble } from './NexusBubbles';
import { getTabProps, getTabPanelProps, useTabNavigation, useRovingTabindex } from './TabUtils';
import { useSpiritualProfile } from '@/hooks/useSpiritualProfile';
import { PROFILES, type ProfileId } from './SpiritualQuiz';
import ContemplativeLayout from './ContemplativeLayout';


interface Tag {
  id: string;
  label: string;
  slug: string;
  emoji: string;
  category: string;
  similarityScore?: number;
  [key: string]: unknown;
}

const TemasPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const tagsContainerRef = React.useRef<HTMLDivElement>(null);
  const { handleKeyDown: handleTabKeyDown } = useTabNavigation();
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    const fromUrl = searchParams.get('category');
    if (fromUrl) return fromUrl;
    return localStorage.getItem('nexus_bubbles_filter') || 'all';
  });

  useEffect(() => {
    localStorage.setItem('nexus_bubbles_filter', activeCategory);
    if (activeCategory !== 'all') {
      setSearchParams({ category: activeCategory }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [activeCategory, setSearchParams]);

  const { data: tags, isLoading: loadingTags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []).map((t: any) => ({
        id: t.id,
        label: t.name,
        slug: t.slug,
        emoji: t.emoji || '⛪',
        category: t.category || 'Geral'
      })) as Tag[];
    },
  });

  const categories = useMemo(() => {
    if (!tags) return ['all'];
    const distinct = Array.from(new Set(tags.map(t => t.category)));
    return ['all', ...distinct];
  }, [tags]);

  const {
    results: fuzzyTags,
    isPending: isSearchPending,
  } = useFuzzySearch<Tag>({
    rpc: 'search_tags_fuzzy',
    query: searchQuery,
    primaryField: 'label',
    secondaryField: 'category',
    secondaryWeight: 0.5,
  });
  const isSearchActive = searchQuery.trim().length >= 2;

  const filteredTags = useMemo(() => {
    if (!tags) return [];
    const base: Tag[] = isSearchActive ? (fuzzyTags ?? []) : tags;
    if (isSearchActive || activeCategory === 'all') return base;
    return base.filter(tag => tag.category === activeCategory);
  }, [tags, fuzzyTags, isSearchActive, activeCategory]);

  const { activeIndex, handleKeyDown: handleRovingKeyDown } = useRovingTabindex(filteredTags.length, tagsContainerRef);

  // Suggested tags based on the user's spiritual profile (sparkle highlight)
  const { profileId } = useSpiritualProfile();
  const suggestedSlugs = useMemo(() => {
    if (!profileId || !tags) return new Set<string>();
    const profile = PROFILES[profileId];
    if (!profile) return new Set<string>();
    const relevantLabels = [profile.theme, profile.pain.label, 'Oração', 'Jesus', 'Fé'];
    return new Set(
      tags
        .filter(t => relevantLabels.some(l => t.label.toLowerCase().includes(l.toLowerCase())))
        .slice(0, 8)
        .map(t => t.slug)
    );
  }, [profileId, tags]);

  useEffect(() => {
    const temaSlug = searchParams.get('tema');
    if (temaSlug) {
      navigate(`${AppRoute.TEMAS}/${temaSlug}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const handleTagSelect = (tag: Tag) => {
    navigate(`${AppRoute.TEMAS}/${tag.slug}`);
  };

  const prefetchTag = useCallback((tag: Tag) => {
    queryClient.prefetchQuery({
    queryKey: ['tag-contents', tag.id, tag.label],
    queryFn: () => fetchNexusTagContent(tag),
    staleTime: 1000 * 60 * 5,
  });
  }, [queryClient]);

  return (
    <ContemplativeLayout>
      <div className="desktop-main px-spacing-md stack-rhythm">
        <header className="space-y-spacing-md text-center header-margin-rhythm">
          <div className="flex justify-center mb-spacing-md">
            <div className="w-spacing-3xl h-spacing-2xs bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-premium shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
          </div>
          <h1 className="text-premium-4xl sm:text-premium-6xl md:text-premium-8xl font-black tracking-tighter bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent leading-[0.9] flex flex-col sm:block">
            <span>Nexus</span> <span className="text-primary/90">Temas</span>
          </h1>
          <p className="text-muted-foreground text-premium-base sm:text-premium-xl max-w-spacing-2xl mx-auto font-serif italic leading-relaxed">
            "Fides quaerens intellectum" — Explore conexões sagradas entre as Escrituras e a Tradição.
          </p>
        </header>

        <div className="stack-rhythm">
          <div className="flex flex-col sm:flex-row items-center gap-spacing-xs sm:gap-spacing-md bg-card/60 p-spacing-xs sm:p-spacing-sm rounded-premium border border-border/40 shadow-premium-hover sticky top-spacing-xs sm:top-spacing-md z-20 transition-all duration-500 hover:shadow-premium-hover hover:border-primary/20 group/nav">
            <FuzzySearchInput
              className="flex-1 w-full"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar tema (ex: Amor, Graça...)"
              isSearching={isSearchPending}
            />
            
            <div className="flex items-center gap-spacing-2xs overflow-x-auto w-full sm:w-auto px-spacing-xs pb-spacing-xs sm:pb-spacing-0 scrollbar-none scroll-smooth">
              {categories.map((cat, idx) => (
                <motion.button
                  key={cat}
                  {...getTabProps(`tab-category-${idx}`, `panel-temas`, activeCategory === cat, `
                    whitespace-nowrap px-spacing-sm sm:px-spacing-md py-spacing-xs sm:py-spacing-xs rounded-premium-full sm:rounded-premium-full text-premium-xs sm:text-premium-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary outline-none
                    ${activeCategory === cat 
                      ? 'bg-primary text-primary-foreground shadow-premium shadow-primary/20 scale-105' 
                      : 'bg-muted/40 text-muted-foreground/70 hover:bg-muted hover:text-foreground hover:scale-102 border border-transparent hover:border-border/50'
                    }
                  `)}
                  initial={false}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => setActiveCategory(cat)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx, categories.length, (newIdx) => setActiveCategory(categories[newIdx]), 'tab-category-')}
                >
                  {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent  opacity-30 pointer-events-none" />
            
            <div {...getTabPanelProps('panel-temas', `tab-category-${categories.indexOf(activeCategory)}`, true, "relative overflow-hidden rounded-premium border border-border/30 bg-card/20 outline-none")}>
              {loadingTags ? (
                <div className="flex flex-col items-center gap-spacing-md py-spacing-2xl w-full justify-center">
                  <div className="relative">
                    <Icons.Loader2 className="h-spacing-xl w-spacing-xl animate-spin text-primary/60" />
                    <div className="absolute inset-0 bg-primary/20  animate-pulse rounded-premium" />
                  </div>
                  <span className="text-premium-sm font-bold text-muted-foreground/60 tracking-widest uppercase">Consultando Nexus...</span>
                </div>
              ) : filteredTags.length === 0 ? (
                <div className="py-spacing-3xl px-spacing-xl text-center w-full space-y-spacing-md">
                  <div className="w-spacing-3xl h-spacing-3xl bg-muted/30 rounded-premium flex items-center justify-center mx-auto">
                    <Icons.Search className="w-spacing-lg h-spacing-lg text-muted-foreground/60" />
                  </div>
                  <p className="text-premium-sm text-muted-foreground/60 italic font-medium tracking-wide">Nenhum tema encontrado para sua busca teológica.</p>
                </div>
              ) : (
                <>
                  {isSearchActive && activeCategory !== 'all' && (
                    <div className="px-spacing-lg pt-spacing-lg flex items-center justify-between">
                      <div className="flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs rounded-premium bg-primary/5 border border-primary/10">
                        <Icons.Sparkles className="w-spacing-sm h-spacing-sm text-primary/40" />
                        <span className="text-premium-xs font-bold text-primary/60 uppercase tracking-widest">Busca Global Ativa</span>
                      </div>
                      <Button 
                        onClick={() => setActiveCategory('all')}
                        className="text-premium-xs font-black uppercase tracking-widest text-primary hover:underline underline-offset-4 transition-all"
                      >
                        Limpar Filtro
                      </Button>
                    </div>
                  )}
                  <div className="relative p-spacing-lg sm:p-spacing-xl">
                    <div className="flex flex-wrap justify-center gap-spacing-xs sm:gap-spacing-sm max-w-5xl mx-auto" role="list" ref={tagsContainerRef}>
                      {filteredTags.map((tag, idx) => (
                        <div key={tag.id} role="listitem">
                          <TagBubble
                            tag={tag}
                            index={idx}
                            isSuggested={suggestedSlugs.has(tag.slug)}
                            onKeyDown={(e) => handleRovingKeyDown(e, idx, () => {})}
                            tabIndex={activeIndex === idx ? 0 : -1}
                            className="px-spacing-md py-spacing-xs text-premium-xs sm:text-premium-small uppercase tracking-widest"
                            profileId={profileId as ProfileId}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-spacing-sm px-spacing-xl pb-spacing-lg pt-spacing-xs">
                    <div className="flex items-center gap-spacing-xs bg-muted/20 px-spacing-md py-spacing-2xs rounded-premium border border-border/20">
                      <span className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground/60 tabular-nums">
                        {filteredTags.length} conexões sagradas
                      </span>
                      <div className="w-spacing-2xs h-spacing-2xs rounded-premium bg-primary/30" />
                      <Icons.Sparkles className="w-spacing-sm h-spacing-sm text-primary/40 animate-pulse" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="min-h-[400px] mt-spacing-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[300px] flex flex-col items-center justify-center text-center p-spacing-2xl bg-muted/10 rounded-premium border border-dashed border-border/40 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50" />
            <div className="w-spacing-4xl h-spacing-4xl rounded-premium bg-primary/5 flex items-center justify-center mb-spacing-xl border border-primary/10 shadow-premium-md group-hover:scale-110 transition-transform duration-500">
              <Icons.Tag className="h-spacing-2xl w-spacing-2xl text-primary/60" />
            </div>
            <h3 className="text-premium-3xl font-black mb-spacing-md text-foreground tracking-tight">Descubra os tesouros da Fé</h3>
            <p className="text-muted-foreground text-premium-lg max-w-spacing-md font-serif italic">
              Selecione uma das "bolhas" acima para navegar pelos conteúdos da Bíblia, Catecismo e Magistério relacionados ao tema.
            </p>
          </motion.div>
        </div>
      </div>
    </ContemplativeLayout>
  );
};

export default TemasPage;
