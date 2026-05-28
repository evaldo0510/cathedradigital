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

    // Normalize tags for robust matching
    const itemTags = (item.metadata?.tags || []).map((t: string) => t.toLowerCase());
    const normalizedContextTags = currentContextTags.map(t => t.toLowerCase());
    
    // 1. Semantic overlap (Tags matching) - Weighted by importance
    const matches = itemTags.filter((t: string) => normalizedContextTags.includes(t));
    const matchCount = matches.length;
    score += matchCount * 15; // Increased weight for direct context matches
    
    if (matchCount > 0) {
      reason = 'Contexto Similar';
      // Priority tags boost (if matches include specific key theological terms)
      const highValueTerms = ['graça', 'fé', 'cristo', 'eucaristia', 'maria', 'trindade'];
      if (matches.some(t => highValueTerms.includes(t))) {
        score += 20;
        reason = 'Doutrina Central';
      }
    }

    // 2. Type-based relevance (Bible usually ranks higher for spiritual depth)
    if (item.type === 'bible') {
      score += 10;
    }

    // 3. Match with user psychology (virtues/traits)
    if (context.psychology?.traits) {
      const traitMatches = itemTags.filter((t: string) => 
        context.psychology?.traits?.[t]
      ).length || 0;
      score += traitMatches * 8;
      if (traitMatches > 0 && score < 30) reason = 'Inclinação Espiritual';
    }

    // 4. Continuity and Recency
    if (context.lastReading) {
      // Bonus if it's the same book/type
      if (item.type === context.lastReading.type) {
        score += 5;
      }
      if (reason === 'Tradição Conectada') reason = 'Fluxo de Contemplação';
    }

    // 5. Emotional Resonance (Remédio da Alma)
    if (context.psychology?.dominant_emotion) {
      const emotion = context.psychology.dominant_emotion.toLowerCase();
      if (itemTags.includes(emotion)) {
        score += 25;
        reason = 'Consolo Espiritual';
      }
    }

    // 6. Theme specific content
    if (item.metadata?.is_theme_content) {
      score += 12;
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
