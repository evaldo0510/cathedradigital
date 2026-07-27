/**
 * CollectionCompletionCTA — Reflexão final + recomendações Nexus.
 * Sprint Coleções Temáticas · Onda 1 (recomendações).
 *
 * Aparece somente quando o usuário concluiu 100% dos itens da coleção.
 * Lê `collection.metadata.related_slugs: string[]` para sugerir próximas
 * trilhas. Se ausente, cai em `collections.featured = true` (exceto a atual).
 */
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Sparkles, ScrollText } from 'lucide-react';
import type { Collection } from './types';
import { trackCollectionEvent } from './collectionAnalytics';

interface Props {
  collection: Collection;
  reflection?: string;
}

interface Suggestion {
  slug: string;
  title: string;
  subtitle: string | null;
  cover: string | null;
}

async function fetchSuggestions(
  currentSlug: string,
  relatedSlugs: string[],
): Promise<Suggestion[]> {
  if (relatedSlugs.length > 0) {
    const { data } = await supabase
      .from('collections')
      .select('slug,title,subtitle,cover')
      .eq('status', 'published')
      .in('slug', relatedSlugs)
      .limit(3);
    return (data ?? []) as Suggestion[];
  }
  // Fallback: coleções em destaque (excluindo a atual).
  const { data } = await supabase
    .from('collections')
    .select('slug,title,subtitle,cover')
    .eq('status', 'published')
    .eq('featured', true)
    .neq('slug', currentSlug)
    .limit(3);
  return (data ?? []) as Suggestion[];
}

export const CollectionCompletionCTA: React.FC<Props> = ({
  collection,
  reflection,
}) => {
  const relatedSlugs = Array.isArray(collection.metadata?.related_slugs)
    ? (collection.metadata.related_slugs as string[]).filter(Boolean)
    : [];

  const { data: suggestions = [] } = useQuery({
    queryKey: ['collection-suggestions', collection.slug, relatedSlugs.join(',')],
    queryFn: () => fetchSuggestions(collection.slug, relatedSlugs),
    staleTime: 5 * 60 * 1000,
  });

  // Analytics: dispara uma vez por sessão desta coleção quando o bloco de
  // recomendações Nexus estiver visível (o usuário concluiu 100%).
  const emittedRef = useRef(false);
  useEffect(() => {
    if (emittedRef.current) return;
    emittedRef.current = true;
    trackCollectionEvent('collection_completed', {
      collection_id: collection.id,
      collection_slug: collection.slug,
      collection_title: collection.title,
      category: collection.category,
      difficulty_level: collection.difficulty_level ?? null,
      estimated_reading_time_minutes:
        collection.estimated_reading_time_minutes ?? null,
      has_certificate: Boolean(collection.certificate_eligible),
      extra: { recommendations_count: suggestions.length },
    });
  }, [collection, suggestions.length]);

  return (
    <section
      aria-labelledby="collection-completion-heading"
      className="mt-spacing-2xl rounded-2xl border border-primary/20 bg-primary/[0.03] p-spacing-lg md:p-spacing-xl"
    >
      <div className="grid gap-spacing-xl md:grid-cols-[1.2fr_1fr]">
        {/* Reflexão final */}
        <div className="space-y-spacing-md">
          <div className="inline-flex items-center gap-spacing-xs text-[10px] font-black uppercase tracking-[0.25em] text-primary">
            <Sparkles className="w-4 h-4" aria-hidden />
            Coleção concluída
          </div>
          <h2
            id="collection-completion-heading"
            className="font-serif text-premium-2xl md:text-premium-3xl text-foreground leading-tight"
          >
            Reflexão final
          </h2>
          <p className="font-serif text-premium-md text-muted-foreground leading-relaxed">
            {reflection ??
              `Você percorreu ${collection.title}. Guarde o que tocou seu coração e deixe que a graça continue seu trabalho em silêncio. Que os próximos passos aprofundem o que foi semeado aqui.`}
          </p>
        </div>

        {/* Próximos passos via Nexus */}
        {suggestions.length > 0 && (
          <div className="space-y-spacing-sm" data-testid="collection-nexus-recommendations">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">
              Agora recomendamos
            </h3>
            <div className="space-y-spacing-xs">
              {suggestions.map((s) => (
                <Link
                  key={s.slug}
                  to={`/colecoes/${s.slug}`}
                  className="group flex items-center gap-spacing-sm p-spacing-sm rounded-xl border border-border/60 bg-card/60 hover:bg-primary/5 hover:border-primary/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                    <ScrollText className="w-5 h-5" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-premium-md text-foreground truncate">
                      {s.title}
                    </p>
                    {s.subtitle && (
                      <p className="text-premium-xs text-muted-foreground truncate">
                        {s.subtitle}
                      </p>
                    )}
                  </div>
                  <ArrowRight
                    className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform flex-shrink-0"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CollectionCompletionCTA;
