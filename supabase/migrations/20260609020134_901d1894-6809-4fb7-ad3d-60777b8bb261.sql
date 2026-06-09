-- Inserir configurações padrão de notificação se não existirem
INSERT INTO public.telemetry_settings (key, value)
VALUES 
  ('notification_config', '{"slack_webhook": "", "email": "", "enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Garantir permissões
GRANT SELECT, INSERT, UPDATE ON public.telemetry_settings TO authenticated;
GRANT ALL ON public.telemetry_settings TO service_role;
