-- Add new columns to themes table
ALTER TABLE public.themes 
ADD COLUMN IF NOT EXISTS emoji TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Add an index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_themes_category ON public.themes(category);
