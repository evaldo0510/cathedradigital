CREATE OR REPLACE VIEW public.view_journeys_with_stats WITH (security_invoker = true) AS
SELECT 
    j.*,
    COALESCE(s.steps_count, 0) as steps_count
FROM public.journeys j
LEFT JOIN (
    SELECT journey_id, count(*) as steps_count
    FROM public.journey_steps
    GROUP BY journey_id
) s ON j.id = s.journey_id;
