-- Adiciona a coluna tags como text[] nas tabelas principais
ALTER TABLE public.spiritual_contents ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Cria uma função para sincronizar as tags da tabela content_tags para spiritual_contents
CREATE OR REPLACE FUNCTION public.sync_content_tags_to_array()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.spiritual_contents
    SET tags = (
      SELECT array_agg(t.label)
      FROM public.content_tags ct
      JOIN public.tags t ON ct.tag_id = t.id
      WHERE ct.content_id = NEW.content_id
    )
    WHERE id = NEW.content_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.spiritual_contents
    SET tags = (
      SELECT COALESCE(array_agg(t.label), '{}')
      FROM public.content_tags ct
      JOIN public.tags t ON ct.tag_id = t.id
      WHERE ct.content_id = OLD.content_id
    )
    WHERE id = OLD.content_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho para a tabela content_tags
DROP TRIGGER IF EXISTS trg_sync_content_tags ON public.content_tags;
CREATE TRIGGER trg_sync_content_tags
AFTER INSERT OR UPDATE OR DELETE ON public.content_tags
FOR EACH ROW EXECUTE FUNCTION public.sync_content_tags_to_array();

-- Sincronização inicial para registros existentes
UPDATE public.spiritual_contents sc
SET tags = (
  SELECT COALESCE(array_agg(t.label), '{}')
  FROM public.content_tags ct
  JOIN public.tags t ON ct.tag_id = t.id
  WHERE ct.content_id = sc.id
);
