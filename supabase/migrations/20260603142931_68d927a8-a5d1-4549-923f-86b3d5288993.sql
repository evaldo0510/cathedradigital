
-- 1. Premium gating for itineraria_steps
DROP POLICY IF EXISTS "Itineraria steps are viewable by everyone" ON public.itineraria_steps;

CREATE POLICY "Free itineraria steps are public"
ON public.itineraria_steps
FOR SELECT
TO public
USING (is_free = true);

CREATE POLICY "Premium itineraria steps require premium"
ON public.itineraria_steps
FOR SELECT
TO authenticated
USING (
  is_free
  OR (SELECT profiles.is_premium FROM public.profiles WHERE profiles.id = auth.uid())
  OR auth_internal.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can manage itineraria steps"
ON public.itineraria_steps
FOR ALL
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- 2. Restrict construction data to admins
DROP POLICY IF EXISTS "Public can view construction data" ON public.construction_data;
DROP POLICY IF EXISTS "Public can view projects" ON public.construction_projects;

-- 3. Realtime: scope user-owned table broadcasts to row owner
DO $$
DECLARE
  policy_rec record;
BEGIN
  FOR policy_rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'realtime' AND tablename = 'messages'
      AND policyname IN (
        'Users receive own profile changes',
        'Users receive own journey_progress changes',
        'Users receive own reading_marks changes',
        'Users receive own reading_reflections changes',
        'Users receive own itineraria_progress changes',
        'Users receive own user_achievements changes',
        'Users receive own notifications changes'
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON realtime.messages', policy_rec.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users receive own profile changes"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'profile-sync-' || auth.uid()::text
  OR realtime.topic() LIKE 'user-' || auth.uid()::text || '%'
);
