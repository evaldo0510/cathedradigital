
DROP POLICY "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = source_user_id);
