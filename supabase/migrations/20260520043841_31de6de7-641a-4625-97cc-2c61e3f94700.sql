-- Add new columns to profiles for streaks and notification settings
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"daily_reminder": {"enabled": false, "time": "08:00"}}'::jsonb,
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS weekly_goal INTEGER DEFAULT 5;

-- Function to update user streak
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    last_active DATE;
    today DATE;
BEGIN
    SELECT last_active_at::DATE INTO last_active FROM public.profiles WHERE id = NEW.user_id;
    today := CURRENT_DATE;

    IF last_active IS NULL THEN
        -- First time reading
        UPDATE public.profiles 
        SET streak = 1, 
            max_streak = GREATEST(max_streak, 1),
            last_active_at = NOW()
        WHERE id = NEW.user_id;
    ELSIF last_active = today THEN
        -- Already active today, just update timestamp
        UPDATE public.profiles SET last_active_at = NOW() WHERE id = NEW.user_id;
    ELSIF last_active = today - INTERVAL '1 day' THEN
        -- Continued streak
        UPDATE public.profiles 
        SET streak = streak + 1,
            max_streak = GREATEST(max_streak, streak + 1),
            last_active_at = NOW()
        WHERE id = NEW.user_id;
    ELSE
        -- Streak broken
        UPDATE public.profiles 
        SET streak = 1,
            last_active_at = NOW()
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for different reading activities to update streak
-- Assuming tables like bible_chapters_read, catechism_paragraphs_read exist
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'bible_chapters_read') THEN
        CREATE TRIGGER update_streak_on_bible_read
        AFTER INSERT ON public.bible_chapters_read
        FOR EACH ROW EXECUTE FUNCTION public.update_user_streak();
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'catechism_paragraphs_read') THEN
        CREATE TRIGGER update_streak_on_catechism_read
        AFTER INSERT ON public.catechism_paragraphs_read
        FOR EACH ROW EXECUTE FUNCTION public.update_user_streak();
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'journey_progress') THEN
        CREATE TRIGGER update_streak_on_journey_progress
        AFTER INSERT ON public.journey_progress
        FOR EACH ROW EXECUTE FUNCTION public.update_user_streak();
    END IF;
END $$;
