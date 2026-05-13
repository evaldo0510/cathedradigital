-- Clean up duplicates first
DELETE FROM public.catechism_paragraphs_read a
USING public.catechism_paragraphs_read b
WHERE a.id > b.id 
AND a.user_id = b.user_id 
AND a.paragraph = b.paragraph;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'catechism_paragraphs_read_user_id_paragraph_key'
    ) THEN
        ALTER TABLE public.catechism_paragraphs_read 
        ADD CONSTRAINT catechism_paragraphs_read_user_id_paragraph_key 
        UNIQUE (user_id, paragraph);
    END IF;
END $$;
