
REVOKE ALL ON FUNCTION public.glossary_role_for(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_glossary_role(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.enforce_glossary_publish() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.touch_glossary_permissions_updated_at() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.glossary_role_for(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_glossary_role(uuid, text) TO authenticated, service_role;
