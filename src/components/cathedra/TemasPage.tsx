import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Bookmark, FileText, Tag, Loader2, ChevronRight, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface ThemeContent {
  id: string;
  content_type: 'bible' | 'catechism' | 'magisterium';
  reference: string;
  title: string;
  text_content: string;
}

const TemasPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  const { data: themes, isLoading: loadingThemes } = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Theme[];
    },
  });

  // Auto-select theme from URL param ?tema=slug
  useEffect(() => {
    const temaSlug = searchParams.get('tema');
    if (temaSlug && themes && !selectedTheme) {
      const match = themes.find(t => t.slug === temaSlug);
      if (match) setSelectedTheme(match);
    }
  }, [themes, searchParams, selectedTheme]);

  const { data: contents, isLoading: loadingContents } = useQuery({
    queryKey: ['theme-contents', selectedTheme?.id],
    queryFn: async () => {
      if (!selectedTheme) return [];
      const { data, error } = await supabase
        .from('theme_contents')
        .select('*')
        .eq('theme_id', selectedTheme.id);
      if (error) throw error;
      return data as ThemeContent[];
    },
    enabled: !!selectedTheme,
  });

  const bibleVerses = contents?.filter(c => c.content_type === 'bible') || [];
  const catechism = contents?.filter(c => c.content_type === 'catechism') || [];
  const magisterium = contents?.filter(c => c.content_type === 'magisterium') || [];

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
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-transparent blur opacity-50 transition duration-1000 group-hover:opacity-100" />
        <div className="relative flex flex-wrap justify-center gap-3 p-4 bg-card/30 backdrop-blur-sm rounded-3xl border border-border/40 shadow-sm">
          {loadingThemes ? (
            <div className="flex items-center gap-3 py-6 px-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
              <span className="text-sm font-medium text-muted-foreground">Carregando temas teológicos...</span>
            </div>
          ) : (
            themes?.map((theme) => {
              const isSelected = selectedTheme?.id === theme.id;
              return (
                <motion.button
                  key={theme.id}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTheme(theme)}
                  className={`
                    px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
                    flex items-center gap-2 border shadow-sm
                    ${isSelected 
                      ? 'bg-primary text-primary-foreground border-primary shadow-primary/30 ring-2 ring-primary/20' 
                      : 'bg-card/50 text-muted-foreground border-border/80 hover:border-primary/40 hover:text-primary hover:bg-white dark:hover:bg-slate-900'
                    }
                  `}
                >
                  <Hash className={`h-3.5 w-3.5 ${isSelected ? 'text-primary-foreground' : 'text-primary/40'}`} />
                  {theme.name}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Content Area */}
      <main className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {!selectedTheme ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-[300px] flex flex-col items-center justify-center text-center p-12 bg-muted/20 rounded-3xl border border-dashed border-border/60"
            >
              <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 border border-primary/10 shadow-inner">
                <Tag className="h-10 w-10 text-primary/30" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Descubra os tesouros da Fé</h3>
              <p className="text-muted-foreground max-w-md">
                Selecione uma das "bolhas" acima para navegar pelos conteúdos da Bíblia, Catecismo e Magistério relacionados ao tema.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={selectedTheme.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="bg-gradient-to-br from-card to-muted/20 border border-border/60 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="h-1.5 w-8 sm:w-12 bg-primary rounded-full" />
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 sm:px-4 py-1 text-[10px] sm:text-xs uppercase tracking-widest font-bold">
                        Estudo de Tema
                      </Badge>
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight leading-tight text-foreground">{selectedTheme.name}</h2>
                  </div>
                  <Button variant="outline" className="rounded-2xl border-primary/20 hover:bg-primary/5 hover:border-primary/40 group/btn h-12 sm:h-14 px-4 sm:px-6">
                    <Bookmark className="mr-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover/btn:scale-110" />
                    Salvar Estudo
                  </Button>
                </div>

                <p className="text-xl text-muted-foreground/90 leading-relaxed max-w-3xl font-medium">
                  {selectedTheme.description}
                </p>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <div className="flex justify-center mb-10">
                  <TabsList className="flex bg-muted/40 p-1.5 rounded-[2rem] border border-border/40 gap-1 overflow-x-auto max-w-full">
                    <TabsTrigger value="all" className="rounded-full px-8 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all font-semibold">Geral</TabsTrigger>
                    <TabsTrigger value="bible" className="rounded-full px-8 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all font-semibold flex gap-2"><Book className="h-4 w-4" /> Bíblia</TabsTrigger>
                    <TabsTrigger value="catechism" className="rounded-full px-8 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all font-semibold flex gap-2"><Bookmark className="h-4 w-4" /> Catecismo</TabsTrigger>
                    <TabsTrigger value="magisterium" className="rounded-full px-8 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all font-semibold flex gap-2"><FileText className="h-4 w-4" /> Magistério</TabsTrigger>
                  </TabsList>
                </div>

                {loadingContents ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground font-medium">Consultando fontes sagradas...</p>
                  </div>
                ) : (
                  <div className="px-1">
                    <TabsContent value="all" className="mt-0 space-y-10 focus-visible:outline-none">
                      <ContentSection title="Sagrada Escritura" icon={<Book className="h-6 w-6" />} items={bibleVerses} color="blue" />
                      <ContentSection title="Catecismo da Igreja" icon={<Bookmark className="h-6 w-6" />} items={catechism} color="amber" />
                      <ContentSection title="Documentos Pontifícios" icon={<FileText className="h-6 w-6" />} items={magisterium} color="emerald" />
                    </TabsContent>

                    <TabsContent value="bible" className="mt-0 focus-visible:outline-none">
                      <ContentSection title="Bíblia Sagrada" icon={<Book className="h-6 w-6" />} items={bibleVerses} showEmpty color="blue" />
                    </TabsContent>

                    <TabsContent value="catechism" className="mt-0 focus-visible:outline-none">
                      <ContentSection title="Catecismo da Igreja Católica" icon={<Bookmark className="h-6 w-6" />} items={catechism} showEmpty color="amber" />
                    </TabsContent>

                    <TabsContent value="magisterium" className="mt-0 focus-visible:outline-none">
                      <ContentSection title="Magistério da Igreja" icon={<FileText className="h-6 w-6" />} items={magisterium} showEmpty color="emerald" />
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
                        {item.title || item.reference}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
                        <CardDescription className="font-bold text-primary/70 tracking-wide text-sm">{item.reference}</CardDescription>
                      </div>
                    </div>
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
                    <Button size="sm" className="rounded-full gap-2 px-6 shadow-md hover:shadow-lg transition-all group-hover:scale-[1.02]">
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