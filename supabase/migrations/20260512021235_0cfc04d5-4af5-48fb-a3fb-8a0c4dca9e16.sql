-- 1. Add Local SEO fields
ALTER TABLE public.seo_settings 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_phone TEXT,
ADD COLUMN IF NOT EXISTS business_whatsapp TEXT,
ADD COLUMN IF NOT EXISTS business_email TEXT,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS opening_hours TEXT;

-- 2. Revoke public execute and set search_path for SECURITY DEFINER functions
DO $$
DECLARE
    func_record record;
BEGIN
    FOR func_record IN 
        SELECT p.proname, n.nspname, pg_get_function_identity_arguments(p.oid) as ident_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.prosecdef = true
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC', func_record.nspname, func_record.proname, func_record.ident_args);
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', func_record.nspname, func_record.proname, func_record.ident_args);
    END LOOP;
END $$;

-- 3. Set search_path for ALL public functions to clear 'Search Path Mutable' warning
DO $$
DECLARE
    func_record record;
BEGIN
    FOR func_record IN 
        SELECT p.proname, n.nspname, pg_get_function_identity_arguments(p.oid) as ident_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', func_record.nspname, func_record.proname, func_record.ident_args);
    END LOOP;
END $$;
