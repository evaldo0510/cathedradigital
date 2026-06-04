-- Enhance audit logs with masked IP field
ALTER TABLE public.telemetry_audit_logs ADD COLUMN IF NOT EXISTS masked_ip TEXT;

-- Function to mask IP (simplified for demonstration)
CREATE OR REPLACE FUNCTION public.mask_ip(ip TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(ip, '(\d+)\.(\d+)\.(\d+)\.(\d+)', '\1.\2.\3.***');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update cleanup policy with tiers
-- Tier 1: Sensitive metadata/PII-prone fields (7 days retention)
-- Tier 2: General logs (30 days retention)
-- Tier 3: Audit trails (90 days retention)
CREATE OR REPLACE FUNCTION public.cleanup_telemetry_logs()
RETURNS void AS $$
BEGIN
  -- Tier 1: Redact sensitive metadata fields after 7 days but keep the log entry
  UPDATE public.security_logs
  SET metadata = metadata - 'stack' - 'context' - 'payload'
  WHERE created_at < (now() - interval '7 days')
  AND (event_type = 'error' OR action = 'type_error');

  -- Tier 2: Delete general telemetry logs after 30 days
  DELETE FROM public.security_logs
  WHERE created_at < (now() - interval '30 days')
  AND (event_type = 'error' OR action = 'navigation_click' OR action = 'type_error');
  
  -- Tier 3: Delete audit records after 90 days
  DELETE FROM public.telemetry_audit_logs
  WHERE inspected_at < (now() - interval '90 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
