import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import FuzzySearchInput from './FuzzySearchInput';
import RelevanceBadge from './RelevanceBadge';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import { AppRoute } from '@/types';
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

        {hasQuery && (
          <Tabs defaultValue="santos" className="mt-6">
            <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="santos" className="text-xs flex-1 min-w-[80px]">Santos ({counts.santos})</TabsTrigger>
              <TabsTrigger value="glossario" className="text-xs flex-1 min-w-[80px]">Glossário ({counts.glossario})</TabsTrigger>
              <TabsTrigger value="comunidade" className="text-xs flex-1 min-w-[80px]">Comunidade ({counts.comunidade})</TabsTrigger>
              <TabsTrigger value="temas" className="text-xs flex-1 min-w-[80px]">Temas ({counts.temas})</TabsTrigger>
              <TabsTrigger value="jornadas" className="text-xs flex-1 min-w-[80px]">Jornadas ({counts.jornadas})</TabsTrigger>
            </TabsList>

            <TabsContent value="santos" className="space-y-2 mt-4">
              {saints.results?.map(s => (
                <Card key={s.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate(`${AppRoute.SAINTS}?santo=${s.id}`)}>
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{s.name}</p>
                      {s.title && <p className="text-xs text-muted-foreground truncate">{s.title}</p>}
                    </div>
                    <RelevanceBadge score={(s as any).similarityScore} size="xs" />
                  </CardContent>
                </Card>
              ))}
              {saints.results?.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">Nenhum santo encontrado.</p>}
            </TabsContent>

            <TabsContent value="glossario" className="space-y-2 mt-4">
              {glossary.results?.map(g => (
                <Card key={g.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate(AppRoute.GLOSSARY)}>
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{g.term}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{g.definition}</p>
                    </div>
                    <RelevanceBadge score={(g as any).similarityScore} size="xs" />
                  </CardContent>
                </Card>
              ))}
              {glossary.results?.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">Nenhum termo encontrado.</p>}
            </TabsContent>

            <TabsContent value="comunidade" className="space-y-2 mt-4">
              {community.results?.map(p => (
                <Card key={p.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate(AppRoute.COMMUNITY)}>
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{p.title || p.content.slice(0, 60)}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{p.content}</p>
                    </div>
                    <RelevanceBadge score={(p as any).similarityScore} size="xs" />
                  </CardContent>
                </Card>
              ))}
              {community.results?.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">Nenhuma discussão encontrada.</p>}
            </TabsContent>

            <TabsContent value="temas" className="space-y-2 mt-4">
              <div className="flex flex-wrap gap-2">
                {tags.results?.map(t => (
                  <div key={t.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50">
                    {t.emoji && <span>{t.emoji}</span>}
                    <span className="text-xs font-medium text-foreground">{t.label}</span>
                    <RelevanceBadge score={(t as any).similarityScore} size="xs" />
                  </div>
                ))}
              </div>
              {tags.results?.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">Nenhum tema encontrado.</p>}
            </TabsContent>

            <TabsContent value="jornadas" className="space-y-2 mt-4">
              {journeys.results?.map(j => (
                <Card key={j.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate(`/jornadas/${j.id}`)}>
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{j.title}</p>
                      {j.subtitle && <p className="text-xs text-muted-foreground truncate">{j.subtitle}</p>}
                    </div>
                    <RelevanceBadge score={(j as any).similarityScore} size="xs" />
                  </CardContent>
                </Card>
              ))}
              {journeys.results?.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">Nenhuma jornada encontrada.</p>}
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
