
CREATE TABLE IF NOT EXISTS public.nexus_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  book_abbr TEXT NOT NULL,
  chapter INTEGER NOT NULL CHECK (chapter > 0),
  verse INTEGER CHECK (verse IS NULL OR verse > 0),
  connection_type TEXT NOT NULL CHECK (connection_type IN ('catechism','bible','document','theology','cross_ref')),
  reference_id TEXT,
  reference_title TEXT NOT NULL,
  summary TEXT NOT NULL,
  contributor_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nexus_contributions_book_ch_idx ON public.nexus_contributions(book_abbr, chapter);
CREATE INDEX IF NOT EXISTS nexus_contributions_status_idx ON public.nexus_contributions(status);
CREATE INDEX IF NOT EXISTS nexus_contributions_user_idx ON public.nexus_contributions(user_id);

GRANT SELECT, INSERT, UPDATE ON public.nexus_contributions TO authenticated;
GRANT ALL ON public.nexus_contributions TO service_role;

ALTER TABLE public.nexus_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_insert_own_contributions"
  ON public.nexus_contributions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_read_own_contributions"
  ON public.nexus_contributions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "admins_read_all_contributions"
  ON public.nexus_contributions FOR SELECT
  TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins_update_contributions"
  ON public.nexus_contributions FOR UPDATE
  TO authenticated
  USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_nexus_contributions_updated_at
  BEFORE UPDATE ON public.nexus_contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
