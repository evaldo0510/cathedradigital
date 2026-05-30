import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { normalizeText } from '@/lib/utils';
import { getSearchTermsForTag } from '@/lib/tagNormalization';
import { fetchNexusTagContent } from '@/lib/nexusContent';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft, Sparkles, BookOpen, Quote, Shield, Globe, ExternalLink, CheckCircle, Flame, AlertTriangle } from 'lucide-react';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppRoute } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/SEOHead';
import { BubbleTag, getTagIcon } from './BubbleTag';
import { TagBubble } from './NexusBubbles';
import { useRovingTabindex } from './TabUtils';
import Relatio from './Relatio';

import { useSpiritualProfile } from '@/hooks/useSpiritualProfile';
import { PROFILES, type ProfileId } from './SpiritualQuiz';


interface Tag {
  id: string;
  label: string;
  slug: string;
  emoji: string;
  category: string;
  priorityGroup?: string;
}

interface ThemeContent {
  id: string;
  content_type: string;
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
  onAction,
  allThemes,
  currentTagId
}: { 
  content: ThemeContent; 
  index: number; 
  icon: any; 
  accentColor: string; 
  buttonText: string; 
  onAction: () => void;
  allThemes?: Tag[];
  currentTagId?: string;
}) => {
  const navigate = useNavigate();
  const otherTags = React.useMemo(() => {
    if (!content.tags || !allThemes) return [];
    return content.tags
      .map(tLabel => allThemes.find(at => at.label.toLowerCase() === tLabel.toLowerCase()))
      .filter((t): t is Tag => !!t && t.id !== currentTagId)
      .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
  }, [content.tags, allThemes, currentTagId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="border-border/40 bg-card/30 hover:bg-card transition-all duration-300 rounded-premium overflow-hidden group hover:shadow-premium-hover hover:border-primary/20">
        <CardContent className="p-lg sm:p-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-xs">
              <div className={`p-xs rounded-full ${accentColor.replace('text-', 'bg-')}/10`}>
                <Icon className={`w-md h-md ${accentColor}`} />
              </div>
              <span className={`text-premium-tiny font-black uppercase tracking-widest ${accentColor}`}>{content.reference}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onAction}
              className={`h-xl rounded-full text-premium-tiny font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary gap-2xs px-md transition-all duration-300`}
            >
              {buttonText} <ExternalLink className="w-sm h-sm" />
            </Button>
          </div>
          <p className="text-base sm:text-lg text-foreground/80 leading-relaxed font-serif">
            {content.content_type === 'bible' ? `"${content.text_content}"` : content.text_content}
          </p>
          
          {otherTags.length > 0 && (
            <div className="pt-md border-t border-border/10">
              <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground/60 mb-xs">Conexões relacionadas:</p>
              <div className="flex flex-wrap gap-xs">
                {otherTags.map((tag, idx) => (
                  <BubbleTag
                    key={tag.id}
                    label={tag.label}
                    emoji={tag.emoji}
                    index={idx}
                    size="sm"
                    onClick={() => navigate(`${AppRoute.TEMAS}/${tag.slug}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ContentSkeleton = () => (
  <div className="space-y-4" data-testid="content-skeleton">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="border-border/40 bg-card/20 rounded-premium overflow-hidden">
        <CardContent className="p-lg sm:p-xl space-y-4">
          <div className="flex items-center gap-xs">
            <Skeleton className="w-xl h-xl rounded-full" />
            <Skeleton className="h-sm w-4xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-md w-full" />
            <Skeleton className="h-md w-[90%]" />
            <Skeleton className="h-md w-[70%]" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
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
  const [activeTab, setActiveTab] = useState('bible');
  const [debouncedTab, setDebouncedTab] = useState('bible');
  const relatedRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTab(activeTab);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('themes').select('*').order('name');
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

  const selectedTag = tags?.find(t => t.slug === slug);

  const { data: contents, isLoading: loadingContents, isFetching: isFetchingContents, error: contentError, refetch } = useQuery({
    queryKey: ['tag-contents', selectedTag?.id, debouncedTab],
    queryFn: async ({ signal }) => {
      if (!selectedTag) return [];
      const results = await fetchNexusTagContent(selectedTag, signal);
      return (results || []).map(r => ({
        id: r.id,
        content_type: r.type,
        reference: r.title || (r.type === 'bible' ? 'Escritura' : r.type === 'catechism' ? 'Catecismo' : 'Tradição'),
        title: r.title,
        text_content: r.content_text,
        tags: r.metadata?.tags || []
      }));
    },
    enabled: !!selectedTag,
  });

  const { profileId } = useSpiritualProfile();
  const suggestedSlugs = React.useMemo(() => {
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


  const prefetchTag = useCallback((tag: Tag) => {
    queryClient.prefetchQuery({
      queryKey: ['tag-contents', tag.id, tag.label],
      queryFn: async () => {
        const results = await fetchNexusTagContent(tag);
        return (results || []).map(r => ({
          id: r.id,
          content_type: r.type,
          reference: r.title || (r.type === 'bible' ? 'Escritura' : r.type === 'catechism' ? 'Catecismo' : 'Tradição'),
          title: r.title,
          text_content: r.content_text,
          tags: r.metadata?.tags || []
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
      if (error) {
        console.error('Spiritual insight error:', error);
        // Handle specific status codes if possible via error object
        const status = (error as any).status || (error as any).status_code;
        if (status === 402) {
          window.dispatchEvent(new CustomEvent('ai-status-error', { 
            detail: { type: 'credits_exhausted' } 
          }));
        } else if (status === 429) {
          window.dispatchEvent(new CustomEvent('ai-status-error', { 
            detail: { type: 'rate_limited' } 
          }));
        }
      } else if (data?.insight) {
        setLogosInsight(data.insight);
      } else if (data?.error) {
        // The function might return { error: "..." } with a 200/500 status
        if (data.error.includes('esgotados')) {
          window.dispatchEvent(new CustomEvent('ai-status-error', { 
            detail: { type: 'credits_exhausted' } 
          }));
        }
      }
      setLoadingLogos(false);
    });
  };

  const relatedThemes = React.useMemo(() => {
    if (!tags || !selectedTag) return [];

    // 1) Connections via shared tags in content
    const sharedContentTagIds = new Set<string>();
    contents?.forEach(c => {
      c.tags?.forEach(tLabel => {
        const matchingTag = tags.find(tag => tag.label.toLowerCase() === tLabel.toLowerCase());
        if (matchingTag && matchingTag.id !== selectedTag.id) {
          sharedContentTagIds.add(matchingTag.id);
        }
      });
    });
    const fromContent = tags
      .filter(t => sharedContentTagIds.has(t.id))
      .map(t => ({ ...t, priorityGroup: 'content' }));

    // 2) Connections via the user's spiritual profile (priority signal)
    const profileSlugs = new Set<string>();
    if (profileId) {
      const profile = PROFILES[profileId];
      if (profile) {
        const labels = [profile.theme, profile.pain.label, 'Oração', 'Jesus', 'Fé'];
        tags
          .filter(t => labels.some(l => t.label.toLowerCase().includes(l.toLowerCase())))
          .forEach(t => { if (t.id !== selectedTag.id) profileSlugs.add(t.slug); });
      }
    }
    const fromProfile = tags
      .filter(t =>
        profileSlugs.has(t.slug) &&
        !sharedContentTagIds.has(t.id) &&
        t.id !== selectedTag.id
      )
      .map(t => ({ ...t, priorityGroup: 'profile' }));

    // 3) Same category fallback
    const fromCategory = tags
      .filter(t =>
        t.category && t.category === selectedTag.category &&
        t.id !== selectedTag.id &&
        !sharedContentTagIds.has(t.id) &&
        !profileSlugs.has(t.slug)
      )
      .map(t => ({ ...t, priorityGroup: 'category' }));

    // Dedupe by id, preserve order
    const seen = new Set<string>();
    return [...fromContent, ...fromProfile, ...fromCategory]
      .filter(t => (seen.has(t.id) ? false : (seen.add(t.id), true)))
      .slice(0, 12);
  }, [tags, selectedTag, contents, profileId]);

  const { activeIndex, handleKeyDown: handleRelatedKeyDown } = useRovingTabindex(relatedThemes.length, relatedRef);

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

  const isLoadingAny = loadingContents || isFetchingContents || activeTab !== debouncedTab;

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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-md duration-700 max-w-5xl mx-auto pb-4xl px-md relative">
      <div className={`fixed inset-0 bg-gradient-to-b ${getCategoryColor(selectedTag?.category)} -z-10 pointer-events-none opacity-40`} />
      <SEOHead 
        title={`${selectedTag?.label || 'Tema'} - Cathedra`}
        description={`Explore conteúdos sagrados sobre ${selectedTag?.label}.`}
        path={`/temas/${slug}`}
      />

      <nav className="flex items-center gap-sm text-premium-tiny font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-xl overflow-x-auto whitespace-nowrap pb-xs scrollbar-none">
        <Button 
          onClick={() => navigate(AppRoute.HOME)}
          className="hover:text-primary transition-colors flex items-center gap-2xs"
        >
          <ChevronLeft className="w-sm h-sm" /> Início
        </Button>
        <span className="opacity-30">/</span>
        <Button 
          onClick={() => navigate(AppRoute.TEMAS)}
          className="hover:text-primary transition-colors"
        >
          Temas
        </Button>
        <span className="opacity-30">/</span>
        <Button 
          onClick={() => navigate(`${AppRoute.TEMAS}?category=${selectedTag?.category}`)}
          className="hover:text-primary transition-colors"
        >
          {selectedTag?.category}
        </Button>
        <span className="opacity-30">/</span>
        <span className="text-primary/80">{selectedTag?.label}</span>
      </nav>

      <header className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-lg">
          <div className="flex items-center gap-md">
            <div className="w-3xl h-3xl rounded-premium bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              {selectedTag && getTagIcon(selectedTag.emoji, "w-xl h-xl")}
            </div>
            <div>
              <div className="flex items-center gap-xs mb-2xs">
                <span className="text-premium-tiny font-black uppercase tracking-[0.3em] text-primary/60">{selectedTag?.category}</span>
                <div className="w-2xs h-2xs rounded-premium bg-primary/30" />
                <Badge variant="outline" className="text-premium-tiny font-black uppercase tracking-widest border-primary/20 text-primary/70">Nexus</Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">{selectedTag?.label}</h1>
            </div>
          </div>

          <Relatio 
            context={{
              type: 'theme',
              id: selectedTag?.id,
              tags: [selectedTag?.label || '', selectedTag?.category || '', 'Tema Espiritual']
            }}
            onNavigateToBible={(abbr, ch) => navigate(`/bible?book=${abbr}&chapter=${ch}`)}
            onNavigateToCIC={(p) => navigate(`/catechism?p=${p}`)}
            onNavigateToDoc={(docId) => navigate(`/magisterium/${docId}`)}
            className="mb-xl"
          />

          <Button 
            onClick={handleLoadInsight}

            disabled={loadingLogos || !!logosInsight}
            className="rounded-full h-2xl px-xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-premium-hover shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
            {loadingLogos ? (
              <Loader2 className="w-md h-md animate-spin" />
            ) : (
              <>
                <Sparkles className="w-md h-md mr-xs group-hover:rotate-12 transition-transform" />
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
              <div className="absolute inset-0 bg-secondary/5 rounded-premium-lg" />
              <Card className="border-secondary/30 bg-card rounded-premium overflow-hidden relative z-10 shadow-premium">
                <CardContent className="p-xl sm:p-xl">
                  <div className="flex items-center justify-between mb-xl">
                    <div className="flex items-center gap-sm">
                      <div className="w-2xl h-2xl rounded-premium bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-inner">
                        <Sparkles className="w-lg h-lg text-secondary" />
                      </div>
                      <div>
                        <p className="text-premium-small font-black uppercase tracking-[0.3em] text-secondary">Logos Theologicus</p>
                        <p className="text-sm text-muted-foreground font-medium">Sentido & Aplicação</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-premium-tiny font-black uppercase tracking-widest border-secondary/20 text-secondary animate-pulse px-sm">IA Ativa</Badge>
                  </div>
                  {loadingLogos && !logosInsight ? (
                    <div className="space-y-4">
                      <div className="h-md w-full bg-muted animate-pulse rounded-premium" />
                      <div className="h-md w-[90%] bg-muted animate-pulse rounded-premium opacity-70" />
                      <div className="h-md w-[75%] bg-muted animate-pulse rounded-premium opacity-40" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-xl sm:text-2xl text-foreground/90 leading-relaxed font-serif italic first-letter:text-5xl first-letter:font-black first-letter:mr-xs first-letter:float-left first-letter:text-secondary selection:bg-secondary/20">
                        {logosInsight}
                      </p>
                      
                      <div className="pt-lg border-t border-secondary/10 flex items-start gap-sm opacity-80">
                        <Icons.CheckCircle className="w-md h-md text-secondary shrink-0 mt-2xs" />
                        <div>
                          <p className="text-premium-tiny font-black uppercase tracking-widest text-secondary mb-2xs">Aplicação Prática</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
        <div className="md:col-span-2 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-muted/40 p-2xs rounded-full border border-border/40 grid grid-cols-4">
              <TabsTrigger value="bible" className="rounded-full text-premium-tiny font-black uppercase tracking-widest py-xs">Escrituras</TabsTrigger>
              <TabsTrigger value="tradition" className="rounded-full text-premium-tiny font-black uppercase tracking-widest py-xs">Tradição</TabsTrigger>
              <TabsTrigger value="magisterium" className="rounded-full text-premium-tiny font-black uppercase tracking-widest py-xs">Magistério</TabsTrigger>
              <TabsTrigger value="journeys" className="rounded-full text-premium-tiny font-black uppercase tracking-widest py-xs">Jornadas</TabsTrigger>
            </TabsList>

            {contentError ? (
              <div className="p-2xl text-center space-y-4 bg-red-500/5 rounded-[2rem] border border-red-500/10">
                <AlertTriangle className="w-2xl h-2xl text-red-500 mx-auto" />
                <p className="text-lg font-bold text-red-600">Erro ao carregar conexões de {activeTab === 'bible' ? 'Escrituras' : activeTab === 'tradition' ? 'Tradição' : activeTab === 'magisterium' ? 'Magistério' : 'Jornadas'} no Nexus</p>
                <p className="text-sm text-muted-foreground italic max-w-md mx-auto">
                  Não foi possível estabelecer uma conexão estável com o banco de dados teológico. Por favor, tente novamente em alguns instantes.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    refetch();
                  }} 
                  className="h-xl rounded-full px-lg"
                  disabled={isLoadingAny}
                  aria-busy={isLoadingAny}
                  aria-live="polite"
                  data-testid="retry-button"
                >
                  {isFetchingContents || isLoadingAny ? (
                    "Processando..."
                  ) : (
                    "Tentar Novamente"
                  )}
                </Button>
              </div>
            ) : (
            <>
            <TabsContent value="bible" className="mt-lg space-y-4">
              {isLoadingAny ? (
                <ContentSkeleton />
              ) : bibleVerses.length > 0 ? (
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
                        allThemes={tags}
                        currentTagId={selectedTag?.id}
                      />
                    ))}
                  </div>
                  {bibleLimit < bibleVerses.length && (
                    <div className="pt-md flex justify-center">
                      <Button 
                        variant="ghost" 
                        onClick={() => setBibleLimit(prev => prev + 5)}
                        className="rounded-full text-premium-tiny font-black uppercase tracking-widest gap-xs"
                      >
                        Carregar mais escrituras ({bibleVerses.length - bibleLimit})
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-2xl text-muted-foreground italic">Nenhum versículo catalogado para este tema.</div>
              )}
            </TabsContent>

            <TabsContent value="tradition" className="mt-lg space-y-4">
              {isLoadingAny ? (
                <ContentSkeleton />
              ) : catechism.length > 0 ? (
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
                        allThemes={tags}
                        currentTagId={selectedTag?.id}
                      />
                    ))}
                  </div>
                  {traditionLimit < catechism.length && (
                    <div className="pt-md flex justify-center">
                      <Button 
                        variant="ghost" 
                        onClick={() => setTraditionLimit(prev => prev + 5)}
                        className="rounded-full text-premium-tiny font-black uppercase tracking-widest gap-xs"
                      >
                        Carregar mais Tradição ({catechism.length - traditionLimit})
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-2xl text-muted-foreground italic">Conteúdo da Tradição em aprofundamento.</div>
              )}
            </TabsContent>

            <TabsContent value="magisterium" className="mt-lg space-y-4">
              {isLoadingAny ? (
                <ContentSkeleton />
              ) : magisterium.length > 0 ? (
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
                        allThemes={tags}
                        currentTagId={selectedTag?.id}
                      />
                    ))}
                  </div>
                  {magisteriumLimit < magisterium.length && (
                    <div className="pt-md flex justify-center">
                      <Button 
                        variant="ghost" 
                        onClick={() => setMagisteriumLimit(prev => prev + 5)}
                        className="rounded-full text-premium-tiny font-black uppercase tracking-widest gap-xs"
                      >
                        Carregar mais Magistério ({magisterium.length - magisteriumLimit})
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-2xl text-muted-foreground italic">Documentos do Magistério em aprofundamento.</div>
              )}
            </TabsContent>
            
            <TabsContent value="journeys" className="mt-lg space-y-4">
              {isLoadingAny ? (
                <ContentSkeleton />
              ) : journeys.length > 0 ? (
                <div className="space-y-4">
                  {journeys.map((c, i) => (
                    <ThemeContentCard
                      key={c.id}
                      content={c}
                      index={i}
                      icon={Flame}
                      accentColor="text-orange-500"
                      buttonText="Iniciar Jornada"
                      onAction={() => navigate(`/jornadas/${c.id}`)}
                      allThemes={tags}
                      currentTagId={selectedTag?.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-2xl text-muted-foreground italic">Nenhuma jornada específica vinculada a este tema.</div>
              )}
            </TabsContent>
            </>
            )}
          </Tabs>
        </div>

        <aside className="space-y-6">
          <div className="bg-card border border-border/40 rounded-[2rem] p-lg space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground/60">Temas Relacionados</h3>
            <div ref={relatedRef} className="flex flex-wrap gap-xs">
              {relatedThemes.length > 0 ? (
                relatedThemes.map((tag, idx) => (
                  <TagBubble 
                    key={tag.id}
                    tag={tag}
                    index={idx}
                    isSuggested={suggestedSlugs.has(tag.slug)}
                    onKeyDown={(e) => handleRelatedKeyDown(e, idx, () => navigate(`${AppRoute.TEMAS}/${tag.slug}`))}
                    tabIndex={activeIndex === idx ? 0 : -1}
                    size="sm"
                    profileId={profileId as ProfileId}
                    navigateOnClick={true}
                    priorityGroup={tag.priorityGroup}
                  />
                ))
              ) : (
                <p className="text-premium-tiny text-muted-foreground italic leading-relaxed">
                  Estamos tecendo novas conexões para este tema.
                </p>
              )}
            </div>
          </div>

          <Card className="border-primary/20 bg-primary/5 rounded-[2rem] overflow-hidden">
            <CardContent className="p-lg space-y-4">
              <div className="w-xl h-xl rounded-premium bg-primary/20 flex items-center justify-center">
                <Quote className="w-md h-md text-primary" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                "A fé e a razão são como as duas asas com as quais o espírito humano se eleva à contemplação da verdade."
              </p>
              <div className="pt-xs">
                <p className="text-premium-tiny font-black uppercase tracking-widest text-primary">S. João Paulo II</p>
                <p className="text-premium-tiny text-muted-foreground/60">Fides et Ratio</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default TemaDetailPage;
