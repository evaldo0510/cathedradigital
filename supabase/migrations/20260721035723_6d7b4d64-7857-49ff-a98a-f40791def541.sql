CREATE TABLE public.liturgy_meditations (
  iso_date        date PRIMARY KEY,
  readings_hash   text NOT NULL,
  theme           text,
  reading_key     text,
  fathers         jsonb NOT NULL DEFAULT '[]'::jsonb,
  catechism       jsonb NOT NULL DEFAULT '[]'::jsonb,
  magisterium     jsonb NOT NULL DEFAULT '[]'::jsonb,
  logos           jsonb,
  final_prayer    text,
  church_history  jsonb,
  action_of_day   text,
  model           text,
  generated_at    timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.liturgy_meditations TO anon;
GRANT SELECT ON public.liturgy_meditations TO authenticated;
GRANT ALL ON public.liturgy_meditations TO service_role;

ALTER TABLE public.liturgy_meditations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Liturgy meditations are publicly readable"
  ON public.liturgy_meditations
  FOR SELECT
  USING (true);

CREATE INDEX idx_liturgy_meditations_generated_at
  ON public.liturgy_meditations (generated_at DESC);