-- Function to get the latest journey for a user
CREATE OR REPLACE FUNCTION public.get_latest_journey_title(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_title TEXT;
BEGIN
    SELECT j.title INTO v_title
    FROM public.journey_progress jp
    JOIN public.journeys j ON jp.journey_id = j.id
    WHERE jp.user_id = p_user_id
    ORDER BY jp.completed_at DESC NULLS LAST
    LIMIT 1;
    
    RETURN COALESCE(v_title, 'Nenhuma');
END;
$$;

-- View for user management
CREATE OR REPLACE VIEW public.user_management_stats AS
WITH user_data AS (
    SELECT 
        p.id,
        p.name,
        usd.email,
        CASE WHEN p.is_premium THEN 'PRO' ELSE 'Free' END as plan,
        public.get_latest_journey_title(p.id) as current_journey,
        (SELECT count(*) FROM public.spiritual_journal WHERE user_id = p.id) as reflections_count,
        GREATEST(p.last_visit, p.last_action_at, p.created_at) as last_activity,
        p.created_at
    FROM public.profiles p
    LEFT JOIN public.user_sensitive_data usd ON p.id = usd.user_id
)
SELECT 
    *,
    CASE 
        WHEN reflections_count >= 50 THEN 'Profundo'
        WHEN reflections_count >= 10 AND last_activity > now() - interval '7 days' THEN 'Engajado'
        WHEN last_activity > now() - interval '3 days' THEN 'Ativo'
        WHEN created_at > now() - interval '7 days' THEN 'Novo'
        ELSE 'Inativo'
    END as classification
FROM user_data;

-- Security: Only admins should see this, but since RLS doesn't apply to views directly in the same way,
-- we'll rely on the application layer (AdminGuard) and maybe a function if needed.
-- However, we can use SECURITY DEFINER if we want to bypass RLS, but here we want to expose it to admins.

GRANT SELECT ON public.user_management_stats TO authenticated;
