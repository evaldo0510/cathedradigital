-- 1) Bucket avatars: restringir SELECT à pasta do próprio usuário (mantém policies existentes de admin e read own)
DROP POLICY IF EXISTS "Authenticated can read avatars" ON storage.objects;

-- 2) Fixar search_path das 6 funções SECURITY INVOKER que não o definem (lint 0011)
ALTER FUNCTION public._glossary_editorial_score(g public.glossary) SET search_path = public, pg_temp;
ALTER FUNCTION public._glossary_nexus_score(g public.glossary) SET search_path = public, pg_temp;
ALTER FUNCTION public.collections_doctrinal_area(_category text) SET search_path = public, pg_temp;
ALTER FUNCTION public.journeys_doctrinal_area(_category text) SET search_path = public, pg_temp;
ALTER FUNCTION public.prayers_doctrinal_area(_category text) SET search_path = public, pg_temp;
ALTER FUNCTION public.saints_doctrinal_area(_category text) SET search_path = public, pg_temp;