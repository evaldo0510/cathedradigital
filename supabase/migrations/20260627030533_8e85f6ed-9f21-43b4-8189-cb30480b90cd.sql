-- Tighten webhook_logs: remove loose payload-based user SELECT policy; restrict to admins only.
DROP POLICY IF EXISTS "Users can view their own webhook logs" ON public.webhook_logs;