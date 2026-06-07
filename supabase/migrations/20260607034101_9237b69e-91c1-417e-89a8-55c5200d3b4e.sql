CREATE TABLE IF NOT EXISTS public.vatican_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vatican_cache TO authenticated;
GRANT ALL ON public.vatican_cache TO service_role;

ALTER TABLE public.vatican_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all for vatican_cache" ON public.vatican_cache FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.core_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  status_code INTEGER,
  livro TEXT,
  capitulo INTEGER,
  error_code TEXT,
  content_hash TEXT,
  db_content_hash TEXT,
  payload JSONB,
  response JSONB,
  duration_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_audit_logs TO authenticated;
GRANT ALL ON public.core_audit_logs TO service_role;

ALTER TABLE public.core_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users for core_audit_logs" 
ON public.core_audit_logs FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_core_audit_correlation_id ON public.core_audit_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_core_audit_livro_capitulo ON public.core_audit_logs(livro, capitulo);
