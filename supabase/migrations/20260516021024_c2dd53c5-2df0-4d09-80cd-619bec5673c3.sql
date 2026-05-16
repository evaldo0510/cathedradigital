-- Add metadata column to user_notes if not exists
ALTER TABLE public.user_notes 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add metadata column to colloquium_conversations if not exists
ALTER TABLE public.colloquium_conversations
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create index for faster metadata lookups
CREATE INDEX IF NOT EXISTS idx_user_notes_metadata ON public.user_notes USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_colloquium_conversations_metadata ON public.colloquium_conversations USING GIN (metadata);
