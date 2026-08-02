
CREATE OR REPLACE VIEW public.nexus_node_degree
WITH (security_invoker = on) AS
SELECT kind, ref, COUNT(*)::int AS degree
FROM (
  SELECT source_kind AS kind,
         COALESCE(source_ref->>'slug', source_ref->>'id', source_ref->>'ref') AS ref
  FROM public.nexus_relations
  UNION ALL
  SELECT target_kind AS kind,
         COALESCE(target_ref->>'slug', target_ref->>'id', target_ref->>'ref') AS ref
  FROM public.nexus_relations
) t
WHERE ref IS NOT NULL AND kind IS NOT NULL
GROUP BY kind, ref;

GRANT SELECT ON public.nexus_node_degree TO anon, authenticated;
GRANT ALL ON public.nexus_node_degree TO service_role;
