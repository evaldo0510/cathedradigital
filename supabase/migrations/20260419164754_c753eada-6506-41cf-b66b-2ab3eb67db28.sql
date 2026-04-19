-- Move pg_trgm extension to dedicated 'extensions' schema for security best practices
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move the extension
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Update search_path so functions still find pg_trgm operators
ALTER DATABASE postgres SET search_path TO "$user", public, extensions;