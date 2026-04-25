import React, { useState } from 'react';
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
import type { Tables } from '@/integrations/supabase/types';

type Saint = Tables<'saints'>;
type GlossaryRow = Tables<'glossary'>;
type CommunityPost = Tables<'community_posts'>;
type Tag = Tables<'tags'>;
type Journey = Tables<'journeys'>;

const GlobalSearchPage = React.forwardRef<HTMLDivElement>((_props, ref) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

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

  const EmptyState = ({ text }: { text: string }) => (
    <p className="text-center text-sm text-muted-foreground py-6">{text}</p>
  );

  return (
    <>
      <SEOHead title="Busca Global" description="Pesquise santos, glossário, discussões, temas e jornadas em um só lugar." path="/buscar" />
      <div ref={ref} className="space-y-6 max-w-2xl mx-auto pb-24 px-2 sm:px-4">
        <motion.div className="text-center space-y-3 pt-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Icons.Search className="w-8 h-8 mx-auto text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-foreground">Busca Global</h1>
          <p className="text-muted-foreground font-serif italic text-sm">Encontre tudo em um só lugar</p>
        </motion.div>

        <FuzzySearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar santos, termos, discussões, temas, jornadas…"
          isSearching={anyPending}
          size="lg"
          className="max-w-xl mx-auto"
        />

        {isAllEmpty && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center py-12 space-y-4"
          >
            <Icons.Search className="w-12 h-12 mx-auto text-muted-foreground opacity-20" />
            <div className="space-y-2">
              <p className="text-lg font-serif italic text-muted-foreground">Nenhum resultado encontrado.</p>
              <p className="text-sm text-muted-foreground/60">Tente buscar por termos mais genéricos ou verifique a ortografia.</p>
            </div>
          </motion.div>
        )}

        {hasQuery && !isAllEmpty && (
          <Tabs defaultValue="santos" className="mt-6">
            <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="santos" className="text-xs flex-1 min-w-[80px]">Santos ({counts.santos})</TabsTrigger>
              <TabsTrigger value="glossario" className="text-xs flex-1 min-w-[80px]">Glossário ({counts.glossario})</TabsTrigger>
              <TabsTrigger value="comunidade" className="text-xs flex-1 min-w-[80px]">Comunidade ({counts.comunidade})</TabsTrigger>
              <TabsTrigger value="temas" className="text-xs flex-1 min-w-[80px]">Temas ({counts.temas})</TabsTrigger>
              <TabsTrigger value="jornadas" className="text-xs flex-1 min-w-[80px]">Jornadas ({counts.jornadas})</TabsTrigger>
            </TabsList>

            <TabsContent value="santos" className="space-y-2 mt-4">
              <AnimatePresence mode="popLayout">
              {saints.results?.map((s, i) => (
                <SearchResultCard
                  key={s.id}
                  title={s.name}
                  subtitle={s.title}
                  score={(s as any).similarityScore}
                  icon={<Icons.User className="w-4 h-4" />}
                  onClick={() => navigate(`/santos/${s.id}`)}
                  index={i}
                />
              ))}
              </AnimatePresence>
              {saints.results?.length === 0 && <EmptyState text="Nenhum santo encontrado." />}
            </TabsContent>

            <TabsContent value="glossario" className="space-y-2 mt-4">
              <AnimatePresence mode="popLayout">
              {glossary.results?.map((g, i) => (
                <SearchResultCard
                  key={g.id}
                  title={g.term}
                  subtitle={g.definition}
                  score={(g as any).similarityScore}
                  icon={<Icons.BookOpen className="w-4 h-4" />}
                  onClick={() => navigate(AppRoute.GLOSSARY)}
                  index={i}
                />
              ))}
              </AnimatePresence>
              {glossary.results?.length === 0 && <EmptyState text="Nenhum termo encontrado." />}
            </TabsContent>

            <TabsContent value="comunidade" className="space-y-2 mt-4">
              <AnimatePresence mode="popLayout">
              {community.results?.map((p, i) => (
                <SearchResultCard
                  key={p.id}
                  title={p.title || p.content.slice(0, 60)}
                  subtitle={p.content}
                  score={(p as any).similarityScore}
                  icon={<Icons.MessageCircle className="w-4 h-4" />}
                  onClick={() => navigate(AppRoute.COMMUNITY)}
                  index={i}
                />
              ))}
              </AnimatePresence>
              {community.results?.length === 0 && <EmptyState text="Nenhuma discussão encontrada." />}
            </TabsContent>

            <TabsContent value="temas" className="space-y-2 mt-4">
              <div className="flex flex-wrap gap-2" role="list">
                {tags.results?.map(t => (
                  <button
                    key={t.id}
                    role="listitem"
                    onClick={() => navigate(`${AppRoute.TEMAS}/${t.slug}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none group"
                    aria-label={`Tema: ${t.label}`}
                  >
                    {t.emoji && <span className="group-hover:scale-110 transition-transform">{t.emoji}</span>}
                    <span className="text-xs font-medium text-foreground group-hover:text-primary">{t.label}</span>
                    <RelevanceBadge score={(t as any).similarityScore} size="xs" />
                  </button>
                ))}
              </div>
              {tags.results?.length === 0 && <EmptyState text="Nenhum tema encontrado." />}
            </TabsContent>

            <TabsContent value="jornadas" className="space-y-2 mt-4">
              <AnimatePresence mode="popLayout">
              {journeys.results?.map((j, i) => (
                <SearchResultCard
                  key={j.id}
                  title={j.title}
                  subtitle={j.subtitle}
                  score={(j as any).similarityScore}
                  icon={<Icons.Compass className="w-4 h-4" />}
                  onClick={() => navigate(`/jornadas/${j.id}`)}
                  index={i}
                />
              ))}
              </AnimatePresence>
              {journeys.results?.length === 0 && <EmptyState text="Nenhuma jornada encontrada." />}
            </TabsContent>
          </Tabs>
        )}

        {!hasQuery && (
          <div className="text-center py-12 text-muted-foreground">
            <Icons.Search className="w-12 h-12 mx-auto opacity-20 mb-4" />
            <p className="text-sm">Digite pelo menos 2 caracteres para buscar</p>
          </div>
        )}
      </div>
    </>
  );
});

GlobalSearchPage.displayName = 'GlobalSearchPage';
export default GlobalSearchPage;
