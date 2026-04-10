-- Function to update last_action_at
CREATE OR REPLACE FUNCTION public.update_last_action_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET last_action_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user_history
DROP TRIGGER IF EXISTS trigger_update_last_action_at ON public.user_history;
CREATE TRIGGER trigger_update_last_action_at
AFTER INSERT ON public.user_history
FOR EACH ROW
EXECUTE FUNCTION public.update_last_action_at();

-- Trigger on app_metrics (if user_id is present)
-- This might need a slightly different function or check
CREATE OR REPLACE FUNCTION public.update_last_action_at_from_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.metadata->>'user_id') IS NOT NULL THEN
    UPDATE public.profiles
    SET last_action_at = now()
    WHERE id = (NEW.metadata->>'user_id')::uuid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index to logs for ignore logic
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_sent ON public.intelligent_notification_logs(user_id, sent_at);
