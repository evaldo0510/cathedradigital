
CREATE TABLE IF NOT EXISTS public.saints_audit (
  id bigserial PRIMARY KEY,
  saint_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('insert','update','delete')),
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  old_full_bio text,
  new_full_bio text,
  old_prayer text,
  new_prayer text,
  old_last_scraped_at timestamptz,
  new_last_scraped_at timestamptz,
  old_content_hash text,
  new_content_hash text,
  old_source_url text,
  new_source_url text,
  source_note text
);

GRANT SELECT ON public.saints_audit TO authenticated;
GRANT ALL ON public.saints_audit TO service_role;

ALTER TABLE public.saints_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_read_saints_audit" ON public.saints_audit;
CREATE POLICY "admins_read_saints_audit"
ON public.saints_audit
FOR SELECT
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_saints_audit_saint_id_changed_at
  ON public.saints_audit(saint_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_saints_audit_changed_at
  ON public.saints_audit(changed_at DESC);

CREATE OR REPLACE FUNCTION public.saints_audit_trg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.saints_audit(
      saint_id, action, changed_by,
      new_full_bio, new_prayer, new_last_scraped_at, new_content_hash, new_source_url
    ) VALUES (
      NEW.id, 'insert', actor,
      NEW.full_bio, NEW.prayer, NEW.last_scraped_at, NEW.content_hash, NEW.source_url
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.full_bio IS DISTINCT FROM OLD.full_bio
       OR NEW.prayer IS DISTINCT FROM OLD.prayer
       OR NEW.last_scraped_at IS DISTINCT FROM OLD.last_scraped_at
       OR NEW.content_hash IS DISTINCT FROM OLD.content_hash
       OR NEW.source_url IS DISTINCT FROM OLD.source_url THEN
      INSERT INTO public.saints_audit(
        saint_id, action, changed_by,
        old_full_bio, new_full_bio,
        old_prayer, new_prayer,
        old_last_scraped_at, new_last_scraped_at,
        old_content_hash, new_content_hash,
        old_source_url, new_source_url
      ) VALUES (
        NEW.id, 'update', actor,
        OLD.full_bio, NEW.full_bio,
        OLD.prayer, NEW.prayer,
        OLD.last_scraped_at, NEW.last_scraped_at,
        OLD.content_hash, NEW.content_hash,
        OLD.source_url, NEW.source_url
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.saints_audit(
      saint_id, action, changed_by,
      old_full_bio, old_prayer, old_last_scraped_at, old_content_hash, old_source_url
    ) VALUES (
      OLD.id, 'delete', actor,
      OLD.full_bio, OLD.prayer, OLD.last_scraped_at, OLD.content_hash, OLD.source_url
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_saints_audit ON public.saints;
CREATE TRIGGER trg_saints_audit
AFTER INSERT OR UPDATE OR DELETE ON public.saints
FOR EACH ROW EXECUTE FUNCTION public.saints_audit_trg();
