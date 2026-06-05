-- Trigger function to notify admins on critical security events
CREATE OR REPLACE FUNCTION public.notify_admin_on_security_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  IF NEW.severity = 'critical' THEN
    -- Find all admins (using the profiles role as reference)
    FOR v_admin_id IN (SELECT id FROM public.profiles WHERE role = 'admin') LOOP
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        v_admin_id,
        '🚨 ALERTA DE SEGURANÇA: ' || NEW.event_type,
        NEW.description,
        'security',
        '/security-dashboard'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_notify_admin_on_security_event ON public.security_audit_logs;
CREATE TRIGGER tr_notify_admin_on_security_event
AFTER INSERT ON public.security_audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_on_security_event();
