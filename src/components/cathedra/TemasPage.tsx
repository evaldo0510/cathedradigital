import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronRight, Hash, Sparkles, Tag as TagIcon, X, Search } from 'lucide-react';
import { Icons } from '@/constants';
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

  const filteredTags = useMemo(() => {
    if (!tags) return [];
    return tags.filter(tag => {
      const matchesSearch = tag.label.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || tag.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tags, searchQuery, activeCategory]);

  // Auto-select tag from URL param ?tema=slug
  useEffect(() => {
    const temaSlug = searchParams.get('tema');
    if (temaSlug && tags && (!selectedTag || selectedTag.slug !== temaSlug)) {
      const match = tags.find(t => t.slug === temaSlug);
      if (match) setSelectedTag(match);
    }
  }, [tags, searchParams]);

  const handleTagSelect = (tag: Tag) => {
    setSelectedTag(tag);
    setSearchParams({ tema: tag.slug });
  };

  // Fetch Logos Insight when tag changes
  useEffect(() => {
    if (selectedTag) {
      setLogosInsight(null);
      setLoadingLogos(true);
      supabase.functions.invoke('logos-spiritual-insight', {
        body: { query: selectedTag.label }
      }).then(({ data, error }) => {
        if (!error && data?.insight) setLogosInsight(data.insight);
        setLoadingLogos(false);
      });
    }
  }, [selectedTag]);

  const { data: contents, isLoading: loadingContents } = useQuery({
    queryKey: ['tag-contents', selectedTag?.id],
    queryFn: async () => {
      if (!selectedTag) return [];
      
      // Query spiritual_contents through content_tags junction table
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      <header className="space-y-3 text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent sm:text-5xl">
          Navegação por Temas
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Explore conexões sagradas entre as Escrituras, a Tradição e o Magistério através de conceitos fundamentais da fé.
        </p>
      </header>

      {/* Bubble Navigation System */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-card/40 backdrop-blur-md p-4 rounded-[2rem] border border-border/50 shadow-sm sticky top-0 z-10 transition-all duration-300">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar tema teológico (ex: Amor, Graça, Pecado...)"
              className="w-full bg-background/50 border-none h-12 pl-12 pr-12 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat, idx) => (
              <motion.button
                key={cat}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setActiveCategory(cat)}
                className={`
                  whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                  ${activeCategory === cat 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }
                `}
              >
                {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-transparent blur opacity-50 transition duration-1000 group-hover:opacity-100" />
          <motion.div 
            layout 
            className="relative flex flex-wrap justify-center gap-2.5 p-4 sm:p-6 bg-card/30 backdrop-blur-sm rounded-[2.5rem] border border-border/40 shadow-inner overflow-hidden"
          >
            {loadingTags ? (
              <div className="flex items-center gap-3 py-6 px-8 w-full justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
                <span className="text-sm font-medium text-muted-foreground">Carregando temas teológicos...</span>
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="py-12 px-8 text-center w-full">
                <p className="text-sm text-muted-foreground italic font-medium">Nenhum tema encontrado para sua busca.</p>
              </div>
            ) : (
              filteredTags.map((tag) => {
                const isSelected = selectedTag?.id === tag.id;
                return (
                  <motion.button
                    key={tag.id}
                    layoutId={`tag-${tag.id}`}
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTagSelect(tag)}
                    className={`
                      px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300
                      flex items-center gap-2 border shadow-sm relative overflow-hidden group
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg ring-4 ring-primary/20' 
                        : 'bg-card/40 backdrop-blur-md text-muted-foreground border-border/60 hover:border-primary/50 hover:text-primary hover:bg-white dark:hover:bg-slate-900'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 relative z-10">
                      <span className="text-lg group-hover:scale-125 transition-transform duration-300">{tag.emoji}</span>
                      {tag.label}
                    </div>
                  </motion.button>
                );
              })
            )}
          </motion.div>
        </div>
      </div>

      {/* Content Area */}
      <main className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {!selectedTag ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-[300px] flex flex-col items-center justify-center text-center p-12 bg-muted/20 rounded-3xl border border-dashed border-border/60"
            >
              <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 border border-primary/10 shadow-inner">
                <TagIcon className="h-10 w-10 text-primary/30" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Descubra os tesouros da Fé</h3>
              <p className="text-muted-foreground max-w-md">
                Selecione uma das "bolhas" acima para navegar pelos conteúdos da Bíblia, Catecismo e Magistério relacionados ao tema.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={selectedTag.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Theme Hero Section */}
              <div className="bg-gradient-to-br from-card via-card/90 to-muted/20 border border-border/40 rounded-[3rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-20 -mt-20 group-hover:bg-primary/10 transition-all duration-1000" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full blur-[80px] -ml-10 -mb-10" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10 relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-0.5 w-12 bg-primary/60 rounded-full" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">
                        Navegação Teológica
                      </span>
                    </div>
                    <motion.h2 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-4xl sm:text-6xl font-black tracking-tighter leading-none text-foreground flex items-center gap-4 flex-wrap"
                    >
                      <span className="text-5xl sm:text-7xl group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">{selectedTag.emoji}</span>
                      {selectedTag.label}
                    </motion.h2>
                    <p className="text-lg sm:text-xl text-muted-foreground/80 leading-relaxed max-w-2xl font-medium font-serif italic">
                      "A fé procura a inteligência." — Explorando a profundidade de {selectedTag.label} nas fontes da Tradição.
                    </p>
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="outline" className="rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 group/btn h-14 sm:h-16 px-8 shadow-sm">
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
                className="relative overflow-hidden rounded-[2.5rem] border border-secondary/20 bg-gradient-to-br from-secondary/10 via-card/50 to-primary/5 p-8 sm:p-12 shadow-xl group"
              >
                <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none -mr-48 -mt-48 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none -ml-32 -mb-32" />
                
                <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center text-secondary shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500 border border-secondary/20">
                    <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Logos · Síntese Espiritual</p>
                        </div>
                        <h3 className="text-2xl font-black text-foreground tracking-tight">Iluminação Teológica</h3>
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
                          <p className="text-foreground/90 italic leading-relaxed whitespace-pre-wrap font-serif text-xl sm:text-2xl tracking-tight">
                            "{logosInsight}"
                          </p>
                        ) : (
                          <p className="text-muted-foreground/60 italic text-lg">Selecione um tema sagrado para receber uma síntese teológica profunda do Logos.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <Tabs defaultValue="all" className="w-full">
                <div className="flex justify-center mb-12 overflow-x-auto pb-4 px-2">
                  <TabsList className="flex bg-muted/40 p-2 rounded-[3rem] border border-border/40 gap-1.5 min-w-max h-auto shadow-inner backdrop-blur-md">
                    <TabsTrigger value="all" className="rounded-full px-8 py-4 data-[state=active]:bg-background data-[state=active]:shadow-2xl data-[state=active]:scale-105 transition-all font-black uppercase tracking-widest text-[10px]">Geral</TabsTrigger>
                    <TabsTrigger value="bible" className="rounded-full px-8 py-4 data-[state=active]:bg-background data-[state=active]:shadow-2xl data-[state=active]:scale-105 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2.5"><Icons.Bible className="h-4 w-4" /> Bíblia</TabsTrigger>
                    <TabsTrigger value="catechism" className="rounded-full px-8 py-4 data-[state=active]:bg-background data-[state=active]:shadow-2xl data-[state=active]:scale-105 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2.5"><Icons.Catechism className="h-4 w-4" /> Catecismo</TabsTrigger>
                    <TabsTrigger value="magisterium" className="rounded-full px-8 py-4 data-[state=active]:bg-background data-[state=active]:shadow-2xl data-[state=active]:scale-105 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2.5"><Icons.Magisterium className="h-4 w-4" /> Documentos</TabsTrigger>
                    <TabsTrigger value="journey" className="rounded-full px-8 py-4 data-[state=active]:bg-background data-[state=active]:shadow-2xl data-[state=active]:scale-105 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2.5"><Icons.Compass className="h-4 w-4" /> Jornadas</TabsTrigger>
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
                    <TabsContent value="all" className="mt-0 space-y-10 focus-visible:outline-none">
                      <ContentSection title="Bíblia" icon={<Icons.Bible className="h-6 w-6" />} items={bibleVerses} color="blue" />
                      <ContentSection title="Catecismo" icon={<Icons.Catechism className="h-6 w-6" />} items={catechism} color="amber" />
                      <ContentSection title="Documentos" icon={<Icons.Magisterium className="h-6 w-6" />} items={magisterium} color="emerald" />
                      <ContentSection title="Jornadas" icon={<Icons.Compass className="h-6 w-6" />} items={journeyItems} color="primary" />
                    </TabsContent>

                    <TabsContent value="bible" className="mt-0 focus-visible:outline-none">
                      <ContentSection title="Bíblia" icon={<Icons.Bible className="h-6 w-6" />} items={bibleVerses} showEmpty color="blue" />
                    </TabsContent>

                    <TabsContent value="catechism" className="mt-0 focus-visible:outline-none">
                      <ContentSection title="Catecismo" icon={<Icons.Catechism className="h-6 w-6" />} items={catechism} showEmpty color="amber" />
                    </TabsContent>

                    <TabsContent value="magisterium" className="mt-0 focus-visible:outline-none">
                      <ContentSection title="Documentos" icon={<Icons.Magisterium className="h-6 w-6" />} items={magisterium} showEmpty color="emerald" />
                    </TabsContent>

                    <TabsContent value="journey" className="mt-0 focus-visible:outline-none">
                      <ContentSection title="Jornadas" icon={<Icons.Compass className="h-6 w-6" />} items={journeyItems} showEmpty color="primary" />
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
}

const ContentSection = React.forwardRef<HTMLDivElement, ContentSectionProps>(({ title, icon, items, showEmpty = false, color = 'primary' }, ref) => {
  const navigate = useNavigate();

  if (items.length === 0 && !showEmpty) return null;

  const colorStyles = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
    primary: { bg: 'bg-primary/10', text: 'text-primary' }
  }[color];

  return (
    <section className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b pb-4 border-border/40">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${colorStyles.bg} shadow-sm ${colorStyles.text}`}>
            {icon}
          </div>
          <h3 className="font-bold text-2xl tracking-tight text-foreground">{title}</h3>
        </div>
        <Badge variant="outline" className="rounded-full px-4 py-1 font-mono text-sm bg-muted/50 border-border/60">
          {items.length} itens
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {items.length === 0 ? (
          <div className="text-center py-12 px-6 bg-muted/10 rounded-3xl border border-dashed border-border/40">
            <p className="text-muted-foreground font-medium italic">
              Nenhum conteúdo vinculado a este tema nesta categoria no momento.
            </p>
          </div>
        ) : (
          items.map((item, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={item.id}
            >
              <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-xl group rounded-3xl">
                <CardHeader className="pb-4 pt-7 px-7">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors leading-snug text-foreground">
                        {item.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
                        <CardDescription className="font-bold text-primary/70 tracking-wide text-sm">{item.reference}</CardDescription>
                      </div>
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-7 pb-7">
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent rounded-full" />
                    <p className="text-foreground/90 leading-relaxed italic text-lg pl-6 py-2">
                      "{item.text_content}"
                    </p>
                  </div>
                  <div className="mt-8 flex justify-end gap-3">
                    <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5">
                      Copiar
                    </Button>
                    <Button 
                      onClick={() => {
                        if (item.content_type === 'journey') {
                          navigate(`/jornadas/${item.id}`);
                        } else if (item.content_type === 'bible') {
                          navigate(`/bible?ref=${item.reference}`);
                        } else if (item.content_type === 'catechism') {
                          navigate(`/catechism?p=${item.reference.replace('Catecismo ', '')}`);
                        }
                      }}
                      size="sm" 
                      className="rounded-full gap-2 px-6 shadow-md hover:shadow-lg transition-all group-hover:scale-[1.02]"

                    >
                      Explorar no Texto <ChevronRight className="h-4 w-4" />
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
