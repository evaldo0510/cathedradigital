import { supabase } from '@/integrations/supabase/client';

export async function clearAllReadingProgress(userId: string) {
  await Promise.all([
    supabase.from('bible_chapters_read').delete().eq('user_id', userId),
    supabase.from('catechism_paragraphs_read').delete().eq('user_id', userId),
    supabase.from('ritual_progress').delete().eq('user_id', userId),
    supabase.from('journey_progress').delete().eq('user_id', userId),
    supabase.from('reading_marks').delete().eq('user_id', userId),
  ]);
}
