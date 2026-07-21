
CREATE TABLE public.missal_propers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  iso_date DATE NOT NULL UNIQUE,
  celebration_title TEXT NOT NULL,
  liturgical_color TEXT,
  entrance_antiphon TEXT,
  collect TEXT NOT NULL,
  offertory_prayer TEXT NOT NULL,
  preface_suggestion TEXT,
  communion_antiphon TEXT,
  prayer_after_communion TEXT NOT NULL,
  season_note TEXT,
  readings_hash TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  model TEXT,
  provider TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.missal_propers TO anon, authenticated;
GRANT ALL ON public.missal_propers TO service_role;

ALTER TABLE public.missal_propers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read missal propers"
  ON public.missal_propers
  FOR SELECT
  USING (true);

CREATE POLICY "Service role manages missal propers"
  ON public.missal_propers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_missal_propers_iso_date ON public.missal_propers(iso_date DESC);

CREATE TRIGGER trg_missal_propers_updated_at
  BEFORE UPDATE ON public.missal_propers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
