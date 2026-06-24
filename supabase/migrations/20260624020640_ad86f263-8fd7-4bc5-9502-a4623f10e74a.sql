REVOKE EXECUTE ON FUNCTION public.enforce_profile_update_guards() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_profile_update_guards() TO service_role;