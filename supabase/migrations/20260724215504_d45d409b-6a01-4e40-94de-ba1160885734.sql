
-- SW-1.0: Access model for saint_works — prepara Biblioteca Católica integrada.

CREATE TYPE public.saint_work_access_type AS ENUM (
  'internal',
  'official_external',
  'public_domain',
  'licensed'
);

ALTER TABLE public.saint_works
  ADD COLUMN external_url TEXT,
  ADD COLUMN external_source_label TEXT,
  ADD COLUMN access_type public.saint_work_access_type NOT NULL DEFAULT 'internal';

-- Consistência: quando access_type != 'internal', exige external_url.
CREATE OR REPLACE FUNCTION public.saint_works_validate_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.access_type <> 'internal' AND (NEW.external_url IS NULL OR length(trim(NEW.external_url)) = 0) THEN
    RAISE EXCEPTION 'saint_works.external_url é obrigatório quando access_type = %', NEW.access_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_saint_works_validate_access ON public.saint_works;
CREATE TRIGGER trg_saint_works_validate_access
  BEFORE INSERT OR UPDATE ON public.saint_works
  FOR EACH ROW EXECUTE FUNCTION public.saint_works_validate_access();

COMMENT ON COLUMN public.saint_works.external_url IS 'URL canônica externa (Vatican.va, CCEL, DomTotal…). Obrigatório quando access_type != internal.';
COMMENT ON COLUMN public.saint_works.external_source_label IS 'Rótulo humano da fonte externa (ex.: "Vatican.va", "CCEL", "Documenta Catholica Omnia").';
COMMENT ON COLUMN public.saint_works.access_type IS 'Modelo de acesso: internal (leitor Cathedra), official_external (Vaticano etc.), public_domain (CCEL/PD), licensed (tradução licenciada).';
