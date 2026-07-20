
CREATE OR REPLACE FUNCTION public.resolve_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid;
BEGIN
  IF NOT auth_internal.has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem resolver e-mails de usuários.'
      USING ERRCODE = '42501';
  END IF;
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
  RETURN uid;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_user_id_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_user_id_by_email(text) TO authenticated, service_role;
