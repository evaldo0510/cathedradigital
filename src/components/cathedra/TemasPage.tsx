import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Bookmark, FileText, Search, Tag, Loader2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredThemes = themes?.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const bibleVerses = contents?.filter(c => c.content_type === 'bible') || [];
  const catechism = contents?.filter(c => c.content_type === 'catechism') || [];
  const magisterium = contents?.filter(c => c.content_type === 'magisterium') || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Navegação por Temas
        </h1>
        <p className="text-muted-foreground text-lg">
          Explore as conexões entre a Bíblia, o Catecismo e o Magistério através de temas fundamentais.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Themes Sidebar/List */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tema..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/30 border-none focus-visible:ring-1"
            />
          </div>

          <ScrollArea className="h-[calc(100vh-250px)] pr-4">
            <div className="space-y-2">
              {loadingThemes ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredThemes?.length === 0 ? (
                <p className="text-center text-muted-foreground p-4 italic">Nenhum tema encontrado.</p>
              ) : (
                filteredThemes?.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`w-full text-left p-4 rounded-xl transition-all border group ${
                      selectedTheme?.id === theme.id
                        ? 'bg-primary/10 border-primary/30 shadow-sm'
                        : 'bg-card border-border/40 hover:border-primary/20 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground flex items-center gap-2">
                        <Tag className={`h-4 w-4 ${selectedTheme?.id === theme.id ? 'text-primary' : 'text-muted-foreground'}`} />
                        {theme.name}
                      </span>
                      <ChevronRight className={`h-4 w-4 transition-transform ${selectedTheme?.id === theme.id ? 'translate-x-1 text-primary' : 'text-muted-foreground opacity-0 group-hover:opacity-100'}`} />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {theme.description}
                    </p>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-8 min-h-[500px]">
          <AnimatePresence mode="wait">
            {!selectedTheme ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 bg-muted/20 rounded-3xl border border-dashed border-border"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                  <Tag className="h-8 w-8 text-primary/40" />
                </div>
                <h3 className="text-xl font-medium mb-2">Selecione um tema</h3>
                <p className="text-muted-foreground max-w-sm">
                  Escolha um tema à esquerda para ver as passagens bíblicas, parágrafos do Catecismo e documentos relacionados.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedTheme.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-card border rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1">
                      Tema Selecionado
                    </Badge>
                  </div>
                  <h2 className="text-4xl font-bold mb-3">{selectedTheme.name}</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {selectedTheme.description}
                  </p>
                </div>

                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-muted/30 p-1 rounded-xl">
                    <TabsTrigger value="all" className="rounded-lg">Tudo</TabsTrigger>
                    <TabsTrigger value="bible" className="rounded-lg flex gap-2"><Book className="h-4 w-4" /> Bíblia</TabsTrigger>
                    <TabsTrigger value="catechism" className="rounded-lg flex gap-2"><Bookmark className="h-4 w-4" /> Catecismo</TabsTrigger>
                    <TabsTrigger value="magisterium" className="rounded-lg flex gap-2"><FileText className="h-4 w-4" /> Magistério</TabsTrigger>
                  </TabsList>

                  {loadingContents ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <TabsContent value="all" className="mt-6 space-y-6">
                        <ContentSection title="Versículos da Bíblia" icon={<Book className="text-blue-500" />} items={bibleVerses} />
                        <ContentSection title="Trechos do Catecismo" icon={<Bookmark className="text-amber-500" />} items={catechism} />
                        <ContentSection title="Documentos do Magistério" icon={<FileText className="text-emerald-500" />} items={magisterium} />
                      </TabsContent>

                      <TabsContent value="bible" className="mt-6">
                        <ContentSection title="Bíblia Sagrada" icon={<Book className="text-blue-500" />} items={bibleVerses} showEmpty />
                      </TabsContent>

                      <TabsContent value="catechism" className="mt-6">
                        <ContentSection title="Catecismo da Igreja Católica" icon={<Bookmark className="text-amber-500" />} items={catechism} showEmpty />
                      </TabsContent>

                      <TabsContent value="magisterium" className="mt-6">
                        <ContentSection title="Magistério da Igreja" icon={<FileText className="text-emerald-500" />} items={magisterium} showEmpty />
                      </TabsContent>
                    </>
                  )}
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

interface ContentSectionProps {
  title: string;
  icon: React.ReactNode;
  items: ThemeContent[];
  showEmpty?: boolean;
}

const ContentSection = ({ title, icon, items, showEmpty = false }: ContentSectionProps) => {
  if (items.length === 0 && !showEmpty) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        {icon}
        <h3 className="font-bold text-lg">{title}</h3>
        <Badge variant="outline" className="ml-2 font-mono text-xs">{items.length}</Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {items.length === 0 ? (
          <p className="text-muted-foreground italic text-sm p-4 bg-muted/10 rounded-xl border border-dashed">
            Nenhum conteúdo vinculado a este tema nesta categoria.
          </p>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="overflow-hidden border-border/40 hover:border-primary/20 transition-colors bg-card/50 backdrop-blur-sm group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{item.title || item.reference}</CardTitle>
                    <CardDescription className="font-medium text-primary/80">{item.reference}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1">
                  "{item.text_content}"
                </p>
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" className="gap-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    Ir para conteúdo <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </section>
  );
};

export default TemasPage;
