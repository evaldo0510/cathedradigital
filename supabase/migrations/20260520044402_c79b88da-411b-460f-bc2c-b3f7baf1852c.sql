-- Create a table for weekly goals history if it doesn't exist
CREATE TABLE IF NOT EXISTS public.weekly_goals_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  goal_count INTEGER NOT NULL,
  achieved_count INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_goals_history ENABLE ROW LEVEL SECURITY;

-- Policies for weekly_goals_history
CREATE POLICY "Users can view their own goals history" 
ON public.weekly_goals_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals history" 
ON public.weekly_goals_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals history" 
ON public.weekly_goals_history FOR UPDATE USING (auth.uid() = user_id);

-- Add column for last_reminder_sent_at to profiles to avoid double notifications
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Create function to check and send reminders
CREATE OR REPLACE FUNCTION public.check_daily_reminders()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    current_time_text TEXT;
BEGIN
    current_time_text := to_char(now() AT TIME ZONE 'UTC', 'HH24:MI');
    
    FOR user_record IN 
        SELECT p.id, p.ritual_reminder_time, p.journey_reminder_time 
        FROM public.profiles p
        WHERE (p.ritual_reminder_time = current_time_text OR p.journey_reminder_time = current_time_text)
          AND (p.last_reminder_sent_at IS NULL OR p.last_reminder_sent_at < current_date)
    LOOP
        INSERT INTO public.notifications (user_id, type, title, message, link)
        VALUES (
            user_record.id, 
            'reminder', 
            'Hora do seu Ritual', 
            'O silêncio do mosteiro te espera. Continue sua jornada espiritual.', 
            '/hoje'
        );
        
        UPDATE public.profiles 
        SET last_reminder_sent_at = now() 
        WHERE id = user_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
