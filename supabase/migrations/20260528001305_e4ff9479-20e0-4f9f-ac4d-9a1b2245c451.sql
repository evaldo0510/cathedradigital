-- Drop and recreate view with security_invoker
DROP VIEW IF EXISTS public.view_itineraria_with_stats;

CREATE VIEW public.view_itineraria_with_stats 
WITH (security_invoker = true)
AS
SELECT 
    i.*,
    (SELECT count(*) FROM public.itineraria_steps s WHERE s.itinerarium_id = i.id) as steps_count
FROM public.itineraria i;

GRANT SELECT ON public.view_itineraria_with_stats TO anon, authenticated;
GRANT ALL ON public.view_itineraria_with_stats TO service_role;
