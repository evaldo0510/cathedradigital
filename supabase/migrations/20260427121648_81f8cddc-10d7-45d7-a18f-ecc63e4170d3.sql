-- Create logs table for executions
CREATE TABLE IF NOT EXISTS public.catechism_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paragraph INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  duration_ms INTEGER,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on logs
ALTER TABLE public.catechism_execution_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can see logs
CREATE POLICY "Admins can view logs" ON public.catechism_execution_logs
FOR SELECT USING (public.is_admin());

-- Add retry count to cache
ALTER TABLE public.catechism_cache ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Create official texts table
CREATE TABLE IF NOT EXISTS public.catechism_official (
  paragraph INTEGER PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on official texts
ALTER TABLE public.catechism_official ENABLE ROW LEVEL SECURITY;

-- Everyone can view official texts
CREATE POLICY "Public can view official texts" ON public.catechism_official
FOR SELECT USING (true);

-- Fix linter security issues: restrict EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_user_visit() FROM PUBLIC;

-- Ensure RLS is enabled on sensitive tables if missing
ALTER TABLE public.catechism_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can select cache" ON public.catechism_cache;
CREATE POLICY "Anyone can select cache" ON public.catechism_cache FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only service role or admin can modify cache" ON public.catechism_cache;
CREATE POLICY "Only service role or admin can modify cache" ON public.catechism_cache FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
