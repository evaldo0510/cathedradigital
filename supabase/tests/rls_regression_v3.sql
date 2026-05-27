
-- RLS Regression Tests V3
BEGIN;

-- Insert test users into auth.users
INSERT INTO auth.users (id, email, aud, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'user@test.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000002', 'admin@test.com', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Insert test admin role
INSERT INTO public.user_roles (user_id, role) 
VALUES ('00000000-0000-0000-0000-000000000002', 'admin')
ON CONFLICT DO NOTHING;

-- Test theme_contents as non-admin
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';

-- Should be able to select
DO $$
BEGIN
    PERFORM * FROM theme_contents LIMIT 1;
END $$;

-- Should NOT be able to insert
DO $$
BEGIN
    BEGIN
        INSERT INTO theme_contents (title, content_type, reference) VALUES ('Test', 'text', 'test');
        RAISE EXCEPTION 'RLS FAIL: authenticated user should NOT be able to INSERT into theme_contents';
    EXCEPTION WHEN insufficient_privilege THEN
        -- Success
    END;
END $$;

-- Test as admin
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}';
DO $$
BEGIN
    INSERT INTO theme_contents (title, content_type, reference) VALUES ('Admin Test', 'text', 'admin-test');
END $$;

-- Cleanup
ROLLBACK;
