
REVOKE ALL ON FUNCTION public.editorial_coverage(text)              FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.editorial_correction_priority(text)   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.editorial_quality_gate(text, text)    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.editorial_coverage(text)            TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.editorial_correction_priority(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.editorial_quality_gate(text, text)  TO authenticated, service_role;
