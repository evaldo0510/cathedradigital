-- Fix search path security warning for the update_last_updated_column function
ALTER FUNCTION public.update_last_updated_column() SET search_path = public;
