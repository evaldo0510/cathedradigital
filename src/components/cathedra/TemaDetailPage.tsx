import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft, Sparkles, BookOpen, Quote, Shield, Globe, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppRoute } from '@/types';
import SEOHead from '@/components/SEOHead';
import { BubbleTag, getTagIcon } from './BubbleTag';

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

const TemaDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [logosInsight, setLogosInsight] = useState<string | null>(null);
  const [loadingLogos, setLoadingLogos] = useState(false);
  const [bibleLimit, setBibleLimit] = useState(5);
  const [traditionLimit, setTraditionLimit] = useState(5);
  const [magisteriumLimit, setMagisteriumLimit] = useState(5);

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*').order('label');
      if (error) throw error;
      return data as Tag[];
    },
  });

  const selectedTag = tags?.find(t => t.slug === slug);

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

  if (!selectedTag && tags) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] space-y-4">
        <h2 className="text-2xl font-bold">Tema não encontrado</h2>
        <Button onClick={() => navigate(AppRoute.TEMAS)}>Voltar para Temas</Button>
      </div>
    );
  }

  const bibleVerses = contents?.filter(c => c.content_type === 'bible') || [];
  const catechism = contents?.filter(c => c.content_type === 'catechism') || [];
  const magisterium = contents?.filter(c => c.content_type === 'magisterium') || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto pb-20 px-4">
      <SEOHead 
        title={`${selectedTag?.label || 'Tema'} - Cathedra`}
        description={`Explore conteúdos sagrados sobre ${selectedTag?.label}.`}
        path={`/temas/${slug}`}
      />

      <nav className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(AppRoute.TEMAS)}
          className="rounded-full gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Todos os Temas
        </Button>
      </nav>

      <header className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              {selectedTag && getTagIcon(selectedTag.emoji, "w-8 h-8")}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">{selectedTag?.category}</span>
                <div className="w-1 h-1 rounded-full bg-primary/30" />
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary/70">Nexus</Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">{selectedTag?.label}</h1>
            </div>
          </div>

          <Button 
            onClick={handleLoadInsight}
            disabled={loadingLogos || !!logosInsight}
            className="rounded-2xl h-14 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
            {loadingLogos ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Insight do Logos
              </>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {logosInsight && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="relative"
            >
              <div className="absolute inset-0 bg-secondary/5 blur-3xl rounded-[3rem]" />
              <Card className="border-secondary/30 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl">
                <CardContent className="p-8 sm:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-secondary/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Logos Theologicus</p>
                      <p className="text-xs text-muted-foreground font-medium">Síntese espiritual personalizada</p>
                    </div>
                  </div>
                  <p className="text-lg sm:text-xl text-foreground/90 leading-relaxed font-serif italic first-letter:text-4xl first-letter:font-black first-letter:mr-1 first-letter:float-left first-letter:text-secondary">
                    {logosInsight}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Tabs defaultValue="bible" className="w-full">
            <TabsList className="w-full bg-muted/40 p-1 rounded-2xl border border-border/40 grid grid-cols-3">
              <TabsTrigger value="bible" className="rounded-xl text-[10px] font-black uppercase tracking-widest py-2.5">Escrituras</TabsTrigger>
              <TabsTrigger value="tradition" className="rounded-xl text-[10px] font-black uppercase tracking-widest py-2.5">Tradição</TabsTrigger>
              <TabsTrigger value="magisterium" className="rounded-xl text-[10px] font-black uppercase tracking-widest py-2.5">Magistério</TabsTrigger>
            </TabsList>

            <TabsContent value="bible" className="mt-6 space-y-4">
              {bibleVerses.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {bibleVerses.slice(0, bibleLimit).map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className="border-border/40 bg-card/30 hover:bg-card/50 transition-colors rounded-3xl overflow-hidden group">
                          <CardContent className="p-6 sm:p-8 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary/60" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{c.reference}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/bible?ref=${encodeURIComponent(c.reference)}&from=temas&tema=${slug}`)}
                                className="h-8 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary gap-1.5"
                              >
                                Ler na Bíblia <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed font-serif">
                              "{c.text_content}"
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                  {bibleLimit < bibleVerses.length && (
                    <div className="pt-4 flex justify-center">
                      <Button 
                        variant="ghost" 
                        onClick={() => setBibleLimit(prev => prev + 5)}
                        className="rounded-full text-[10px] font-black uppercase tracking-widest gap-2"
                      >
                        Carregar mais escrituras ({bibleVerses.length - bibleLimit})
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground italic">Nenhum versículo catalogado para este tema.</div>
              )}
            </TabsContent>

            <TabsContent value="tradition" className="mt-6 space-y-4">
              {catechism.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {catechism.slice(0, traditionLimit).map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className="border-border/40 bg-card/30 rounded-3xl overflow-hidden group">
                          <CardContent className="p-6 sm:p-8 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-amber-500/60" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">{c.reference}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              const paragraph = (c.reference || '').replace(/\D/g, '');
                              navigate(`/catechism?p=${paragraph}&from=temas&tema=${slug}`);
                            }}
                            className="h-8 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/5 hover:text-amber-600 gap-1.5"
                          >
                            Ver no Catecismo <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-base text-foreground/80 leading-relaxed">
                          {c.text_content}
                        </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                  {traditionLimit < catechism.length && (
                    <div className="pt-4 flex justify-center">
                      <Button 
                        variant="ghost" 
                        onClick={() => setTraditionLimit(prev => prev + 5)}
                        className="rounded-full text-[10px] font-black uppercase tracking-widest gap-2"
                      >
                        Carregar mais Tradição ({catechism.length - traditionLimit})
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground italic">Conteúdo da Tradição em aprofundamento.</div>
              )}
            </TabsContent>

            <TabsContent value="magisterium" className="mt-6 space-y-4">
              {magisterium.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {magisterium.slice(0, magisteriumLimit).map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className="border-border/40 bg-card/30 rounded-3xl overflow-hidden group">
                          <CardContent className="p-6 sm:p-8 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-500/60" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{c.reference}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/magisterium?doc=${encodeURIComponent(c.reference)}&from=temas&tema=${slug}`)}
                            className="h-8 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/5 hover:text-blue-600 gap-1.5"
                          >
                            Ver Documento <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-base text-foreground/80 leading-relaxed">
                          {c.text_content}
                        </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                  {magisteriumLimit < magisterium.length && (
                    <div className="pt-4 flex justify-center">
                      <Button 
                        variant="ghost" 
                        onClick={() => setMagisteriumLimit(prev => prev + 5)}
                        className="rounded-full text-[10px] font-black uppercase tracking-widest gap-2"
                      >
                        Carregar mais Magistério ({magisterium.length - magisteriumLimit})
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground italic">Documentos do Magistério em aprofundamento.</div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-6">
          <div className="bg-card/50 border border-border/40 rounded-[2rem] p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground/60">Temas Relacionados</h3>
            <div className="flex flex-wrap gap-2">
              {tags?.filter(t => t.category === selectedTag?.category && t.id !== selectedTag?.id).slice(0, 8).map((tag, idx) => (
                <BubbleTag 
                  key={tag.id}
                  label={tag.label}
                  emoji={tag.emoji}
                  index={idx}
                  onClick={() => navigate(`${AppRoute.TEMAS}/${tag.slug}`)}
                  className="px-3 py-1.5"
                />
              ))}
            </div>
          </div>

          <Card className="border-primary/20 bg-primary/5 rounded-[2rem] overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Quote className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                "A fé e a razão são como as duas asas com as quais o espírito humano se eleva à contemplação da verdade."
              </p>
              <div className="pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">João Paulo II</p>
                <p className="text-[8px] text-muted-foreground font-medium uppercase tracking-tighter">Fides et Ratio</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default TemaDetailPage;
