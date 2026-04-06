-- 1. Block direct INSERT on notifications (system-only via service role)
DROP POLICY IF EXISTS "Users can create notifications for others" ON public.notifications;

CREATE POLICY "No direct notification insert"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 2. Block direct INSERT on profiles (trigger-only)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "No direct profile insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (false);
