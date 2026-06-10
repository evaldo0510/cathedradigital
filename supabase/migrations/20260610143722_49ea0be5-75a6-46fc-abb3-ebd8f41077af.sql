-- Index for time-based filtering on app_metrics (heavily used in telemetry)
CREATE INDEX IF NOT EXISTS idx_app_metrics_created_at ON public.app_metrics (created_at DESC);

-- Index for time-based filtering on core_audit_logs (heavily used in audit dashboard)
CREATE INDEX IF NOT EXISTS idx_core_audit_logs_timestamp ON public.core_audit_logs (timestamp DESC);

-- Index for correlation_id lookups
CREATE INDEX IF NOT EXISTS idx_core_audit_logs_correlation_id ON public.core_audit_logs (correlation_id);

GRANT SELECT ON public.app_metrics TO authenticated;
GRANT SELECT ON public.app_metrics TO service_role;
GRANT SELECT ON public.core_audit_logs TO authenticated;
GRANT SELECT ON public.core_audit_logs TO service_role;