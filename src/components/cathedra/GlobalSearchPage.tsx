import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
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
import { ListSkeleton } from './SacredSkeleton';


type Saint = Tables<'saints'>;
type GlossaryRow = Tables<'glossary'>;
type CommunityPost = Tables<'community_posts'>;
type Tag = Tables<'tags'>;
type Journey = Tables<'journeys'>;

import { useVisualViewport } from '@/hooks/useVisualViewport';

const GlobalSearchPage = React.forwardRef<HTMLDivElement>((_props, ref) => {
  const navigate = useNavigate();
  useAutoFocus();
  const [query, setQuery] = useState('');
  const viewportHeight = useVisualViewport();
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
      subtitle="O Verbo de Deus"
      title="Logos IA"
      maxW="max-w-spacing-4xl"
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
      <div ref={ref} className="space-y-spacing-md md:space-y-spacing-2xl">
        <motion.div 
          className={cn(
            "text-center space-y-spacing-xs md:space-y-spacing-md pt-spacing-sm md:pt-spacing-xl transition-all duration-500",
            hasQuery && "hidden md:block"
          )} 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-spacing-xl h-spacing-xl md:w-spacing-3xl md:h-spacing-3xl rounded-[1rem] md:rounded-[2rem] bg-primary flex items-center justify-center mx-auto shadow-premium transform -rotate-3 hover:rotate-0 transition-transform duration-500" aria-hidden="true">
            <Icons.Search className="w-spacing-sm h-spacing-sm md:w-spacing-xl md:h-spacing-xl text-white" />
          </div>
          <h2 className="text-premium-xl md:text-premium-5xl font-bold font-serif text-foreground uppercase tracking-widest leading-tight">Logos IA</h2>
          <p className="text-muted-foreground font-serif italic text-premium-sm md:text-premium-lg max-w-spacing-lg mx-auto leading-relaxed hidden md:block">
            "No princípio era o Verbo..." — Pergunte, pesquise e contemple a Sabedoria da Igreja.
          </p>
        </motion.div>

        {/* LOGOS IA CHAT INTERFACE - STICKY SEARCH ON MOBILE */}
        <div className="sticky top-0 z-[100] -mx-spacing-md md:mx-0 px-spacing-md md:px-0 bg-background/80 backdrop-blur-md md:bg-transparent md:backdrop-blur-none transition-all duration-300">
          <div className="bg-card md:border border-border/40 md:rounded-[2.5rem] rounded-b-[1.5rem] p-spacing-lg md:p-spacing-2xl md:shadow-premium space-y-spacing-md md:space-y-spacing-xl">
             <div className={cn("flex flex-col gap-spacing-xs md:gap-spacing-md", hasQuery && "hidden md:flex")}>
                <div className="flex items-center gap-spacing-sm">
                   <div className="w-spacing-xl h-spacing-xl rounded-premium-full bg-primary/10 flex items-center justify-center">
                      <Icons.Sparkles className="w-spacing-md h-spacing-md text-primary" />
                   </div>
                   <h2 className="text-premium-xs font-black uppercase tracking-widest text-primary">Conversa com Logos</h2>
                </div>
                <p className="text-premium-sm text-muted-foreground leading-relaxed">
                  Logos é o seu assistente teológico. Você pode perguntar sobre passagens bíblicas, parágrafos do catecismo ou ensinamentos do Magistério.
                </p>
             </div>
             
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
          style={{ maxHeight: viewportHeight ? `${viewportHeight - 200}px` : 'auto', overflowY: 'auto' }}
        >
          <div className="flex items-center gap-spacing-md md:gap-spacing-xl">
            <h2 className="text-[10px] md:text-premium-xs font-bold uppercase tracking-[0.2em] md:tracking-[0.5em] text-primary/60 whitespace-nowrap">
              Resultados da Pesquisa
            </h2>
            <div className="h-px flex-1 bg-border/30" />
          </div>

        {anyPending && (
          <div className="mt-spacing-xl">
            <ListSkeleton count={4} />
          </div>
        )}

        {isAllEmpty && !anyPending && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center py-spacing-2xl space-y-spacing-md"
          >
            <Icons.Search className="w-spacing-2xl h-spacing-2xl mx-auto text-muted-foreground opacity-20" />
            <div className="space-y-spacing-xs">
              <p className="text-premium-lg font-serif italic text-muted-foreground">Nenhum resultado encontrado.</p>
              <p className="text-premium-sm text-muted-foreground/60">Tente buscar por termos mais genéricos ou verifique a ortografia.</p>
            </div>
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
              {saints.results?.length === 0 && <EmptyState text="Nenhum santo encontrado." />}
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
              {glossary.results?.length === 0 && <EmptyState text="Nenhum termo encontrado." />}
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
              {community.results?.length === 0 && <EmptyState text="Nenhuma discussão encontrada." />}
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
                    className="inline-flex items-center gap-spacing-2xs px-spacing-sm py-spacing-2xs rounded-premium-full bg-muted/60 border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none group"
                    aria-label={`Tema: ${t.label}`}
                  >
                    {t.emoji && <span className="group-hover:scale-110 transition-transform">{t.emoji}</span>}
                    <span className="text-premium-xs font-medium text-foreground group-hover:text-primary">{t.label}</span>
                    <RelevanceBadge score={(t as any).similarityScore} size="xs" />
                  </Button>
                ))}
              </div>
              {tags.results?.length === 0 && <EmptyState text="Nenhum tema encontrado." />}
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
              {journeys.results?.length === 0 && <EmptyState text="Nenhuma jornada encontrada." />}
            </TabsContent>
          </Tabs>
        )}
      </div>

        {!hasQuery && (
          <div className="text-center py-spacing-2xl text-muted-foreground">
            <Icons.Search className="w-spacing-2xl h-spacing-2xl mx-auto opacity-20 mb-spacing-md" />
            <p className="text-premium-sm">Digite pelo menos 2 caracteres para buscar</p>
          </div>
        )}
      </div>
    </ContemplativeLayout>
  );
});

GlobalSearchPage.displayName = 'GlobalSearchPage';
export default GlobalSearchPage;
