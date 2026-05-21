import { supabase } from '@/integrations/supabase/client';
import { TagContent } from './nexusContent';
import { getUserPsychology, PsychologicalProfile } from './psychologicalProfile';

export interface SpiritualContext {
  psychology: PsychologicalProfile | null;
  lastReading: {
    type: string;
    title: string;
    tags: string[];
  } | null;
}

/**
 * Fetches the user's current spiritual context for relevance ranking.
 */
export async function getSpiritualContext(userId: string): Promise<SpiritualContext> {
  if (!userId) return { psychology: null, lastReading: null };

  const [psychology, lastReading] = await Promise.all([
    getUserPsychology(userId),
    fetchLastReading(userId)
  ]);

  return { psychology, lastReading };
}

async function fetchLastReading(userId: string) {
  try {
    const { data, error } = await supabase
      .from('reading_marks')
      .select('content_type, label, content_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    // Fetch tags if possible or rely on content ID matching
    return {
      type: data.content_type || 'unknown',
      title: data.label || data.content_id || 'Leitura Recente',
      tags: [] 
    };
  } catch (err) {
    console.error('Error fetching last reading for relevance:', err);
    return null;
  }
}

/**
 * Ranks connections based on the user's spiritual context.
 * Higher score means more relevant.
 */
export function rankConnections(
  connections: TagContent[], 
  context: SpiritualContext,
  currentContextTags: string[]
): (TagContent & { relevanceScore: number; reason: string })[] {
  
  return connections.map(item => {
    let score = 0;
    let reason = 'Tradição Conectada';

    // 1. Match with current content tags (primary)
    const currentMatches = item.metadata?.tags?.filter((t: string) => currentContextTags.includes(t)).length || 0;
    score += currentMatches * 10;
    if (currentMatches > 0) reason = 'Contexto Similar';

    // 2. Match with user psychology (virtues/traits)
    if (context.psychology?.traits) {
      const traitMatches = item.metadata?.tags?.filter((t: string) => 
        context.psychology?.traits?.[t.toLowerCase()]
      ).length || 0;
      score += traitMatches * 5;
      if (traitMatches > 0 && score < 15) reason = 'Inclinação Espiritual';
    }

    // 3. Match with last reading tags (if we had tags for it)
    if (context.lastReading) {
      // Very basic continuity bonus
      score += 3;
      if (reason === 'Tradição Conectada') reason = 'Continuidade da Leitura';
    }

    // 4. Match with dominant emotion (virtue alignment)
    if (context.psychology?.dominant_emotion) {
      const emotionMatch = item.metadata?.tags?.some((t: string) => 
        t.toLowerCase() === context.psychology?.dominant_emotion?.toLowerCase()
      );
      if (emotionMatch) {
        score += 15;
        reason = 'Remédio da Alma';
      }
    }

    // 5. Theme specific content
    if (item.metadata?.is_theme_content) {
      score += 5;
      if (reason === 'Tradição Conectada') reason = 'Tema Relacionado';
    }

    return { ...item, relevanceScore: score, reason };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Advanced deduplication based on content fingerprinting.
 */
export function deduplicateRelatio(connections: TagContent[]): TagContent[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const seenFingerprints = new Set<string>();
  
  return connections.filter(item => {
    if (seenIds.has(item.id)) return false;
    
    // Normalize title for better matching
    const normTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenTitles.has(normTitle)) return false;
    
    // Content fingerprint (first 50 chars of normalized text)
    const fingerprint = item.content_text.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 50);
      
    if (fingerprint.length > 20 && seenFingerprints.has(fingerprint)) return false;
    
    seenIds.add(item.id);
    seenTitles.add(normTitle);
    seenFingerprints.add(fingerprint);
    return true;
  });
}
