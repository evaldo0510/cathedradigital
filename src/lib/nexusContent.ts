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
 * Ensures references are never empty and have meaningful fallbacks.
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

/**
 * Fetches and formats content for a specific tag.
 */
// STAB-003A: aceita apenas UUID v1-v5 para evitar `theme_id=eq.undefined`
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

export async function fetchNexusTagContent(tag: { label: string; slug: string; id?: string }, signal?: AbortSignal): Promise<TagContent[]> {
  const searchTerms = getSearchTermsForTag(tag);

  const spiritualQuery = supabase
    .from('spiritual_contents')
    .select('*')
    .overlaps('tags', searchTerms)
    .limit(15);

  const journeyQuery = supabase
    .from('journeys')
    .select('*')
    .overlaps('tags', searchTerms)
    .limit(10);

  // STAB-003A: só consulta theme_contents quando há theme_id UUID válido.
  // Antes: `.eq('theme_id', (tag as any).id)` disparava `theme_id=eq.undefined`
  // no viewer do Magistério, gerando 400/22P02 em `/rest/v1/theme_contents`.
  const themeId = (tag as any).id;
  const themeContentQuery = isValidUuid(themeId)
    ? supabase.from('theme_contents').select('*').eq('theme_id', themeId).limit(10)
    : null;

  if (signal) {
    spiritualQuery.abortSignal(signal);
    journeyQuery.abortSignal(signal);
    themeContentQuery?.abortSignal(signal);
  }

  const [spiritualResponse, journeyResponse, themeContentResponse] = await Promise.all([
    spiritualQuery,
    journeyQuery,
    themeContentQuery ?? Promise.resolve({ data: [], error: null } as { data: any[]; error: null }),
  ]);

  if (spiritualResponse.error) throw spiritualResponse.error;
  if (journeyResponse.error) throw journeyResponse.error;
  if (themeContentResponse.error) throw themeContentResponse.error;

  const spiritual = (spiritualResponse.data || []).map(d => formatNexusContent(d, d.type));
  const journeys = (journeyResponse.data || []).map(d => formatNexusContent(d, 'journey'));
  const themeContents = (themeContentResponse.data || []).map(d => ({
    id: d.id,
    type: d.content_type,
    content_text: d.text_content || '',
    title: d.reference || d.title || 'Tradição',
    metadata: { ...d, is_theme_content: true }
  }));

  // Add local catechism data that matches search terms
  const localCatechism = getAllLocalCatechism()
    .filter(cat => cat.tags.some(t => searchTerms.includes(t)))
    .map(cat => ({
      id: cat.id,
      type: 'catechism',
      content_text: cat.conteudo,
      title: `Catecismo §${cat.paragraph}`,
      metadata: { ...cat, tags: cat.tags }
    }));

  const all = [...spiritual, ...journeys, ...themeContents, ...localCatechism];
  // Unique by ID
  return Array.from(new Map(all.map(item => [item.id, item])).values());
}

