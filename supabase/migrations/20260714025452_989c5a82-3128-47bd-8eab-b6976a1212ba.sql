-- Sprint B — B2 Query Optimization
-- Alvo: acelerar get_latest_journey_title() usada pela view user_management_stats.
-- Plano antes: Bitmap Heap Scan em idx_journey_progress_user + Sort por completed_at.
-- Plano depois esperado: Index Scan direto por (user_id, completed_at DESC NULLS LAST) + Limit 1, sem Sort.

CREATE INDEX IF NOT EXISTS idx_journey_progress_user_completed
  ON public.journey_progress (user_id, completed_at DESC NULLS LAST);

ANALYZE public.journey_progress;
ANALYZE public.app_metrics;
ANALYZE public.profiles;
ANALYZE public.spiritual_journal;