CREATE OR REPLACE VIEW public.view_journeys_with_stats AS
SELECT 
    j.*,
    COALESCE(s.steps_count, 0) as steps_count
FROM public.journeys j
LEFT JOIN (
    SELECT journey_id, count(*) as steps_count
    FROM public.journey_steps
    GROUP BY journey_id
) s ON j.id = s.journey_id;

-- Grant access to authenticated users
GRANT SELECT ON public.view_journeys_with_stats TO authenticated;
GRANT SELECT ON public.view_journeys_with_stats TO anon;
