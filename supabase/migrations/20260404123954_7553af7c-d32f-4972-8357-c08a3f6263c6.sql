-- 1. PRIVILEGE ESCALATION FIX: Prevent users from modifying role/is_premium
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.is_premium IS DISTINCT FROM NEW.is_premium) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      NEW.role := OLD.role;
      NEW.is_premium := OLD.is_premium;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_prevent_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- 2. DATA EXPOSURE FIX: Create a public_profiles view with safe fields only
CREATE VIEW public.public_profiles AS
  SELECT id, name, avatar_url, bio FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;

-- 3. NOTIFICATION ABUSE FIX: Restrict notification types
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('reply', 'like', 'mention', 'system'));

-- Tighten INSERT policy: users cannot target themselves (prevents forged system notifications)
DROP POLICY "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications for others"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = source_user_id
    AND user_id IS DISTINCT FROM auth.uid()
  );