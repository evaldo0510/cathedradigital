-- Adição de índices para performance do Dashboard
CREATE INDEX IF NOT EXISTS idx_profiles_last_visit ON public.profiles (last_visit);
CREATE INDEX IF NOT EXISTS idx_app_metrics_type_created ON public.app_metrics (metric_type, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status_created ON public.transactions (status, created_at);

-- Correção de segurança para funções SECURITY DEFINER
-- Revoga execução pública e para usuários autenticados, permitindo apenas service_role ou chamadas internas seguras.

REVOKE EXECUTE ON FUNCTION public.check_daily_reminders() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_daily_reminders() FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_daily_reminders() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_daily_reminders() TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_user_streak() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_user_streak() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_user_streak() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_streak() TO service_role;

-- Nota: update_user_streak é normalmente uma função de gatilho.
-- Se for usada em gatilhos, o proprietário (geralmente postgres) terá permissão.
