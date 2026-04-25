import { supabase } from '@/integrations/supabase/client';
import { getSearchTermsForTag } from './tagNormalization';

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
    metadata: data.metadata || {}
  };
}

/**
 * Fetches and formats content for a specific tag.
 */
export async function fetchNexusTagContent(tag: { label: string; slug: string }): Promise<TagContent[]> {
  const searchTerms = getSearchTermsForTag(tag);
  
  const [spiritualResponse, journeyResponse] = await Promise.all([
    supabase
      .from('spiritual_contents')
      .select('*')
      .overlaps('tags', searchTerms)
      .limit(15),
    supabase
      .from('journeys')
      .select('*')
      .overlaps('tags', searchTerms)
      .limit(10)
  ]);

  if (spiritualResponse.error) throw spiritualResponse.error;
  if (journeyResponse.error) throw journeyResponse.error;

  const spiritual = (spiritualResponse.data || []).map(d => formatNexusContent(d, d.type));
  const journeys = (journeyResponse.data || []).map(d => formatNexusContent(d, 'journey'));

  const all = [...spiritual, ...journeys];
  // Unique by ID
  return Array.from(new Map(all.map(item => [item.id, item])).values());
}
