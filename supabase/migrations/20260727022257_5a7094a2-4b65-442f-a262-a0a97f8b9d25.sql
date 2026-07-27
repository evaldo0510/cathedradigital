
-- Onda 3 · Coleções Inteligentes — extensão do modelo editorial
ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS estimated_reading_time_minutes int,
  ADD COLUMN IF NOT EXISTS difficulty_level text CHECK (difficulty_level IN ('iniciante','intermediario','avancado')),
  ADD COLUMN IF NOT EXISTS recommended_for text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hero_quote text,
  ADD COLUMN IF NOT EXISTS hero_quote_author text,
  ADD COLUMN IF NOT EXISTS learning_objectives text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS prerequisites uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completion_message text,
  ADD COLUMN IF NOT EXISTS certificate_eligible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS program_slug text,
  ADD COLUMN IF NOT EXISTS track text;

CREATE INDEX IF NOT EXISTS idx_collections_track ON public.collections(track) WHERE track IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_collections_program_slug ON public.collections(program_slug) WHERE program_slug IS NOT NULL;

ALTER TABLE public.collection_items
  ADD COLUMN IF NOT EXISTS is_locked_until_prev boolean NOT NULL DEFAULT false;

-- Métricas editoriais (admin/editor apenas)
CREATE OR REPLACE FUNCTION public.collections_metrics_v1()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'editor')
  ) THEN
    RAISE EXCEPTION 'insufficient_privilege';
  END IF;

  WITH
    published AS (
      SELECT id, slug, title, track, difficulty_level
      FROM public.collections
      WHERE status = 'published'
    ),
    items_per AS (
      SELECT collection_id, COUNT(*)::int AS items_count
      FROM public.collection_items
      GROUP BY collection_id
    ),
    starts AS (
      SELECT collection_id, COUNT(DISTINCT user_id)::int AS started_users
      FROM public.collection_progress
      GROUP BY collection_id
    ),
    completions AS (
      SELECT cp.collection_id,
             COUNT(*) FILTER (WHERE cp.status = 'completed')::int AS completed_items,
             COUNT(*)::int AS total_items,
             AVG(EXTRACT(EPOCH FROM (cp.completed_at - cp.started_at)) / 60.0)
               FILTER (WHERE cp.completed_at IS NOT NULL AND cp.started_at IS NOT NULL) AS avg_minutes
      FROM public.collection_progress cp
      GROUP BY cp.collection_id
    )
  SELECT jsonb_build_object(
    'total_collections', (SELECT COUNT(*) FROM published),
    'total_items', COALESCE((SELECT SUM(items_count) FROM items_per WHERE collection_id IN (SELECT id FROM published)), 0),
    'by_track', COALESCE((
      SELECT jsonb_object_agg(track_key, cnt)
      FROM (
        SELECT COALESCE(track, 'sem_trilha') AS track_key, COUNT(*)::int AS cnt
        FROM published GROUP BY track_key
      ) t
    ), '{}'::jsonb),
    'top_started', COALESCE((
      SELECT jsonb_agg(row_to_json(x)) FROM (
        SELECT p.slug, p.title, s.started_users
        FROM published p JOIN starts s ON s.collection_id = p.id
        ORDER BY s.started_users DESC LIMIT 5
      ) x
    ), '[]'::jsonb),
    'top_completed', COALESCE((
      SELECT jsonb_agg(row_to_json(x)) FROM (
        SELECT p.slug, p.title,
               ROUND((c.completed_items::numeric / NULLIF(c.total_items,0)) * 100, 1) AS completion_rate
        FROM published p JOIN completions c ON c.collection_id = p.id
        WHERE c.total_items > 0
        ORDER BY completion_rate DESC NULLS LAST LIMIT 5
      ) x
    ), '[]'::jsonb),
    'avg_completion_minutes', COALESCE((
      SELECT ROUND(AVG(avg_minutes)::numeric, 1) FROM completions WHERE avg_minutes IS NOT NULL
    ), 0),
    'generated_at', now()
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.collections_metrics_v1() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.collections_metrics_v1() TO authenticated;
