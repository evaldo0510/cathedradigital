-- Admin policies for user data tables
DROP POLICY IF EXISTS "Admins can view all journal entries" ON public.spiritual_journal;
CREATE POLICY "Admins can view all journal entries" ON public.spiritual_journal
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can view all journey progress" ON public.journey_progress;
CREATE POLICY "Admins can view all journey progress" ON public.journey_progress
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can view all chapters read" ON public.bible_chapters_read;
CREATE POLICY "Admins can view all chapters read" ON public.bible_chapters_read
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can view all user notes" ON public.user_notes;
CREATE POLICY "Admins can view all user notes" ON public.user_notes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can view all user history" ON public.user_history;
CREATE POLICY "Admins can view all user history" ON public.user_history
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
