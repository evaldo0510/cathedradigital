
CREATE TABLE public.partner_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('created','status_changed','updated')),
  from_status TEXT,
  to_status TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_audit_log_partner ON public.partner_audit_log(partner_id, created_at DESC);

GRANT SELECT ON public.partner_audit_log TO authenticated;
GRANT ALL ON public.partner_audit_log TO service_role;

ALTER TABLE public.partner_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read partner audit log"
ON public.partner_audit_log
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

CREATE OR REPLACE FUNCTION public.log_partner_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.partner_audit_log (partner_id, actor_id, action, to_status, metadata)
    VALUES (NEW.id, auth.uid(), 'created', NEW.status,
            jsonb_build_object('name', NEW.name, 'partner_type', NEW.partner_type));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.partner_audit_log (partner_id, actor_id, action, from_status, to_status, metadata)
      VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status, NEW.status, '{}'::jsonb);
    ELSIF (NEW.name IS DISTINCT FROM OLD.name)
       OR (NEW.description IS DISTINCT FROM OLD.description)
       OR (NEW.logo_url IS DISTINCT FROM OLD.logo_url)
       OR (NEW.website_url IS DISTINCT FROM OLD.website_url)
       OR (NEW.contact_email IS DISTINCT FROM OLD.contact_email) THEN
      INSERT INTO public.partner_audit_log (partner_id, actor_id, action, metadata)
      VALUES (NEW.id, auth.uid(), 'updated',
              jsonb_build_object(
                'changed_fields',
                (SELECT jsonb_agg(k) FROM (VALUES
                  ('name', NEW.name IS DISTINCT FROM OLD.name),
                  ('description', NEW.description IS DISTINCT FROM OLD.description),
                  ('logo_url', NEW.logo_url IS DISTINCT FROM OLD.logo_url),
                  ('website_url', NEW.website_url IS DISTINCT FROM OLD.website_url),
                  ('contact_email', NEW.contact_email IS DISTINCT FROM OLD.contact_email)
                ) AS t(k, changed) WHERE changed)
              ));
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_partner_change ON public.partners;
CREATE TRIGGER trg_log_partner_change
AFTER INSERT OR UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.log_partner_change();
