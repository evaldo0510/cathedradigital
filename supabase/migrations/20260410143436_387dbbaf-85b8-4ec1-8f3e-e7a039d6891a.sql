-- Fix search path for update_last_action_at
ALTER FUNCTION public.update_last_action_at() SET search_path = public;

-- Fix search path for update_last_action_at_from_metrics
ALTER FUNCTION public.update_last_action_at_from_metrics() SET search_path = public;
