import { supabase } from '@/integrations/supabase/client';
import { getSearchTermsForTag } from './tagNormalization';
import { getAllLocalCatechism } from '@/data/catechism';

export interface TagContent {
  id: string;
  type: string;
  content_text: string;
  title: string;
  metadata: any;
}

/**
 * Standardizes the formatting of spiritual and journey content.
 */
export function formatNexusContent(data: any, type: string): TagContent {
  const isJourney = type === 'journey';
  
  if (isJourney) {
    return {
      id: data.id,
      type: 'journey',
      content_text: data.description || data.subtitle || '',
      title: data.title || 'Jornada Espiritual',
      metadata: { ...data, is_direct_journey: true }
    };
  }

  // Spiritual contents (Bible, Catechism, Magisterium)
  let fallbackReference = 'Tradição';
  if (data.type === 'bible') fallbackReference = 'Escritura';
  else if (data.type === 'catechism') fallbackReference = 'Catecismo';
  else if (data.type === 'magisterium') fallbackReference = 'Magistério';

  return {
    id: data.id,
    type: data.type,
    content_text: data.content_text || '',
    title: data.reference_id || data.title || fallbackReference,
    metadata: {
      ...(data.metadata || {}),
      tags: data.tags || []
    }
  };
}

export interface NexusSearchParams {
  mode: 'tags' | 'title' | 'reference' | 'text' | 'all';
  includeSynonyms: boolean;
}

export interface NexusDiagnosticLog {
  stage: string;
  query: string;
  resultsCount: number;
  termsUsed: string[];
  timestamp: string;
}

/**
 * Fetches and formats content for a specific tag with advanced search support.
 */
