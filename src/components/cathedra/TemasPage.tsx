import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRoute } from '@/types';
import { Loader2, ChevronRight, ChevronLeft, Hash, Sparkles, Tag as TagIcon, X, Search, Heart, Cross, BookOpen, Flame, Shield, Crown, Hand, Star, Globe, Eye, Users, Compass, Church, Wine, Orbit, Mountain, RefreshCw, Frown, Bird, Droplets, Wheat, Target, Clock, Megaphone, Skull, Filter } from 'lucide-react';
import { Icons } from '@/constants';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { RelevanceBadge } from './RelevanceBadge';
import { FuzzySearchInput } from './FuzzySearchInput';
import { BubbleTag, getTagIcon } from './BubbleTag';

// Using shared getTagIcon from BubbleTag
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Tag {
  id: string;
  label: string;
  slug: string;
  emoji: string;
  category: string;
  similarityScore?: number;
  [key: string]: unknown;
}

interface ThemeContent {
  id: string;
  content_type: 'bible' | 'catechism' | 'magisterium' | 'journey';
  reference: string;
  title: string;
  text_content: string;
  tags: string[];
}

const TemasPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [logosInsight, setLogosInsight] = useState<string | null>(null);
  const [loadingLogos, setLoadingLogos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [scrollProgress, setScrollProgress] = useState(0);

  // removed handleCarouselScroll as it is replaced by flex-wrap logic


  // moved below filteredTags

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


  // Server-side fuzzy search via search_tags_fuzzy (debounced 300ms, ≥2 chars).
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
    // When the user is searching, prefer the relevance-ranked RPC results;
    // otherwise show the alphabetical full list.
    const base: Tag[] = isSearchActive ? (fuzzyTags ?? []) : tags;
    if (activeCategory === 'all') return base;
    return base.filter(tag => tag.category === activeCategory);
  }, [tags, fuzzyTags, isSearchActive, activeCategory]);

  useEffect(() => {
    const temaSlug = searchParams.get('tema');
    if (temaSlug && tags && (!selectedTag || selectedTag.slug !== temaSlug)) {
      const match = tags.find(t => t.slug === temaSlug);
      if (match) setSelectedTag(match);
    }
  }, [tags, searchParams]);

  const handleTagSelect = (tag: Tag) => {
    navigate(`${AppRoute.TEMAS}/${tag.slug}`);
  };

  useEffect(() => {
    if (selectedTag) {
      setLogosInsight(null);
      setLoadingLogos(false);
    }
  }, [selectedTag]);

  const handleLoadInsight = () => {
    if (!selectedTag || loadingLogos) return;
    setLoadingLogos(true);
    supabase.functions.invoke('logos-spiritual-insight', {
      body: { query: selectedTag.label }
    }).then(({ data, error }) => {
      if (!error && data?.insight) setLogosInsight(data.insight);
      setLoadingLogos(false);
    });
  };

  const { data: contents, isLoading: loadingContents } = useQuery({
    queryKey: ['tag-contents', selectedTag?.id],
    queryFn: async () => {
      if (!selectedTag) return [];
      
      const { data: tagContents, error: contentError } = await supabase
        .from('content_tags')
        .select(`
          spiritual_contents (
            id,
            title,
            content_text,
            type,
            reference_id,
            tags
          )
        `)
        .eq('tag_id', selectedTag.id);
      
      if (contentError) throw contentError;

      const results: ThemeContent[] = (tagContents || []).map((c: any) => ({
        id: c.spiritual_contents.id,
        content_type: c.spiritual_contents.type,
        reference: c.spiritual_contents.reference_id || c.spiritual_contents.title || 'Referência',
        title: c.spiritual_contents.title,
        text_content: c.spiritual_contents.content_text,
        tags: c.spiritual_contents.tags || []
      }));

      return results;
    },
    enabled: !!selectedTag,
  });

  const bibleVerses = contents?.filter(c => c.content_type === 'bible') || [];
  const catechism = contents?.filter(c => c.content_type === 'catechism') || [];
  const magisterium = contents?.filter(c => c.content_type === 'magisterium') || [];
  const journeyItems = contents?.filter(c => c.content_type === 'journey') || [];

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

      {/* Bubble Navigation System */}
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => setActiveCategory(cat)}
                className={`
                  whitespace-nowrap px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-300
                  ${activeCategory === cat 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' 
                    : 'bg-muted/40 text-muted-foreground/70 hover:bg-muted hover:text-foreground hover:scale-102 border border-transparent hover:border-border/50'
                  }
                `}
              >
                {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-3xl opacity-30 pointer-events-none" />
          
          <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-card/20 backdrop-blur-sm">
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
                          isSelected={selectedTag?.id === tag.id}
                          onClick={() => handleTagSelect(tag)}
                          className={`
                            px-4 py-2.5 text-[10px] sm:text-[11px] uppercase tracking-widest
                            ${selectedTag?.id === tag.id ? 'z-10 scale-110 shadow-primary/30' : ''}
                          `}
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
        <AnimatePresence mode="wait">
          {!selectedTag ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
          ) : (
            <motion.div
              key={selectedTag.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, type: "spring", damping: 25 }}
              className="space-y-6 sm:space-y-12"
            >
              {/* Theme Hero Section */}
              <div className="bg-gradient-to-br from-card via-card/90 to-muted/20 border border-border/40 rounded-2xl sm:rounded-[3rem] p-5 sm:p-12 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-20 -mt-20 group-hover:bg-primary/10 transition-all duration-1000" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full blur-[80px] -ml-10 -mb-10" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-8 mb-4 sm:mb-10 relative z-10">
                  <div className="space-y-2 sm:space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-0.5 w-12 bg-primary/60 rounded-full" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">
                        Navegação Teológica
                      </span>
                    </div>
                    <motion.h2 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tighter leading-none text-foreground flex items-center gap-2 sm:gap-4 flex-wrap"
                    >
                      <span className="text-primary/60 group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">{getTagIcon(selectedTag.emoji)}</span>
                      {selectedTag.label}
                    </motion.h2>
                    <p className="text-sm sm:text-lg md:text-xl text-muted-foreground/80 leading-relaxed max-w-2xl font-medium font-serif italic">
                      "A fé procura a inteligência." — Explorando a profundidade de {selectedTag.label} nas fontes da Tradição.
                    </p>
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="outline" className="rounded-xl sm:rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 group/btn h-10 sm:h-16 px-4 sm:px-8 shadow-sm w-full sm:w-auto">
                      <Icons.Bookmark className="mr-3 h-5 w-5 transition-transform group-hover/btn:scale-110 text-primary" />
                      <span className="font-bold text-xs uppercase tracking-widest">Salvar Estudo</span>
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Logos AI Synthesis Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", damping: 20 }}
                className="relative overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-secondary/20 bg-gradient-to-br from-secondary/10 via-card/50 to-primary/5 p-5 sm:p-12 shadow-xl group"
              >
                <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none -mr-48 -mt-48 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none -ml-32 -mb-32" />
                
                <div className="flex flex-col md:flex-row items-start gap-4 sm:gap-8 relative z-10">
                  <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center text-secondary shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500 border border-secondary/20">
                    <Sparkles className="w-6 h-6 sm:w-10 sm:h-10 animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-3 sm:space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Logos · Síntese Espiritual</p>
                        </div>
                        <h3 className="text-lg sm:text-2xl font-black text-foreground tracking-tight">Iluminação Teológica</h3>
                      </div>
                      {loadingLogos && <Loader2 className="h-6 w-6 animate-spin text-secondary/50" />}
                    </div>
                    
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-secondary/40 via-secondary/10 to-transparent rounded-full -ml-4" />
                      <div className="prose prose-lg prose-secondary dark:prose-invert max-w-none">
                        {loadingLogos ? (
                          <div className="space-y-3 py-2">
                            <div className="h-5 bg-secondary/10 rounded-full animate-pulse w-full" />
                            <div className="h-5 bg-secondary/10 rounded-full animate-pulse w-5/6" />
                            <div className="h-5 bg-secondary/10 rounded-full animate-pulse w-4/5" />
                          </div>
                        ) : logosInsight ? (
                          <p className="text-foreground/90 italic leading-relaxed whitespace-pre-wrap font-serif text-base sm:text-xl md:text-2xl tracking-tight">
                            "{logosInsight}"
                          </p>
                        ) : (
                          <div className="flex flex-col items-center gap-4 py-4">
                            <p className="text-muted-foreground/60 italic text-sm sm:text-lg font-serif">
                              Receba uma reflexão teológica sobre <strong>{selectedTag.label}</strong> à luz da Tradição.
                            </p>
                            <Button 
                              onClick={handleLoadInsight}
                              variant="outline" 
                              className="rounded-2xl border-secondary/30 bg-secondary/5 hover:bg-secondary/10 hover:border-secondary/40 h-12 px-6"
                            >
                              <Sparkles className="mr-2 h-4 w-4 text-secondary" />
                              <span className="font-bold text-xs uppercase tracking-widest">Carregar reflexão</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <Tabs defaultValue="all" className="w-full">
                <div className="flex justify-center mb-6 sm:mb-12 overflow-x-auto pb-2 sm:pb-4 px-1 sm:px-2">
                  <TabsList className="flex bg-muted/40 p-1 sm:p-2 rounded-2xl sm:rounded-[3rem] border border-border/40 gap-1 sm:gap-1.5 min-w-max h-auto shadow-inner backdrop-blur-md">
                    <TabsTrigger value="all" className="rounded-full px-4 sm:px-8 py-2.5 sm:py-4 data-[state=active]:bg-background data-[state=active]:shadow-2xl data-[state=active]:scale-105 transition-all font-black uppercase tracking-widest text-[8px] sm:text-[10px]">Geral</TabsTrigger>
                    <TabsTrigger value="bible" className="rounded-full px-4 sm:px-8 py-2.5 sm:py-4 data-[state=active]:bg-background data-[state=active]:shadow-2xl data-[state=active]:scale-105 transition-all font-black uppercase tracking-widest text-[8px] sm:text-[10px] flex items-center gap-1.5 sm:gap-2.5"><Icons.Bible className="h-3 w-3 sm:h-4 sm:w-4" /> Bíblia</TabsTrigger>
                    <TabsTrigger value="catechism" className="rounded-full px-4 sm:px-8 py-2.5 sm:py-4 data-[state=active]:bg-background data-[state=active]:shadow-2xl data-[state=active]:scale-105 transition-all font-black uppercase tracking-widest text-[8px] sm:text-[10px] flex items-center gap-1.5 sm:gap-2.5"><Icons.Catechism className="h-3 w-3 sm:h-4 sm:w-4" /> CIC</TabsTrigger>
                    <TabsTrigger value="magisterium" className="rounded-full px-4 sm:px-8 py-2.5 sm:py-4 data-[state=active]:bg-background data-[state=active]:shadow-2xl data-[state=active]:scale-105 transition-all font-black uppercase tracking-widest text-[8px] sm:text-[10px] flex items-center gap-1.5 sm:gap-2.5"><Icons.Magisterium className="h-3 w-3 sm:h-4 sm:w-4" /> Docs</TabsTrigger>
                    <TabsTrigger value="journey" className="rounded-full px-4 sm:px-8 py-2.5 sm:py-4 data-[state=active]:bg-background data-[state=active]:shadow-2xl data-[state=active]:scale-105 transition-all font-black uppercase tracking-widest text-[8px] sm:text-[10px] flex items-center gap-1.5 sm:gap-2.5"><Icons.Compass className="h-3 w-3 sm:h-4 sm:w-4" /> Jornadas</TabsTrigger>
                  </TabsList>
                </div>

                {loadingContents ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                      <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse rounded-full" />
                    </div>
                    <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-xs">Consultando fontes sagradas...</p>
                  </div>
                ) : (
                  <div className="px-1">
                    <TabsContent value="all" className="mt-0 space-y-12 focus-visible:outline-none">
                      <ContentSection title="Bíblia" icon={<Icons.Bible className="h-6 w-6" />} items={bibleVerses} color="blue" temaSlug={selectedTag.slug} />
                      <ContentSection title="Catecismo" icon={<Icons.Catechism className="h-6 w-6" />} items={catechism} color="amber" temaSlug={selectedTag.slug} />
                      <ContentSection title="Documentos" icon={<Icons.Magisterium className="h-6 w-6" />} items={magisterium} color="emerald" temaSlug={selectedTag.slug} />
                      <ContentSection title="Jornadas" icon={<Icons.Compass className="h-6 w-6" />} items={journeyItems} color="primary" temaSlug={selectedTag.slug} />
                    </TabsContent>

                    <TabsContent value="bible" className="mt-0 focus-visible:outline-none">
                      <ContentSection title="Bíblia" icon={<Icons.Bible className="h-6 w-6" />} items={bibleVerses} showEmpty color="blue" temaSlug={selectedTag.slug} />
                    </TabsContent>

                    <TabsContent value="catechism" className="mt-0 focus-visible:outline-none">
                      <ContentSection title="Catecismo" icon={<Icons.Catechism className="h-6 w-6" />} items={catechism} showEmpty color="amber" temaSlug={selectedTag.slug} />
                    </TabsContent>

                    <TabsContent value="magisterium" className="mt-0 focus-visible:outline-none">
                      <ContentSection title="Documentos" icon={<Icons.Magisterium className="h-6 w-6" />} items={magisterium} showEmpty color="emerald" temaSlug={selectedTag.slug} />
                    </TabsContent>

                    <TabsContent value="journey" className="mt-0 focus-visible:outline-none">
                      <ContentSection title="Jornadas" icon={<Icons.Compass className="h-6 w-6" />} items={journeyItems} showEmpty color="primary" temaSlug={selectedTag.slug} />
                    </TabsContent>
                  </div>
                )}
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

interface ContentSectionProps {
  title: string;
  icon: React.ReactNode;
  items: ThemeContent[];
  showEmpty?: boolean;
  color?: 'blue' | 'amber' | 'emerald' | 'primary';
  temaSlug?: string;
}

const ContentSection = React.forwardRef<HTMLDivElement, ContentSectionProps>(({ title, icon, items, showEmpty = false, color = 'primary', temaSlug }, ref) => {
  const navigate = useNavigate();

  if (items.length === 0 && !showEmpty) return null;

  const colorStyles = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', glow: 'shadow-blue-500/10', border: 'border-blue-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', glow: 'shadow-amber-500/10', border: 'border-amber-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', glow: 'shadow-emerald-500/10', border: 'border-emerald-500/20' },
    primary: { bg: 'bg-primary/10', text: 'text-primary', glow: 'shadow-primary/10', border: 'border-primary/20' }
  }[color];

  return (
    <section className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex items-center justify-between border-b pb-4 sm:pb-6 border-border/40">
        <div className="flex items-center gap-3 sm:gap-5">
          <div className={`p-2.5 sm:p-4 rounded-xl sm:rounded-[1.5rem] ${colorStyles.bg} ${colorStyles.glow} shadow-xl ${colorStyles.text} transition-all duration-500 hover:scale-110`}>
            {icon}
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <h3 className="font-black text-xl sm:text-3xl tracking-tighter text-foreground">{title}</h3>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Fontes Sagradas</p>
          </div>
        </div>
        <Badge variant="outline" className="rounded-full px-3 sm:px-6 py-1.5 sm:py-2 font-black text-[9px] sm:text-[10px] uppercase tracking-widest bg-muted/30 border-border/40 text-muted-foreground shadow-sm">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:gap-8">
        {items.length === 0 ? (
          <div className="text-center py-12 sm:py-20 px-6 sm:px-10 bg-muted/5 rounded-2xl sm:rounded-[2.5rem] border border-dashed border-border/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <p className="text-muted-foreground/60 font-medium italic text-lg relative z-10">
              Nenhum conteúdo vinculado a este tema nesta categoria no momento.
            </p>
          </div>
        ) : (
          items.map((item, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, type: "spring", damping: 20 }}
              key={item.id}
            >
              <Card className="overflow-hidden border-border/40 hover:border-primary/40 transition-all duration-500 bg-card/40 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:shadow-primary/5 group rounded-2xl sm:rounded-[2.5rem] relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all duration-700" />
                
                <CardHeader className="pb-3 sm:pb-4 pt-5 sm:pt-10 px-4 sm:px-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${colorStyles.bg} ${colorStyles.text} animate-pulse`} />
                        <CardDescription className={`font-black uppercase tracking-[0.2em] text-[10px] ${colorStyles.text}`}>{item.reference}</CardDescription>
                      </div>
                      <CardTitle className="text-lg sm:text-2xl font-black group-hover:text-primary transition-colors leading-tight tracking-tight text-foreground">
                        {item.title}
                      </CardTitle>
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest bg-muted/20 border-border/40">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-10 pb-5 sm:pb-10 space-y-5 sm:space-y-10">
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/40 via-primary/10 to-transparent rounded-full -ml-2 sm:-ml-4" />
                    <p className="text-foreground/90 leading-relaxed italic text-base sm:text-xl md:text-2xl font-serif pl-2 sm:pl-4 py-2 tracking-tight">
                      "{item.text_content}"
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-4 pt-2 sm:pt-4">
                    <Button 
                      variant="ghost" 
                      size="lg" 
                      onClick={() => {
                        const text = `"${item.text_content}" — ${item.reference}`;
                        navigator.clipboard.writeText(text);
                      }}
                      className="rounded-xl sm:rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/5 font-black uppercase tracking-widest text-[9px] sm:text-[10px] w-full sm:w-auto h-10 sm:h-12">
                      Copiar Citação
                    </Button>
                    <Button 
                      onClick={() => {
                        const fromParam = temaSlug ? `&from=temas&tema=${temaSlug}` : '';
                        if (item.content_type === 'journey') {
                          navigate(`/jornadas/${item.id}${temaSlug ? `?from=temas&tema=${temaSlug}` : ''}`);
                        } else if (item.content_type === 'bible') {
                          const ref = item.reference || item.title;
                          navigate(`/bible?ref=${encodeURIComponent(ref)}${fromParam}`);
                        } else if (item.content_type === 'catechism') {
                          const paragraph = (item.reference || item.title || '').replace(/\D/g, '');
                          navigate(`/catechism?p=${paragraph}${fromParam}`);
                        } else if (item.content_type === 'magisterium') {
                          navigate(`/magisterium?doc=${encodeURIComponent(item.reference || item.title)}${fromParam}`);
                        }
                      }}
                      size="lg" 
                      className="rounded-xl sm:rounded-2xl gap-2 sm:gap-3 px-6 sm:px-10 shadow-xl hover:shadow-primary/20 transition-all group-hover:scale-[1.03] font-black uppercase tracking-widest text-[9px] sm:text-[10px] w-full sm:w-auto h-10 sm:h-12"
                    >
                      {item.content_type === 'bible' ? 'Ler na Bíblia' : item.content_type === 'catechism' ? 'Ver no Catecismo' : item.content_type === 'magisterium' ? 'Ver Documento' : 'Abrir Jornada'} <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
});

export default TemasPage;
