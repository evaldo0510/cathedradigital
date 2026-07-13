
-- 1. Ampliar CHECK do pcl_status para incluir 'expired'
ALTER TABLE public.bible_translation_sources
  DROP CONSTRAINT IF EXISTS bible_translation_sources_pcl_status_check;

ALTER TABLE public.bible_translation_sources
  ADD CONSTRAINT bible_translation_sources_pcl_status_check
  CHECK (pcl_status = ANY (ARRAY[
    'draft','submitted','validated','approved','active','suspended','revoked','expired'
  ]));

-- 2. Colunas de decisão administrativa explícita
ALTER TABLE public.bible_translation_sources
  ADD COLUMN IF NOT EXISTS pcl_activated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pcl_activated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.bible_translation_sources.pcl_activated_by IS
  'Admin que autorizou explicitamente a promoção para pcl_status=active. Certificação técnica (certified_at) não implica ativação jurídica.';

-- 3. Rebaixa qualquer 'active' sem autorização explícita para 'validated'
UPDATE public.bible_translation_sources
   SET pcl_status = 'validated'
 WHERE pcl_status = 'active'
   AND pcl_activated_by IS NULL;

-- 4. Gate: impede transição para 'active' sem decisão administrativa
CREATE OR REPLACE FUNCTION public.enforce_pcl_active_requires_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pcl_status = 'active'
     AND (TG_OP = 'INSERT' OR OLD.pcl_status IS DISTINCT FROM 'active') THEN
    IF NEW.pcl_activated_by IS NULL THEN
      RAISE EXCEPTION 'PCL gate: promoção para active exige pcl_activated_by (autorização administrativa explícita).'
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.pcl_activated_at IS NULL THEN
      NEW.pcl_activated_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_pcl_active_requires_admin
  ON public.bible_translation_sources;

CREATE TRIGGER trg_enforce_pcl_active_requires_admin
  BEFORE INSERT OR UPDATE ON public.bible_translation_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_pcl_active_requires_admin();
