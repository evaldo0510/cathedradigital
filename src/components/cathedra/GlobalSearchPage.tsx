import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import FuzzySearchInput from './FuzzySearchInput';
import RelevanceBadge from './RelevanceBadge';
import SearchResultCard from './SearchResultCard';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { AppRoute } from '@/types';
import { useRovingTabindex } from './TabUtils';
import { useAutoFocus } from '@/hooks/useAutoFocus';
import type { Tables } from '@/integrations/supabase/types';
import ContemplativeLayout from './ContemplativeLayout';
import { ListSkeleton, SearchResultSkeleton, TagSkeleton } from './SacredSkeleton';
import { useRenderPerf } from '@/hooks/useRenderPerf';



type Saint = Tables<'saints'>;
type GlossaryRow = Tables<'glossary'>;
type CommunityPost = Tables<'community_posts'>;
type Tag = Tables<'tags'>;
type Journey = Tables<'journeys'>;

import { useVisualViewport } from '@/hooks/useVisualViewport';

const GlobalSearchPage = React.forwardRef<HTMLDivElement>((_props, ref) => {
  const navigate = useNavigate();
  useRenderPerf('Logos Search', 20);

  useAutoFocus();
  const [query, setQuery] = useState('');
  const viewportHeight = useVisualViewport();
  const [lastHeight, setLastHeight] = useState(viewportHeight);
  const [savedScroll, setSavedScroll] = useState(0);
  
  useEffect(() => {
    if (lastHeight && viewportHeight) {
      const delta = viewportHeight - lastHeight;
      // Keyboard Closing (viewport height increases significantly)
      if (delta > 150) {
        window.scrollTo({ top: savedScroll, behavior: 'smooth' });
      } 
      // Keyboard Opening (viewport height decreases significantly)
      else if (delta < -150) {
        setSavedScroll(window.scrollY);
      }
    }
    setLastHeight(viewportHeight);
  }, [viewportHeight, lastHeight, savedScroll]);

  useEffect(() => {
    if (query.length >= 2 && viewportHeight && viewportHeight < 600) {
      const container = document.getElementById('search-results-container');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [query, viewportHeight]);

  const tagsRef = React.useRef<HTMLDivElement>(null);

  const saints = useFuzzySearch<Saint>({ rpc: 'search_saints_fuzzy', query, primaryField: 'name', secondaryField: 'title', resultLimit: 10 });
  const glossary = useFuzzySearch<GlossaryRow>({ rpc: 'search_glossary_fuzzy', query, primaryField: 'term', secondaryField: 'definition', resultLimit: 10 });
  const community = useFuzzySearch<CommunityPost>({ rpc: 'search_community_posts_fuzzy', query, primaryField: 'title', secondaryField: 'content', resultLimit: 10 });
  const tags = useFuzzySearch<Tag>({ rpc: 'search_tags_fuzzy', query, primaryField: 'label', secondaryField: 'category', resultLimit: 10 });
  const journeys = useFuzzySearch<Journey>({ rpc: 'search_journeys_fuzzy', query, primaryField: 'title', secondaryField: 'description', resultLimit: 10 });

  const anyPending = saints.isPending || glossary.isPending || community.isPending || tags.isPending || journeys.isPending;
  const hasQuery = query.trim().length >= 2;
  const counts = {
    santos: saints.results?.length ?? 0,
    glossario: glossary.results?.length ?? 0,
    comunidade: community.results?.length ?? 0,
    temas: tags.results?.length ?? 0,
    jornadas: journeys.results?.length ?? 0,
  };
  const isAllEmpty = hasQuery && !anyPending && Object.values(counts).every(c => c === 0);
  
  const { activeIndex: tagsActiveIndex, handleKeyDown: handleTagsKeyDown } = useRovingTabindex(tags.results?.length || 0, tagsRef);

  const EmptyState = ({ text }: { text: string }) => (
    <p className="text-center text-premium-sm text-muted-foreground py-spacing-lg">{text}</p>
  );

  return (
    <ContemplativeLayout
      maxW="max-w-4xl w-full"
    >
      <SEOHead 
        title="Logos IA | Sabedoria Teológica e Espiritual" 
        description="Pesquise e dialogue com a Logos IA sobre a Bíblia, Catecismo e Magistério. O seu assistente inteligente para aprofundamento na fé católica." 
        path="/buscar" 
        keywords="logos ia, busca teológica, assistente espiritual, bíblia, catecismo, magistério"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Logos IA", path: "/buscar" }
        ]}
      />
      <div ref={ref} className="editorial-column space-y-spacing-md md:space-y-spacing-2xl">
        <motion.div 
          className={cn(
            "text-center space-y-spacing-sm md:space-y-spacing-md pt-spacing-sm md:pt-spacing-xl transition-all duration-500",
            hasQuery && "hidden md:block"
          )} 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center gap-3" aria-hidden="true">
            <span className="h-px w-10 md:w-16 bg-secondary" />
            <span className="editorial-meta text-secondary">Logos</span>
            <span className="h-px w-10 md:w-16 bg-secondary" />
          </div>
          <h2
            className="editorial-display leading-none text-primary"
            style={{ fontSize: 'clamp(2rem, 6vw, 3.75rem)' }}
          >
            Logos<span className="text-secondary">.</span> IA
          </h2>
          <p className="mx-auto hidden md:block font-serif italic text-muted-foreground text-lg leading-relaxed max-w-[42ch]">
            "No princípio era o Verbo." — Pergunte, pesquise e contemple a Sabedoria da Igreja.
          </p>
        </motion.div>


        {/* LOGOS IA CHAT INTERFACE - STICKY SEARCH ON MOBILE */}
        <div className="sticky top-0 z-[100] -mx-spacing-md md:mx-0 px-spacing-md md:px-0 bg-background/95 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none transition-all duration-300 border-b border-border/10 md:border-none shadow-sm md:shadow-none mb-spacing-md">
          <div className="bg-card/50 md:bg-card md:border border-border/40 md:rounded-[2.5rem] rounded-b-[1.5rem] p-spacing-sm md:p-spacing-2xl md:shadow-premium">
             <FuzzySearchInput
              value={query}
              onChange={setQuery}
              placeholder="Qual é a sua dúvida espiritual hoje?"
              isSearching={anyPending}
              size="lg"
              className="max-w-none shadow-sm md:shadow-none"
            />
          </div>
        </div>



        <div 

          className="space-y-spacing-lg pb-spacing-4xl transition-all duration-300"
          style={{ minHeight: '50vh' }}
          id="search-results-container"
        >
          <div className="flex items-center gap-3 md:gap-5">
            <span className="editorial-meta text-secondary whitespace-nowrap">
              {anyPending ? 'Buscando sabedoria' : 'Resultados'}
            </span>
            <div className="h-px flex-1 bg-secondary/35" />
          </div>



        {anyPending && (
          <div className="mt-spacing-lg">
            <Tabs defaultValue="santos" className="mt-spacing-lg">
              <TabsList className="w-full flex-wrap h-auto gap-spacing-2xs bg-muted/50 p-spacing-2xs rounded-premium-full opacity-60">
                <TabsTrigger value="santos" disabled className="text-premium-xs flex-1">Santos (...)</TabsTrigger>
                <TabsTrigger value="glossario" disabled className="text-premium-xs flex-1">Glossário (...)</TabsTrigger>
                <TabsTrigger value="comunidade" disabled className="text-premium-xs flex-1">Comunidade (...)</TabsTrigger>
              </TabsList>
              <div className="mt-spacing-md">
                <SearchResultSkeleton count={3} />
              </div>
            </Tabs>
          </div>
        )}

        {isAllEmpty && !anyPending && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center py-spacing-2xl space-y-4"
          >
            <span
              className="block mx-auto w-px h-10 bg-secondary/50"
              aria-hidden="true"
            />
            <p className="editorial-display text-2xl italic text-foreground">
              Nenhum resultado encontrado.
            </p>
            <p className="text-premium-sm text-muted-foreground/70">
              Tente termos mais genéricos ou verifique a ortografia.
            </p>
          </motion.div>
        )}



        {hasQuery && !isAllEmpty && (
          <Tabs defaultValue="santos" className="mt-spacing-lg">
            <TabsList className="w-full flex-wrap h-auto gap-spacing-2xs bg-muted/50 p-spacing-2xs rounded-premium-full">
              <TabsTrigger value="santos" className="text-premium-xs flex-1 min-w-[80px]">Santos ({counts.santos})</TabsTrigger>
              <TabsTrigger value="glossario" className="text-premium-xs flex-1 min-w-[80px]">Glossário ({counts.glossario})</TabsTrigger>
              <TabsTrigger value="comunidade" className="text-premium-xs flex-1 min-w-[80px]">Comunidade ({counts.comunidade})</TabsTrigger>
              <TabsTrigger value="temas" className="text-premium-xs flex-1 min-w-[80px]">Temas ({counts.temas})</TabsTrigger>
              <TabsTrigger value="jornadas" className="text-premium-xs flex-1 min-w-[80px]">Jornadas ({counts.jornadas})</TabsTrigger>
            </TabsList>

            <TabsContent value="santos" className="space-y-spacing-xs mt-spacing-md">
              <AnimatePresence mode="popLayout">
              {saints.results?.map((s, i) => (
                <SearchResultCard
                  key={s.id}
                  title={s.name}
                  subtitle={s.title}
                  score={(s as any).similarityScore}
                  icon={<Icons.User className="w-spacing-md h-spacing-md" />}
                  onClick={() => navigate(`/santos/${s.id}`)}
                  index={i}
                />
              ))}
              </AnimatePresence>
              {saints.results?.length === 0 && !saints.isPending && <EmptyState text="Nenhum santo encontrado." />}
              {saints.isPending && <SearchResultSkeleton count={3} />}
            </TabsContent>

            <TabsContent value="glossario" className="space-y-spacing-xs mt-spacing-md">
              <AnimatePresence mode="popLayout">
              {glossary.results?.map((g, i) => (
                <SearchResultCard
                  key={g.id}
                  title={g.term}
                  subtitle={g.definition}
                  score={(g as any).similarityScore}
                  icon={<Icons.BookOpen className="w-spacing-md h-spacing-md" />}
                  onClick={() => navigate(AppRoute.GLOSSARY)}
                  index={i}
                />
              ))}
              </AnimatePresence>
              {glossary.results?.length === 0 && !glossary.isPending && <EmptyState text="Nenhum termo encontrado." />}
              {glossary.isPending && <SearchResultSkeleton count={3} />}
            </TabsContent>

            <TabsContent value="comunidade" className="space-y-spacing-xs mt-spacing-md">
              <AnimatePresence mode="popLayout">
              {community.results?.map((p, i) => (
                <SearchResultCard
                  key={p.id}
                  title={p.title || p.content.slice(0, 60)}
                  subtitle={p.content}
                  score={(p as any).similarityScore}
                  icon={<Icons.MessageCircle className="w-spacing-md h-spacing-md" />}
                  onClick={() => navigate(AppRoute.COMMUNITY)}
                  index={i}
                />
              ))}
              </AnimatePresence>
              {community.results?.length === 0 && !community.isPending && <EmptyState text="Nenhuma discussão encontrada." />}
              {community.isPending && <SearchResultSkeleton count={3} />}
            </TabsContent>

            <TabsContent value="temas" className="space-y-spacing-xs mt-spacing-md">
              <div className="flex flex-wrap gap-spacing-xs" role="list" ref={tagsRef}>
                {tags.results?.map((t, idx) => (
                  <Button
                    key={t.id}
                    role="listitem"
                    onClick={() => navigate(`${AppRoute.TEMAS}/${t.slug}`)}
                    onKeyDown={(e) => handleTagsKeyDown(e, idx, () => navigate(`${AppRoute.TEMAS}/${t.slug}`))}
                    tabIndex={tagsActiveIndex === idx ? 0 : -1}
                    data-roving-item="true"
                    className="inline-flex items-center gap-spacing-2xs px-spacing-md py-spacing-sm min-h-[48px] md:min-h-0 rounded-premium-full bg-muted/60 border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none group"
                    aria-label={`Tema: ${t.label}`}
                  >
                    {t.emoji && <span className="group-hover:scale-110 transition-transform">{t.emoji}</span>}
                    <span className="text-premium-xs font-medium text-foreground group-hover:text-primary">{t.label}</span>
                    <RelevanceBadge score={(t as any).similarityScore} size="xs" />
                  </Button>
                ))}
              </div>
              {tags.results?.length === 0 && !tags.isPending && <EmptyState text="Nenhum tema encontrado." />}
              {tags.isPending && <TagSkeleton count={5} />}
            </TabsContent>

            <TabsContent value="jornadas" className="space-y-spacing-xs mt-spacing-md">
              <AnimatePresence mode="popLayout">
              {journeys.results?.map((j, i) => (
                <SearchResultCard
                  key={j.id}
                  title={j.title}
                  subtitle={j.subtitle}
                  score={(j as any).similarityScore}
                  icon={<Icons.Compass className="w-spacing-md h-spacing-md" />}
                  onClick={() => navigate(`/jornadas/${j.id}`)}
                  index={i}
                />
              ))}
              </AnimatePresence>
              {journeys.results?.length === 0 && !journeys.isPending && <EmptyState text="Nenhuma jornada encontrada." />}
              {journeys.isPending && <SearchResultSkeleton count={3} />}
            </TabsContent>
          </Tabs>
        )}
      </div>

        {!hasQuery && (
          <div className="text-center py-spacing-2xl space-y-4">
            <span
              className="block mx-auto w-px h-10 bg-secondary/50"
              aria-hidden="true"
            />
            <p className="font-serif italic text-lg text-muted-foreground">
              Digite ao menos 2 caracteres para começar.
            </p>
          </div>
        )}

      </div>
    </ContemplativeLayout>
  );
});

GlobalSearchPage.displayName = 'GlobalSearchPage';
export default GlobalSearchPage;
