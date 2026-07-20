
-- Tabela de permissões específicas do Glossário (editor, revisor, admin)
CREATE TABLE public.glossary_permissions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('editor','reviewer','admin')),
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.glossary_permissions TO authenticated;
GRANT ALL ON public.glossary_permissions TO service_role;
ALTER TABLE public.glossary_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_glossary_permission_readable"
ON public.glossary_permissions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR auth_internal.has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "admins_manage_glossary_permissions"
ON public.glossary_permissions FOR ALL TO authenticated
USING (auth_internal.has_role(auth.uid(),'admin'::app_role))
WITH CHECK (auth_internal.has_role(auth.uid(),'admin'::app_role));

-- Helpers de função
CREATE OR REPLACE FUNCTION public.glossary_role_for(_uid uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth_internal
AS $$
  SELECT CASE
    WHEN _uid IS NULL THEN NULL
    WHEN auth_internal.has_role(_uid,'admin'::app_role) THEN 'admin'
    ELSE (SELECT role FROM public.glossary_permissions WHERE user_id = _uid)
  END
$$;

CREATE OR REPLACE FUNCTION public.has_glossary_role(_uid uuid, _min text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE public.glossary_role_for(_uid)
    WHEN 'admin' THEN true
    WHEN 'reviewer' THEN _min IN ('editor','reviewer')
    WHEN 'editor' THEN _min = 'editor'
    ELSE false
  END
$$;

-- Substitui a policy única de admin por policies granulares
DROP POLICY IF EXISTS "Admins can manage glossary" ON public.glossary;

CREATE POLICY "glossary_editors_insert"
ON public.glossary FOR INSERT TO authenticated
WITH CHECK (public.has_glossary_role(auth.uid(),'editor'));

CREATE POLICY "glossary_editors_update"
ON public.glossary FOR UPDATE TO authenticated
USING (public.has_glossary_role(auth.uid(),'editor'))
WITH CHECK (public.has_glossary_role(auth.uid(),'editor'));

CREATE POLICY "glossary_admin_delete"
ON public.glossary FOR DELETE TO authenticated
USING (public.has_glossary_role(auth.uid(),'admin'));

-- Trigger que exige revisor+ para publicar e carimba reviewed_by/reviewed_at
CREATE OR REPLACE FUNCTION public.enforce_glossary_publish()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    IF NOT public.has_glossary_role(auth.uid(),'reviewer') THEN
      RAISE EXCEPTION 'Apenas revisores ou administradores podem publicar verbetes.'
        USING ERRCODE = '42501';
    END IF;
    NEW.reviewed_by := auth.uid();
    NEW.reviewed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_glossary_publish ON public.glossary;
CREATE TRIGGER trg_enforce_glossary_publish
BEFORE INSERT OR UPDATE ON public.glossary
FOR EACH ROW EXECUTE FUNCTION public.enforce_glossary_publish();

-- Mantém updated_at do glossary_permissions
CREATE OR REPLACE FUNCTION public.touch_glossary_permissions_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_touch_glossary_permissions
BEFORE UPDATE ON public.glossary_permissions
FOR EACH ROW EXECUTE FUNCTION public.touch_glossary_permissions_updated_at();
