ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_visit TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS completed_books TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS total_minutes_read INTEGER DEFAULT 0;

-- Update trigger function to handle streak (simple version)
CREATE OR REPLACE FUNCTION public.handle_user_visit()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.last_visit::date > OLD.last_visit::date) THEN
    IF (NEW.last_visit::date = OLD.last_visit::date + INTERVAL '1 day') THEN
      NEW.streak := OLD.streak + 1;
    ELSE
      NEW.streak := 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