export async function fetchNexusTagContent(
  tag: { label: string; slug: string; id?: string }, 
  params: NexusSearchParams = { mode: 'tags', includeSynonyms: true },
  signal?: AbortSignal
): Promise<{ content: TagContent[], logs: NexusDiagnosticLog[] }> {
  const logs: NexusDiagnosticLog[] = [];
  
  // 1. Term Expansion Stage
  const baseTerms = getSearchTermsForTag(tag);
  let searchTerms = [...baseTerms];
  
  if (params.includeSynonyms) {
    const { data: dbSynonyms } = await supabase
      .from('nexus_synonyms')
      .select('term')
      .eq('canonical_slug', tag.slug);
    
    if (dbSynonyms && dbSynonyms.length > 0) {
      const manualSynonyms = dbSynonyms.map(s => s.term);
      searchTerms = Array.from(new Set([...searchTerms, ...manualSynonyms]));
    }
  }

  logs.push({
    stage: 'Term Expansion',
    query: tag.label,
    resultsCount: searchTerms.length,
    termsUsed: searchTerms,
    timestamp: new Date().toISOString()
  });

  const content: TagContent[] = [];

  // 2. Querying Stage
  // Depending on the mode, we build the query differently
  const buildQuery = (tableName: any) => {
    let query = supabase.from(tableName).select('*');
    
    if (params.mode === 'tags') {
      query = query.overlaps('tags', searchTerms);
    } else if (params.mode === 'title') {
      const orCondition = searchTerms.map(t => `title.ilike.%${t}%`).join(',');
      query = query.or(orCondition);
    } else if (params.mode === 'reference') {
      if (tableName === 'spiritual_contents') {
        const orCondition = searchTerms.map(t => `reference_id.ilike.%${t}%`).join(',');
        query = query.or(orCondition);
      } else {
        const orCondition = searchTerms.map(t => `title.ilike.%${t}%`).join(',');
        query = query.or(orCondition);
      }
    } else if (params.mode === 'text') {
      const field = tableName === 'journeys' ? 'description' : 
                    tableName === 'theme_contents' ? 'text_content' : 'content_text';
      const orCondition = searchTerms.map(t => `${field}.ilike.%${t}%`).join(',');
      query = query.or(orCondition);
    } else {
      const field = tableName === 'journeys' ? 'description' : 
                    tableName === 'theme_contents' ? 'text_content' : 'content_text';
      // Fallback to tags + title for 'all' mode to avoid complex OR logic across types
      query = query.or(`tags.overlaps.{${searchTerms.join(',')}},title.ilike.%${searchTerms[0]}%`);
    }
    
    return query.limit(15);
  };

  const spiritualQuery = buildQuery('spiritual_contents');
  const journeyQuery = buildQuery('journeys');
  const themeContentQuery = tag.id ? supabase.from('theme_contents').select('*').eq('theme_id', tag.id).limit(10) : null;

  if (signal) {
    spiritualQuery.abortSignal(signal);
    journeyQuery.abortSignal(signal);
    if (themeContentQuery) themeContentQuery.abortSignal(signal);
  }

  const queries: any[] = [spiritualQuery, journeyQuery];
  if (themeContentQuery) queries.push(themeContentQuery);

  const results = await Promise.all(queries);
  
  const spiritualResponse = results[0];
  const journeyResponse = results[1];
  const themeContentResponse = results[2];

  if (spiritualResponse.error) {
    console.error('Spiritual query error:', spiritualResponse.error);
    logs.push({ stage: 'DB Query (Spiritual)', query: params.mode, resultsCount: 0, termsUsed: searchTerms, timestamp: new Date().toISOString() });
  } else {
    const data = spiritualResponse.data || [];
    content.push(...data.map((d: any) => formatNexusContent(d, d.type)));
    logs.push({ stage: 'DB Query (Spiritual)', query: params.mode, resultsCount: data.length, termsUsed: searchTerms, timestamp: new Date().toISOString() });
  }

  if (journeyResponse.error) {
    console.error('Journey query error:', journeyResponse.error);
    logs.push({ stage: 'DB Query (Journeys)', query: params.mode, resultsCount: 0, termsUsed: searchTerms, timestamp: new Date().toISOString() });
  } else {
    const data = journeyResponse.data || [];
    content.push(...data.map((d: any) => formatNexusContent(d, 'journey')));
    logs.push({ stage: 'DB Query (Journeys)', query: params.mode, resultsCount: data.length, termsUsed: searchTerms, timestamp: new Date().toISOString() });
  }

  if (themeContentResponse && !themeContentResponse.error) {
    const data = themeContentResponse.data || [];
    content.push(...data.map((d: any) => ({
      id: d.id,
      type: d.content_type,
      content_text: d.text_content || '',
      title: d.reference || d.title || 'Tradição',
      metadata: { ...d, is_theme_content: true }
    })));
    logs.push({ stage: 'DB Query (Theme Contents)', query: 'theme_id', resultsCount: data.length, termsUsed: [tag.id!], timestamp: new Date().toISOString() });
  }


  // 3. Local Data Stage
  const normalizedSearchTerms = searchTerms.map(t => t.toLowerCase().replace(/[-_]/g, ' '));
  const localCatechism = getAllLocalCatechism()
    .filter(cat => cat.tags.some(t => {
      const nt = t.toLowerCase().replace(/[-_]/g, ' ');
      return normalizedSearchTerms.includes(nt) || searchTerms.includes(t);
    }))
    .map(cat => ({
      id: cat.id,
      type: 'catechism',
      content_text: cat.conteudo,
      title: `Catecismo §${cat.paragraph}`,
      metadata: { ...cat, tags: cat.tags }
    }));
  
  content.push(...localCatechism);
  logs.push({ stage: 'Local Search (Catechism)', query: 'tags_match', resultsCount: localCatechism.length, termsUsed: normalizedSearchTerms, timestamp: new Date().toISOString() });

  // Unique by ID
  const uniqueContent = Array.from(new Map(content.map(item => [item.id, item])).values());
  
  return { content: uniqueContent, logs };
}


