-- Explicitly revoke from anon role
REVOKE EXECUTE ON FUNCTION public.log_sensitive_operation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_access_denial(TEXT, TEXT, JSONB) FROM anon;