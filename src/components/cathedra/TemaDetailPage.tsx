import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { normalizeText } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft, Sparkles, BookOpen, Quote, Shield, Globe, ExternalLink, CheckCircle } from 'lucide-react';
import { Icons } from '@/constants';
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

const ThemeContentCard = ({ 
  content, 
  index, 
  icon: Icon, 
  accentColor, 
  buttonText, 
  onAction 
}: { 
  content: ThemeContent; 
  index: number; 
  icon: any; 
  accentColor: string; 
  buttonText: string; 
  onAction: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <Card className="border-border/40 bg-card/30 hover:bg-card/50 transition-all duration-300 rounded-[2rem] overflow-hidden group hover:shadow-lg hover:border-primary/20">
      <CardContent className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${accentColor.replace('text-', 'bg-')}/10`}>
              <Icon className={`w-4 h-4 ${accentColor}`} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${accentColor}`}>{content.reference}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onAction}
            className={`h-9 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary gap-1.5 px-4 transition-all duration-300`}
          >
            {buttonText} <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-base sm:text-lg text-foreground/80 leading-relaxed font-serif">
          {content.content_type === 'bible' ? `"${content.text_content}"` : content.text_content}
        </p>
      </CardContent>
    </Card>
  </motion.div>
);

const TemaDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [logosInsight, setLogosInsight] = useState<string | null>(null);
  const [loadingLogos, setLoadingLogos] = useState(false);
  const [bibleLimit, setBibleLimit] = useState(5);
  const [traditionLimit, setTraditionLimit] = useState(5);
  const [magisteriumLimit, setMagisteriumLimit] = useState(5);
  const [autoLoaded, setAutoLoaded] = useState(false);

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
    queryKey: ['tag-contents', selectedTag?.id, selectedTag?.label],
    queryFn: async () => {
      if (!selectedTag) return [];
      
      const normalizedLabel = normalizeText(selectedTag.label);
      const searchTerms = [selectedTag.label, normalizedLabel, selectedTag.slug].filter(Boolean);
      
      // Fetch from spiritual_contents
      const { data: spiritualData, error: spiritualError } = await supabase
        .from('spiritual_contents')
        .select('*')
        .overlaps('tags', searchTerms)
        .limit(30);
      
      // Fetch from journeys
      const { data: journeyData, error: journeyError } = await supabase
        .from('journeys')
        .select('*')
        .overlaps('tags', searchTerms)
        .limit(10);
      
      if (spiritualError) throw spiritualError;
      if (journeyError) throw journeyError;

      const results: ThemeContent[] = (spiritualData || []).map((d: any) => ({
        id: d.id,
        content_type: d.type,
        reference: d.reference_id || d.title || 'Referência',
        title: d.title,
        text_content: d.content_text,
        tags: d.tags || []
      }));

      const journeyResults: ThemeContent[] = (journeyData || []).map((d: any) => ({
        id: d.id,
        content_type: 'journey',
        reference: d.subtitle || d.category || 'Jornada',
        title: d.title,
        text_content: d.description || '',
        tags: d.tags || []
      }));

      // Combine and remove duplicates
      const all = [...results, ...journeyResults];
      return Array.from(new Map(all.map(item => [item.id, item])).values());
    },
    enabled: !!selectedTag,
  });

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

  useEffect(() => {
    if (selectedTag && !logosInsight && !loadingLogos && !autoLoaded) {
      setAutoLoaded(true);
      const timer = setTimeout(() => {
        handleLoadInsight();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [selectedTag, logosInsight, loadingLogos, autoLoaded]);

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
  const journeys = contents?.filter(c => c.content_type === 'journey') || [];

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'dores': return 'from-red-500/10 via-background to-background';
      case 'fundamentos': return 'from-blue-500/10 via-background to-background';
      case 'virtudes': return 'from-amber-500/10 via-background to-background';
      default: return 'from-primary/10 via-background to-background';
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-24 px-4 relative">
      <div className={`fixed inset-0 bg-gradient-to-b ${getCategoryColor(selectedTag?.category)} -z-10 pointer-events-none opacity-40`} />
      <SEOHead 
        title={`${selectedTag?.label || 'Tema'} - Cathedra`}
        description={`Explore conteúdos sagrados sobre ${selectedTag?.label}.`}
        path={`/temas/${slug}`}
      />

      <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
        <button 
          onClick={() => navigate(AppRoute.HOME)}
          className="hover:text-primary transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="w-3 h-3" /> Início
        </button>
        <span className="opacity-30">/</span>
        <button 
          onClick={() => navigate(AppRoute.TEMAS)}
          className="hover:text-primary transition-colors"
        >
          Temas
        </button>
        <span className="opacity-30">/</span>
        <button 
          onClick={() => navigate(`${AppRoute.TEMAS}?category=${selectedTag?.category}`)}
          className="hover:text-primary transition-colors"
        >
          {selectedTag?.category}
        </button>
        <span className="opacity-30">/</span>
        <span className="text-primary/80">{selectedTag?.label}</span>
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
          {(logosInsight || loadingLogos) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="relative"
            >
              <div className="absolute inset-0 bg-secondary/5 blur-3xl rounded-[3rem]" />
              <Card className="border-secondary/30 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl">
                <CardContent className="p-8 sm:p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-inner">
                        <Sparkles className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Logos Theologicus</p>
                        <p className="text-sm text-muted-foreground font-medium">Sentido & Aplicação</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-secondary/20 text-secondary animate-pulse px-3">IA Ativa</Badge>
                  </div>
                  {loadingLogos && !logosInsight ? (
                    <div className="space-y-4">
                      <div className="h-4 w-full bg-muted animate-pulse rounded-full" />
                      <div className="h-4 w-[90%] bg-muted animate-pulse rounded-full opacity-70" />
                      <div className="h-4 w-[75%] bg-muted animate-pulse rounded-full opacity-40" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-xl sm:text-2xl text-foreground/90 leading-relaxed font-serif italic first-letter:text-5xl first-letter:font-black first-letter:mr-2 first-letter:float-left first-letter:text-secondary selection:bg-secondary/20">
                        {logosInsight}
                      </p>
                      
                      <div className="pt-6 border-t border-secondary/10 flex items-start gap-3 opacity-80">
                        <Icons.CheckCircle className="w-5 h-5 text-secondary shrink-0 mt-1" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Aplicação Prática</p>
                          <p className="text-sm text-muted-foreground italic leading-relaxed">
                            "Busque viver este mistério hoje através de um ato de caridade ou de um momento de silêncio contemplativo."
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                      <ThemeContentCard
                        key={c.id}
                        content={c}
                        index={i}
                        icon={BookOpen}
                        accentColor="text-primary"
                        buttonText="Ler na Bíblia"
                        onAction={() => navigate(`/bible?ref=${encodeURIComponent(c.reference)}&from=temas&tema=${slug}`)}
                      />
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
                      <ThemeContentCard
                        key={c.id}
                        content={c}
                        index={i}
                        icon={Shield}
                        accentColor="text-amber-600"
                        buttonText="Ver no Catecismo"
                        onAction={() => {
                          const paragraph = (c.reference || '').replace(/\D/g, '');
                          navigate(`/catechism?p=${paragraph}&from=temas&tema=${slug}`);
                        }}
                      />
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
                      <ThemeContentCard
                        key={c.id}
                        content={c}
                        index={i}
                        icon={Globe}
                        accentColor="text-blue-600"
                        buttonText="Ver Documento"
                        onAction={() => navigate(`/magisterium?doc=${encodeURIComponent(c.reference)}&from=temas&tema=${slug}`)}
                      />
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
                  onMouseEnter={() => prefetchTag(tag)}
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
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">S. João Paulo II</p>
                <p className="text-[9px] text-muted-foreground/60">Fides et Ratio</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default TemaDetailPage;
