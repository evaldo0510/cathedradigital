import { supabase } from '@/integrations/supabase/client';

/**
 * Updates the user's streak based on their last activity.
 * If the last action was yesterday, increment streak.
 * If it was today, keep it.
 * If it was more than 1 day ago, reset to 1.
 */
export const updateUserStreak = async (userId: string) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('streak, last_action_at')
    .eq('id', userId)
    .single();

  if (error || !profile) return;

  const lastAction = profile.last_action_at ? new Date(profile.last_action_at) : null;
  const now = new Date();
  
  // Set times to midnight for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = profile.streak || 0;
  
  if (!lastAction) {
    newStreak = 1;
  } else {
    const lastActionDate = new Date(lastAction.getFullYear(), lastAction.getMonth(), lastAction.getDate());
    
    if (lastActionDate.getTime() === yesterday.getTime()) {
      newStreak += 1;
    } else if (lastActionDate.getTime() < yesterday.getTime()) {
      newStreak = 1;
    }
    // If lastActionDate is today, streak remains the same
  }

  await supabase
    .from('profiles')
    .update({ 
      streak: newStreak, 
      last_action_at: now.toISOString() 
    } as any)
    .eq('id', userId);
    
  return newStreak;
};
