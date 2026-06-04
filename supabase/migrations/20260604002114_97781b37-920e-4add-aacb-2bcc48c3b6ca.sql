-- Set search_path for log_sensitive_operation
ALTER FUNCTION public.log_sensitive_operation() SET search_path = public;

-- Set search_path for log_access_denial
ALTER FUNCTION public.log_access_denial(TEXT, TEXT, JSONB) SET search_path = public;

-- Hardening access to SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.log_sensitive_operation() FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.log_sensitive_operation() TO service_role;

REVOKE EXECUTE ON FUNCTION public.log_access_denial(TEXT, TEXT, JSONB) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.log_access_denial(TEXT, TEXT, JSONB) TO service_role;

-- Additional hardening for existing sensitive functions if needed
-- (Example: if there are other functions flagged by the linter)
-- Assuming the linter was referring to the new ones I just added.