ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

DROP POLICY "Admins can manage audit notifications" ON public.bible_audit_notifications;

CREATE POLICY "Admins can manage audit notifications" ON public.bible_audit_notifications
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
