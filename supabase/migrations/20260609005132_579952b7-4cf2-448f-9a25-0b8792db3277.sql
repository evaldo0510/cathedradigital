CREATE TABLE IF NOT EXISTS public.telemetry_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.telemetry_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'alert', 'export', 'config_change'
  severity TEXT,
  title TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

GRANT ALL ON public.telemetry_settings TO authenticated;
GRANT ALL ON public.telemetry_settings TO service_role;
GRANT ALL ON public.telemetry_audit TO authenticated;
GRANT ALL ON public.telemetry_audit TO service_role;

ALTER TABLE public.telemetry_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage telemetry settings" ON public.telemetry_settings
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Admins can view and create audit logs" ON public.telemetry_audit
  FOR ALL TO authenticated USING (true);

-- Inserir valores padrão
INSERT INTO public.telemetry_settings (key, value)
VALUES ('thresholds', '{"errorRate": 10, "avgLatency": 500, "effectTriggers": 50}')
ON CONFLICT (key) DO NOTHING;