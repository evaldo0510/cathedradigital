import { supabase } from '@/integrations/supabase/client';
import { detectCategories } from './smartRouter';

export interface EmotionRecord {
  emotion_type: string;
  score: number;
  context_text?: string;
  source_feature: string;
}

export interface PsychologicalProfile {
  dominant_emotion?: string;
  mood_history: string[];
  traits: Record<string, any>;
  last_updated: string;
}

/**
 * Persists detected emotions and updates the user's psychological profile.
 */
export async function saveUserPsychology(
  userId: string,
  text: string,
  source: string
): Promise<void> {
  if (!userId || !text.trim()) return;

  const scores = detectCategories(text);
  
  // Only save if there's at least one match
  const topCategory = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .filter(([, score]) => score > 0)[0];

  if (!topCategory) return;

  const [emotionType, score] = topCategory;

  try {
    // 1. Log the individual emotion detection
    const { error: logError } = await supabase
      .from('user_emotions')
      .insert({
        user_id: userId,
        emotion_type: emotionType,
        score,
        context_text: text.slice(0, 1000), // Cap length
        source_feature: source,
      });

    if (logError) throw logError;

    // 2. Fetch current profile or create it
    const { data: profile, error: fetchError } = await supabase
      .from('user_psychological_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const moodHistory = profile?.mood_history ? [...(profile.mood_history as string[])] : [];
    moodHistory.push(emotionType);
    if (moodHistory.length > 20) moodHistory.shift(); // Keep last 20

    // Update traits based on frequency
    const traits = profile?.traits ? { ...(profile.traits as Record<string, any>) } : {};
    traits[emotionType] = (traits[emotionType] || 0) + 1;

    // Determine dominant emotion from history
    const counts = moodHistory.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantEmotion = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)[0][0];

    // 3. Update the aggregated profile
    const { error: upsertError } = await supabase
      .from('user_psychological_profiles')
      .upsert({
        user_id: userId,
        dominant_emotion: dominantEmotion,
        mood_history: moodHistory,
        traits,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) throw upsertError;

    console.log(`Psychological profile updated for user ${userId}: dominant=${dominantEmotion}`);
  } catch (err) {
    console.error('Error saving user psychology:', err);
  }
}

/**
 * Hook or function to fetch the profile
 */
export async function getUserPsychology(userId: string): Promise<PsychologicalProfile | null> {
  const { data, error } = await supabase
    .from('user_psychological_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user psychology:', error);
    return null;
  }

  return data as PsychologicalProfile | null;
}
