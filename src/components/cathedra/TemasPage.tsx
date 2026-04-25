import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { AppRoute } from '@/types';
import { Loader2, Sparkles, Tag as TagIcon, Search } from 'lucide-react';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { FuzzySearchInput } from './FuzzySearchInput';
import { BubbleTag } from './BubbleTag';
import { getTabProps, getTabPanelProps, useTabNavigation, useRovingTabindex } from './TabUtils';


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
        .from('tags')
        .select('*')
        .order('label');
      if (error) throw error;
      return data as Tag[];
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
    if (activeCategory === 'all') return base;
    return base.filter(tag => tag.category === activeCategory);
  }, [tags, fuzzyTags, isSearchActive, activeCategory]);

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
  }, [queryClient]);

  return (
    <div className="space-y-6 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-20 px-2 sm:px-4">
      <header className="space-y-2 sm:space-y-4 text-center mb-6 sm:mb-12">
        <div className="flex justify-center mb-2 sm:mb-4">
          <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          Navegação por Temas
        </h1>
        <p className="text-muted-foreground text-sm sm:text-xl max-w-3xl mx-auto font-serif italic">
          "Fides quaerens intellectum" — Explore conexões sagradas entre as Escrituras e a Tradição.
        </p>
      </header>

      <div className="space-y-4 sm:space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-card/60 backdrop-blur-xl p-2 sm:p-3 rounded-2xl sm:rounded-[2.5rem] border border-border/40 shadow-xl sticky top-2 sm:top-4 z-20 transition-all duration-500 hover:shadow-2xl hover:border-primary/20 group/nav">
          <FuzzySearchInput
            className="flex-1 w-full"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar tema (ex: Amor, Graça...)"
            isSearching={isSearchPending}
          />
          
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto px-2 pb-2 sm:pb-0 scrollbar-none scroll-smooth">
            {categories.map((cat, idx) => (
              <motion.button
                key={cat}
                {...getTabProps(`tab-category-${idx}`, `panel-temas`, activeCategory === cat, `
                  whitespace-nowrap px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary outline-none
                  ${activeCategory === cat 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' 
                    : 'bg-muted/40 text-muted-foreground/70 hover:bg-muted hover:text-foreground hover:scale-102 border border-transparent hover:border-border/50'
                  }
                `)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => setActiveCategory(cat)}
                onKeyDown={(e) => handleTabKeyDown(e, idx, categories.length, (newIdx) => setActiveCategory(categories[newIdx]), 'tab-category-')}
              >
                {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-3xl opacity-30 pointer-events-none" />
          
          <div {...getTabPanelProps('panel-temas', `tab-category-${categories.indexOf(activeCategory)}`, true, "relative overflow-hidden rounded-2xl border border-border/30 bg-card/20 backdrop-blur-sm outline-none")}>
            {loadingTags ? (
              <div className="flex flex-col items-center gap-4 py-12 w-full justify-center">
                <div className="relative">
                  <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
                  <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse rounded-full" />
                </div>
                <span className="text-sm font-bold text-muted-foreground/60 tracking-widest uppercase">Consultando Nexus...</span>
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="py-20 px-8 text-center w-full space-y-4">
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground/60 italic font-medium tracking-wide">Nenhum tema encontrado para sua busca teológica.</p>
              </div>
            ) : (
              <>
                <div className="relative p-6 sm:p-10">
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-5xl mx-auto" role="list">
                    {filteredTags.map((tag, idx) => (
                      <div key={tag.id} role="listitem">
                        <BubbleTag
                          label={tag.label}
                          emoji={tag.emoji}
                          index={idx}
                          isSelected={false}
                          onClick={() => handleTagSelect(tag)}
                          onMouseEnter={() => prefetchTag(tag)}
                          className="px-4 py-2.5 text-[10px] sm:text-[11px] uppercase tracking-widest"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 px-8 pb-6 pt-2">
                  <div className="flex items-center gap-2 bg-muted/20 px-4 py-1.5 rounded-full border border-border/20">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 tabular-nums">
                      {filteredTags.length} conexões sagradas
                    </span>
                    <div className="w-1 h-1 rounded-full bg-primary/30" />
                    <Sparkles className="w-3 h-3 text-primary/40 animate-pulse" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <main className="min-h-[500px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-[400px] flex flex-col items-center justify-center text-center p-12 bg-muted/10 rounded-[3rem] border border-dashed border-border/40 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50" />
          <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-8 border border-primary/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
            <TagIcon className="h-12 w-12 text-primary/30" />
          </div>
          <h3 className="text-3xl font-black mb-4 text-foreground tracking-tight">Descubra os tesouros da Fé</h3>
          <p className="text-muted-foreground text-lg max-w-md font-serif italic">
            Selecione uma das "bolhas" acima para navegar pelos conteúdos da Bíblia, Catecismo e Magistério relacionados ao tema.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default TemasPage;